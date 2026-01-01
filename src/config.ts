/**
 * Configuration file for accessing environment variables
 * All sensitive API keys should be accessed through this file
 */

export const getApiKeys = () => {
  console.log('Environment variables available:', {
    VITE_GEMINI_API_KEY: !!import.meta.env.VITE_GEMINI_API_KEY,
    VITE_FIRECRAWL_API_KEY: !!import.meta.env.VITE_FIRECRAWL_API_KEY,
    VITE_PERPLEXITY_API_KEY: !!import.meta.env.VITE_PERPLEXITY_API_KEY,
    VITE_NASA_API_KEY: !!import.meta.env.VITE_NASA_API_KEY,
    VITE_OPENWEATHER_API_KEY: !!import.meta.env.VITE_OPENWEATHER_API_KEY,
    VITE_MAPBOX_API_KEY: !!import.meta.env.VITE_MAPBOX_API_KEY,
  });

  return {
    firecrawlKey: import.meta.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY || '',
    perplexityKey: import.meta.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY || '',
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    nasaKey: import.meta.env.VITE_NASA_API_KEY || process.env.NASA_API_KEY || '',
    openweatherKey: import.meta.env.VITE_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || '',
    mapboxKey: import.meta.env.VITE_MAPBOX_API_KEY || process.env.MAPBOX_API_KEY || '',
  }
}

// Helper function to get configuration values
export const getConfigValue = (key: string): string | number => {
  switch (key) {
    case 'FIRECRAWL_MONTHLY_CREDITS':
      return Number(import.meta.env.VITE_FIRECRAWL_MONTHLY_CREDITS || process.env.FIRECRAWL_MONTHLY_CREDITS || 600);
    default:
      return import.meta.env[key] || process.env[key] || '';
  }
}

// Helper function to check if a specific key is configured
export const isKeyConfigured = (keyName: keyof ReturnType<typeof getApiKeys>): boolean => {
  const keys = getApiKeys()
  return Boolean(keys[keyName])
}

// Helper function to get a specific key
export const getApiKey = (keyName: keyof ReturnType<typeof getApiKeys>): string => {
  const keys = getApiKeys()
  return keys[keyName] || ''
}