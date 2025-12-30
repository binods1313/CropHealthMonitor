Task: Create Configuration File to Access Environment Variables
Objective: Create a centralized config file to properly access all API keys from Vercel environment variables and fix the "FIRECRAWL_API_KEY not configured" warning.

Instructions:

Step 1: Create src/config.ts file
Create a new file at src/config.ts with the following content:

typescript
/**
 * Configuration file for accessing environment variables
 * All sensitive API keys should be accessed through this file
 */

export const getApiKeys = () => {
  return {
    firecrawlKey: import.meta.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY || '',
    perplexityKey: import.meta.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY || '',
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    nasaKey: import.meta.env.VITE_NASA_API_KEY || process.env.NASA_API_KEY || '',
    openweatherKey: import.meta.env.VITE_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY || '',
    mapboxKey: import.meta.env.VITE_MAPBOX_API_KEY || process.env.MAPBOX_API_KEY || '',
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
Step 2: Update .env.example file
Add these lines to your .env.example (or create one if it doesn't exist):

text
# API Keys - Add your keys here for local development
# These will be automatically loaded from Vercel environment variables in production

VITE_FIRECRAWL_API_KEY=your_firecrawl_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_key_here
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_NASA_API_KEY=your_nasa_key_here
VITE_OPENWEATHER_API_KEY=your_openweather_key_here
VITE_MAPBOX_API_KEY=your_mapbox_key_here
Step 3: Update the Real-time Web Data Enhancement Component
Find the component that displays the "FIRECRAWL_API_KEY not configured" warning and update it:

Before:

typescript
// OLD CODE - checking hardcoded or unavailable variable
if (!FIRECRAWL_API_KEY || !process.env.FIRECRAWL_API_KEY) {
  return <WarningBanner message="FIRECRAWL_API_KEY not configured..." />
}
After:

typescript
import { isKeyConfigured, getApiKey } from '@/config'

// NEW CODE - properly checking environment variable
const firecrawlKey = getApiKey('firecrawlKey')
const isConfigured = isKeyConfigured('firecrawlKey')

if (!isConfigured) {
  return <WarningBanner message="FIRECRAWL_API_KEY not configured..." />
}

// Use the key for API calls
const response = await fetch('https://api.firecrawl.dev/...', {
  headers: {
    'Authorization': `Bearer ${firecrawlKey}`
  }
})
Step 4: Update vite.config.ts
Make sure your vite.config.ts loads environment variables:

typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // This ensures environment variables are available
  define: {
    'process.env': JSON.stringify(process.env)
  }
})
Step 5: Update all components using API keys
Replace all direct references to environment variables with imports from the config file:

typescript
// Instead of:
const key = process.env.FIRECRAWL_API_KEY

// Use:
import { getApiKey } from '@/config'
const key = getApiKey('firecrawlKey')
Step 6: Commit and Push
bash
git add src/config.ts .env.example vite.config.ts
git commit -m "feat: Add centralized API key configuration file"
git push origin main
Vercel will automatically redeploy with the new code.

Expected Result:
✅ All API keys will be properly loaded from Vercel environment variables
✅ The "FIRECRAWL_API_KEY not configured" warning will disappear
✅ Web enhancement and all features will work correctly
✅ Clean, maintainable code for managing multiple API keys

Timeline: After pushing to GitHub, the app will redeploy in 2-3 minutes and the warning should be gone!