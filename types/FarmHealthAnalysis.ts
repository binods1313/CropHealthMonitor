
export interface FarmHealthAnalysis {
  // Metadata
  reportId: string;
  version: string;
  generatedAt: string;
  
  // Farm Basics
  farmName: string;
  location: {
    name: string;
    coordinates: {lat: number; lon: number;};
  };
  cropType: string;
  areaHa: number;
  scanDate: string;
  
  // Health Assessment
  healthScore: number;
  healthLabel: 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';
  primaryDiagnosis: string;
  confidenceScore: number;
  timeToAction: string;
  yieldRisk: string;
  executiveSummary: string;
  
  // NDVI & Imagery
  ndviMetrics: {
    min: number;
    max: number;
    mean: number;
    stressZones: {
      critical: number; // % area < 0.5
      moderate: number; // % area 0.5-0.75
      healthy: number;  // % area > 0.75
    };
  };
  images: {
    ndviMap: string;             // Base64: Raw Satellite Style
    deficiencyOverlay: string;   // Base64: Clinical GIS Style
  };
  
  // Environmental Data
  soilMetrics: {
    pH: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    moisture: number;
    organicMatter: number;
  };
  weatherMetrics: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
  };
  
  // Detailed Impact Assessment
  impactAssessment: {
    primaryLimitingFactor: string;
    secondaryRisks: string[];
    rootCauseAnalysis: string;
    predictedImpact: string;
    confidenceExplanation: string;
  };
  
  // Interventions
  interventions: Array<{
    priority: 'P1' | 'P2' | 'P3';
    action: string;
    goal: string;
    impact: string;
    materials: string;
    timing: string;
    costLevel: 'Low' | 'Medium' | 'High';
    confidence: number;
    expectedOutcome: string;
  }>;
  
  // Resources & Logistics
  resources: {
    materialsList: string[];
    equipmentNeeded: string[];
    laborRequirements?: string;
    estimatedCost: string;
  };
  logistics: {
    timeline: Array<{ week: string; action: string }>;
  };
  
  // Monitoring Plan
  monitoringPhases: Array<{
    phase: string;
    timeRange: string;
    actions: string[];
    successMetrics: string;
  }>;
  
  // Communication
  communicationChannels: Array<{
    channel: string;
    updateFrequency: string;
  }>;
  
  // Historical Context
  historicalFarmEvents: Array<{
    season: string;
    issue: string;
    treatment: string;
    outcome: string;
  }>;
  regionalProfile: string;
  
  // Data Sources & Metadata
  dataSources: {
    satelliteSource: string;
    soilDataSource: string;
    weatherSource: string;
    aiModelVersion: string;
  };
  
  // Sharing
  reportUrl: string;
}
