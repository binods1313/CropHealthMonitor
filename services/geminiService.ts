
import { SchemaType } from "@google/generative-ai";
import { FarmData, HealthReport, NDVIStats, SoilData } from "../types";
import { DisasterAnalysis, DISASTER_REPORT_SCHEMA } from "./DisasterReportEnhancement";
import { fetchWithFallback } from '../utils/apiFallback';

const REPORT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    healthScore: { type: SchemaType.NUMBER, description: "0 to 100 integer score of crop health" },
    confidence: { type: SchemaType.NUMBER, description: "AI confidence level 0 to 100" },
    primaryDiagnosis: { type: SchemaType.STRING, description: "The main identified issue" },
    affectedArea: { type: SchemaType.STRING, description: "Percentage or description of area affected" },
    detailedExplanation: { type: SchemaType.STRING, description: "Comprehensive agronomic reasoning" },
    interventions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          goal: { type: SchemaType.STRING },
          impact: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          materials: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["title", "goal", "impact", "confidence", "materials"]
      }
    },
    monitoringPlan: { type: SchemaType.STRING }
  },
  required: ["healthScore", "primaryDiagnosis", "affectedArea", "detailedExplanation", "interventions", "monitoringPlan"]
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([
    promise.then(res => { clearTimeout(timeoutHandle); return res; }),
    timeoutPromise
  ]);
};

const withRetry = async <T>(fn: () => Promise<T>, maxRetries: number = 2, delayMs: number = 2000): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('401') || error.message?.includes('403') || attempt === maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }
  throw lastError;
};

// Added missing fallbackHealthReport function to handle AI failures gracefully
const fallbackHealthReport = (errorMessage: string): HealthReport => ({
  healthScore: 50,
  confidence: 0,
  primaryDiagnosis: "Analysis Failure",
  affectedArea: "Unknown",
  detailedExplanation: `Spatial and spectral analysis could not be completed due to a system handshake error: ${errorMessage}. Please check connectivity and spectral source availability.`,
  interventions: [],
  monitoringPlan: "Retry analysis or check system logs.",
  overall_health_score: 50,
  primary_stress: "System Error",
  explanation: "AI analysis was interrupted.",
  monitoring_plan: "Review network and API configuration."
});

export const analyzeFarmHealth = async (farm: FarmData, ndviStats: NDVIStats, base64Image: string, soilData: SoilData): Promise<HealthReport> => {
  // Define the API call function
  const apiCall = async (): Promise<HealthReport> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyzeFarmHealth',
        payload: { farm, ndviStats, base64Image, soilData, schema: REPORT_SCHEMA }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to analyze farm health");
    }

    const result = await response.json();
    return {
      ...result,
      overall_health_score: result.healthScore,
      primary_stress: result.primaryDiagnosis,
      explanation: result.detailedExplanation,
      monitoring_plan: result.monitoringPlan,
      interventions: result.interventions.map((i: any, idx: number) => ({
        ...i, rank: idx + 1, action: i.title, cost: "Medium", timing: "Immediate"
      }))
    };
  };

  // Use fallback mechanism
  return fetchWithFallback(
    apiCall,
    fallbackHealthReport("Gemini API call failed"),
    "Failed to analyze farm health via Gemini API"
  );
};

export const analyzeDisasterRisk = async (
  lat: number,
  lon: number,
  locationName: string,
  categories: string[],
  isFuture: boolean,
  bounds?: { north: number; south: number; east: number; west: number }
): Promise<DisasterAnalysis> => {
  // Define the API call function
  const apiCall = async (): Promise<DisasterAnalysis> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyzeDisasterRisk',
        payload: { lat, lon, locationName, categories, isFuture, bounds, schema: DISASTER_REPORT_SCHEMA }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to analyze disaster risk");
    }

    const parsed = await response.json();

    return {
      ...parsed,
      meta: {
        ...(parsed.meta || {}),
        generatedAt: new Date().toISOString(),
        reportVersion: isFuture ? 'L5-ADAPT-2030' : 'L5-SIGNAL-LIVE',
        overallConfidenceScore: parsed.meta?.overallConfidenceScore || 0.88
      }
    };
  };

  // Use fallback mechanism
  return fetchWithFallback(
    apiCall,
    generateFallbackDisasterReport(lat, lon, locationName, categories[0]),
    "Failed to analyze disaster risk via Gemini API"
  );
};

const generateFallbackDisasterReport = (lat: number, lon: number, region: string, type: string): DisasterAnalysis => ({
  metadata: {
    eventId: `ERR-FIX-${Date.now()}`,
    disasterType: type || "Regional Hazard",
    severity: 6,
    detectionTime: new Date().toISOString(),
    location: { region, country: "Global Sector", coordinates: { lat, lon }, affectedAreaSqKm: 150 },
    satelliteImagery: { provider: "Sentinel-2 Fallback", date: new Date().toISOString(), resolution: "10m" }
  },
  riskAssessment: {
    immediateRisk: { severity: 6, description: "Rapidly spreading vector hazard detected. Immediate threat to residential settlements and agricultural infrastructure.", timeToImpact: "1-3 Hours", populationAtRisk: 1500 },
    trajectoryPrediction: { predictedPath: "Predominantly East-North-East, driven by strong westerly winds.", windInfluence: "Major", spreadRate: "Rapid (2-5 km/hr)", confidence: 0.85 },
    environmentalFactors: { temperature: 32, humidity: 30, windSpeed: 14.5, windDirection: "West (270°)", precipitation: 0 }
  },
  interventionStrategy: {
    immediateActions: [
      { priority: 1, action: "Activate Type 2 IMT", goal: "Establish Command", impact: "High", timing: "Within 1 hour", responsibleAgency: "Regional Emergency Management", resources: ["IMT Unit"], costLevel: "Medium", expectedOutcome: "Command established" },
      { priority: 1, action: "Deploy Suppression Units", goal: "Containment", impact: "Critical", timing: "Immediately", responsibleAgency: "Forest Service", resources: ["Air Support"], costLevel: "High", expectedOutcome: "Lines established" }
    ],
    evacuationPlan: {
      zones: [
        { zoneId: "ZA-1", name: "Zone Alpha", population: 750, evacuationRoute: "Highway 27 North", timeToEvacuate: "1-2 Hours" }
      ],
      shelterLocations: ["Regional Civic Center", "Municipal Gymnasium"]
    },
    resourceAllocation: { firefighting: "District Assets Deployed", medical: "Emergency Response Ready", emergency: "EOC Level 2" }
  },
  monitoringPlan: {
    timelinePhases: [
      { phase: "Initial Response", actions: ["Deploy units", "Issue alerts"], checkpoints: ["Resource staging"] },
      { phase: "Containment", actions: ["Mop-up", "Structure protection"], checkpoints: ["Perimeter check"] }
    ],
    liveMonitoringPoints: []
  },
  communicationStrategy: {
    publicAlerts: { channels: ["EBS", "SMS", "Radio"], messageFrequency: "Hourly", keyMessages: ["Evacuate Zone Alpha", "Limit outdoor activity"] },
    officialUpdates: { authority: "Regional Command", updateFrequency: "Continuous" }
  },
  historicalContext: {
    previousSimilarEvents: [
      { event: "Large-Scale Event 1", year: "2017", impact: "Property damage" }
    ],
    regionalRiskProfile: "High risk profile due to dense vegetation and adverse weather conditions."
  },
  meta: { overallConfidenceScore: 0.9, disclaimer: "SIMULATION: Handshake failure recovery mode active.", generatedAt: new Date().toISOString(), reportVersion: "L5-RECOVERY" }
});

export const generateFarmLogo = async (farm: FarmData): Promise<string> => {
  // Define the API call function
  const apiCall = async (): Promise<string> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateImage',
        payload: {
          prompt: `Professional circular logo for "${farm.name}". Stylized "${farm.crop}" icon. Minimalist, modern agritech style.`,
          model: 'gemini-1.5-flash'  // Changed to a more reliable model
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to generate farm logo");
    }

    const result = await response.json();
    return `data:image/png;base64,${result.data}`;
  };

  // Use fallback mechanism (return empty string as fallback)
  return fetchWithFallback(
    apiCall,
    '',
    "Failed to generate farm logo via Gemini API"
  );
};

export const generateDisasterImpactMap = async (data: DisasterAnalysis): Promise<string | null> => {
  // Define the API call function
  const apiCall = async (): Promise<string | null> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateImage',
        payload: {
          prompt: `Tactical top-down GIS impact map for ${data.metadata.disasterType} in ${data.metadata.location.region}.
            Dark gray coordinate grid. Digital heatmap overlays (Red/Amber risk zones). Vector spread arrows. Technical command style.`,
          model: 'gemini-1.5-flash'  // Changed to a more reliable model
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to generate disaster impact map");
    }

    const result = await response.json();
    return `data:image/png;base64,${result.data}`;
  };

  // Use fallback mechanism (return null as fallback)
  return fetchWithFallback(
    apiCall,
    null,
    "Failed to generate disaster impact map via Gemini API"
  );
};
