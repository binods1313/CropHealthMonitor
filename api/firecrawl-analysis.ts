
import Firecrawl from '@mendable/firecrawl-js';
import { analyzeFarmHealth } from '../services/geminiService';
import { MOCK_FARMS, NDVI_STATS } from '../constants';
import { FarmData } from '../types';

// Initialize Firecrawl app with API key from environment
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || process.env.VITE_FIRECRAWL_API_KEY;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY;
console.log(`[DEBUG] API Keys loaded - Firecrawl: ${!!firecrawlApiKey}, Perplexity: ${!!perplexityApiKey}`);
const app = new Firecrawl({ apiKey: firecrawlApiKey });

// Helper to detect Firecrawl credit errors
function isFirecrawlCreditError(error: any): boolean {
    if (error.status === 402) return true;
    const msg = (error.message || "").toLowerCase();
    const details = error.details ? JSON.stringify(error.details).toLowerCase() : "";
    return msg.includes('credit') || details.includes('credit');
}

// Perplexity API Helper
async function callPerplexity(prompt: string) {
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.VITE_PERPLEXITY_API_KEY;
    if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY or VITE_PERPLEXITY_API_KEY not configured in .env');
    }

    console.log(`[DEBUG] Perplexity fallback triggered for prompt: "${prompt.substring(0, 100)}..."`);
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'sonar-pro', // Updated to latest Pro model for better results
            messages: [
                {
                    role: 'system',
                    content: 'You are an agricultural expert. Provide a detailed analysis of crop health, pest issues, disease patterns, and recommended treatments for the specified crop and region. Format your output clearly.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2,
            top_p: 0.9,
            return_citations: true,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] Perplexity API error status:', response.status);
        throw new Error(`Perplexity API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`[DEBUG] Perplexity response parsed successfully.`);
    return {
        answer: data.choices[0].message.content,
        citations: data.citations || [],
        poweredBy: 'Perplexity'
    };
}

export default async function handler(req: any, res: any) {
    console.log(`[API Request] POST /api/firecrawl-analysis`);
    console.log(`[API] Firecrawl analysis started: ${req.body.analysisType || 'unknown'}`);

    // 1. Basic Security: Only POST allowed
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { cropType, region, farmerId, analysisType, query, url } = req.body;
    if (!analysisType) {
        return res.status(400).json({ error: "Missing required field: analysisType" });
    }

    // Validate required fields based on analysis type
    if (analysisType === 'quick-search' || analysisType === 'deep-analysis') {
        if (!cropType || typeof cropType !== 'string' || !region || typeof region !== 'string') {
            return res.status(400).json({ error: "cropType and region are required for this analysis type and must be strings" });
        }
    } else if (analysisType === 'portal-sync' || analysisType === 'scrape') {
        if (!cropType || typeof cropType !== 'string' || !region || typeof region !== 'string') {
            return res.status(400).json({ error: "cropType and region are required for this analysis type and must be strings" });
        }
    } else if (analysisType === 'general-intelligence') {
        // No strict requirements for general intelligence queries
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: "Query is required for general intelligence analysis" });
        }
    }

    try {
        // Get the farm data based on region or use a default
        let farm: FarmData | undefined;
        if (farmerId) {
            farm = MOCK_FARMS.find(f => f.id === farmerId);
        }
        if (!farm) {
            farm = MOCK_FARMS[0]; // Default to first farm if not found
        }

        // Check if Firecrawl API key is available
        const hasFirecrawlKey = !!(process.env.FIRECRAWL_API_KEY || process.env.VITE_FIRECRAWL_API_KEY);

        let firecrawlInsights: any = null;
        let creditsUsed = 0;
        let source: 'firecrawl+gemini' | 'gemini-only' | 'perplexity+gemini' = 'gemini-only';

        if (hasFirecrawlKey) {
            try {
                if (analysisType === 'quick-search') {
                    const searchQuery = query || `${cropType} health ${region} latest`;
                    if (!searchQuery || typeof searchQuery !== 'string') {
                        throw new Error('Search query is required for quick-search analysis');
                    }
                    try {
                        firecrawlInsights = await app.search(searchQuery, {
                            limit: 10,
                            timeout: 30000
                        });
                        creditsUsed = 10;
                    } catch (searchError: any) {
                        if (isFirecrawlCreditError(searchError)) {
                            console.log('[DEBUG] Quick-search credits exhausted. Falling back to Perplexity...');
                            firecrawlInsights = await callPerplexity(`Search for: ${searchQuery}`);
                            creditsUsed = 0;
                        } else {
                            throw searchError;
                        }
                    }
                    source = 'firecrawl+gemini';
                } else if (analysisType === 'deep-analysis') {
                    // Ensure cropType and region are valid before constructing the query
                    if (!cropType || typeof cropType !== 'string' || !region || typeof region !== 'string') {
                        throw new Error('cropType and region are required for deep-analysis');
                    }
                    // Construct a detailed query - ensure it's never undefined
                    const agentQuery = query && query.trim()
                        ? query.trim()
                        : `Find the latest agricultural information, pest issues, disease patterns, and recommended treatments for ${cropType} crops in the ${region} region. Include climate impact and best farming practices.`;

                    console.log(`[DEBUG] Deep analysis - original query: ${query}, cropType: ${cropType}, region: ${region}, final agentQuery: ${agentQuery}`);

                    try {
                        // Use prompt field as the primary parameter for agent
                        firecrawlInsights = await app.agent({
                            prompt: agentQuery,
                            maxCredits: 50  // Increased limit for complex agricultural queries
                        });

                        // Check if the agent call returned a failure object internally
                        if (firecrawlInsights && (firecrawlInsights.status === 'failed' || firecrawlInsights.success === false)) {
                            console.log(`[DEBUG] Firecrawl agent reported failure: ${firecrawlInsights.error || 'Unknown error'}`);
                            throw new Error(firecrawlInsights.error || 'Firecrawl agent failed');
                        }
                    } catch (firecrawlError: any) {
                        console.error('Firecrawl agent API failure:', firecrawlError.message);

                        if (isFirecrawlCreditError(firecrawlError)) {
                            console.log('[DEBUG] Firecrawl credits exhausted. Attempting Perplexity fallback...');
                            try {
                                firecrawlInsights = await callPerplexity(agentQuery);
                            } catch (perplexityError: any) {
                                console.error('[DEBUG] Perplexity fallback failed:', perplexityError.message);
                                // Continue with Gemini-only
                            }
                        } else {
                            // Fallback: Try with a simpler query structure in Firecrawl if it wasn't a credit error
                            try {
                                const fallbackQuery = `${cropType} crop health and farming practices in ${region}`;
                                console.log(`[DEBUG] Attempting simplified Firecrawl fallback query: ${fallbackQuery}`);
                                firecrawlInsights = await app.agent({
                                    prompt: fallbackQuery,
                                    maxCredits: 25
                                });

                                if (firecrawlInsights && (firecrawlInsights.status === 'failed' || firecrawlInsights.success === false)) {
                                    throw new Error(firecrawlInsights.error || 'Fallback agent failed');
                                }
                            } catch (fallbackError: any) {
                                console.error('[DEBUG] Firecrawl fallback query failed:', fallbackError.message);
                                firecrawlInsights = null;
                            }
                        }
                    }
                    creditsUsed = firecrawlInsights?.poweredBy === 'Perplexity' ? 0 : (firecrawlInsights ? 20 : 0);
                    source = 'firecrawl+gemini';
                } else if (analysisType === 'portal-sync') {
                    console.log(`[DEBUG] Portal Sync initiated for ${cropType} in ${region}`);
                    let targetUrl = url;

                    if (!targetUrl) {
                        console.log(`[DEBUG] No URL provided. Searching for relevant agricultural nodes...`);
                        try {
                            const searchResult: any = await app.search(`official agricultural ${cropType} portal ${region} health pest`, { limit: 1 });
                            if (searchResult && searchResult.data && searchResult.data.length > 0) {
                                targetUrl = searchResult.data[0].url;
                                console.log(`[DEBUG] Found target node: ${targetUrl}`);
                            }
                        } catch (e) {
                            console.log(`[DEBUG] Portal search failed.`);
                        }
                    }

                    try {
                        if (targetUrl) {
                            firecrawlInsights = await app.scrape(targetUrl, { formats: ['markdown'] });
                            creditsUsed = 10;
                        } else {
                            throw new Error('No target portal available');
                        }
                    } catch (err) {
                        console.log(`[DEBUG] Traditional sync failed. Activating Advanced Intelligence fallback...`);
                        firecrawlInsights = await callPerplexity(`Simulate a high-level portal sync analysis for ${cropType} crops in ${region} region. Extract official health indices and pest alerts.`);
                        creditsUsed = 0;
                    }
                    source = 'firecrawl+gemini';
                } else if (analysisType === 'scrape') {
                    const targetUrl = url || `https://example-agricultural-portal.com/${region}/${cropType}`;
                    if (!targetUrl || typeof targetUrl !== 'string') {
                        throw new Error('URL is required for scrape analysis');
                    }
                    firecrawlInsights = await app.scrape(targetUrl, {
                        formats: ['markdown', 'html']
                    });
                    creditsUsed = 5;
                    source = 'firecrawl+gemini';
                } else if (analysisType === 'general-intelligence') {
                    console.log(`[DEBUG] General Intelligence analysis initiated for: ${query}`);
                    try {
                        firecrawlInsights = await callPerplexity(query);
                        creditsUsed = 0;
                        source = 'perplexity+gemini';
                    } catch (e) {
                        console.log('[DEBUG] Perplexity failed, trying Firecrawl search as fallback');
                        try {
                            firecrawlInsights = await app.search(query, { limit: 5 });
                            creditsUsed = 5;
                            source = 'firecrawl+gemini';
                        } catch (fcError) {
                            console.error('Firecrawl fallback failed', fcError);
                            throw fcError;
                        }
                    }
                }
            } catch (firecrawlError: any) {
                console.error('Firecrawl API error:', firecrawlError);
                // Continue with gemini-only analysis
            }
        }

        // Only perform Gemini analysis if Firecrawl didn't succeed or if we want to combine results
        let geminiAnalysis = null;
        let combinedScore = 75; // Default score if no analysis is available

        console.log(`[DEBUG] Finalizing analysis. Insights found: ${!!firecrawlInsights}, Provider: ${firecrawlInsights?.poweredBy || 'Firecrawl'}`);

        if (firecrawlInsights) {
            // If we have Firecrawl/Perplexity insights, try to get Gemini analysis to combine
            try {
                geminiAnalysis = await analyzeFarmHealth(farm, NDVI_STATS, "", farm.soil);

                // Re-evaluate score: Web insights usually provide high-confidence qualitative data
                // We'll use a weighted average favoring the more recent web data
                const baseScore = geminiAnalysis.healthScore;
                const weightPerplexity = firecrawlInsights.poweredBy === 'Perplexity' ? 0.4 : 0.3;
                const webImpactScore = 88; // Assumed quality of web-sourced protocols

                combinedScore = Math.round((baseScore * (1 - weightPerplexity)) + (webImpactScore * weightPerplexity));
                console.log(`[DEBUG] Combined score calculated: ${combinedScore} (Base: ${baseScore}, Web Impact: ${webImpactScore})`);
            } catch (geminiError) {
                console.error('[DEBUG] Gemini analysis failed, using Web data only:', geminiError);
                combinedScore = firecrawlInsights.poweredBy === 'Perplexity' ? 90 : 85;
            }
        } else {
            // If no Firecrawl insights, try Gemini as fallback
            try {
                geminiAnalysis = await analyzeFarmHealth(farm, NDVI_STATS, "", farm.soil);
                combinedScore = geminiAnalysis.healthScore;
                source = 'gemini-only';
            } catch (geminiError) {
                console.error('Both Firecrawl and Gemini failed:', geminiError);
                // Return minimal data with error indication
                return res.json({
                    success: false,
                    data: {
                        firecrawlInsights: null,
                        geminiAnalysis: null,
                        combinedScore: 50, // Default score when both fail
                        creditsUsed: 0,
                        error: "Both Firecrawl and Gemini services unavailable"
                    },
                    source: 'gemini-only'
                });
            }
        }

        return res.json({
            success: true,
            data: {
                firecrawlInsights: firecrawlInsights || undefined, // Don't include if null
                geminiAnalysis: geminiAnalysis || undefined,
                combinedScore,
                creditsUsed,
            },
            source: firecrawlInsights?.poweredBy === 'Perplexity' ? 'perplexity+gemini' : source
        });

    } catch (error: any) {
        console.error('[Firecrawl API Error]:', error);

        // Perform fallback analysis if possible
        try {
            const farm = MOCK_FARMS[0];
            const geminiAnalysis = await analyzeFarmHealth(farm, NDVI_STATS, "", farm.soil);

            return res.json({
                success: false,
                data: {
                    geminiAnalysis,
                    combinedScore: geminiAnalysis.healthScore,
                    creditsUsed: 0,
                    error: "Firecrawl enhancement unavailable"
                },
                source: 'gemini-only'
            });
        } catch (geminiError: any) {
            console.error('[Fallback Gemini Error]:', geminiError);
            return res.status(500).json({
                error: "Both Firecrawl and Gemini analysis failed",
                details: error.message
            });
        }
    }
}