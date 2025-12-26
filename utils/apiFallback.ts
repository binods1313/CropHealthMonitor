/**
 * Utility function to fetch data with fallback to mock data
 * Prioritizes real API calls, falls back to mock data if API fails
 * 
 * @param apiCall - The API call function to execute
 * @param mockData - The mock data to use if API call fails
 * @param errorMessage - Optional error message to log
 * @returns The API response or mock data
 */
export async function fetchWithFallback<T>(
  apiCall: () => Promise<T>,
  mockData: T,
  errorMessage: string = "API call failed"
): Promise<T> {
  try {
    // Attempt the API call
    const result = await apiCall();
    
    // If the result is valid (not null, undefined, or empty), return it
    if (result !== null && result !== undefined) {
      // For objects/arrays, check if they have content
      if (typeof result === 'object' && !Array.isArray(result)) {
        // If it's an object, check if it has keys
        if (Object.keys(result).length > 0) {
          return result;
        }
      } else if (Array.isArray(result)) {
        // If it's an array, check if it has elements
        if (result.length > 0) {
          return result;
        }
      } else {
        // For primitives, just return the value
        return result;
      }
    }
    
    // If we get here, the API call returned an empty result
    console.warn(`${errorMessage}: API returned empty result, using mock data`);
    return mockData;
  } catch (error) {
    // Log the error with details
    console.warn(`${errorMessage}:`, error);
    
    // Return mock data as fallback
    return mockData;
  }
}

/**
 * Type for API key configuration
 */
export interface ApiKeyConfig {
  geminiApiKey?: string;
  nasaApiKey?: string;
  openWeatherApiKey?: string;
}

/**
 * Function to validate if API keys are available
 * @param config - Configuration object containing API keys
 * @returns Boolean indicating if keys are available
 */
export function validateApiKeys(config: ApiKeyConfig): boolean {
  // For now, we'll consider keys valid if they're not explicitly empty
  // In a real implementation, you'd want to validate the actual key format
  return !!(
    (config.geminiApiKey && config.geminiApiKey.trim() !== '') ||
    (config.nasaApiKey && config.nasaApiKey.trim() !== '') ||
    (config.openWeatherApiKey && config.openWeatherApiKey.trim() !== '')
  );
}

/**
 * Function to check if API key is valid before making a call
 * @param apiKey - The API key to check
 * @returns Boolean indicating if key is valid
 */
export function isValidApiKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim() !== '' && apiKey.length > 10;
}