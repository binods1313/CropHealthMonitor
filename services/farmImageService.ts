
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FarmData } from "../types";
import { fetchWithFallback } from '../utils/apiFallback';

/**
 * Generates two distinct images for the farm report.
 * 1. Realistic Satellite NDVI view (Raw Data).
 * 2. Clinical GIS Diagnostic Overlay (Actionable Map).
 */
export const generateDualFarmImages = async (farm: FarmData): Promise<{ ndviMap: string | null, deficiencyOverlay: string | null }> => {
  // Define the API call function
  const apiCall = async (): Promise<{ ndviMap: string | null, deficiencyOverlay: string | null }> => {
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing");
    }

    const ai = new GoogleGenerativeAI(apiKey);

    // Prompt 1: Realistic Sentinel-2 NDVI (Observational Data)
    const ndviPrompt = `
      Generate a high-resolution, photorealistic Sentinel-2 satellite image of a ${farm.crop} farm in ${farm.location}.

      VISUAL STYLE:
      - RAW SATELLITE PHOTOGRAPHY (Bird's eye view).
      - Realistic earth textures, soil details, and crop canopy visible.
      - Overlay a semi-transparent NDVI heatmap:
        * RED areas showing stressed crops/bare soil.
        * YELLOW areas showing moderate growth.
        * DEEP GREEN areas showing healthy vegetation.
      - Visuals should look like Google Earth or Sentinel Hub imagery.

      REQUIRED ELEMENTS:
      - A white outline defining the farm boundary.
      - A small North arrow in the corner.
      - A standard NDVI color scale bar (Red to Green gradient) in the bottom corner.
      - GPS coordinates text in small white font at the bottom.

      NEGATIVE CONSTRAINTS (Do NOT Include):
      - NO text boxes or speech bubbles.
      - NO icons (droplets, bugs, targets).
      - NO priority labels (P1, P2).
      - NO UI overlays or "dashboard" elements.
      - Just pure, raw scientific observation data.
    `;

    // Prompt 2: AI Diagnostic Treatment Map (Actionable Prescription)
    const diagnosticPrompt = `
      Generate a digital "Precision Agriculture Dashboard Interface" screen showing a vector map of a ${farm.crop} farm.

      VISUAL STYLE - STRICTLY DIGITAL/VECTOR (NOT A PHOTO):
      - Create a clean, flat vector GIS map on a dark or light grey grid background.
      - Look like a screenshot from John Deere Operations Center or Climate FieldView.
      - NO photorealistic textures. Use solid colors and hatch patterns.

      MAP CONTENT:
      - Define 3 distinct polygonal zones with thick borders:
        1. RED ZONE (Label: "P1: N-Deficiency"): Fill with diagonal red lines. Add a "Nitrogen" icon.
        2. ORANGE ZONE (Label: "P2: Water Stress"): Fill with orange dots. Add a "Droplet" icon.
        3. GREEN ZONE (Label: "Healthy"): Solid light green fill.

      OVERLAYS & UI ELEMENTS:
      - Add white text boxes connected to zones with lines: "Rx: Apply 120kg Urea" and "Rx: Irrigation +15mm".
      - Add distinct directional arrows showing "Machinery Path".
      - Top bar: "AI DIAGNOSTIC PLAN | CONFIDENCE 88%".
      - Side legend panel explaining the zone colors.

      Ensure this looks like a SOFTWARE INTERFACE or TECHNICAL SCHEMATIC, completely distinct from the satellite photo.
    `;

    // Create a temporary client to list available models using the direct API
    const listModelsClient = {
        async listModels(apiKey: string) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                return data.models || [];
            } catch (error) {
                console.error('Error listing models:', error);
                return [];
            }
        }
    };

    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    // Get available models dynamically
    let modelsToTry: string[] = [];
    const allModels = await listModelsClient.listModels(apiKey);

    // Filter for models that support the generateContent method
    modelsToTry = allModels
        .filter((model: any) =>
            model &&
            model.name &&
            model.supportedGenerationMethods &&
            model.supportedGenerationMethods.includes('generateContent') &&
            // Only include models that are likely to be available for most users
            (model.name.includes('gemini') && !model.name.includes('embedding'))
        )
        .map((model: any) => model.name.replace('models/', '')); // Remove 'models/' prefix

    // If no models were found from the API, use fallback models
    if (modelsToTry.length === 0) {
        console.log('[FarmImageService] No models found from API, using fallback models');
        modelsToTry = [
            "gemini-1.5-flash",         // Most commonly available multimodal model for images
            "gemini-1.5-pro",           // Pro version as backup
            "gemini-pro",               // Basic text model (most universally available)
        ];
    }

    console.log('[FarmImageService] Available image generation models:', modelsToTry);

    // Generate the images sequentially to ensure they are distinct
    let ndviResponse;
    const maxRetries = 3;

    // Find the first available model that works for NDVI generation
    for (const modelName of modelsToTry) {
        console.log(`[FarmImageService] Trying NDVI model: ${modelName}`);
        const ndviModel = ai.getGenerativeModel({ model: modelName });

        for (let i = 0; i < maxRetries; i++) {
            try {
                ndviResponse = await ndviModel.generateContent({
                    contents: { parts: [{ text: ndviPrompt }] }
                });
                console.log(`[FarmImageService] NDVI image generation SUCCESS with ${modelName}`);
                break; // Success, exit retry loop
            } catch (error: any) {
                console.warn(`[FarmImageService] NDVI image generation attempt ${i+1} with ${modelName} failed:`, error.message);
                if (error.message?.includes("429") && i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                    console.log(`[FarmImageService] Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else if (error.message?.includes("429") && i >= maxRetries - 1) {
                    // If quota error persists after retries, try next model
                    console.log(`[FarmImageService] Quota exceeded for ${modelName}, trying next model...`);
                    continue;
                }
                // If it's not a quota error, try next model
                console.log(`[FarmImageService] Non-quota error with ${modelName}, trying next model...`);
                break;
            }
        }

        // If we got a successful response, break out of model loop
        if (ndviResponse) {
            break;
        }
    }

    let diagResponse;

    // Find the first available model that works for diagnostic generation
    for (const modelName of modelsToTry) {
        console.log(`[FarmImageService] Trying diagnostic model: ${modelName}`);
        const diagModel = ai.getGenerativeModel({ model: modelName });

        for (let i = 0; i < maxRetries; i++) {
            try {
                diagResponse = await diagModel.generateContent({
                    contents: { parts: [{ text: diagnosticPrompt }] }
                });
                console.log(`[FarmImageService] Diagnostic image generation SUCCESS with ${modelName}`);
                break; // Success, exit retry loop
            } catch (error: any) {
                console.warn(`[FarmImageService] Diagnostic image generation attempt ${i+1} with ${modelName} failed:`, error.message);
                if (error.message?.includes("429") && i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                    console.log(`[FarmImageService] Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else if (error.message?.includes("429") && i >= maxRetries - 1) {
                    // If quota error persists after retries, try next model
                    console.log(`[FarmImageService] Quota exceeded for ${modelName}, trying next model...`);
                    continue;
                }
                // If it's not a quota error, try next model
                console.log(`[FarmImageService] Non-quota error with ${modelName}, trying next model...`);
                break;
            }
        }

        // If we got a successful response, break out of model loop
        if (diagResponse) {
            break;
        }
    }

    const extractImage = (response: any) => {
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    };

    const ndviMapResult = extractImage(ndviResponse);
    const deficiencyOverlayResult = extractImage(diagResponse);

    // Ensure the images are distinct - if they're the same, return null for the duplicate to force fallback
    if (ndviMapResult && deficiencyOverlayResult && ndviMapResult === deficiencyOverlayResult) {
      console.warn("Generated images are identical, returning null for one to force distinction");
      return {
        ndviMap: ndviMapResult,
        deficiencyOverlay: null
      };
    }

    return {
      ndviMap: ndviMapResult,
      deficiencyOverlay: deficiencyOverlayResult
    };
  };

  // Use fallback mechanism with distinct placeholder images
  return fetchWithFallback(
    apiCall,
    {
      ndviMap: generatePlaceholderImage(farm, 'ndvi'),
      deficiencyOverlay: generatePlaceholderImage(farm, 'diagnostic')
    },
    "Failed to generate farm images via Gemini API"
  );
};

// Helper function to generate distinct placeholder images
const generatePlaceholderImage = (farm: FarmData, type: 'ndvi' | 'diagnostic'): string => {
  // Generate SVG placeholder image that's visually distinct
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      ${
        type === 'ndvi'
        ? '<defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#10B981;stop-opacity:1" /><stop offset="100%" style="stop-color:#3B82F6;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad1)"/>'
        : '<defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E5E7EB;stop-opacity:1" /><stop offset="100%" style="stop-color:#D1D5DB;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad2)"/>'
      }
      <text x="50%" y="40%" font-family="Arial" font-size="20" font-weight="bold" fill="${type === 'ndvi' ? '#FFFFFF' : '#374151'}" text-anchor="middle" dominant-baseline="middle">
        ${type === 'ndvi' ? 'NDVI SATELLITE' : 'DIAGNOSTIC MAP'}
      </text>
      <text x="50%" y="55%" font-family="Arial" font-size="16" fill="${type === 'ndvi' ? '#FFFFFF' : '#374151'}" text-anchor="middle" dominant-baseline="middle">
        ${farm.name}
      </text>
      <text x="50%" y="65%" font-family="Arial" font-size="16" fill="${type === 'ndvi' ? '#FFFFFF' : '#374151'}" text-anchor="middle" dominant-baseline="middle">
        ${farm.crop}
      </text>
      ${
        type === 'ndvi'
        ? '<rect x="50" y="50" width="300" height="200" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="5,5"/><circle cx="200" cy="150" r="50" fill="#FBBF24" opacity="0.3"/>'
        : '<rect x="50" y="50" width="300" height="200" fill="none" stroke="#9CA3AF" stroke-width="2"/><rect x="80" y="80" width="40" height="40" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/><rect x="140" y="80" width="40" height="40" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/><rect x="200" y="80" width="40" height="40" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>'
      }
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
};
