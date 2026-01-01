
import { GoogleGenAI } from "@google/genai";
import { runAnalyzeFarmHealth, REPORT_SCHEMA } from '../server/aiLogic';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    let apiKey = '';

    try {
        // Try to get the API key from config
        const configModule = require('../src/config');
        apiKey = configModule.getApiKey('geminiKey');
    } catch (error) {
        // Fallback to environment variables if config module fails to load
        apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }

    if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const { action, payload } = req.body;
    if (!action || !payload) {
        return res.status(400).json({ error: "Missing 'action' or 'payload' in request body." });
    }

    // Initialize with the object pattern
    const ai = new GoogleGenAI(apiKey);

    try {
        let response: any;

        switch (action) {
            case 'analyzeFarmHealth':
                const healthResult = await runAnalyzeFarmHealth(ai, payload);
                return res.json(healthResult);

            case 'analyzeDisasterRisk':
                const spatialContext = payload.bounds
                    ? `BOUNDING BOX: N:${payload.bounds.north}, S:${payload.bounds.south}, E:${payload.bounds.east}, W:${payload.bounds.west}.`
                    : `COORDINATES: ${payload.lat}, ${payload.lon}.`;

                const riskPrompt = `
                    Analyze agriculture risk for:
                    NODE: ${payload.locationName}
                    VECTORS: ${payload.categories.join(', ')}
                    MODE: ${payload.isFuture ? 'ADAPT_2030' : 'SIGNAL_LIVE'}
                    ${spatialContext}
                    Return situation report in JSON.
                `;

                // Try multiple models for disaster risk analysis
                const disasterModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
                let disasterResponse = null;
                let disasterError = null;

                for (const model of disasterModels) {
                    try {
                        const modelInstance = ai.models.get(model);
                        disasterResponse = await modelInstance.generateContent({
                            contents: [{ role: 'user', parts: [{ text: riskPrompt }] }],
                            generationConfig: {
                                responseMimeType: "application/json",
                                responseSchema: payload.schema,
                            }
                        });
                        console.log(`[AI] Disaster risk analysis SUCCESS with ${model}.`);
                        break;
                    } catch (error: any) {
                        console.warn(`[AI] Disaster risk analysis with ${model} failed:`, error.message);
                        disasterError = error;
                        // Continue to next model if this one fails
                        if (error.message?.includes("403") || error.message?.includes("leaked")) {
                            // If it's a key issue, stop trying other models
                            break;
                        }
                        continue;
                    }
                }

                if (!disasterResponse) {
                    throw disasterError || new Error("All disaster risk analysis models failed");
                }

                return res.json(JSON.parse(disasterResponse.response?.text() || disasterResponse.text || '{}'));

            case 'generateImage':
                // Try multiple models for image generation
                const imageModels = [
                    payload.model || "gemini-1.5-flash",
                    "gemini-1.5-pro",
                    "gemini-2.0-flash-exp",
                    "gemini-pro-vision"
                ];
                let imageResponse = null;
                let imageError = null;

                for (const model of imageModels) {
                    try {
                        const modelInstance = ai.models.get(model);
                        imageResponse = await modelInstance.generateContent({
                            contents: [{ role: 'user', parts: [{ text: payload.prompt }] }]
                        });
                        console.log(`[AI] Image generation SUCCESS with ${model}.`);
                        break;
                    } catch (error: any) {
                        console.warn(`[AI] Image generation with ${model} failed:`, error.message);
                        imageError = error;
                        // Continue to next model if this one fails
                        if (error.message?.includes("403") || error.message?.includes("leaked")) {
                            // If it's a key issue, stop trying other models
                            break;
                        }
                        continue;
                    }
                }

                if (!imageResponse) {
                    throw imageError || new Error("All image generation models failed");
                }

                // Extract image data from parts
                if (imageResponse.response?.candidates?.[0]?.content?.parts) {
                    const parts = imageResponse.response.candidates[0].content.parts;
                    for (const part of parts) {
                        if (part.inlineData && part.inlineData.data) {
                            return res.json({ data: part.inlineData.data });
                        }
                    }
                }
                throw new Error("No image data returned from Gemini API");

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

    } catch (error: any) {
        console.error(`[API Analyze Error - ${action}]:`, error);
        return res.status(500).json({
            error: "AI analysis failed",
            details: error.message
        });
    }
}
