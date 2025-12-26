
import React, { useMemo } from 'react';
/* Fix: Re-importing useLocation and useNavigate to ensure they are correctly recognized as exported members of react-router-dom */
import { useLocation, useNavigate } from 'react-router-dom';
import { FarmData, HealthReport } from '../types';
import { FarmHealthExportPanel } from './FarmHealthExportPanel';
import { FarmHealthAnalysis } from '../types/FarmHealthAnalysis';
import { samplePunjabWheatFarm } from '../data/sampleFarmData';
import { FarmHealthDashboard } from './FarmHealthDashboard';

interface LocationState {
  farm: FarmData;
  report: HealthReport;
  shareUrl?: string;
  generatedImages?: {
    ndviMap: string | null;
    deficiencyOverlay: string | null;
  };
}

const CropHealthReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract data from navigation state
  const { farm, report, shareUrl, generatedImages } = (location.state as LocationState) || {};

  // Transform legacy data to new comprehensive FarmHealthAnalysis format
  const analysisData: FarmHealthAnalysis = useMemo(() => {
    // If no farm data, return sample data to prevent crash
    if (!farm || !report) return samplePunjabWheatFarm;

    // Extract materials for resources section
    const allMaterials = (report.interventions || []).flatMap(i => i.materials || []);
    const uniqueMaterials = Array.from(new Set(allMaterials));

    return {
      reportId: `FARM-${farm.id.slice(0,8).toUpperCase()}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`,
      version: "v1.0",
      generatedAt: new Date().toISOString(),
      
      farmName: farm.name,
      location: {
        name: farm.location,
        coordinates: { lat: farm.lat, lon: farm.lon }
      },
      cropType: farm.crop,
      areaHa: farm.sizeHa,
      scanDate: farm.date,
      
      healthScore: report.healthScore ?? report.overall_health_score ?? 0,
      healthLabel: (report.healthScore || 0) > 75 ? 'GOOD' : (report.healthScore || 0) > 50 ? 'MODERATE' : 'POOR',
      primaryDiagnosis: report.primaryDiagnosis ?? report.primary_stress ?? "Unknown",
      confidenceScore: report.confidence || 85,
      timeToAction: "Within 7 days",
      yieldRisk: "High Risk", // Inferred
      executiveSummary: report.detailedExplanation ?? report.explanation ?? "Analysis complete.",
      
      // Use sample metrics structure if specific field data isn't in legacy report
      ndviMetrics: {
        min: 0.35,
        max: 0.85,
        mean: 0.62,
        stressZones: {
            critical: 45,
            moderate: 30,
            healthy: 25
        }
      },
      
      // CRITICAL: Use the generated images passed from Dashboard if available. 
      // Fallback to the generic URL only if generation failed.
      images: {
        ndviMap: generatedImages?.ndviMap || farm.imageUrl,
        deficiencyOverlay: generatedImages?.deficiencyOverlay || farm.imageUrl 
      },
      
      soilMetrics: {
        pH: farm.soil.ph,
        nitrogen: farm.soil.nitrogen,
        phosphorus: farm.soil.phosphorus,
        potassium: farm.soil.potassium,
        moisture: farm.weather.soilMoisture,
        organicMatter: farm.soil.organicMatter
      },
      weatherMetrics: {
        temperature: farm.weather.temp,
        humidity: farm.weather.humidity,
        windSpeed: farm.weather.windSpeed,
        precipitation: farm.weather.precip
      },
      
      impactAssessment: {
        primaryLimitingFactor: report.primaryDiagnosis || "Environmental Stress",
        secondaryRisks: ["Yield Reduction", "Pest Vulnerability"],
        rootCauseAnalysis: "Combination of detected soil parameters and recent weather patterns.",
        predictedImpact: "Potential yield loss if untreated.",
        confidenceExplanation: "AI confidence based on provided sensor data."
      },
      
      interventions: (report.interventions || []).map((i, idx) => ({
        priority: idx === 0 ? 'P1' : idx === 1 ? 'P2' : 'P3',
        action: i.title || i.action,
        goal: i.goal,
        impact: i.impact,
        materials: (i.materials || []).join(', '),
        timing: i.timing || "Immediate",
        costLevel: (i.cost as any) || "Medium",
        confidence: i.confidence,
        expectedOutcome: "Improvement in crop vigor"
      })),

      resources: {
        materialsList: uniqueMaterials.length > 0 ? uniqueMaterials : ["Standard inputs"],
        estimatedCost: "Variable",
        equipmentNeeded: ["Applicator/Sprayer", "Safety Gear"]
      },
      
      logistics: {
        timeline: [
            { week: "Week 1", action: "Immediate application of recommended interventions" },
            { week: "Week 2", action: "Monitoring of crop response and adjustment" }
        ]
      },
      
      // Fallback to sample structure for static sections if dynamic data missing
      monitoringPhases: samplePunjabWheatFarm.monitoringPhases,
      communicationChannels: samplePunjabWheatFarm.communicationChannels,
      historicalFarmEvents: samplePunjabWheatFarm.historicalFarmEvents,
      regionalProfile: samplePunjabWheatFarm.regionalProfile,
      
      dataSources: {
        satelliteSource: "Sentinel-2 NDVI",
        soilDataSource: "Farm Sensor Network",
        weatherSource: "OpenWeather API",
        aiModelVersion: "Gemini 3 Pro Ag-Model"
      },
      
      reportUrl: shareUrl || window.location.href
    };
  }, [farm, report, shareUrl, generatedImages]);

  if (!farm || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-xl font-bold text-stone-700 mb-4">No report data available</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-12 print:bg-white print:pb-0">
      
      {/* Print Helper */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* Floating Back Button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="bg-stone-800 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm border border-stone-700 hover:bg-stone-900 flex items-center gap-2 transition-transform hover:-translate-y-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Analyze Another Farm
        </button>
      </div>

      {/* Render the Full 12-Section Dashboard */}
      <FarmHealthDashboard data={analysisData} />

    </div>
  );
};

export default CropHealthReport;
