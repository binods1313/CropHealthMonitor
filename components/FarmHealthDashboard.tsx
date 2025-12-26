
import React, { useState } from 'react';
import { FarmHealthAnalysis } from '../types/FarmHealthAnalysis';
import { 
  AlertTriangle, CheckCircle, Activity, Wind, Droplets, Thermometer, 
  Layers, Calendar, ClipboardList, Info, FileText, Smartphone, Mail, 
  QrCode, Copy, Check, Leaf, AlertOctagon, History, MapPin, XCircle
} from 'lucide-react';
import { FarmHealthExportPanel } from './FarmHealthExportPanel';
import { QRCodeSVG } from 'qrcode.react';
import TrendChart from './TrendChart';

interface Props {
  data: FarmHealthAnalysis;
}

const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2 mb-6 border-b-2 border-green-700/10 pb-2">
    {icon && <span className="text-green-700">{icon}</span>}
    <h2 className="text-xl font-bold text-green-800 uppercase tracking-tight">{title}</h2>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-md border border-stone-200 p-6 ${className || ''}`}>
    {children}
  </div>
);

const MetricBadge: React.FC<{ label: string; value: string | number; color?: string; icon?: React.ReactNode }> = ({ label, value, color = "bg-stone-100 text-stone-800", icon }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-lg border border-stone-100 ${color} h-full`}>
    <div className="flex items-center gap-1 mb-1 opacity-80">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-lg font-bold text-center leading-tight">{value}</span>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    let color = 'bg-stone-100 text-stone-600';
    let icon = null;

    if (status.includes('Optimal') || status.includes('Adequate') || status.includes('High') || status.includes('Good')) {
        color = 'bg-green-100 text-green-700 border-green-200';
        icon = <CheckCircle size={12} />;
    } else if (status.includes('Low') || status.includes('Concern')) {
        color = 'bg-orange-100 text-orange-700 border-orange-200';
        icon = <AlertTriangle size={12} />;
    } else if (status.includes('Critical')) {
        color = 'bg-red-100 text-red-700 border-red-200';
        icon = <XCircle size={12} />;
    }

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${color}`}>
            {icon} {status}
        </span>
    );
};

export const FarmHealthDashboard: React.FC<Props> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const scoreColor = data.healthScore >= 75 ? 'text-green-600' : data.healthScore >= 50 ? 'text-[#D4AF37]' : 'text-red-600';
  const scoreRing = data.healthScore >= 75 ? 'stroke-green-600' : data.healthScore >= 50 ? 'stroke-[#D4AF37]' : 'stroke-red-600';

  const handleCopy = () => {
    navigator.clipboard.writeText(data.reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 bg-stone-50 font-sans">
      
      <div className="bg-green-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{data.farmName}</h1>
          <p className="text-green-100 mt-2 flex items-center gap-2 text-sm md:text-base">
            <MapPin size={16} />
            <span>{data.location.name}</span> • 
            <span>{data.cropType}</span> • 
            <span>{data.areaHa} ha</span>
          </p>
        </div>
        <div className="text-right mt-4 md:mt-0 bg-green-800/50 p-3 rounded-lg border border-green-600">
          <p className="text-xs text-green-200 uppercase tracking-widest font-bold">Report Date</p>
          <p className="text-lg font-mono font-bold">{data.scanDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 bg-white border border-stone-200">
          <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative mb-3 border border-stone-200">
            <img src={data.images.ndviMap} alt="NDVI Satellite Map" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-bold">SENTINEL-2 NDVI</div>
          </div>
          <p className="text-xs text-stone-500 font-medium flex items-center gap-1"><Layers size={12}/> Source: Sentinel-2 NDVI | NASA Earth Observatory</p>
        </Card>

        <Card className="p-4 bg-white border border-stone-200">
          <div className="aspect-square bg-stone-100 rounded-lg overflow-hidden relative mb-3 border border-stone-200">
            <img src={data.images.deficiencyOverlay} alt="Diagnostic Overlay" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-bold">AI DIAGNOSTIC OVERLAY</div>
          </div>
          <p className="text-xs text-stone-500 font-medium flex items-center gap-1"><Activity size={12}/> Source: AI-generated analysis based on Sentinel-2 & soil data</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center py-8">
          <h3 className="text-sm font-bold text-stone-500 uppercase mb-6 tracking-wider">Overall Health Index</h3>
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="50%" cy="50%" r="45%" className="fill-none stroke-stone-100" strokeWidth="12" />
              <circle cx="50%" cy="50%" r="45%" className={`fill-none ${scoreRing} transition-all duration-1000`} strokeWidth="12" strokeDasharray={`${data.healthScore * 2.83} 283`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-black ${scoreColor}`}>{data.healthScore}</span>
              <span className="text-sm text-stone-400 font-bold uppercase mt-1">/ 100</span>
            </div>
          </div>
          <div className={`mt-6 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wide ${data.healthLabel === 'GOOD' ? 'bg-green-100 text-green-800' : data.healthLabel === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{data.healthLabel} Condition</div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <MetricBadge label="Time to Action" value={data.timeToAction} color="bg-orange-50 text-orange-900 border-orange-100" icon={<AlertOctagon size={14} />} />
            <MetricBadge label="Yield Risk" value={data.yieldRisk} color="bg-red-50 text-red-900 border-red-100" icon={<AlertTriangle size={14} />} />
            <MetricBadge label="Confidence" value={`${data.confidenceScore}%`} color="bg-green-50 text-green-900 border-green-100" icon={<CheckCircle size={14} />} />
            <MetricBadge label="NDVI Range" value={`${data.ndviMetrics.min} - ${data.ndviMetrics.max}`} color="bg-blue-50 text-blue-900 border-blue-100" icon={<Layers size={14} />} />
        </div>
      </div>

      <Card>
          <SectionHeader title="Executive Assessment" icon={<FileText size={20}/>} />
          <div className="bg-stone-50 border-l-4 border-green-600 p-5 rounded-r-lg">
            <h4 className="font-bold text-stone-900 text-lg mb-2">{data.primaryDiagnosis}</h4>
            <p className="text-stone-700 leading-relaxed text-sm md:text-base text-justify">{data.executiveSummary}</p>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <SectionHeader title="Soil Metrics" icon={<Layers size={20}/>} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-stone-100 text-stone-500 uppercase text-xs">
                        <tr><th className="px-3 py-2 text-left">Parameter</th><th className="px-3 py-2 text-left">Value</th><th className="px-3 py-2 text-right">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        <tr><td className="px-3 py-3 font-medium text-stone-700">pH</td><td className="px-3 py-3 font-mono">{data.soilMetrics.pH}</td><td className="px-3 py-3 text-right"><StatusBadge status={data.soilMetrics.pH >= 6 && data.soilMetrics.pH <= 7.5 ? "Optimal" : "Concern"} /></td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700">Nitrogen</td><td className="px-3 py-3 font-mono">{data.soilMetrics.nitrogen} ppm</td><td className="px-3 py-3 text-right"><StatusBadge status={data.soilMetrics.nitrogen > 60 ? "High" : "Adequate"} /></td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700">Phosphorus</td><td className="px-3 py-3 font-mono">{data.soilMetrics.phosphorus} ppm</td><td className="px-3 py-3 text-right"><StatusBadge status="Optimal" /></td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700">Potassium</td><td className="px-3 py-3 font-mono">{data.soilMetrics.potassium} ppm</td><td className="px-3 py-3 text-right"><StatusBadge status="High" /></td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700">Moisture</td><td className="px-3 py-3 font-mono">{data.soilMetrics.moisture}%</td><td className="px-3 py-3 text-right"><StatusBadge status="Adequate" /></td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700">Organic Matter</td><td className="px-3 py-3 font-mono">{data.soilMetrics.organicMatter}%</td><td className="px-3 py-3 text-right"><StatusBadge status={data.soilMetrics.organicMatter < 2 ? "Low" : "Optimal"} /></td></tr>
                    </tbody>
                </table>
            </div>
        </Card>

        <Card>
            <SectionHeader title="Weather Conditions" icon={<Wind size={20}/>} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-stone-100 text-stone-500 uppercase text-xs">
                        <tr><th className="px-3 py-2 text-left">Metric</th><th className="px-3 py-2 text-left">Observation</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        <tr><td className="px-3 py-3 font-medium text-stone-700 flex items-center gap-2"><Thermometer size={16} className="text-red-500"/> Temperature</td><td className="px-3 py-3 font-bold">{data.weatherMetrics.temperature}°C</td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700 flex items-center gap-2"><Droplets size={16} className="text-blue-500"/> Humidity</td><td className="px-3 py-3 font-bold">{data.weatherMetrics.humidity}%</td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700 flex items-center gap-2"><Wind size={16} className="text-stone-500"/> Wind Speed</td><td className="px-3 py-3 font-bold">{data.weatherMetrics.windSpeed} m/s</td></tr>
                        <tr><td className="px-3 py-3 font-medium text-stone-700 flex items-center gap-2"><Activity size={16} className="text-blue-400"/> Precipitation</td><td className="px-3 py-3 font-bold">{data.weatherMetrics.precipitation} mm</td></tr>
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      <Card>
          <SectionHeader title="Detailed Impact Assessment" icon={<Activity size={20}/>} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100"><h4 className="text-xs font-bold text-red-800 uppercase mb-2">Primary Limiting Factor</h4><p className="text-sm text-stone-800">{data.impactAssessment.primaryLimitingFactor}</p></div>
              <div className="bg-stone-50 p-4 rounded-lg border border-stone-100"><h4 className="text-xs font-bold text-stone-600 uppercase mb-2">Root Cause Analysis</h4><p className="text-sm text-stone-800">{data.impactAssessment.rootCauseAnalysis}</p></div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100"><h4 className="text-xs font-bold text-orange-800 uppercase mb-2">Predicted Impact</h4><p className="text-sm text-stone-800">{data.impactAssessment.predictedImpact}</p></div>
          </div>
      </Card>

      <Card><SectionHeader title="Health Trend (30 Days)" icon={<Activity size={20}/>} /><TrendChart /></Card>

      <Card>
        <SectionHeader title="Strategic Intervention Plan" icon={<ClipboardList size={20}/>} />
        <div className="space-y-6">
          {data.interventions.map((item, idx) => (
            <div key={idx} className={`border border-stone-200 rounded-lg overflow-hidden shadow-sm`}>
              <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-3"><span className={`text-xs font-bold px-2 py-1 rounded text-white ${item.priority === 'P1' ? 'bg-red-600' : item.priority === 'P2' ? 'bg-orange-500' : 'bg-green-600'}`}>{item.priority}</span><h4 className="font-bold text-stone-900 text-lg">{item.action}</h4></div>
                <span className="text-xs font-bold text-stone-500 uppercase bg-white px-3 py-1 rounded border border-stone-200 tracking-wider">{item.timing}</span>
              </div>
              <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div><h5 className="text-xs font-bold text-stone-400 uppercase mb-1">Goal</h5><p className="text-sm font-medium text-stone-800 mb-4">{item.goal}</p><h5 className="text-xs font-bold text-stone-400 uppercase mb-1">Impact</h5><p className="text-sm text-stone-600 leading-relaxed">{item.impact}</p></div>
                      <div className="bg-stone-50 rounded-lg p-4 h-full border border-stone-100"><h5 className="text-xs font-bold text-stone-400 uppercase mb-2">Required Materials</h5><ul className="space-y-1 mb-4">{item.materials.split(',').map((mat, i) => (<li key={i} className="text-sm text-stone-700 flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>{mat.trim()}</li>))}</ul><div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-200"><div><span className="block text-[10px] font-bold text-stone-400 uppercase">Cost</span><span className="text-sm font-bold text-stone-700">{item.costLevel}</span></div><div><span className="block text-[10px] font-bold text-stone-400 uppercase">Confidence</span><span className="text-sm font-bold text-green-700">{item.confidence}%</span></div></div></div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-100 flex items-center gap-2"><Leaf size={16} className="text-green-600"/><span className="text-xs font-bold text-green-800 uppercase mr-2">Expected Outcome:</span><span className="text-sm text-green-900 font-medium">{item.expectedOutcome}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><SectionHeader title="Materials & Equipment" icon={<Layers size={20}/>} /><div className="bg-stone-50 p-4 rounded-lg border border-stone-100 h-full"><ul className="space-y-2">{[...data.resources.materialsList, ...data.resources.equipmentNeeded].map((item, i) => (<li key={i} className="flex items-center gap-2 text-sm text-stone-700 p-2 bg-white rounded border border-stone-100 shadow-sm"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{item}</li>))}</ul><div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center"><span className="font-bold text-stone-500 text-xs uppercase">Est. Cost</span><span className="font-mono font-bold text-stone-800">{data.resources.estimatedCost}</span></div></div></Card>
          <Card><SectionHeader title="Logistics Timeline" icon={<Calendar size={20}/>} /><div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-4 before:w-0.5 before:-translate-x-1/2 before:bg-stone-200 before:top-2 before:bottom-2">{data.logistics.timeline.map((item, i) => (<div key={i} className="relative flex items-start gap-4"><div className="absolute left-0 mt-1 w-2 h-2 rounded-full bg-green-600 ring-4 ring-white"></div><div className="bg-stone-50 p-3 rounded-lg border border-stone-100 w-full"><span className="text-xs font-bold text-green-700 uppercase block mb-1">{item.week}</span><p className="text-sm text-stone-800 font-medium">{item.action}</p></div></div>))}</div></Card>
      </div>

      <Card>
          <SectionHeader title="Monitoring & Communication" icon={<Smartphone size={20}/>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div><h4 className="font-bold text-stone-700 mb-3 text-sm uppercase tracking-wide">Communication Channels</h4><div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm"><table className="w-full text-sm"><thead className="bg-stone-50 text-stone-500"><tr><th className="px-4 py-2 text-left text-xs uppercase">Channel</th><th className="px-4 py-2 text-left text-xs uppercase">Update Frequency</th></tr></thead><tbody className="divide-y divide-stone-100">{data.communicationChannels.map((c, i) => (<tr key={i}><td className="px-4 py-3 font-medium text-stone-800">{c.channel}</td><td className="px-4 py-3 text-stone-600">{c.updateFrequency}</td></tr>))}</tbody></table></div></div>
              <div><h4 className="font-bold text-stone-700 mb-3 text-sm uppercase tracking-wide">Phased Monitoring Plan</h4><div className="space-y-4">{data.monitoringPhases.map((phase, i) => (<div key={i} className="border border-stone-200 rounded-lg p-4 bg-stone-50"><div className="flex justify-between items-center mb-2"><span className="font-bold text-stone-800 text-sm">{phase.phase}</span><span className="text-[10px] bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-500 font-mono">{phase.timeRange}</span></div><ul className="list-disc pl-4 space-y-1 mb-3">{phase.actions.map((act, j) => (<li key={j} className="text-xs text-stone-600">{act}</li>))}</ul><div className="pt-2 border-t border-stone-200"><span className="text-[10px] font-bold text-green-700 uppercase mr-2">Success Metric:</span><span className="text-xs text-stone-700 italic">{phase.successMetrics}</span></div></div>))}</div></div>
          </div>
      </Card>

      <Card>
          <SectionHeader title="Historical Farm Events" icon={<History size={20}/>} />
          <div className="overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full text-sm text-left">
                  <thead className="bg-green-700 text-white text-xs uppercase">
                      <tr>
                          <th className="px-4 py-3">Season</th>
                          <th className="px-4 py-3">Issue</th>
                          <th className="px-4 py-3">Treatment</th>
                          <th className="px-4 py-3">Outcome</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {data.historicalFarmEvents.map((ev, i) => (
                          <tr key={i} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/80'} hover:bg-green-50/50`}>
                              <td className="px-4 py-3 font-bold text-stone-800">{ev.season}</td>
                              <td className="px-4 py-3 text-stone-600 font-medium">{ev.issue}</td>
                              <td className="px-4 py-3 text-stone-600 italic">{ev.treatment}</td>
                              <td className="px-4 py-3 font-black text-green-700 uppercase tracking-tight">{ev.outcome}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </Card>

      <Card className="bg-blue-50/50 border-blue-200">
          <SectionHeader title="Geographic Intelligence" icon={<MapPin size={20}/>} />
          <div className="flex gap-6 items-start p-2">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 shrink-0">
                <Info size={28} />
              </div>
              <div className="space-y-2">
                  <h4 className="text-xs font-black text-blue-800 uppercase tracking-[0.2em]">Regional Context Profile</h4>
                  <p className="text-stone-700 text-base leading-relaxed font-medium italic">
                      {data.regionalProfile}
                  </p>
              </div>
          </div>
      </Card>

      <FarmHealthExportPanel data={data} />

      <div className="bg-stone-200 rounded-xl p-6 text-xs text-stone-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div><h6 className="font-bold text-stone-700 uppercase mb-1">Report Metadata</h6><p>ID: {data.reportId}</p><p>Ver: {data.version}</p><p>Gen: {new Date(data.generatedAt).toLocaleString()}</p></div>
              <div><h6 className="font-bold text-stone-700 uppercase mb-1">Satellite Data</h6><p>{data.dataSources.satelliteSource}</p></div>
              <div><h6 className="font-bold text-stone-700 uppercase mb-1">Soil Analysis</h6><p>{data.dataSources.soilDataSource}</p></div>
              <div><h6 className="font-bold text-stone-700 uppercase mb-1">Model</h6><p>{data.dataSources.aiModelVersion}</p><p>{data.dataSources.weatherSource}</p></div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-yellow-800 flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" /><p><strong>DISCLAIMER:</strong> This report is based on satellite imagery, soil data, and AI-driven analysis. Ground verification is recommended before major input applications. Consult a certified agronomist for final treatment decisions.</p></div>
      </div>

      <Card>
        <SectionHeader title="Digital Access" icon={<QrCode size={20}/>} />
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-4">
            <div className="bg-white p-2 border border-stone-200 rounded shadow-sm"><QRCodeSVG value={data.reportUrl} size={120} /></div>
            <div className="text-center md:text-left"><h4 className="font-bold text-stone-800 mb-1">Mobile Field Access</h4><p className="text-sm text-stone-500 mb-4 max-w-md">Scan to view this live report on your mobile device while in the field.</p><div className="flex gap-2 justify-center md:justify-start"><input readOnly value={data.reportUrl} className="bg-stone-100 border border-stone-200 rounded px-3 py-1 text-xs text-stone-600 w-64" /><button onClick={handleCopy} className="bg-stone-200 hover:bg-stone-300 px-3 py-1 rounded text-xs font-bold text-stone-700 transition-colors">{copied ? 'Copied' : 'Copy'}</button></div></div>
        </div>
      </Card>

    </div>
  );
};
