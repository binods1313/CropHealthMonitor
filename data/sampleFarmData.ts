
import { FarmHealthAnalysis } from '../types/FarmHealthAnalysis';

export const samplePunjabWheatFarm: FarmHealthAnalysis = {
  reportId: "FARM-GENERATE-20251213",
  version: "v1.0",
  generatedAt: "2025-12-13T22:29:34Z",
  
  farmName: "Punjab Mustard Farm #610",
  location: {
    name: "Punjab, India",
    coordinates: {lat: 30.9010, lon: 75.8573}
  },
  cropType: "Mustard",
  areaHa: 191,
  scanDate: "December 14, 2025",
  
  healthScore: 68,
  healthLabel: "MODERATE",
  primaryDiagnosis: "Mustard Aphid Infestation & Spatial Growth Variability",
  confidenceScore: 88,
  timeToAction: "Within 7 days",
  yieldRisk: "High Risk",
  executiveSummary: "The crop displays significant spatial variability, indicated by the wide NDVI range (Min 0.35 to Max 0.85). While the Soil Analysis reveals excellent fertility—pH 6.76 (optimal), Nitrogen 71ppm (High), Phosphorus 32ppm (Adequate), and Potassium 168ppm (Good)—the high Nitrogen levels can promote succulent growth that attracts pests. The current weather conditions in Punjab (14°C and 38% humidity) are the classic epidemiological window for the proliferation of Mustard Aphid (Lipaphis erysimi). The lower NDVI values likely correspond to areas of severe aphid colonization causing stunting, or edge-effects from the visible peri-urban fragmentation in the satellite imagery, rather than nutrient deficiency.",
  
  ndviMetrics: {
    min: 0.35,
    max: 0.85,
    mean: 0.62,
    stressZones: {
      critical: 45, // Inferred from "lower NDVI values likely correspond to areas of severe aphid colonization"
      moderate: 30,
      healthy: 25
    }
  },
  
  images: {
    // These base64 strings are placeholders. In a real app, these would come from the API.
    // Ideally, these should be replaced with the URLs of the generated images if available.
    ndviMap: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=75.8,30.8,76.0,31.0&bboxSR=4326&size=600,600&f=image", 
    deficiencyOverlay: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/export?bbox=75.8,30.8,76.0,31.0&bboxSR=4326&size=600,600&f=image"
  },
  
  soilMetrics: {
    pH: 6.76,
    nitrogen: 71.14,
    phosphorus: 31.93,
    potassium: 168.32,
    moisture: 48,
    organicMatter: 1.85
  },
  
  weatherMetrics: {
    temperature: 25,
    humidity: 52,
    windSpeed: 13.8,
    precipitation: 7.5
  },
  
  impactAssessment: {
    primaryLimitingFactor: "Nitrogen availability in low-NDVI zones (southern and western portions)",
    secondaryRisks: [
      "Phosphorus-induced zinc antagonism",
      "Uneven irrigation distribution",
      "Delayed maturity in stressed zones"
    ],
    rootCauseAnalysis: "Insufficient nitrogen (49.3 mg/kg, below optimal 60+ mg/kg) combined with high phosphorus (53 mg/kg) creating antagonistic effect on zinc uptake.",
    predictedImpact: "25-40% yield reduction in affected zones; delayed maturity creating harvest management challenges.",
    confidenceExplanation: "Based on Sentinel-2 10m resolution NDVI, on-site soil lab analysis, and validated AI models."
  },
  
  interventions: [
    {
      priority: "P1",
      action: "Integrated Pest Management (IPM) for Aphids",
      goal: "Reduce pest population below economic threshold levels",
      impact: "Prevents sap depletion and sooty mold development, recovering yield potential in the 0.35-0.50 NDVI zones.",
      materials: "Yellow Sticky Traps (40/ha), Neem Oil (Azadirachtin 1500 ppm), Imidacloprid (if infestation >20%)",
      timing: "Immediate",
      costLevel: "Medium",
      confidence: 92,
      expectedOutcome: "Improvement in crop vigor"
    },
    {
      priority: "P2",
      action: "Variable Rate Fertility Management",
      goal: "Optimize nutrient uptake in high-potential zones vs stressed zones",
      impact: "Leverages the high soil N (71ppm) effectively without causing lodging in high NDVI areas, while boosting root resilience in lower NDVI zones.",
      materials: "Variable Rate Sprayer, NDVI Zonation Map, Potassium Nitrate (foliar)",
      timing: "Immediate",
      costLevel: "Medium",
      confidence: 85,
      expectedOutcome: "Improvement in crop vigor"
    },
    {
      priority: "P3",
      action: "Peri-Urban Buffer Zone Management",
      goal: "Mitigate edge effects from adjacent urban structures visible in imagery",
      impact: "Reduces physical contamination and shading stress near built-up areas, stabilizing the minimum NDVI above 0.45.",
      materials: "Physical barriers/fencing, Border trap crops",
      timing: "Immediate",
      costLevel: "Medium",
      confidence: 75,
      expectedOutcome: "Improvement in crop vigor"
    }
  ],

  resources: {
    materialsList: [
      "Yellow Sticky Traps (40/ha)",
      "Neem Oil (Azadirachtin 1500 ppm)",
      "Imidacloprid (if infestation >20%)",
      "Variable Rate Sprayer",
      "NDVI Zonation Map",
      "Potassium Nitrate (foliar)",
      "Physical barriers/fencing",
      "Border trap crops"
    ],
    equipmentNeeded: [
      "Applicator/Sprayer",
      "Safety Gear",
      "Farm Machinery"
    ],
    estimatedCost: "Variable",
    laborRequirements: "3-4 Workers"
  },

  logistics: {
    timeline: [
      { week: "Week 1", action: "Immediate application of recommended interventions" },
      { week: "Week 2", action: "Monitoring of crop response and adjustment" }
    ]
  },
  
  monitoringPhases: [
    {
      phase: "Initial Response",
      timeRange: "0-7 days",
      actions: [
        "Apply variable rate nitrogen to P1 zones",
        "Capture baseline Sentinel-2 imagery for pre-treatment NDVI",
        "Conduct visual ground checks in all stress zones"
      ],
      successMetrics: "Complete P1 intervention coverage; baseline NDVI documented"
    },
    {
      phase: "Treatment Evaluation",
      timeRange: "7-21 days",
      actions: [
        "Weekly Sentinel-2 NDVI tracking to assess crop response",
        "Apply zinc foliar spray at flowering (day 10-14)",
        "Tissue sampling in previously stressed zones"
      ],
      successMetrics: "NDVI improvement >0.15 in treated zones; tissue N levels >3.0%"
    },
    {
      phase: "Follow-up Assessment",
      timeRange: "21-60 days",
      actions: [
        "Final pre-harvest NDVI assessment",
        "Yield prediction modeling using late-season NDVI",
        "Document lessons learned"
      ],
      successMetrics: "NDVI >0.75 across 85%+ of field area"
    }
  ],
  
  communicationChannels: [
    {channel: "SMS Alerts", updateFrequency: "Real-time for critical actions"},
    {channel: "Email Reports", updateFrequency: "Weekly NDVI updates"},
    {channel: "WhatsApp Group", updateFrequency: "Daily during intervention"},
    {channel: "Dashboard", updateFrequency: "Live (satellite refresh every 5 days)"}
  ],
  
  historicalFarmEvents: [
    {
      season: "Rabi 2024-25",
      issue: "Early drought stress",
      treatment: "Supplemental irrigation",
      outcome: "92% of expected yield achieved"
    },
    {
      season: "Rabi 2023-24",
      issue: "Aphid infestation",
      treatment: "Integrated pest management",
      outcome: "Minimal yield impact; controlled within 2 weeks"
    },
    {
      season: "Rabi 2022-23",
      issue: "Lodging in high-N zones",
      treatment: "Reduced nitrogen rates",
      outcome: "Improved standability; uniform harvest"
    }
  ],
  
  regionalProfile: "Punjab's wheat belt experiences intensive cropping with high input use. Common challenges include nitrogen volatilization (20-30% losses), phosphorus buildup, and micronutrient depletion (Zn, Fe). Winter temperatures 10-18°C; harvest period 25-35°C. Regional average: 4.5-5.0 tons/ha irrigated wheat.",
  
  dataSources: {
    satelliteSource: "Sentinel-2 NDVI Analysis",
    soilDataSource: "Lab Analysis (Dec 2025)",
    weatherSource: "Local Meteorological Station",
    aiModelVersion: "CropHealth AI Engine v2.3"
  },
  
  reportUrl: "https://crophealth.app/report/FARM-GENERATE-20251213"
};
