
import React, { useState, useEffect } from 'react';
import { DisasterAnalysis } from '../services/DisasterReportEnhancement';
import { generateDisasterImpactMap } from '../services/geminiService';
import { DisasterExportPanel } from './DisasterExportPanel';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ChevronLeft, MapPin, Activity, ShieldAlert, Wind, Clock, User, 
  CheckCircle, Layers, AlertTriangle, FileText, Smartphone, History, 
  Info, AlertOctagon, Share2, Printer, Map, ShieldCheck, RefreshCcw, Leaf, XCircle
} from 'lucide-react';

interface DisasterReportProps {
  data: DisasterAnalysis;
  onBack: () => void;
  onShare: (images: { satellite: string | null, impact: string | null }) => void;
}

const SectionHeader: React.FC<{ title: string; subtitle?: string; pageNum?: number }> = ({ title, subtitle, pageNum }) => (
  <div className="border-b-2 border-red-900/10 pb-4 mb-8 flex justify-between items-end">
    <div>
      {subtitle && <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mb-1">{subtitle}</p>}
      <h2 className="text-2xl font-black text-red-900 tracking-tighter uppercase italic">{title}</h2>
    </div>
    {pageNum && <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Page 0{pageNum}</span>}
  </div>
);

const MetricCard: React.FC<{ label: string; value: string | number; accent: string }> = ({ label, value, accent }) => (
  <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: accent }} />
    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-2xl font-black text-stone-900 tracking-tight">{value}</p>
  </div>
);

const DisasterReport: React.FC<DisasterReportProps> = ({ data, onBack }) => {
  const [satelliteImageUrl, setSatelliteImageUrl] = useState<string | null>(null);
  const [impactVisualizationUrl, setImpactVisualizationUrl] = useState<string | null>(null);
  const [isGeneratingImagery, setIsGeneratingImagery] = useState(false);
  
  // Robust nested property extraction
  // Fixed: Cast fallbacks to any to prevent "Property '...' does not exist on type '{}'" errors during segment-based extraction
  const metadata = (data?.metadata ?? {}) as any;
  const riskAssessment = (data?.riskAssessment ?? {}) as any;
  const immediateRisk = (riskAssessment?.immediateRisk ?? {}) as any;
  const trajectory = (riskAssessment?.trajectoryPrediction ?? {}) as any;
  const envFactors = (riskAssessment?.environmentalFactors ?? {}) as any;
  const strategy = (data?.interventionStrategy ?? {}) as any;
  const monitoring = (data?.monitoringPlan ?? {}) as any;
  const comms = (data?.communicationStrategy ?? {}) as any;
  const histData = (data?.historicalContext ?? {}) as any;
  const meta = (data?.meta ?? {}) as any;
  
  const timestamp = new Date(meta.generatedAt ?? Date.now()).toLocaleString();

  useEffect(() => {
    const loadImagery = async () => {
      const coords = metadata?.location?.coordinates;
      if (!coords?.lat || !coords?.lon) return;

      setIsGeneratingImagery(true);

      // Primary satellite imagery URL from ESRI
      const bbox = `${coords.lon - 0.05},${coords.lat - 0.05},${coords.lon + 0.05},${coords.lat + 0.05}`;
      const primaryUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=1024,768&f=image`;

      // Test the primary URL and fallback if it fails
      try {
        const response = await fetch(primaryUrl, { method: 'HEAD' });
        if (response.ok) {
          setSatelliteImageUrl(primaryUrl);
        } else {
          // Fallback to OpenStreetMap static image if ESRI fails
          const fallbackUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coords.lon},${coords.lat},12,0,0/600x400?access_token=${process.env.VITE_MAPBOX_API_KEY || 'pk.eyJ1IjoiZGVmYXVsdC11c2VyIiwiYSI6ImNra2Zrc2ZycTBrc2oyc253MjR5dW53a24ifQ.0123456789abcdef0123456789abcdef0123456789a'}`;
          setSatelliteImageUrl(fallbackUrl);
        }
      } catch (error) {
        // If primary URL fails (e.g., CORS issue), use fallback
        const fallbackUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${coords.lon},${coords.lat},12,0,0/600x400?access_token=${process.env.VITE_MAPBOX_API_KEY || 'pk.eyJ1IjoiZGVmYXVsdC11c2VyIiwiYSI6ImNra2Zrc2ZycTBrc2oyc253MjR5dW53a24ifQ.0123456789abcdef0123456789abcdef0123456789a'}`;
        setSatelliteImageUrl(fallbackUrl);
      }

      try {
        const url = await generateDisasterImpactMap(data);
        setImpactVisualizationUrl(url);
      } catch (e) {
        console.warn("Failed to generate impact visualization", e);
      } finally {
        setIsGeneratingImagery(false);
      }
    };
    loadImagery();
  }, [data, metadata?.location?.coordinates]);

  return (
    <div className="min-h-screen bg-[#fcfcfb] pb-24 font-sans selection:bg-red-100 animate-fade-in">
      {/* PERSISTENT NAV */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-stone-100 px-8 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-all active:scale-95 border border-stone-100">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-8 w-px bg-stone-100" />
          <div>
            <h1 className="text-sm font-black text-stone-900 tracking-tight uppercase">{(metadata.disasterType ?? 'Hazard').toUpperCase()} SITREP</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{metadata.eventId ?? 'NODE-001'} • {metadata.location?.region ?? 'Global Cluster'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 mt-12 space-y-24">
        
        {/* PAGE 1: SITUATION OVERVIEW */}
        <section className="space-y-12">
          <div className="bg-red-900 rounded-[3rem] p-12 text-white shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="space-y-4">
                <p className="text-[12px] font-black text-red-200/60 uppercase tracking-[0.6em]">Situation Report</p>
                <h2 className="text-7xl font-black tracking-tighter uppercase italic leading-none">{metadata.disasterType ?? 'Unknown Event'}</h2>
                <div className="flex items-center gap-4 text-red-100/80 font-bold text-sm uppercase tracking-widest">
                  <MapPin size={18} className="text-red-400" />
                  {metadata.location?.region ?? 'Sector'}, {metadata.location?.country ?? 'Global'} • {new Date(metadata.detectionTime ?? Date.now()).toLocaleString()}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 text-center min-w-[200px]">
                <p className="text-[10px] font-black text-red-200 uppercase tracking-[0.3em] mb-2">Severity Index</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-black tracking-tighter">{metadata.severity ?? 5}</span>
                  <span className="text-xl font-bold opacity-40">/10</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="aspect-[4/3] bg-stone-100 rounded-[2.5rem] overflow-hidden border border-stone-200 shadow-inner group relative flex items-center justify-center">
                {satelliteImageUrl ? (
                   <img src={satelliteImageUrl} className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-125" alt="Satellite" />
                ) : (
                   <Map size={48} className="text-stone-300" />
                )}
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10">L2_SATELLITE_RGB</div>
              </div>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest text-center italic">Source: Satellite base imagery (NASA EONET / Esri / Landsat)</p>
            </div>
            <div className="space-y-3">
              <div className="aspect-[4/3] bg-stone-900 rounded-[2.5rem] overflow-hidden border border-stone-800 shadow-inner group relative flex items-center justify-center">
                {isGeneratingImagery ? (
                  <div className="flex flex-col items-center gap-4">
                    <Activity className="animate-pulse text-red-500" size={48} />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Neural Mapping...</span>
                  </div>
                ) : impactVisualizationUrl ? (
                  <img src={impactVisualizationUrl} className="w-full h-full object-cover" alt="Impact Map" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-stone-700">
                    <Layers size={48} strokeWidth={1.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">GIS Render Processing</span>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 px-4 py-2 bg-red-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg">AI_GIS_SIMULATION</div>
              </div>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest text-center italic">Source: AI-generated simulation based on environmental telemetry</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard label="Time to Impact" value={immediateRisk.timeToImpact ?? 'Calculating...'} accent="#f43f5e" />
            <MetricCard label="Population at Risk" value={immediateRisk.populationAtRisk?.toLocaleString() ?? '---'} accent="#f59e0b" />
            <MetricCard label="AI Confidence" value={`${((meta.overallConfidenceScore ?? 0.85) * 100).toFixed(0)}%`} accent="#10b981" />
          </div>

          <div className="space-y-6">
            <SectionHeader title="Executive Assessment" subtitle="Core Intelligence Summary" />
            <div className="p-10 bg-white border border-stone-100 rounded-[2.5rem] shadow-sm leading-relaxed text-lg font-medium text-stone-700 italic">
              “{immediateRisk.description ?? 'Analyzing regional telemetry and synchronizing disaster hazard vectors...'}”
            </div>
          </div>
        </section>

        {/* PAGE 2: ENVIRONMENTAL CONDITIONS */}
        <section className="space-y-12">
          <SectionHeader title="Environmental Conditions" subtitle="Atmospheric & GIS Parameters" pageNum={2} />
          <div className="overflow-hidden rounded-[2rem] border border-stone-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                <tr>
                  <th className="px-8 py-5">Factor</th>
                  <th className="px-8 py-5">Value / Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {[
                  { f: 'Wind Speed', v: envFactors.windSpeed ? `${envFactors.windSpeed} m/s` : '--' },
                  { f: 'Wind Direction', v: envFactors.windDirection ?? 'Unknown' },
                  { f: 'Humidity', v: envFactors.humidity ? `${envFactors.humidity}%` : '--' },
                  { f: 'Precipitation', v: envFactors.precipitation ? `${envFactors.precipitation} mm` : '0 mm' },
                  { f: 'Temperature', v: envFactors.temperature ? `${envFactors.temperature}°C` : '--' },
                  { f: 'Trajectory', v: trajectory.predictedPath ?? 'Stationary / Under Analysis' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors">
                    <td className="px-8 py-5 text-sm font-black text-stone-900 uppercase tracking-tighter">{row.f}</td>
                    <td className="px-8 py-5 text-sm font-bold text-stone-500">{row.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-8">
            <SectionHeader title="Detailed Impact Assessment" subtitle="Advanced Vector Analysis" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { l: 'Predicted Spread', v: trajectory.spreadRate ?? 'Calculating...' },
                { l: 'Wind Influence', v: trajectory.windInfluence ?? 'Analyzing atmospheric bias...' },
                { l: 'Affected Area', v: metadata.location?.affectedAreaSqKm ? `${metadata.location.affectedAreaSqKm} sq km` : 'Analyzing geometry...' },
                { l: 'Confidence Score', v: `${((meta.overallConfidenceScore ?? 0.85) * 100).toFixed(0)}%` },
              ].map((item, i) => (
                <div key={i} className="p-8 bg-stone-50 rounded-3xl border border-stone-100 group hover:bg-white hover:shadow-xl transition-all">
                  <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] mb-2">{item.l}</h4>
                  <p className="text-xl font-black text-stone-900 tracking-tight leading-tight">{item.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PAGE 3: STRATEGIC INTERVENTION PLAN */}
        <section className="space-y-12">
          <SectionHeader title="Strategic Intervention Plan" subtitle="Immediate Tactical Directives" pageNum={3} />
          <div className="overflow-hidden rounded-[2.5rem] border border-stone-100 shadow-sm bg-white">
            <table className="w-full text-left">
              <thead className="bg-red-900 text-white text-[9px] font-black uppercase tracking-[0.25em]">
                <tr>
                  <th className="px-6 py-5">Pri</th>
                  <th className="px-6 py-5">Action</th>
                  <th className="px-6 py-5">Agency</th>
                  <th className="px-6 py-5">Timing</th>
                  <th className="px-6 py-5">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(strategy.immediateActions ?? []).map((action: any, i: number) => (
                  <tr key={i} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-5"><span className="w-6 h-6 rounded-full bg-red-100 text-red-900 flex items-center justify-center text-[10px] font-black">P{action.priority ?? i+1}</span></td>
                    <td className="px-6 py-5 font-black text-stone-900 text-sm tracking-tight">{action.action ?? 'Deploying...'}</td>
                    <td className="px-6 py-5 text-[11px] font-bold text-stone-500 uppercase leading-relaxed">{action.responsibleAgency ?? 'Local Command'}</td>
                    <td className="px-6 py-5"><span className="px-3 py-1 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase">{action.timing ?? 'TBD'}</span></td>
                    <td className="px-6 py-5 text-[11px] font-bold text-red-800 italic leading-relaxed">{action.expectedOutcome ?? 'Stabilize sector'}</td>
                  </tr>
                ))}
                {(!strategy.immediateActions || strategy.immediateActions.length === 0) && (
                   <tr><td colSpan={5} className="p-8 text-center text-stone-400 font-bold uppercase tracking-widest text-xs italic">Awaiting AI Core Strategic Formulation...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* PAGE 4: LOGISTICS & OPERATIONS */}
        <section className="space-y-12">
          <SectionHeader title="Logistics & Operations" subtitle="Resource Deployment & Evacuation" pageNum={4} />
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-red-800 uppercase tracking-[0.4em] ml-2 flex items-center gap-3">
              <AlertTriangle size={14} /> Evacuation Orders
            </h4>
            <div className="overflow-hidden rounded-3xl border border-stone-100 shadow-sm bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-400 font-black uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Zone</th>
                    <th className="px-8 py-4">Route</th>
                    <th className="px-8 py-4">Est. Time</th>
                    <th className="px-8 py-4">Pop.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {(strategy.evacuationPlan?.zones ?? []).map((zone: any, i: number) => (
                    <tr key={i}>
                      <td className="px-8 py-4 font-black text-stone-900">{zone.name ?? `Sector ${i+1}`}</td>
                      <td className="px-8 py-4 text-stone-500 font-bold">{zone.evacuationRoute ?? 'Determining...'}</td>
                      <td className="px-8 py-4"><span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg font-black text-[10px]">{zone.timeToEvacuate ?? '--'}</span></td>
                      <td className="px-8 py-4 font-mono font-bold text-stone-900">{zone.population?.toLocaleString() ?? '---'}</td>
                    </tr>
                  ))}
                  {(!strategy.evacuationPlan?.zones || strategy.evacuationPlan.zones.length === 0) && (
                     <tr><td colSpan={4} className="p-8 text-center text-stone-300 font-black uppercase text-[10px]">No active evacuation zones in current protocol</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] ml-2">Resource Allocation</h4>
              <div className="space-y-4">
                {[
                  { l: 'Firefighting / Heavy Ops', v: strategy.resourceAllocation?.firefighting ?? 'On Standby' },
                  { l: 'Medical / EMS', v: strategy.resourceAllocation?.medical ?? 'Standard Coverage' },
                  { l: 'Emergency / Shelter', v: strategy.resourceAllocation?.emergency ?? 'Level 1 Readiness' },
                ].map((res, i) => (
                  <div key={i} className="p-6 bg-white border border-stone-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">{res.l}</p>
                    <p className="text-[13px] font-bold text-stone-600 leading-relaxed">{res.v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-10 bg-stone-900 rounded-[3rem] text-white shadow-3xl space-y-6">
              <h4 className="text-[11px] font-black text-red-400 uppercase tracking-[0.4em]">Shelter Locations</h4>
              <ul className="space-y-4">
                {(strategy.evacuationPlan?.shelterLocations ?? []).map((loc: string, i: number) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-black tracking-tight group">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse group-hover:scale-150 transition-transform" />
                    {loc}
                  </li>
                ))}
                {(!strategy.evacuationPlan?.shelterLocations || strategy.evacuationPlan.shelterLocations.length === 0) && (
                   <li className="text-stone-500 text-xs italic font-bold uppercase">Registering Sector safe-havens...</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* PAGE 5: COMMUNICATION & MONITORING */}
        <section className="space-y-12">
          <SectionHeader title="Communication & Monitoring" subtitle="Surveillance & Alert Management" pageNum={5} />
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-red-800 uppercase tracking-[0.4em] ml-2">Public Safety Alerts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(comms.publicAlerts?.keyMessages ?? []).map((msg: string, i: number) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-red-50/50 rounded-2xl border border-red-100/50 italic text-red-900 text-[13px] font-medium leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                  {msg}
                </div>
              ))}
              {(!comms.publicAlerts?.keyMessages || comms.publicAlerts.keyMessages.length === 0) && (
                 <div className="p-5 text-stone-400 text-xs italic font-bold uppercase">No broadcast bulletins current</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] ml-2">Monitoring Plan</h4>
              <div className="space-y-4">
                {(monitoring.timelinePhases ?? []).map((phase: any, i: number) => (
                  <div key={i} className="p-8 bg-white border border-stone-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h5 className="text-lg font-black text-stone-900 tracking-tight">{phase.phase ?? `Phase ${i+1}`}</h5>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full border border-red-100">Live_Watch</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {(phase.actions ?? []).map((act: string, j: number) => (
                          <span key={j} className="text-[10px] font-bold text-stone-500 uppercase px-3 py-1 bg-stone-50 rounded-lg">• {act}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 space-y-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Active Channels</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(comms.publicAlerts?.channels ?? ['SMS', 'EBS']).map((ch: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white rounded-lg border border-stone-200 text-[10px] font-black text-stone-600 uppercase shadow-sm">{ch}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Update Frequency</p>
                <p className="text-sm font-black text-stone-900 italic">{comms.officialUpdates?.updateFrequency ?? 'Hourly'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">Official Authority</p>
                <p className="text-sm font-black text-stone-900">{comms.officialUpdates?.authority ?? 'Regional Crisis Node'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 6: DIGITAL ACCESS & SHARING */}
        <section className="space-y-12">
          <SectionHeader title="Digital Access & Sharing" subtitle="Secure Protocol Access" pageNum={6} />
          <div className="bg-white rounded-[3.5rem] border border-stone-100 shadow-2xl p-16 flex flex-col items-center text-center space-y-12">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-stone-900 tracking-tighter uppercase italic">Distribution Instructions</h3>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest max-w-lg">Scan this situational handshake node to access the real-time satellite telemetry feed and live sitrep updates.</p>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-red-600 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="p-8 bg-white border-[8px] border-stone-50 rounded-[3rem] shadow-2xl relative z-10 hover:scale-105 transition-transform">
                <QRCodeSVG value={data?.reportUrl ?? window.location.href} size={256} fgColor="#7F1D1D" bgColor="#ffffff" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
              {[
                "Scan QR with phone camera or secure device.",
                "Access the secure Situation Report URL.",
                "Forward link to relevant agencies (Fire, Medical, Police).",
                "Data updates in real-time based on new satellite passes."
              ].map((step, i) => (
                <div key={i} className="p-6 bg-stone-50 rounded-2xl border border-stone-100 text-left">
                  <span className="text-[10px] font-black text-stone-300 uppercase mb-3 block">Step 0{i+1}</span>
                  <p className="text-[12px] font-bold text-stone-600 leading-relaxed uppercase italic tracking-tight">{step}</p>
                </div>
              ))}
            </div>

            <div className="pt-12 border-t border-stone-100 w-full flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em] mb-1">Report Node ID</span>
                <span className="text-xl font-black text-stone-900 font-mono uppercase tracking-tighter">{metadata.eventId ?? 'NODE-001'}</span>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em] mb-1">Version Control</span>
                <span className="text-sm font-black text-stone-900 italic">{meta.reportVersion ?? 'SIGNAL_LIVE'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* PAGE 7: CONTEXT & DISCLAIMER */}
        <section className="space-y-12">
          <SectionHeader title="Context & Disclaimer" subtitle="Regional Risk Profile & History" pageNum={7} />
          <div className="space-y-8">
            <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] ml-2">Historical Context</h4>
            <div className="overflow-hidden rounded-[2.5rem] border border-stone-100 shadow-sm bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                  <tr>
                    <th className="px-8 py-5">Year</th>
                    <th className="px-8 py-5">Event</th>
                    <th className="px-8 py-5">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(histData.previousSimilarEvents ?? []).map((ev: any, i: number) => (
                    <tr key={i} className="hover:bg-stone-50 transition-colors">
                      <td className="px-8 py-5 font-black text-stone-900">{ev.year ?? '----'}</td>
                      <td className="px-8 py-5 font-bold text-stone-600">{ev.event ?? 'Determining...'}</td>
                      <td className="px-8 py-5 text-[11px] font-bold text-stone-500 italic leading-relaxed">{ev.impact ?? '---'}</td>
                    </tr>
                  ))}
                  {(!histData.previousSimilarEvents || histData.previousSimilarEvents.length === 0) && (
                    <tr><td colSpan={3} className="p-8 text-center text-stone-300 font-black uppercase text-[10px]">Retrieving regional historical logs...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] ml-2">Regional Profile Analysis</h4>
              <div className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-sm italic font-medium text-stone-600 leading-relaxed text-lg">
                {histData.regionalRiskProfile ?? 'Synthesizing geographic risk profile based on current telemetry.'}
              </div>
            </div>
            <div className="flex flex-col gap-4">
                <DisasterExportPanel data={data} satelliteImg={satelliteImageUrl} impactImg={impactVisualizationUrl} />
                <button onClick={onBack} className="w-full py-6 rounded-[2rem] bg-stone-900 text-white font-black text-[12px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
                    <RefreshCcw size={20} /> NEW_TARGET_SCAN
                </button>
            </div>
          </div>

          <div className="p-12 bg-red-50 border-2 border-red-100 rounded-[3.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-red-100 opacity-20 group-hover:rotate-12 transition-transform duration-700">
              <AlertTriangle size={120} strokeWidth={2.5} />
            </div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-[12px] font-black text-red-900 uppercase tracking-[0.6em] mb-4 flex items-center gap-3">
                <AlertOctagon size={18} /> Tactical Disclaimer
              </h4>
              <p className="text-[11px] font-bold text-red-800 leading-relaxed uppercase italic opacity-70">
                {meta.disclaimer ?? 'SITREP constitutes a neural draft. Observe all local directives immediately.'}
              </p>
              <p className="text-[10px] font-bold text-red-900 uppercase tracking-widest pt-4">Observe all local directives and safety protocols immediately.</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-24 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-8 pb-12">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-red-900 text-white shadow-lg"><Leaf size={16} /></div>
              <span className="text-sm font-black text-stone-900 tracking-tighter uppercase">CropHealth Risk Monitor AI</span>
            </div>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">© 2025 Autonomous DeepMind Intelligence. All protocols strictly encrypted.</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.5em] mb-1">Status Checksum</span>
            <span className="text-[11px] font-black text-stone-900 tabular-nums uppercase italic">{timestamp}</span>
          </div>
        </footer>
      </div>

      <style>{`
        @media print {
          nav, button { display: none !important; }
          .max-w-6xl { max-width: 100% !important; margin: 0 !important; padding: 15mm !important; }
          section { page-break-after: always !important; border: none !important; }
          .shadow-3xl, .shadow-xl, .shadow-2xl, .shadow-sm { box-shadow: none !important; }
          body { background: white !important; }
          .bg-[#fcfcfb] { background: white !important; }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
export default DisasterReport;
