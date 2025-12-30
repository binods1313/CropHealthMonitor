
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
    const ai = new GoogleGenAI({ apiKey });

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

                response = await ai.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: [{ role: 'user', parts: [{ text: riskPrompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: payload.schema,
                    }
                });
                return res.json(JSON.parse(response.text || '{}'));

            case 'generateImage':
                response = await ai.models.generateContent({
                    model: payload.model || 'gemini-1.5-flash',
                    contents: [{ role: 'user', parts: [{ text: payload.prompt }] }]
                });

                // Extract image data from parts
                if (response.candidates?.[0]?.content?.parts) {
                    const parts = response.candidates[0].content.parts;
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
