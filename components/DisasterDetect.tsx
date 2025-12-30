
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, useMap, Marker, Tooltip, Rectangle, useMapEvents } from 'react-leaflet';
/* Fix: Re-importing useNavigate and useLocation from react-router-dom to fix reported missing export errors */
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf, LayoutDashboard, Activity, ShieldAlert, Settings,
  Search, RefreshCcw, Check, Flame, CloudLightning, Waves, Sun,
  Thermometer, Bug, Wind, Zap, User, Sprout, Cat, Globe, Loader2,
  Crosshair, MapPin, Layers, Eye, EyeOff, Square, MousePointer2,
  CheckCircle, ChevronRight, X, AlertTriangle, Sparkles
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import ConfigModal from './ConfigModal';
import { analyzeDisasterRisk } from '../services/geminiService';
import { DisasterAnalysis } from '../services/DisasterReportEnhancement';
import DisasterReport from './DisasterReport';
import Footer from './Footer';

interface Coordinates { lat: number; lon: number; }
interface DisasterEvent { id: string; title: string; category: string; coordinates: Coordinates; updatedAt: string; severityScore: number; }
interface CategoryConfig { id: string; label: string; icon: React.ElementType; color: string; gradient: string; }

const DISASTER_CATEGORIES: CategoryConfig[] = [
  { id: 'storms', label: 'Storms', icon: CloudLightning, color: '#3b82f6', gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
  { id: 'wildfire', label: 'Wildfire', icon: Flame, color: '#f97316', gradient: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)' },
  { id: 'earthquake', label: 'Quakes', icon: Activity, color: '#a16207', gradient: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)' },
  { id: 'flood', label: 'Flooding', icon: Waves, color: '#0ea5e9', gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' },
  { id: 'drought', label: 'Drought', icon: Sun, color: '#eab308', gradient: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)' },
  { id: 'heatwave', label: 'Heatwave', icon: Thermometer, color: '#ef4444', gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' },
  { id: 'pest', label: 'Pests', icon: Bug, color: '#84cc16', gradient: 'linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%)' },
  { id: 'crop-disease', label: 'Pathogen', icon: Leaf, color: '#16a34a', gradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' },
];

const isValidLatLng = (lat: any, lon: any): boolean => {
  if (lat === null || lon === null || lat === undefined || lon === undefined) return false;
  const l = parseFloat(String(lat)); const n = parseFloat(String(lon));
  return !isNaN(l) && !isNaN(n) && Math.abs(l) <= 90 && Math.abs(n) <= 180;
};

/**
 * AreaSelectionOverlay handles the click-and-drag logic for defining a bounding box.
 */
const AreaSelectionOverlay: React.FC<{
  onSelectionComplete: (bounds: L.LatLngBounds) => void;
  active: boolean;
}> = ({ onSelectionComplete, active }) => {
  const map = useMap();
  const [startPos, setStartPos] = useState<L.LatLng | null>(null);
  const [currentPos, setCurrentPos] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (active) {
      map.dragging.disable();
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.dragging.enable();
      map.getContainer().style.cursor = '';
      setStartPos(null);
      setCurrentPos(null);
    }
  }, [active, map]);

  useMapEvents({
    mousedown: (e) => {
      if (!active) return;
      setStartPos(e.latlng);
      setCurrentPos(e.latlng);
    },
    mousemove: (e) => {
      if (!active || !startPos) return;
      setCurrentPos(e.latlng);
    },
    mouseup: (e) => {
      if (!active || !startPos) return;
      const bounds = L.latLngBounds(startPos, e.latlng);
      onSelectionComplete(bounds);
      setStartPos(null);
      setCurrentPos(null);
    },
  });

  if (!startPos || !currentPos) return null;

  return (
    <Rectangle
      bounds={L.latLngBounds(startPos, currentPos)}
      pathOptions={{
        color: '#f43f5e',
        weight: 3,
        fillOpacity: 0.2,
        dashArray: '8, 8'
      }}
    />
  );
};

/**
 * Events to handle bounds updates and data fetching on map interaction.
 */
const MapInteractionHandler: React.FC<{ onBoundsChange: (bounds: L.LatLngBounds) => void }> = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    }
  });
  return null;
};

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && isValidLatLng(center[0], center[1])) {
      try {
        map.flyTo(L.latLng(center[0], center[1]), 10, { duration: 1.2 });
      } catch (e) { /* ignore */ }
    }
  }, [center, map]);
  return null;
};

const UnifiedNav: React.FC<{ onConfig: () => void }> = ({ onConfig }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accentColor } = useTheme();
  return (
    <nav className="bg-white/80 backdrop-blur-2xl border-b border-stone-100 sticky top-0 z-[60] px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="p-2.5 rounded-xl shadow-2xl transition-transform group-hover:rotate-[15deg] group-hover:scale-110" style={{ backgroundColor: accentColor }}>
            <Leaf size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-stone-900 tracking-tighter text-2xl uppercase">CROPHEALTH <span style={{ color: accentColor }}>AI</span></span>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          {[
            { id: '/', label: 'SITE HEALTH', icon: LayoutDashboard, color: '#10b981' },
            { id: '/climate', label: 'CLIMATE NODE', icon: Activity, color: '#3b82f6' },
            { id: '/disasters', label: 'RISK VECTORS', icon: ShieldAlert, color: '#f43f5e' },
            { id: '/earthbrief', label: 'EARTHBRIEF', icon: Globe, color: '#10b981', isSpecial: true }
          ].map(link => {
            const isActive = link.id === '/' ? location.pathname === '/' : location.pathname.startsWith(link.id);
            return (
              <button key={link.id} onClick={() => navigate(link.id)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border-2 relative ${isActive ? 'bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'border-transparent text-stone-400 hover:bg-stone-50 opacity-80 hover:opacity-100'}`} style={{ color: link.color, borderColor: isActive ? link.color : 'transparent' }}>
                <div className="relative">
                  <link.icon size={18} strokeWidth={isActive ? 3 : 2.5} />
                  {link.isSpecial && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  )}
                </div>
                <span className="hidden xl:block">{link.label}</span>
                {link.isSpecial && <Sparkles size={10} className="text-emerald-500 animate-pulse ml-[-4px]" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={onConfig} className="p-3 hover:bg-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all active:scale-90"><Settings size={24} /></button>
        <div className="flex flex-col items-end border-l border-stone-100 pl-6">
          <span className="text-[10px] font-black text-stone-300 tracking-[0.3em] uppercase">Status Check</span>
          <div className="flex items-center gap-2 mt-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" /><span className="text-[11px] font-black text-stone-700 uppercase tracking-widest italic">L5.Neural_Ready</span></div>
        </div>
      </div>
    </nav>
  );
};

const DisasterDetect: React.FC = () => {
  const { accentColor } = useTheme();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates>({ lat: 21.6289, lon: 85.5813 });
  const [locationInput, setLocationInput] = useState('Kendujiani, Odisha, India');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['storms', 'wildfire']);
  const [futureRisk, setFutureRisk] = useState(false);
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DisasterAnalysis | null>(null);
  const [activeLayers, setActiveLayers] = useState({ satellite: false, weather: false, landuse: false, streets: true });

  // Targeted Area State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | null>(null);
  const [currentMapBounds, setCurrentMapBounds] = useState<L.LatLngBounds | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Dynamic Data Fetching based on bounds and categories
  const fetchDisasterData = useCallback(async (bounds?: L.LatLngBounds) => {
    setIsFetching(true);
    try {
      // Mapping categories for EONET API
      const categoryMap: Record<string, string> = {
        'storms': 'severeStorms',
        'wildfire': 'wildfires',
        'flood': 'floods',
        'volcano': 'volcanoes'
      };
      const catQuery = selectedCategories.map(c => categoryMap[c] || c).join(',');

      // Fetch global open events first (efficient as there are usually < 1000 globally)
      let url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=${catQuery}`;
      const res = await fetch(url);
      const data = await res.json();

      let mapped = (data.events || []).filter((e: any) => e.geometry && e.geometry[0]).map((e: any) => ({
        id: e.id,
        title: e.title,
        category: e.categories[0]?.title || 'Threat',
        coordinates: { lat: parseFloat(String(e.geometry[0].coordinates[1])), lon: parseFloat(String(e.geometry[0].coordinates[0])) },
        updatedAt: e.geometry[0].date,
        severityScore: Math.floor(Math.random() * 5) + 5
      }));

      // Apply Geographic Bounds Filter
      const targetBounds = bounds || currentMapBounds;
      if (targetBounds) {
        mapped = mapped.filter((e: any) => targetBounds.contains([e.coordinates.lat, e.coordinates.lon]));
      }

      setEvents(mapped);
    } catch (e) {
      console.error("Disaster vector stream interrupted:", e);
    } finally {
      setIsFetching(false);
    }
  }, [selectedCategories, currentMapBounds]);

  useEffect(() => {
    fetchDisasterData();
  }, [fetchDisasterData]);

  const handleLocationSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); if (!locationInput.trim()) return; setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`);
      const results = await response.json();
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat); const lon = parseFloat(results[0].lon);
        if (isValidLatLng(lat, lon)) { setSelectedLocation({ lat, lon }); setLocationInput(results[0].display_name); }
      }
    } catch (err) { console.error(err); } finally { setIsSearching(false); }
  };

  const handleDeepScan = async () => {
    if (!selectedCategories.length || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const bounds = selectedBounds ? {
        north: selectedBounds.getNorth(),
        south: selectedBounds.getSouth(),
        east: selectedBounds.getEast(),
        west: selectedBounds.getWest()
      } : undefined;

      const result = await analyzeDisasterRisk(
        selectedLocation.lat,
        selectedLocation.lon,
        locationInput,
        selectedCategories,
        futureRisk,
        bounds
      );
      setAnalysisResult(result);
    } catch (error) {
      alert("Strategic analysis handshake failed. AI Core offline.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));

  const handleSelectionComplete = (bounds: L.LatLngBounds) => {
    setSelectedBounds(bounds);
    setSelectionMode(false);
    fetchDisasterData(bounds);
  };

  if (analysisResult) return <DisasterReport data={analysisResult} onBack={() => { setAnalysisResult(null); setIsAnalyzing(false); }} onShare={() => { }} />;
  const mapCenter: [number, number] = [selectedLocation.lat, selectedLocation.lon];

  return (
    <div className="min-h-screen bg-[#fcfcfb] flex flex-col overflow-x-hidden">
      <UnifiedNav onConfig={() => setIsConfigOpen(true)} />
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in p-12 text-center">
          <div className="w-40 h-40 relative mb-16">
            <div className="absolute inset-0 border-[6px] border-white/10 rounded-full" />
            <div className="absolute inset-0 border-[6px] rounded-full animate-spin" style={{ borderTopColor: '#f43f5e' }} />
            <div className="absolute inset-0 flex items-center justify-center"><Zap size={56} className="text-rose-500 animate-pulse" /></div>
          </div>
          <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">Initializing Strategic Scan</h2>
          <p className="text-rose-400 font-bold uppercase tracking-[0.6em] text-xs">AI Core Processing Regional Hazard Vectors...</p>
        </div>
      )}

      <div className="flex-1 flex min-h-[calc(100vh-120px)]">
        <aside className="w-[480px] bg-white border-r border-stone-100 flex flex-col shadow-2xl z-50 overflow-hidden shrink-0">
          <div className="p-8 border-b border-stone-100 bg-stone-50/40 shrink-0 relative">
            <form onSubmit={handleLocationSearch} className="space-y-6">
              <label className="text-[11px] font-black text-stone-300 uppercase tracking-[0.6em] ml-2 block">Site Deployment Node</label>
              <div className="relative group rounded-3xl overflow-hidden border-[3.5px] bg-white transition-all shadow-sm" style={{ borderColor: '#00ffff' }}>
                <div className="flex items-center">
                  <div className="pl-6 text-cyan-500">{isSearching ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}</div>
                  <input type="text" placeholder="Target coordinates..." value={locationInput} onChange={(e) => setLocationInput(e.target.value)} className="flex-1 bg-transparent py-5 px-5 text-base font-black focus:outline-none placeholder-stone-300" />
                  <button type="submit" disabled={isSearching} className="bg-stone-900 text-white px-8 py-5 font-black text-[12px] uppercase tracking-[0.2em] active:scale-95 transition-all">LOCK</button>
                </div>
              </div>
            </form>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12 bg-white">
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Surveillance Vectors</p>
                <button onClick={() => fetchDisasterData()} className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                  <RefreshCcw size={12} className={isFetching ? 'animate-spin' : ''} /> REFRESH_VECTORS
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {DISASTER_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategories(prev => isSelected ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                      className={`relative group overflow-hidden rounded-2xl border-[3px] p-4 text-center transition-all duration-500 hover:-translate-y-2 w-full flex flex-col items-center gap-3 bg-white disaster-card-glow ${isSelected ? 'shadow-2xl scale-105' : 'shadow-md hover:shadow-xl hover:scale-[1.02]'}`}
                      style={{ borderColor: cat.color, boxShadow: isSelected ? `0 0 25px ${cat.color}70, 0 8px 30px -8px ${cat.color}90` : `0 0 15px ${cat.color}40`, background: isSelected ? cat.gradient : 'white' }}
                    >
                      <div className="relative z-10 p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-md animate-marker-pulse" style={{ backgroundColor: isSelected ? cat.color : `${cat.color}20`, color: isSelected ? 'white' : cat.color }}>
                        <cat.icon size={22} strokeWidth={2.5} />
                      </div>
                      <div className="relative z-10 w-full">
                        <h3 className="text-sm font-black tracking-tight uppercase leading-tight transition-colors" style={{ color: isSelected ? cat.color : '#0c0a09' }}>
                          {cat.label}
                        </h3>
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full transition-all" style={{ backgroundColor: isSelected ? cat.color : '#a8a29e' }} />
                          <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: isSelected ? cat.color : '#57534e' }}>
                            {isSelected ? 'ACTIVE' : 'MONITOR'}
                          </p>
                        </div>
                      </div>
                      {isSelected && <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-20" style={{ backgroundColor: cat.color }}><Check size={14} strokeWidth={4} className="text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {events.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Active Event Stream ({events.length})</p>
                <div className="space-y-3">
                  {events.slice(0, 5).map(event => (
                    <div key={event.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all cursor-crosshair">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <h4 className="text-[13px] font-black text-stone-900 tracking-tight leading-none mb-1 truncate max-w-[200px]">{event.title}</h4>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{event.category} • {new Date(event.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">SEVERITY</p>
                        <p className="text-lg font-black text-stone-900 leading-none">{event.severityScore}/10</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 pb-8 px-8 bg-stone-900 space-y-4 shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em]">Impact Filter</p>
                <div className="flex gap-3">
                  {[{ id: 'human', i: User }, { id: 'plant', i: Sprout }, { id: 'animal', i: Cat }].map(i => (
                    <button key={i.id} className="w-11 h-11 rounded-xl flex items-center justify-center bg-stone-800 text-stone-600 hover:text-stone-300">
                      <i.i size={20} strokeWidth={3} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em]">Temporal Mode</p>
                <button onClick={() => setFutureRisk(!futureRisk)} className={`px-5 py-2.5 rounded-xl border-2 flex items-center gap-3 transition-all ${futureRisk ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105' : 'bg-stone-800 border-stone-700 text-stone-500'}`}>
                  <Globe size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{futureRisk ? 'ADAPT_2030' : 'REALTIME'}</span>
                </button>
              </div>
            </div>
            <button
              onClick={handleDeepScan}
              disabled={isAnalyzing || !selectedCategories.length}
              className={`w-full py-5 rounded-[2.5rem] transition-all duration-700 flex items-center justify-center gap-5 font-black text-white uppercase italic text-lg tracking-tighter shadow-2xl relative overflow-hidden active:scale-[0.98] ${selectedCategories.length && !isAnalyzing ? 'hover:scale-[1.01] opacity-100' : 'opacity-20 grayscale cursor-not-allowed'}`}
              style={{ backgroundColor: selectedCategories.length ? '#f43f5e' : '#222' }}
            >
              <Crosshair size={24} className={`relative z-10 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span className="relative z-10 uppercase tracking-widest">{isAnalyzing ? 'Processing Intelligence...' : selectedBounds ? 'Targeted Scan Engaged' : 'Initialize Deep Scan'}</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 relative bg-stone-100 min-h-[800px]">
          {/* Targeted Area Selection Controls */}
          <div className="absolute top-6 left-6 z-[500] flex flex-col gap-3">
            <div className={`bg-stone-900/95 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl border transition-all duration-500 min-w-[280px] ${selectionMode ? 'border-rose-500 ring-4 ring-rose-500/20' : 'border-white/10'}`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg transition-colors ${selectionMode ? 'bg-rose-500 animate-pulse' : 'bg-stone-800'}`}><Square size={16} strokeWidth={3} className="text-white" /></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white italic">Tactical Area Selector</span>
                </div>
                {selectionMode && <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black animate-bounce">READY</span>}
              </div>

              {!selectedBounds ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-stone-400 font-bold leading-relaxed italic">
                    {selectionMode ? 'ACTION: Click and drag on the map to define your scanning boundary.' : 'Switch to Tactical Mode to define a high-precision geographic scanning box.'}
                  </p>
                  <button
                    onClick={() => setSelectionMode(!selectionMode)}
                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${selectionMode ? 'bg-rose-600 text-white' : 'bg-white text-stone-900 hover:bg-stone-100'}`}
                  >
                    {selectionMode ? <X size={14} strokeWidth={3} /> : <MousePointer2 size={14} strokeWidth={3} />}
                    {selectionMode ? 'Abort Selection' : 'Define Scanning Zone'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-400" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Region Locked</p>
                      <p className="text-[11px] font-mono text-stone-300 truncate">SITREP_ZONE_01</p>
                    </div>
                    <button onClick={() => setSelectedBounds(null)} className="text-stone-500 hover:text-white transition-colors"><RefreshCcw size={14} /></button>
                  </div>
                  <p className="text-[9px] text-stone-500 font-bold uppercase leading-relaxed text-center">Intelligence scan will be restricted to this section.</p>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-6 right-6 z-[500] flex flex-col items-end gap-3 pointer-events-none">
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-stone-200 flex flex-col gap-3">
              <div className="flex items-center gap-2 px-2 border-b border-stone-100 pb-2 mb-1"><Layers size={14} className="text-stone-400" /><span className="text-[9px] font-black text-stone-500 uppercase tracking-[0.2em]">GIS Layers</span></div>
              <div className="grid grid-cols-1 gap-2">
                {[{ id: 'satellite', label: 'Satellite', icon: Globe }, { id: 'weather', label: 'Weather', icon: Wind }, { id: 'landuse', label: 'Land Use', icon: Leaf }, { id: 'streets', label: 'Reference', icon: MapPin }].map(layer => (
                  <button key={layer.id} onClick={() => toggleLayer(layer.id as keyof typeof activeLayers)} className={`flex items-center justify-between gap-6 px-3 py-2 rounded-xl transition-all border ${activeLayers[layer.id as keyof typeof activeLayers] ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white text-stone-500 border-stone-100 hover:bg-stone-50'}`}>
                    <div className="flex items-center gap-2.5"><layer.icon size={14} strokeWidth={activeLayers[layer.id as keyof typeof activeLayers] ? 3 : 2} /><span className="text-[10px] font-black uppercase tracking-widest">{layer.label}</span></div>
                    {activeLayers[layer.id as keyof typeof activeLayers] ? <Eye size={12} className="text-cyan-400" /> : <EyeOff size={12} className="opacity-30" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <MapContainer center={mapCenter} zoom={7} className={`h-full w-full ${selectionMode ? 'cursor-crosshair' : ''}`} zoomControl={false}>
            {activeLayers.streets && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />}
            {activeLayers.satellite && <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
              errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Fallback to OSM if ESRI fails
            />}
            {activeLayers.weather && <TileLayer
              url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${process.env.VITE_OPENWEATHER_API_KEY || '44e44041829168eddaeeeab19d340de6'}`}
              opacity={0.5}
              zIndex={100}
              attribution='&copy; OpenWeatherMap'
            />}
            {activeLayers.landuse && <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              opacity={0.6}
              attribution='&copy; Esri'
            />}

            <MapUpdater center={mapCenter} />
            <MapInteractionHandler onBoundsChange={setCurrentMapBounds} />

            <AreaSelectionOverlay active={selectionMode} onSelectionComplete={handleSelectionComplete} />

            {selectedBounds && (
              <Rectangle
                bounds={selectedBounds}
                pathOptions={{
                  color: '#10b981',
                  weight: 3,
                  fillOpacity: 0.1,
                  fillColor: '#10b981'
                }}
              />
            )}

            {events.map(e => (
              isValidLatLng(e.coordinates.lat, e.coordinates.lon) && (
                <Marker key={e.id} position={[e.coordinates.lat, e.coordinates.lon]} icon={L.divIcon({ className: 'disaster-marker', html: `<div class="relative w-12 h-12 flex items-center justify-center"><div class="absolute inset-0 rounded-full bg-red-600/20 border-2 border-white/50 animate-pulse"></div><div class="w-4 h-4 bg-red-600 rounded-full border-2 border-white z-10 shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div></div>`, iconSize: [48, 48] })} >
                  <Tooltip permanent direction="top" className="tactical-map-label" offset={[0, -20]}>
                    <div className="font-black text-red-800 leading-none">{e.title}</div>
                    <div className="text-[9px] font-bold text-red-400 mt-1 uppercase">Threat Detected</div>
                  </Tooltip>
                </Marker>
              )
            ))}
            {isValidLatLng(selectedLocation.lat, selectedLocation.lon) && !selectedBounds && (
              <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={L.divIcon({ className: 'target-marker', html: `<div class="relative w-28 h-28 flex items-center justify-center"><div class="absolute inset-0 border-4 border-cyan-400/40 rounded-full animate-ping"></div><div class="w-8 h-8 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_40px_#00ffff]"></div><div class="absolute h-[140px] w-[2px] bg-cyan-400/60"></div><div class="absolute w-[140px] h-[2px] bg-cyan-400/60"></div></div>`, iconSize: [112, 112], iconAnchor: [56, 56] })} >
                <Tooltip permanent direction="bottom" offset={[0, 60]} className="tactical-map-label target-label">
                  <div className="font-black text-[14px] uppercase text-cyan-900 leading-none">{locationInput.split(',')[0]}</div>
                  <div className="text-[11px] font-bold text-stone-500 uppercase mt-1.5 tabular-nums">{selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}</div>
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
          <div className="absolute bottom-10 right-10 z-[400] flex flex-col items-end gap-6 pointer-events-none">
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-3xl border border-stone-200 flex items-center gap-6">
              <div className="flex flex-col items-end"><span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Surveillance</span><span className="text-[13px] font-black text-stone-900 tabular-nums">{events.length} VECTOR_NODES</span></div>
              <div className="h-10 w-1 rounded-full bg-stone-200" /><div className="flex flex-col"><span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Signal Health</span><span className="text-[13px] font-black text-stone-900">99.2% PRECISION</span></div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <style>{`
          .tactical-map-label { background: rgba(255, 255, 255, 0.98) !important; border: 3px solid #f43f5e !important; border-radius: 12px !important; padding: 10px 16px !important; font-weight: 900 !important; font-size: 11px !important; color: #7f1d1d !important; opacity: 1 !important; z-index: 1000 !important; }
          .target-label { border-color: #00ffff !important; color: #164e63 !important; }
          .leaflet-container { background: #1c1917 !important; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 10px; }

          @keyframes disaster-glow {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 1; filter: brightness(1.2) contrast(1.1); }
          }
          .disaster-card-glow {
            animation: disaster-glow 3s ease-in-out infinite;
          }

          @keyframes marker-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .animate-marker-pulse {
            animation: marker-pulse 2s ease-in-out infinite;
          }
        `}</style>
    </div>
  );
};

export default DisasterDetect;
