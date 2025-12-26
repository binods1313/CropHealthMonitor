import express from 'express';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import NodeCache from 'node-cache';
import { GoogleGenAI, Type } from "@google/genai";
import { fetchWithFallback } from '../utils/apiFallback';

const router = express.Router();

// --- Configuration ---
const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Initialize Cache (StdTTL: 300 seconds / 5 minutes)
const disasterCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Initialize Gemini
// Ensure process.env.API_KEY is set in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Configure Axios with Retry Logic for flaky APIs
const client = axios.create();
axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
    }
});

// Helper: EONET Category Mapping
const CATEGORY_MAPPING: Record<string, string> = {
    'wildfires': 'wildfires',
    'severeStorms': 'severeStorms',
    'floods': 'floods',
    'volcanoes': 'volcanoes'
};

// --- Route 1: Fetch Data (EONET + OpenWeather) ---
router.post('/fetch', async (req: any, res: any) => {
    try {
        const { bbox, disasterTypes } = req.body;

        if (!bbox || !disasterTypes || !Array.isArray(disasterTypes)) {
            return res.status(400).json({ error: "Invalid request. 'bbox' and 'disasterTypes' array are required." });
        }

        // 1. Check Cache
        const cacheKey = `eonet_${JSON.stringify(req.body)}`;
        const cachedData = disasterCache.get(cacheKey) as any;
        if (cachedData) {
            console.log('⚡ Serving disaster data from cache');
            return res.json({ ...cachedData, fromCache: true });
        }

        // Define the API call function
        const apiCall = async () => {
            const { minLat, maxLat, minLon, maxLon } = bbox;

            // 2. Fetch EONET Data
            // Note: EONET doesn't support strict BBox filtering in the API call itself easily for all types,
            // so we fetch open events and filter server-side.
            const categoryIds = disasterTypes.map((t: any) => CATEGORY_MAPPING[t] || t).join(',');

            const eonetResponse = await client.get(EONET_API_URL, {
                params: {
                    status: 'open',
                    limit: 100, // Reasonable limit
                    category: categoryIds
                }
            });

            const rawEvents = eonetResponse.data.events || [];

            // 3. Filter Events by Geometry (BBox)
            const filteredEvents = rawEvents.filter((event: any) => {
                // Get the latest geometry
                const geometry = event.geometry[event.geometry.length - 1];
                const [lon, lat] = geometry.coordinates; // GeoJSON is [lon, lat]

                return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
            }).map((event: any) => {
                 const geometry = event.geometry[event.geometry.length - 1];
                 return {
                     id: event.id,
                     title: event.title,
                     category: event.categories[0]?.title || 'Unknown',
                     coordinates: { lat: geometry.coordinates[1], lon: geometry.coordinates[0] },
                     updatedAt: geometry.date,
                     sources: event.sources.map((s: any) => s.id),
                     severityScore: 5 // Default; will be updated by AI or heuristic later
                 };
            });

            // 4. Fetch Weather for Center of BBox (Contextual Data)
            const centerLat = (minLat + maxLat) / 2;
            const centerLon = (minLon + maxLon) / 2;

            let weatherData = null;
            try {
                if (process.env.OPENWEATHER_API_KEY) {
                    const weatherRes = await client.get(WEATHER_API_URL, {
                        params: {
                            lat: centerLat,
                            lon: centerLon,
                            appid: process.env.OPENWEATHER_API_KEY,
                            units: 'metric'
                        }
                    });
                    weatherData = {
                        temperature: weatherRes.data.main.temp,
                        windSpeed: weatherRes.data.wind.speed,
                        windDirection: weatherRes.data.wind.deg,
                        gustSpeed: weatherRes.data.wind.gust || 0,
                        summary: weatherRes.data.weather[0]?.description
                    };
                } else {
                    // Fallback simulation if no API key in this demo
                    weatherData = {
                        temperature: 25,
                        windSpeed: 5.5,
                        windDirection: 180,
                        gustSpeed: 8.0,
                        summary: "Simulated Data (Missing API Key)"
                    };
                }
            } catch (wErr) {
                console.warn("Weather fetch failed:", wErr);
                weatherData = null;
            }

            return {
                bbox,
                events: filteredEvents,
                weather: weatherData,
                generatedAt: new Date().toISOString()
            };
        };

        // Use fallback mechanism
        const responsePayload = await fetchWithFallback(
            apiCall,
            {
                bbox,
                events: [], // Return empty events array as fallback
                weather: {
                    temperature: 25,
                    windSpeed: 5.5,
                    windDirection: 180,
                    gustSpeed: 8.0,
                    summary: "Simulated Data (API Error)"
                },
                generatedAt: new Date().toISOString()
            },
            "Failed to fetch disaster data from NASA EONET and OpenWeather APIs"
        );

        // 5. Store in Cache
        disasterCache.set(cacheKey, responsePayload);

        res.json({ ...responsePayload, fromCache: false });

    } catch (error: any) {
        console.error("Disaster Fetch Error:", error.message);
        res.status(503).json({
            error: "Failed to fetch disaster data",
            details: error.message,
            usingCache: false
        });
    }
});

// --- Route 2: AI Analysis (Gemini) ---
router.post('/analyze', async (req: any, res: any) => {
    try {
        const { disasterData } = req.body;
        if (!disasterData || !disasterData.events) {
            return res.status(400).json({ error: "Invalid data for analysis" });
        }

        // Define the API call function
        const apiCall = async () => {
            // Construct Prompt
            const prompt = `
                You are an expert Risk Management AI for an Agritech platform.
                Analyze the following real-time disaster and weather data for a specific agricultural region.

                Context Data:
                ${JSON.stringify(disasterData, null, 2)}

                Task:
                1. Analyze each event's severity (1-10) based on type and proximity.
                2. **CRITICAL:** Use the Wind Direction (${disasterData.weather?.windDirection} degrees) and Speed (${disasterData.weather?.windSpeed} m/s) to predict spread for Wildfires or Storms.
                3. Provide specific actionable recommendations for farmers.
                4. Add a disclaimer.

                Output strictly JSON matching this schema:
                {
                    "summary": "High-level summary of the region status",
                    "riskLevel": "Low" | "Medium" | "High" | "Critical",
                    "analyzedEvents": [
                        {
                            "eventId": "matches input id",
                            "severityScore": number (1-10),
                            "projectedImpact": "string description including wind influence",
                            "recommendation": "string action item"
                        }
                    ]
                }
            `;

            // Fixed: Use 'gemini-3-flash-preview' for basic text/reasoning tasks as per guidelines.
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
                            analyzedEvents: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        eventId: { type: Type.STRING },
                                        severityScore: { type: Type.NUMBER },
                                        projectedImpact: { type: Type.STRING },
                                        recommendation: { type: Type.STRING }
                                    },
                                    required: ["eventId", "severityScore", "projectedImpact", "recommendation"]
                                }
                            }
                        },
                        required: ["summary", "riskLevel", "analyzedEvents"]
                    }
                }
            });

            return JSON.parse(response.text || '{}');
        };

        // Use fallback mechanism
        const analysis = await fetchWithFallback(
            apiCall,
            {
                summary: "Analysis unavailable due to API error. Using simulated data.",
                riskLevel: "Medium",
                analyzedEvents: disasterData.events.map((event: any) => ({
                    eventId: event.id,
                    severityScore: 5,
                    projectedImpact: "Impact assessment pending API recovery",
                    recommendation: "Monitor situation and prepare standard response protocols"
                }))
            },
            "AI Analysis failed due to Gemini API error"
        );

        res.json(analysis);

    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ error: "AI Analysis failed", details: error.message });
    }
});

export default router;