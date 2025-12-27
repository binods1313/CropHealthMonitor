
import React, { useState, useMemo, useEffect } from 'react';
/* Fix: Re-importing useNavigate and useLocation from react-router-dom to fix reported missing export errors */
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend, Label
} from 'recharts';
import { 
  Leaf, Zap, Wind, Droplets, ShieldCheck, Coins, Rocket, BarChart3, 
  ExternalLink, BrainCircuit, Sparkles, Clock, ArrowRight, ShieldAlert, 
  Activity, LayoutDashboard, Settings, RefreshCcw, Bell, MapPin, PieChart,
  Search, Sun, CloudRain, Waves, Thermometer, CloudLightning, Snowflake,
  Skull, Check, MousePointer2, Loader2, Crosshair, ChevronRight, Globe,
  History as HistoryIcon, Info, ChevronDown, ChevronUp, CloudSun,
  Car, Plane, FlaskConical, Factory, Info as LucideInfo
} from 'lucide-react';
import { MOCK_FARMS } from '../constants';
import { calculateFarmFootprint, generateDeepClimateAnalysis, DeepClimateReport, IntegratedAction } from '../services/climateService';
import { fetchRealTimeWeather, fetchForecast } from '../services/weatherService';
import { ForecastDay } from '../types';
import { useTheme } from '../ThemeContext';
import ConfigModal from './ConfigModal';
import Footer from './Footer';

interface ClimateCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  neonColor: string;
}

const CLIMATE_CATEGORIES: ClimateCategory[] = [
  { id: 'heatwave', label: 'Heatwave', icon: Sun, color: '#ef4444', neonColor: '#f87171' },
  { id: 'drought', label: 'Drought', icon: Thermometer, color: '#eab308', neonColor: '#fbbf24' },
  { id: 'rainfall', label: 'Heavy Rain', icon: CloudRain, color: '#3b82f6', neonColor: '#60a5fa' },
  { id: 'floods', label: 'Flooding', icon: Waves, color: '#06b6d4', neonColor: '#22d3ee' },
  { id: 'storms', label: 'Storms', icon: CloudLightning, color: '#8b5cf6', neonColor: '#a78bfa' },
  { id: 'coldwave', label: 'Cold Wave', icon: Snowflake, color: '#38bdf8', neonColor: '#7dd3fc' },
  { id: 'airquality', label: 'Air Quality', icon: Skull, color: '#94a3b8', neonColor: '#cbd5e1' },
  { id: 'humidity', label: 'Humidity', icon: Droplets, color: '#14b8a6', neonColor: '#5eead4' },
  { id: 'windspeed', label: 'Wind Speed', icon: Wind, color: '#0ea5e9', neonColor: '#38bdf8' },
  { id: 'carbon', label: 'Carbon Cap', icon: Leaf, color: '#10b981', neonColor: '#34d399' },
];

const TOP_CITIES = [
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777 },
  { name: 'New York, USA', lat: 40.7128, lon: -74.0060 },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357 },
];

const UnifiedNav: React.FC<{ onConfig: () => void }> = ({ onConfig }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { accentColor } = useTheme();

    return (
        <nav className="bg-white/90 backdrop-blur-2xl border-b border-stone-100 sticky top-0 z-[60] px-8 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="p-2.5 rounded-xl shadow-2xl transition-transform group-hover:rotate-[15deg] group-hover:scale-110" style={{ backgroundColor: accentColor }}>
                        <Leaf size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-stone-900 tracking-tighter text-2xl uppercase">
                        CROPHEALTH <span style={{ color: accentColor }}>AI</span>
                    </span>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                    {[
                        { id: '/', label: 'Site Health', icon: LayoutDashboard, color: '#10b981' },
                        { id: '/climate', label: 'Climate Node', icon: Activity, color: '#3b82f6' },
                        { id: '/disasters', label: 'Risk Vectors', icon: ShieldAlert, color: '#f43f5e' }
                    ].map(link => {
                        const isActive = link.id === '/' ? location.pathname === '/' : location.pathname.startsWith(link.id);
                        return (
                            <button 
                                key={link.id}
                                onClick={() => navigate(link.id)}
                                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border-2
                                    ${isActive ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'border-transparent text-stone-400 hover:bg-stone-50 opacity-80 hover:opacity-100'}`}
                                style={{ 
                                  color: link.color,
                                  borderColor: isActive ? link.color : 'transparent'
                                }}
                            >
                                <link.icon size={18} strokeWidth={isActive ? 3 : 2.5} />
                                {link.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex items-center gap-6">
                <button onClick={onConfig} className="p-3 hover:bg-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all active:scale-90">
                  <Settings size={24} />
                </button>
                <div className="flex flex-col items-end border-l border-stone-100 pl-6">
                    <span className="text-[10px] font-black text-stone-300 tracking-[0.3em] uppercase">Status Check</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-[11px] font-black text-stone-700 uppercase tracking-widest italic">L5.Neural_Ready</span>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const MitigationCard: React.FC<{ action: any; accentColor: string }> = ({ action, accentColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`p-8 bg-white rounded-[2.5rem] border-[3px] transition-all duration-500 relative overflow-hidden group climate-card-glow ${isExpanded ? 'shadow-2xl border-stone-200 scale-[1.02]' : 'border-stone-100 hover:shadow-xl hover:-translate-y-1'}`} style={{ borderColor: isExpanded ? accentColor : 'transparent' }}>
      <div className="absolute top-0 left-0 w-1.5 h-full transition-all duration-500 group-hover:w-2.5" style={{ backgroundColor: accentColor }}></div>
      
      <div className="flex justify-between items-start mb-4">
        <span className="px-4 py-1.5 bg-stone-50 border border-stone-100 rounded-full text-[10px] font-black text-stone-400 uppercase tracking-widest">{action.category} Module</span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full hover:bg-stone-50 transition-colors text-stone-400"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <h5 className="text-xl font-black text-stone-900 mb-3 leading-tight tracking-tight">{action.observation}</h5>
      
      <div className="flex items-center gap-3 mb-6" style={{ color: accentColor }}>
        <ArrowRight size={20} className={`transition-transform duration-500 animate-marker-pulse ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
        <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors">
          {action.recommendation}
        </h3>
      </div>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
        <div className="min-h-0 space-y-6 pt-4 border-t border-stone-50">
            <div className="space-y-2">
                <h6 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <LucideInfo size={12} /> Impact Analysis
                </h6>
                <p className="text-sm text-stone-600 leading-relaxed font-medium">{action.impact}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">ROI Potential</p>
                    <p className="text-sm font-black text-emerald-900">High (2-3 Years)</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100/50">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Resilience Buff</p>
                    <p className="text-sm font-black text-blue-900">+15% Efficiency</p>
                </div>
            </div>

            {action.linkToModule && (
                <button className="w-full py-4 rounded-2xl bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
                    <ExternalLink size={14} /> View {action.linkToModule} Integration
                </button>
            )}
        </div>
      </div>

      {!isExpanded && (
        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest italic group-hover:text-stone-600 transition-colors flex items-center gap-2">
            <ChevronDown size={12} /> Click to expand for ROI intelligence
        </div>
      )}
    </div>
  );
};

const ClimateVisualizer: React.FC = () => {
  const { accentColor } = useTheme();
  const [locationInput, setLocationInput] = useState('New Delhi, India');
  const [selectedLocation, setSelectedLocation] = useState({ lat: 28.6139, lon: 77.2090 });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['carbon']);
  const [cityData, setCityData] = useState<any[]>([]);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [inputs, setInputs] = useState({
    monthlyEnergy: 920, monthlyMiles: 1500, annualFlights: 1, dietType: 'omnivore',
    farmSizeHa: 100, nitrogenPerHa: 140, pesticideFreq: 4, irrigationType: 'sprinkler',
    machineryHours: 65, livestockCount: 0
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deepReport, setDeepReport] = useState<DeepClimateReport | null>(null);

  const { total, breakdown } = useMemo(() => calculateFarmFootprint(inputs), [inputs]);

  const pieData = useMemo(() => [
    { name: 'Energy', value: breakdown.energy, color: '#3b82f6', icon: Zap },
    { name: 'Transport', value: breakdown.transport, color: '#0ea5e9', icon: Car },
    { name: 'Flights', value: breakdown.flights, color: '#8b5cf6', icon: Plane },
    { name: 'Inputs', value: breakdown.fertilizer + breakdown.pesticides, color: '#10b981', icon: FlaskConical },
    { name: 'Machinery', value: breakdown.machinery, color: '#94a3b8', icon: Factory },
    { name: 'Livestock', value: breakdown.livestock, color: '#f43f5e', icon: Activity },
  ].filter(d => d.value > 0), [breakdown]);

  useEffect(() => {
    const loadCities = async () => {
      const data = await Promise.all(TOP_CITIES.map(async (city) => {
        try {
          const weather = await fetchRealTimeWeather(city.lat, city.lon);
          return { ...city, weather };
        } catch (e) {
          return { ...city, weather: null };
        }
      }));
      setCityData(data);
    };
    loadCities();
    handleLocationSearch();
  }, []);

  const handleLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!locationInput.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`);
      const results = await response.json();
      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const newCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };
        setSelectedLocation(newCoords);
        setLocationInput(display_name);
        
        const [weather, forecast] = await Promise.all([
            fetchRealTimeWeather(newCoords.lat, newCoords.lon),
            fetchForecast(newCoords.lat, newCoords.lon)
        ]);
        
        setSearchResult(weather);
        setForecastData(forecast);
      }
    } catch (err) { console.error(err); } finally { setIsSearching(false); }
  };

  const handleInitializeAudit = async () => {
    setIsAnalyzing(true);
    try {
        const report = await generateDeepClimateAnalysis(MOCK_FARMS[0], inputs);
        setDeepReport(report);
    } finally { setIsAnalyzing(false); }
  };

  const renderWeatherIcon = (condition: string) => {
    switch (condition) {
        case 'Rain': return <CloudRain size={40} className="text-blue-500" />;
        case 'Clear': return <Sun size={40} className="text-amber-500" />;
        case 'Clouds': return <CloudSun size={40} className="text-stone-400" />;
        case 'Snow': return <Snowflake size={40} className="text-cyan-300" />;
        case 'Thunderstorm': return <CloudLightning size={40} className="text-purple-500" />;
        default: return <CloudSun size={40} className="text-stone-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col font-sans text-stone-900 overflow-x-hidden">
      <UnifiedNav onConfig={() => setIsConfigOpen(true)} />
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      
      {isAnalyzing && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in p-10 text-center">
              <div className="relative w-32 h-32 mb-12">
                  <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit size={40} className="text-white animate-pulse" /></div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-widest italic">Synchronizing Climate Intelligence</h2>
              <p className="text-emerald-400 font-bold uppercase tracking-[0.4em] text-xs">Processing orbital data for {locationInput}...</p>
          </div>
      )}

      <main className="max-w-7xl mx-auto w-full p-6 md:p-10 space-y-12 flex-1 pb-24">
        
        {/* Search Section */}
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-100 flex flex-col md:flex-row gap-10 items-start md:items-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-1000 group-hover:bg-cyan-400/10"></div>
          <div className="flex-1 w-full space-y-6 relative z-10">
            <div className="flex items-center gap-4"><div className="h-1.5 w-12 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"></div><h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Target Deployment Node</h2></div>
            <form onSubmit={handleLocationSearch} className="relative group rounded-[2rem] overflow-hidden border-[4px] bg-white transition-all shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] focus-within:shadow-[0_20px_50px_-15px_rgba(0,255,255,0.2)]" style={{ borderColor: '#00ffff' }}>
                <div className="flex items-center">
                    <div className="pl-6 text-cyan-500">{isSearching ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}</div>
                    <input type="text" placeholder="Search Global Coordinates..." value={locationInput} onChange={(e) => setLocationInput(e.target.value)} className="flex-1 bg-transparent py-5 px-5 text-base font-black focus:outline-none placeholder-stone-300" />
                    <button type="submit" disabled={isSearching} className="bg-stone-900 text-white px-10 py-5 font-black text-[12px] uppercase tracking-[0.3em] active:scale-95 transition-all hover:bg-black">SYNC_NODE</button>
                </div>
            </form>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex items-center justify-between group/lat hover:bg-white transition-all"><span className="text-[10px] font-black text-stone-300 uppercase tracking-widest group-hover/lat:text-cyan-500 transition-colors">LATITUDE</span><span className="text-lg font-black text-stone-900 font-mono tracking-tighter">{selectedLocation.lat.toFixed(5)}</span></div>
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex items-center justify-between group/lon hover:bg-white transition-all"><span className="text-[10px] font-black text-stone-300 uppercase tracking-widest group-hover/lon:text-cyan-500 transition-colors">LONGITUDE</span><span className="text-lg font-black text-stone-900 font-mono tracking-tighter">{selectedLocation.lon.toFixed(5)}</span></div>
            </div>
          </div>
          
          {/* Live Node Mini Widget */}
          <div className="w-full md:w-80 p-8 bg-stone-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group shrink-0 self-stretch flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 text-cyan-400 group-hover:rotate-12 transition-transform duration-700 animate-marker-pulse">
                    <Globe size={32} className="animate-spin-extra-slow" />
                </div>
                <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Node Link Active</p>
                    <p className="text-stone-500 text-[9px] font-bold mt-2 uppercase italic tracking-widest">L5.Orbital_Handshake_Synced</p>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white/30 uppercase">Signal</span><span className="text-[10px] font-black text-emerald-400">99.8% Strong</span></div>
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-white/30 uppercase">Latency</span><span className="text-[10px] font-black text-cyan-400">12ms</span></div>
            </div>
          </div>
        </div>

        {/* 3-Day Forecast Section - Enhanced with Neon Borders and Background Colors */}
        <div id="three-day-node-forecast" className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="h-1.5 w-12 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]"></div>
                    <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">3-Day Node Forecast</h2>
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Target Sector Metrics</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {forecastData.length > 0 ? forecastData.map((day, idx) => {
                    // Determine theme color based on condition
                    const themeColor = day.condition === 'Clear' ? '#f59e0b' : day.condition === 'Rain' ? '#3b82f6' : day.condition === 'Thunderstorm' ? '#8b5cf6' : accentColor;
                    const softBg = day.condition === 'Clear' ? '#fffbeb' : day.condition === 'Rain' ? '#eff6ff' : day.condition === 'Thunderstorm' ? '#f5f3ff' : '#f0fdf4';

                    // Determine day abbreviation for background color mapping
                    const dayAbbrev = day.day.substring(0, 3).toUpperCase();
                    const dayAbbrevMap: Record<string, string> = {
                        'SUN': '#f0f0f0',
                        'MON': '#fff9c4',
                        'TUE': '#e3f2fd'
                    };
                    const backgroundColor = dayAbbrevMap[dayAbbrev] || softBg;

                    return (
                        <div
                            key={idx}
                            data-day={dayAbbrev}
                            className="p-8 rounded-[3rem] border-2 transition-all duration-500 group hover:-translate-y-3 flex flex-col items-center text-center space-y-6 relative overflow-hidden shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] forecast-card"
                            style={{
                                backgroundColor: backgroundColor,
                                borderColor: themeColor,
                                boxShadow: `0 0 20px ${themeColor}15, inset 0 0 10px ${themeColor}05`
                            }}
                        >
                            {/* Neon Glow Overlay */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${themeColor}, transparent)` }}></div>

                            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" style={{ backgroundColor: themeColor }}></div>

                            <div className="space-y-1 relative z-10">
                                <p className="text-xs font-black text-stone-400 uppercase tracking-[0.3em]">{day.day}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>METEOR_SYNC</p>
                            </div>

                            <div className="p-6 bg-white/60 backdrop-blur-md rounded-[2rem] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10 shadow-sm border border-white/50 animate-marker-pulse">
                                {renderWeatherIcon(day.condition)}
                            </div>

                            <div className="relative z-10 w-full">
                                <p className="text-5xl font-black text-stone-900 tracking-tighter leading-none">{day.temp}°C</p>
                                <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors mt-3 text-stone-500">
                                    {day.condition}
                                </h3>
                            </div>

                            <div className="w-full pt-6 border-t border-stone-200/50 grid grid-cols-2 gap-4 relative z-10">
                                <div className="text-left">
                                    <span className="text-[9px] font-black text-stone-300 uppercase block mb-1">Precip</span>
                                    <span className="text-sm font-black text-stone-700">{day.precip ? `${day.precip}mm` : 'Dry'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-stone-300 uppercase block mb-1">Status</span>
                                    <span className="text-sm font-black text-emerald-500 uppercase italic">Stable</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-stone-50 p-8 rounded-[3rem] border border-stone-100 animate-pulse h-80 forecast-card" data-day={i === 0 ? 'SUN' : i === 1 ? 'MON' : 'TUE'}></div>
                    ))
                )}
            </div>
        </div>

        {/* Global Node Surveillance & Stats Panel - Enhanced Visibility */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-1.5 w-12 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]"></div>
                    <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Global Node Surveillance</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cityData.map((city, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => { setSelectedLocation({ lat: city.lat, lon: city.lon }); setLocationInput(city.name); handleLocationSearch(); }} 
                            className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:to-blue-50/50 transition-all duration-500"></div>
                            <div className="flex items-center gap-5 relative z-10">
                                {/* Improved Icon visibility with theme accent or primary blue */}
                                <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:text-white group-hover:bg-blue-600 group-hover:shadow-lg transition-all duration-500 animate-marker-pulse border border-stone-200 group-hover:border-transparent">
                                    <MapPin size={28} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-stone-900 tracking-tight">{city.name}</h4>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] mt-1">
                                        {city.weather?.temp ?? '--'}°C <span className="mx-1 opacity-20">|</span> {city.weather?.humidity ?? '--'}% RH
                                    </p>
                                </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-stone-100 group-hover:bg-white group-hover:shadow-md transition-all duration-500 relative z-10 border border-stone-200">
                                <ChevronRight size={18} className="text-stone-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="h-1.5 w-12 rounded-full bg-purple-500 shadow-[0_0_15px_#8b5cf6]"></div>
                    <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Active Node Stats</h2>
                </div>
                <div className="bg-stone-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl min-h-[480px] flex flex-col justify-between group climate-card-glow" style={{ border: '3px solid #8b5cf640' }}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000" style={{ backgroundImage: `repeating-conic-gradient(from 0deg, white 0deg 10deg, transparent 10deg 20deg)` }}></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] animate-pulse"></div>
                    
                    <div className="relative z-10 space-y-10">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em]">Live Intelligence</p>
                            </div>
                            <h3 className="text-4xl font-black tracking-tighter leading-[0.9] italic group-hover:scale-105 transition-transform duration-700 origin-left">{locationInput.split(',')[0]}</h3>
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-4 truncate">{locationInput.split(',').slice(1).join(',').trim()}</p>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { l: 'Temp', v: searchResult?.temp, u: '°C', c: 'cyan' },
                                { l: 'Humidity', v: searchResult?.humidity, u: '%', c: 'blue' },
                                { l: 'Wind', v: searchResult?.windSpeed, u: 'm/s', c: 'emerald' }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 group/stat cursor-default">
                                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] group-hover/stat:text-white/60 transition-colors">{stat.l}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black transition-all group-hover/stat:scale-110`} style={{ color: stat.c === 'cyan' ? '#22d3ee' : stat.c === 'blue' ? '#3b82f6' : '#10b981' }}>{stat.v ?? '--'}</span>
                                        <span className="text-[10px] font-black text-white/20 uppercase">{stat.u}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleInitializeAudit} 
                        disabled={isAnalyzing} 
                        className="w-full py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all relative overflow-hidden active:scale-95 group/btn shadow-2xl" 
                        style={{ backgroundColor: accentColor }}
                    >
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700 ease-out"></div>
                        <div className="relative flex items-center justify-center gap-4">
                            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Crosshair size={20} className="group-hover:rotate-90 transition-transform duration-500 animate-marker-pulse" />}
                            GENERATE_SITREP
                        </div>
                    </button>
                </div>
            </div>
        </div>

        {/* Deep Resilience Intelligence Panel */}
        {deepReport && (
            <div className="space-y-16 animate-scale-in">
                {/* Visual Header for SITREP */}
                <div className="flex flex-col items-center text-center space-y-4">
                   <div className="p-6 rounded-[2.5rem] bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 animate-bounce-gentle">
                        <Activity size={48} strokeWidth={2.5} />
                   </div>
                   <h2 className="text-5xl font-black tracking-tighter uppercase italic text-stone-900 leading-none">
                        SITUATION_REPORT <span className="text-emerald-500">L5.CLIMATE</span>
                   </h2>
                   <p className="text-xs font-black text-stone-400 uppercase tracking-[1em] ml-[1em]">Autonomous Deep-Mind Assessment</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white p-10 rounded-[3rem] border-2 border-red-500/20 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-red-500 transition-colors group climate-card-glow">
                        <div className="w-20 h-20 rounded-[2rem] bg-red-50 text-red-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform animate-marker-pulse"><ShieldAlert size={40}/></div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Risk Index</p>
                            <p className="text-5xl font-black text-stone-900 tracking-tighter">{deepReport.metrics.climateRiskScore}</p>
                            <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors text-red-500 pt-2">CRITICAL_VECTORS</h3>
                        </div>
                    </div>
                    
                    <div className="bg-white p-10 rounded-[3rem] border-2 border-emerald-500/20 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-emerald-500 transition-colors group climate-card-glow">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform animate-marker-pulse"><Leaf size={40}/></div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Carbon Cap</p>
                            <p className="text-5xl font-black text-stone-900 tracking-tighter">{deepReport.metrics.carbonFootprintTonnes}</p>
                            <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors text-emerald-500 pt-2">T_CO2e_ANNUAL</h3>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border-2 border-blue-500/20 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-blue-500 transition-colors group climate-card-glow">
                        <div className="w-20 h-20 rounded-[2rem] bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform animate-marker-pulse"><Droplets size={40}/></div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">Water Eff.</p>
                            <p className="text-5xl font-black text-stone-900 tracking-tighter">{deepReport.metrics.waterEfficiencyScore}%</p>
                            <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors text-blue-500 pt-2">GIS_HYDROMETRY</h3>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border-2 border-purple-500/20 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-purple-500 transition-colors group climate-card-glow">
                        <div className="w-20 h-20 rounded-[2rem] bg-purple-50 text-purple-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform animate-marker-pulse"><Coins size={40}/></div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">ROI Target</p>
                            <p className="text-5xl font-black text-stone-900 tracking-tighter">${deepReport.metrics.potentialSavingsUSD.toLocaleString()}</p>
                            <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors text-purple-500 pt-2">EST_SAVINGS_VAL</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Improved Carbon Donut Chart */}
                    <div className="bg-white rounded-[3.5rem] p-12 border border-stone-100 shadow-2xl space-y-10 flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-1.5 w-12 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
                                <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Carbon Distribution</h2>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-stone-50 rounded-full border border-stone-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Active Sink</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-[420px] flex flex-col items-center justify-center">
                            <div className="w-full h-full max-w-[340px] max-h-[340px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={90}
                                            outerRadius={140}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                            animationBegin={0}
                                            animationDuration={1500}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                            <Label 
                                                content={({ viewBox: { cx, cy } }: any) => (
                                                    <g>
                                                        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle" className="fill-stone-900 text-4xl font-black tracking-tighter">
                                                            {total.toFixed(1)}
                                                        </text>
                                                        <text x={cx} y={cy + 25} textAnchor="middle" dominantBaseline="middle" className="fill-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                                            TOTAL tCO2e
                                                        </text>
                                                    </g>
                                                )}
                                            />
                                        </Pie>
                                        <ReTooltip 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-stone-900/95 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
                                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{payload[0].name}</p>
                                                            <p className="text-xl font-black text-white">{payload[0].value} tCO2e</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-stone-50">
                            {pieData.map((d, i) => (
                                <div key={i} className="flex flex-col gap-2 group cursor-default">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 shadow-sm animate-marker-pulse" style={{ backgroundColor: `${d.color}15`, color: d.color }}>
                                            <d.icon size={16} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors text-stone-400 truncate">
                                            {d.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-baseline gap-1.5 pl-1">
                                        <span className="text-xl font-black text-stone-900">{((d.value / total) * 100).toFixed(0)}%</span>
                                        <span className="text-[8px] font-bold text-stone-300 uppercase">Share</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Regional & Forecast Intelligence */}
                    <div className="bg-white rounded-[3.5rem] p-12 border border-stone-100 shadow-2xl space-y-12">
                        <div className="flex items-center gap-4">
                            <div className="h-1.5 w-12 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6]"></div>
                            <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Temporal Forensics</h2>
                        </div>
                        <div className="space-y-10">
                            <div className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 group hover:bg-white hover:shadow-xl transition-all duration-700 climate-card-glow">
                                <h4 className="text-xl font-black text-stone-900 mb-4 tracking-tighter flex items-center gap-4">
                                    <HistoryIcon size={28} className="text-stone-400 group-hover:rotate-[-45deg] transition-transform duration-700 animate-marker-pulse" />
                                    Regional Historical Context
                                </h4>
                                <p className="text-stone-600 font-bold leading-relaxed text-lg italic">“{deepReport.regionalHistoricalContext}”</p>
                            </div>
                            <div className="p-10 bg-stone-900 rounded-[3rem] text-white relative overflow-hidden group climate-card-glow" style={{ border: '3px solid #10b98140' }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-1000"></div>
                                <h4 className="text-xl font-black mb-4 tracking-tighter flex items-center gap-4 relative z-10">
                                    <ShieldCheck size={28} className="text-emerald-400 animate-pulse" />
                                    2030 Resilience Forecast
                                </h4>
                                <p className="text-white/60 font-bold leading-relaxed text-lg italic relative z-10">“{deepReport.forecastedImpact2030}”</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Mitigation Strategies */}
                <div className="space-y-10 pb-12">
                    <div className="flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="h-1.5 w-12 rounded-full bg-amber-500 shadow-[0_0_15px_#f59e0b]"></div>
                            <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Strategic Directives (Action Required)</h2>
                        </div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic flex items-center gap-2">
                            <Info size={12} /> Detailed ROI & Impact Data
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {deepReport.linkedActions.map((action, i) => (
                           <MitigationCard key={i} action={action} accentColor={accentColor} />
                        ))}
                    </div>
                </div>

                {/* EPA Compliance & Credits */}
                <div className="bg-stone-950 rounded-[4rem] p-16 text-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-2 border-white/5 relative overflow-hidden group mb-24">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full -mr-250 -mt-250 blur-[150px]"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-16">
                        <div className="space-y-8 max-w-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 animate-marker-pulse"><Rocket size={36} /></div>
                                <div>
                                    <h4 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Carbon Credit Roadmap</h4>
                                    <p className="text-emerald-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">EPA_AG_COMPLIANCE_TIER_1</p>
                                </div>
                            </div>
                            <p className="text-xl text-stone-400 font-bold leading-relaxed">{deepReport.epaComplianceNote}</p>
                            <div className="flex flex-wrap gap-4">
                                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Potential: {deepReport.carbonSequestrationPotential} t/year</span>
                                </div>
                                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Efficiency: +12.4% Verified</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 text-center min-w-[280px] shadow-2xl group-hover:scale-105 transition-transform duration-700 climate-card-glow" style={{ border: '3px solid #10b98140' }}>
                             <p className="text-[11px] font-black text-stone-500 uppercase tracking-[0.3em] mb-4">Est. Credit Value</p>
                             <div className="flex items-baseline justify-center gap-2">
                                <span className="text-6xl font-black tracking-tighter text-emerald-400">$2.4k</span>
                                <span className="text-sm font-bold text-stone-600 uppercase">/ year</span>
                             </div>
                             <button className="mt-10 w-full py-4 rounded-2xl bg-white text-stone-900 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-xl">Apply for Credits</button>
                        </div>
                    </div>
                </div>

            </div>
        )}

      </main>

      <Footer />

      <style>{`
        .animate-spin-extra-slow { animation: spin 40s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce-gentle { animation: bounce-gentle 4s ease-in-out infinite; }
        
        @keyframes climate-glow {
          0%, 100% { filter: brightness(1) contrast(1); }
          50% { filter: brightness(1.15) contrast(1.1); }
        }
        .climate-card-glow { animation: climate-glow 3s ease-in-out infinite; }
        
        @keyframes marker-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-marker-pulse { animation: marker-pulse 2s ease-in-out infinite; }

        /* Background colors for forecast cards */
        #three-day-node-forecast .forecast-card[data-day="SUN"] {
          background-color: #f0f0f0 !important;
        }

        #three-day-node-forecast .forecast-card[data-day="MON"] {
          background-color: #fff9c4 !important;
        }

        #three-day-node-forecast .forecast-card[data-day="TUE"] {
          background-color: #e3f2fd !important;
        }
      `}</style>
    </div>
  );
};

export default ClimateVisualizer;
