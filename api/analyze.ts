
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runAnalyzeFarmHealth, REPORT_SCHEMA } from '../server/aiLogic';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    console.log('API Key:', process.env.GEMINI_API_KEY ? 'exists' : 'missing');
    console.log('VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'exists' : 'missing');

    let apiKey = '';

    try {
        // Try to get the API key from config - using dynamic import instead of require
        const configModule = await import('../src/config');
        apiKey = configModule.getApiKey('geminiKey');
        console.log('API Key from config:', apiKey ? 'exists' : 'missing');
    } catch (error) {
        console.log('Error loading config:', error.message);
        // Fallback to environment variables if config module fails to load
        apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }

    if (!apiKey) {
        console.log('ERROR: Gemini API key is not configured on the server.');
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const { action, payload } = req.body;
    if (!action || !payload) {
        return res.status(400).json({ error: "Missing 'action' or 'payload' in request body." });
    }

    // Initialize with the object pattern
    console.log('Initializing GoogleGenerativeAI with API key:', apiKey ? 'yes' : 'no');
    const ai = new GoogleGenerativeAI(apiKey);

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

                // Get available models dynamically
                let disasterModels = [];
                try {
                    const models = await ai.listModels();
                    console.log('[AI] Available disaster models:', models.map((m: any) => m.name));
                    disasterModels = models
                        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                        .map((m: any) => m.name.replace('models/', '')); // Remove 'models/' prefix

                    if (disasterModels.length === 0) {
                        console.log('[AI] No disaster models found, using fallback models');
                        disasterModels = [
                            "gemini-pro",           // Basic text model
                            "gemini-1.0-pro",       // Specific version
                            "gemini-1.5-flash",     // Standard flash model
                            "gemini-1.5-pro",       // Pro model as backup
                        ];
                    }
                } catch (error) {
                    console.error('[AI] Failed to list disaster models:', error);
                    // Fallback to known models if listing fails
                    disasterModels = [
                        "gemini-pro",           // Basic text model
                        "gemini-1.0-pro",       // Specific version
                        "gemini-1.5-flash",     // Standard flash model
                        "gemini-1.5-pro",       // Pro model as backup
                    ];
                }
                let disasterResponse = null;
                let disasterError = null;

                for (const model of disasterModels) {
                    try {
                        console.log(`[AI] Attempting to get disaster model: ${model}`);
                        const modelInstance = ai.getGenerativeModel({ model: model });
                        console.log(`[AI] Disaster model object retrieved:`, !!modelInstance);

                        if (!modelInstance || typeof modelInstance.generateContent !== 'function') {
                            console.warn(`[AI] Disaster model ${model} does not have generateContent function`);
                            continue;
                        }

                        // Add retry logic with exponential backoff for quota limits
                        const maxRetries = 3;
                        for (let i = 0; i < maxRetries; i++) {
                            try {
                                console.log(`[AI] Calling generateContent for disaster model: ${model} (attempt ${i+1})`);
                                disasterResponse = await modelInstance.generateContent({
                                    contents: [{ role: 'user', parts: [{ text: riskPrompt }] }],
                                    generationConfig: {
                                        responseMimeType: "application/json",
                                        responseSchema: payload.schema,
                                    }
                                });
                                break; // Success, exit retry loop
                            } catch (error: any) {
                                console.warn(`[AI] Disaster analysis attempt ${i+1} failed for ${model}:`, error.message);
                                if (error.message?.includes("429") && i < maxRetries - 1) {
                                    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                                    console.log(`[AI] Waiting ${delay}ms before retry...`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                    continue;
                                }
                                throw error; // Re-throw if it's not a quota error or max retries reached
                            }
                        }

                        console.log(`[AI] Disaster risk analysis SUCCESS with ${model}.`);
                        break;
                    } catch (error: any) {
                        console.warn(`[AI] Disaster risk analysis with ${model} failed:`, error.message);
                        console.warn(`[AI] Disaster error details:`, error.stack);
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

                return res.json(JSON.parse(disasterResponse.response?.text() || (disasterResponse.text && typeof disasterResponse.text === 'function' ? disasterResponse.text() : disasterResponse.text) || '{}'));

            case 'generateImage':
                // Get available models dynamically for image generation
                let imageModels = [];
                try {
                    const models = await ai.listModels();
                    console.log('[AI] Available image models:', models.map((m: any) => m.name));
                    imageModels = models
                        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                        .map((m: any) => m.name.replace('models/', '')); // Remove 'models/' prefix

                    if (imageModels.length === 0) {
                        console.log('[AI] No image models found, using fallback models');
                        imageModels = [
                            "gemini-pro",           // Basic text model
                            "gemini-1.0-pro",       // Specific version
                            "gemini-1.5-flash",     // Standard flash model
                            "gemini-1.5-pro",       // Pro model as backup
                        ];
                    }

                    // Add the payload model if provided and not already in the list
                    if (payload.model && !imageModels.includes(payload.model)) {
                        imageModels.unshift(payload.model);
                    }
                } catch (error) {
                    console.error('[AI] Failed to list image models:', error);
                    // Fallback to known models if listing fails
                    imageModels = [
                        payload.model || "gemini-pro",      // Basic text model
                        "gemini-1.0-pro",                   // Specific version
                        "gemini-1.5-flash",                 // Standard flash model
                        "gemini-1.5-pro",                   // Pro model as backup
                    ];
                }
                let imageResponse = null;
                let imageError = null;

                for (const model of imageModels) {
                    try {
                        console.log(`[AI] Attempting to get image model: ${model}`);
                        const modelInstance = ai.getGenerativeModel({ model: model });
                        console.log(`[AI] Image model object retrieved:`, !!modelInstance);

                        if (!modelInstance || typeof modelInstance.generateContent !== 'function') {
                            console.warn(`[AI] Image model ${model} does not have generateContent function`);
                            continue;
                        }

                        // Add retry logic with exponential backoff for quota limits
                        const maxRetries = 3;
                        for (let i = 0; i < maxRetries; i++) {
                            try {
                                console.log(`[AI] Calling generateContent for image model: ${model} (attempt ${i+1})`);
                                imageResponse = await modelInstance.generateContent({
                                    contents: [{ role: 'user', parts: [{ text: payload.prompt }] }]
                                });
                                break; // Success, exit retry loop
                            } catch (error: any) {
                                console.warn(`[AI] Image generation attempt ${i+1} failed for ${model}:`, error.message);
                                if (error.message?.includes("429") && i < maxRetries - 1) {
                                    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                                    console.log(`[AI] Waiting ${delay}ms before retry...`);
                                    await new Promise(resolve => setTimeout(resolve, delay));
                                    continue;
                                }
                                throw error; // Re-throw if it's not a quota error or max retries reached
                            }
                        }

                        console.log(`[AI] Image generation SUCCESS with ${model}.`);
                        break;
                    } catch (error: any) {
                        console.warn(`[AI] Image generation with ${model} failed:`, error.message);
                        console.warn(`[AI] Image error details:`, error.stack);
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
                } else if (imageResponse.response?.text) {
                    // Alternative way to extract image data for the new package
                    const responseText = typeof imageResponse.response.text === 'function'
                        ? imageResponse.response.text()
                        : imageResponse.response.text;
                    const dataMatch = responseText.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
                    if (dataMatch) {
                        return res.json({ data: dataMatch[1] });
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
