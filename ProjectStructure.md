# CropHealth Monitor - Project Structure

## Overview
CropHealth Monitor is an advanced agricultural intelligence platform that leverages AI, satellite imagery, and environmental data to provide comprehensive crop health analysis, climate resilience planning, and disaster risk detection. The application features a modern React frontend with TypeScript, utilizing Gemini AI for analysis and various data sources for real-time monitoring.

## Project Architecture

### Frontend Structure
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom animations and gradients
- **Routing**: React Router DOM with HashRouter
- **State Management**: React Context API (ThemeContext)
- **Icons**: Lucide React
- **Maps**: React Leaflet with Leaflet
- **Charts**: Recharts
- **Build Tool**: Vite

### Backend Structure
- **API**: Node.js with Express
- **AI Integration**: Google Gemini API
- **Environment**: Vite environment variables

## Directory Structure

```
E:\Agentic AIs\V3 CropHealthMonitor\
├── api/
│   └── analyze.ts
├── components/
│   ├── ClimateVisualizer.tsx
│   ├── ConfigModal.tsx
│   ├── CropHealthReport.tsx
│   ├── Dashboard.tsx
│   ├── DisasterDetect.tsx
│   ├── DisasterExportPanel.tsx
│   ├── DisasterReport.tsx
│   ├── DisasterShareReport.tsx
│   ├── FallbackTileLayer.tsx
│   ├── FarmDiscoveryCard.tsx
│   ├── FarmEditModal.tsx
│   ├── FarmHealthDashboard.tsx
│   ├── FarmMap.tsx
│   ├── Footer.tsx
│   ├── InterventionList.tsx
│   ├── MapZoomControl.tsx
│   ├── NDVIHeatmap.tsx
│   ├── SavedReportsModal.tsx
│   ├── ShareReport.tsx
│   └── TrendChart.tsx
├── constants/
├── data/
│   └── sampleFarmData.ts
├── docs/
├── hooks/
├── mockData/
├── public/
├── server/
├── services/
│   ├── climateService.ts
│   ├── DisasterReportEnhancement.ts
│   ├── farmImageService.ts
│   ├── geminiService.ts
│   ├── soilService.ts
│   ├── storageService.ts
│   └── weatherService.ts
├── test/
├── types/
│   ├── FarmHealthAnalysis.ts
│   └── index.ts
├── utils/
│   ├── apiFallback.ts
│   ├── disasterReportExport.ts
│   ├── farmHealthReportExport.ts
│   ├── safeExcelHandler.ts
│   └── windUtils.ts
├── .env
├── .gitignore
├── App.tsx
├── constants.ts
├── Errors.md
├── Instructions.md
├── README.md
├── ThemeContext.tsx
├── index.html
├── index.tsx
├── metadata.json
├── package-lock.json
├── package.json
├── tsconfig.json
├── types.ts
├── vercel.json
├── vite.config.ts
└── Warnings.md
```

## Key Files and Their Functions

### Root Level Files

#### `App.tsx`
- Main application component that sets up routing and theme context
- Implements lazy loading for internal modules to optimize performance
- Defines routes for Dashboard, Crop Health Report, Disaster Detection, and Climate Visualization
- Provides loading fallback during component loading

#### `index.tsx`
- Entry point of the React application
- Renders the App component within React StrictMode
- Handles DOM mounting and error checking

#### `ThemeContext.tsx`
- Implements theme management using React Context API
- Manages accent color selection and persistence in localStorage
- Provides CSS variable injection for global theme access
- Defines available color options (emerald, blue, purple, rose, amber, cyan)

#### `constants.ts`
- Contains mock farm data for demonstration purposes
- Defines image URL generation functions for farm visuals
- Implements NDVI statistics and region data
- Provides functions for generating nearby farms and mock NDVI data

#### `types.ts`
- Defines TypeScript interfaces for the application
- Includes interfaces for WeatherData, SoilData, FarmData, HealthReport, etc.
- Provides type safety across the application

#### `package.json`
- Defines project dependencies including React, React Router, Leaflet, Recharts, etc.
- Lists dev dependencies for TypeScript, Vite, and development tools
- Contains build scripts for development, building, and preview

#### `README.md`
- Provides project documentation including setup instructions
- Details security measures for XLSX library vulnerability
- Explains API configuration and fallback mechanisms

### API Directory

#### `api/analyze.ts`
- Server-side API endpoint for AI analysis
- Handles farm health analysis, disaster risk assessment, and image generation
- Implements security measures and API key validation
- Uses Google Gemini API for AI-powered analysis

### Components Directory

#### `Dashboard.tsx`
- Main dashboard component with farm selection and health metrics
- Implements geospatial intelligence map and sector proximity cards
- Features animated UI elements and Vedic sacred geometry patterns
- Provides navigation to health, climate, and risk sections

#### `CropHealthReport.tsx`
- Displays detailed crop health analysis reports
- Renders comprehensive farm health dashboard with 12 sections
- Implements export functionality and navigation controls

#### `DisasterDetect.tsx`
- Disaster risk detection and visualization component
- Provides tactical threat detection and surveillance capabilities
- Features disaster vector monitoring and risk assessment

#### `FarmMap.tsx`
- Interactive map component for farm visualization
- Implements geospatial intelligence with farm markers
- Provides filtering and selection capabilities

#### `FarmHealthDashboard.tsx`
- Comprehensive dashboard for displaying farm health analysis
- Contains 12 sections with detailed information about farm health
- Implements responsive design and data visualization

### Services Directory

#### `geminiService.ts`
- Service for interacting with Google Gemini API
- Handles farm health analysis, disaster risk assessment, and image generation
- Implements retry mechanisms and fallback strategies
- Provides error handling and timeout management

#### `weatherService.ts`
- Service for fetching real-time weather and forecast data
- Integrates with OpenWeatherMap API
- Implements fallback to mock data when API is unavailable

#### `storageService.ts`
- Service for managing saved reports in localStorage
- Provides functions for saving, retrieving, and deleting reports

#### `climateService.ts`
- Service for climate data analysis and risk assessment
- Handles carbon footprint calculations and adaptation strategies

### Utils Directory

#### `apiFallback.ts`
- Utility for implementing API fallback mechanisms
- Provides graceful degradation to mock data when APIs fail
- Implements retry logic and error handling

#### `safeExcelHandler.ts`
- Utility for secure Excel file handling
- Implements security measures to prevent XLSX library vulnerabilities
- Provides input validation and safe parsing workflows

#### `farmHealthReportExport.ts`
- Utility for exporting farm health reports
- Handles PDF and Excel export functionality
- Implements data formatting and styling

### Data Directory

#### `data/sampleFarmData.ts`
- Contains sample farm data for demonstration purposes
- Provides structure for farm health analysis
- Used as fallback when real data is unavailable

### Types Directory

#### `types/FarmHealthAnalysis.ts`
- Defines comprehensive interface for farm health analysis
- Contains detailed structure for health reports with multiple sections
- Provides type safety for complex analysis data

## Key Features

### 1. Crop Health Analysis
- NDVI (Normalized Difference Vegetation Index) analysis
- Soil health assessment
- Weather impact evaluation
- AI-powered diagnosis and recommendations

### 2. Climate Resilience Planning
- Carbon footprint analysis
- Climate risk assessment
- Adaptation strategy recommendations
- Emission reduction planning

### 3. Disaster Risk Detection
- Real-time threat monitoring
- Predictive risk modeling
- Emergency response planning
- Impact assessment and mitigation

### 4. Geospatial Intelligence
- Interactive farm mapping
- Location-based analysis
- Proximity detection for nearby farms
- Satellite imagery integration

### 5. Data Visualization
- Comprehensive dashboard with multiple metrics
- Trend charts and historical data
- Health score visualization
- Intervention prioritization

## Security Measures

### XLSX Library Vulnerability
- Input validation guardrails (file size, type restrictions)
- Safe parsing workflow with try/catch blocks
- Row limits and formula validation
- Sandboxed parsing to isolate risk

### API Security
- Environment variable-based API key management
- Fallback to mock data when APIs fail
- Request timeout and retry mechanisms
- Error logging and monitoring

## Deployment

### Local Development
1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env` file
3. Run the app: `npm run dev`

### Production Build
- Use `npm run build` for production builds
- Deploy with Vercel (configuration in `vercel.json`)

## Technologies Used

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router DOM for navigation
- React Leaflet for maps
- Recharts for data visualization
- Lucide React for icons

### Backend
- Node.js with Express
- Google Gemini API for AI analysis
- OpenWeatherMap API for weather data
- NASA EONET API for disaster data

### Build Tools
- Vite for bundling and development
- TypeScript for type safety
- npm for package management

## Architecture Patterns

### Component Structure
- Modular, reusable components
- Clear separation of concerns
- Context API for state management
- TypeScript interfaces for type safety

### Service Layer
- API abstraction and error handling
- Fallback mechanisms for resilience
- Centralized business logic
- Interceptor patterns for request/response handling

### Data Flow
- Unidirectional data flow
- State management through React Context
- API service layer for data fetching
- Local storage for persistent data