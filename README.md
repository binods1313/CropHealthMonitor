<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Lzn7SRDAE1G3iEr2EZ7anFUuJatSE0Rx

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Security Notice: XLSX Library Vulnerability

### Current Status
The project currently uses `xlsx@0.18.5` which has a known high-severity vulnerability (Prototype Pollution / ReDoS). A patched version is not yet available upstream.

### Mitigation Measures Implemented
1. **Input Validation Guardrails:**
   - File size limits (reject spreadsheets >10MB)
   - File type restrictions (.xlsx, .xlsm only)
   - Schema validation for expected headers and column types
   - Malformed structure detection and rejection

2. **Safe Parsing Workflow:**
   - All Excel parsing wrapped in try/catch blocks
   - Defensive logging for monitoring and debugging
   - Sandboxed parsing to isolate risk
   - Formula validation to detect potentially malicious content

3. **Security Options:**
   - `cellNF: false` and `cellText: false` to reduce attack surface
   - Row limits (10,000 rows maximum) to prevent resource exhaustion
   - Sheet name validation to prevent path traversal issues
   - Dangerous formula detection (e.g., EXECUTE, CALL, HYPERLINK)

### Safe Excel Handling
All Excel operations should now use the safe wrapper functions in `utils/safeExcelHandler.ts`:
- `safeReadExcelFile()` for file reading with validation
- `safeParseExcelData()` for data parsing with security options
- `getSheetDataSafely()` for accessing worksheet data
- `sheetToJSONSafely()` for converting to JSON with limits

### Future Plans
- Tracking SheetJS GitHub advisories for patches
- Evaluating migration to `exceljs` library for long-term security
- Regular dependency audits using `npm audit`

### Monitoring
- All Excel-related operations are logged for security monitoring
- Re-audit dependencies regularly (npm audit) to catch updates

## API Configuration: Fallback to Mock Data

### Approach
The app prioritizes live API calls to Gemini, NASA, and OpenWeather services. If any API key is missing, invalid, or the request fails, the app automatically falls back to mock/simulated data to keep all dashboards functional.

### Configuration
The app uses the following environment variables for API access:
- `VITE_GEMINI_API_KEY` - Gemini AI API key
- `VITE_NASA_API_KEY` - NASA API key (for EONET data)
- `VITE_OPENWEATHER_API_KEY` - OpenWeatherMap API key

### Fallback Mechanism
All API calls use the `fetchWithFallback` utility function which:
1. Attempts the live API call first
2. If the API key is missing, invalid, or the call fails (e.g., 401 Unauthorized, 403 Forbidden, timeout), logs the error clearly
3. Automatically triggers fallback to mock data from the `mockData/` directory
4. Ensures all dashboards (Health, Climate, Risk) remain fully functional

### Mock Data
Mock data files are located in the `mockData/` directory:
- `healthDashboard.json` - Mock data for health dashboard (NDVI, soil pH, temperature)
- `climateDashboard.json` - Mock data for climate dashboard (wind, humidity, precipitation)
- `riskDashboard.json` - Mock data for risk dashboard (hazard maps, wildfire scenarios)

### Implementation
The fallback mechanism is implemented in:
- `utils/apiFallback.ts` - Contains the `fetchWithFallback` utility function
- `services/geminiService.ts` - Updated to use fallback for Gemini API calls
- `services/weatherService.ts` - Updated to use fallback for OpenWeatherMap API calls
- `server/routes/disasters.ts` - Updated to use fallback for NASA EONET API calls

### Verification
- When API keys are valid and accessible, the app uses live API data
- When API keys are missing or invalid, the app seamlessly loads mock data
- Dashboards remain fully functional in both cases
- Clear logging indicates when mock data is being used
