
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
    // 1. Basic Security: Only POST allowed
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // 2. Fetch API Key from environment (STRICTLY SERVER-SIDE)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const { action, payload } = req.body;
    if (!action || !payload) {
        return res.status(400).json({ error: "Missing 'action' or 'payload' in request body." });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        let response;

        switch (action) {
            case 'analyzeFarmHealth':
                // Payload: { farm, ndviStats, base64Image, soilData, schema }
                const hasImage = payload.base64Image && payload.base64Image.length > 100;
                const healthPrompt = `Expert Ag-AI analysis for a ${payload.farm.crop} farm in ${payload.farm.location}. Metrics: NDVI Avg ${payload.ndviStats.avg}, pH ${payload.soilData.ph}, N=${payload.soilData.nitrogen}. Return JSON.`;

                response = await ai.models.generateContent({
                    model: "gemini-3-pro-preview",
                    contents: {
                        parts: [
                            { text: healthPrompt },
                            ...(hasImage ? [{ inlineData: { mimeType: "image/jpeg", data: payload.base64Image } }] : [])
                        ]
                    },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: payload.schema
                    }
                });
                break;

            case 'analyzeDisasterRisk':
                // Payload: { lat, lon, locationName, categories, isFuture, bounds, schema }
                const spatialContext = payload.bounds
                    ? `PRECISION BOUNDING BOX: N:${payload.bounds.north}, S:${payload.bounds.south}, E:${payload.bounds.east}, W:${payload.bounds.west}. Focus analysis strictly within this section.`
                    : `CENTER COORDINATES: ${payload.lat}, ${payload.lon}. Analyze the regional node.`;

                const riskPrompt = `
          Strategic Risk AI Analysis Module L5.
          NODE: ${payload.locationName}
          VECTORS: ${payload.categories.join(', ')}
          TEMPORAL MODE: ${payload.isFuture ? 'ADAPT_2030' : 'SIGNAL_LIVE'}
          ${spatialContext}
          TASK: Generate a COMPLETE Situation Report structure in JSON.
        `;

                response = await ai.models.generateContent({
                    model: "gemini-3-pro-preview",
                    contents: riskPrompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: payload.schema,
                        thinkingConfig: { thinkingBudget: 16000 }
                    }
                });
                break;

            case 'generateImage':
                // Payload: { prompt, model }
                response = await ai.models.generateContent({
                    model: payload.model || 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: payload.prompt }]
                    }
                });
                break;

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        // Return the response text/data
        if (action === 'generateImage') {
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return res.json({ data: part.inlineData.data });
                    }
                }
            }
            throw new Error("No image data returned from Gemini API");
        }

        const result = JSON.parse(response.text || '{}');
        return res.json(result);

    } catch (error: any) {
        console.error(`[API Analyze Error - ${action}]:`, error);
        return res.status(500).json({
            error: "AI analysis failed",
            details: error.message
        });
    }
}
