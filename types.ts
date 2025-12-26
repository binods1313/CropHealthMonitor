
export interface WeatherData {
  temp: number;
  precip: number;
  humidity: number;
  windSpeed: number;
  soilMoisture: number; // Percentage (0-100)
  cloudCover: number; // Percentage (0-100)
  windChill?: number; // Calculated "Feels Like" in Celsius
  windDirection?: number; // Degrees (0-360)
}

export interface SoilData {
  ph: number;
  organicMatter: number;
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
}

export interface ForecastDay {
  day: string;
  temp: number;
  condition: 'Clear' | 'Clouds' | 'Rain' | 'Snow' | 'Thunderstorm' | 'Drizzle' | 'Mist' | 'Atmosphere';
  precip?: number; // mm of rainfall
}

export interface FarmData {
  id: string;
  name: string;
  location: string;
  lat: number;
  lon: number;
  crop: string;
  sizeHa: number;
  date: string;
  weather: WeatherData;
  soil: SoilData;
  imageUrl: string;
  logoUrl?: string;
  maxWindSpeed?: number; // Operational threshold in km/h
  gustWindSpeed?: number;
  gustWindSpeedUnit?: string;
}

export interface NDVIStats {
  min: number;
  max: number;
  avg: number;
  stress_threshold: number;
}

export interface Intervention {
  title: string;
  goal: string;
  impact: string;
  confidence: number;
  materials: string[];
  rank?: number;
  action?: string;
  timing?: string;
  cost?: string;
}

export interface HealthReport {
  healthScore: number;
  confidence: number;
  primaryDiagnosis: string;
  affectedArea: string;
  detailedExplanation: string;
  interventions: Intervention[];
  monitoringPlan: string;
  overall_health_score?: number;
  primary_stress?: string;
  explanation?: string;
  affected_percent?: number;
  monitoring_plan?: string;
}

export interface SavedReport {
  id: string;
  farmId: string;
  farmName: string;
  crop: string;
  dateSaved: string;
  report: HealthReport;
}

export interface Region {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  country: string;
  suitableCrops: string[];
  season: string;
}

// --- Climate Specific Types ---

export interface CarbonBreakdown {
  energy: number;
  transport: number;
  flights: number;
  diet: number;
  fertilizer: number;
  pesticides: number;
  irrigation: number;
  livestock: number;
  machinery: number;
}

export interface ClimateRisk {
  category: string;
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  score: number; // 0-100
  impact: string;
  action: string;
}

export interface AdaptationStrategy {
  id: string;
  category: 'Variety' | 'Irrigation' | 'Calendar' | 'Soil' | 'Energy' | 'Water';
  title: string;
  description: string;
  reductionTonnes: number;
  savingsUSD: number;
  costUSD: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  paybackYears: number;
  impactPoints: string[];
}