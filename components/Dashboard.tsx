
import React, { useState, useMemo, useRef, useEffect } from 'react';
/* Fix: Re-importing useNavigate and useLocation from react-router-dom to fix reported missing export errors */
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_FARMS, NDVI_STATS, REGIONS, generateNearbyFarms, generateFallbackImageUrl } from '../constants';
import { analyzeFarmHealth } from '../services/geminiService';
import { generateDualFarmImages } from '../services/farmImageService';
import { fetchRealTimeWeather, fetchForecast } from '../services/weatherService';
import { getSavedReports, deleteSavedReport } from '../services/storageService';
import FarmMap from './FarmMap';
import SavedReportsModal from './SavedReportsModal';
import FarmEditModal from './FarmEditModal';
import FarmDiscoveryCard from './FarmDiscoveryCard';
import Footer from './Footer';
import FirecrawlEnhancedAnalysis from './FirecrawlEnhancedAnalysis';
import { FarmData, WeatherData, SavedReport, Region, ForecastDay } from '../types';
import {
  LayoutDashboard, Activity, ShieldAlert, Leaf, Settings, History, Search,
  Navigation, Beaker, Cloud, Sparkles, ChevronRight, Wind, CheckCircle,
  ArrowUpRight, ChevronDown, Sun, CloudRain, CloudLightning, Snowflake,
  Maximize2, TestTube2, Thermometer, Droplets,
  ThermometerSun,
  ThermometerSnowflake,
  Droplet,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Map,
  Zap,
  Target
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import ConfigModal from './ConfigModal';

// --- Vedic Sacred Geometry Components ---

const HealthPattern = ({ color }: { color: string }) => (
  <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms] ease-out z-0">
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.48] group-hover:opacity-[0.8] transition-opacity duration-700 animate-spin-extra-slow" fill="none" stroke={color} strokeWidth="1.2">
      <circle cx="100" cy="100" r="8" fill={color} fillOpacity="0.15" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <g key={deg} transform={`rotate(${deg} 100 100)`}>
          <path d="M100 92 C 110 70, 130 70, 100 30 C 70 70, 90 70, 100 92" />
        </g>
      ))}
      <circle cx="100" cy="100" r="50" strokeDasharray="2 6" />
      <circle cx="100" cy="100" r="95" className="animate-pulse-gentle" strokeWidth="1.5" />
    </svg>
  </div>
);

const ClimatePattern = ({ color }: { color: string }) => (
  <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms] ease-out z-0">
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.48] group-hover:opacity-[0.8] transition-opacity duration-700 animate-spin-reverse-ultra-slow" fill="none" stroke={color} strokeWidth="1.2">
      <circle cx="100" cy="100" r="32" />
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return <circle key={deg} cx={100 + 32 * Math.cos(rad)} cy={100 + 32 * Math.sin(rad)} r="32" />;
      })}
      <circle cx="100" cy="100" r="98" className="animate-pulse-gentle" strokeWidth="1.5" />
    </svg>
  </div>
);

const RiskPattern = ({ color }: { color: string }) => (
  <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms] ease-out z-0">
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.48] group-hover:opacity-[0.8] transition-opacity duration-700 animate-spin-extra-slow" fill="none" stroke={color} strokeWidth="1.2">
      <path d="M100 15 L180 165 L20 165 Z" />
      <path d="M100 185 L20 35 L180 35 Z" opacity="0.7" />
      <circle cx="100" cy="100" r="25" />
    </svg>
  </div>
);

const EarthBriefPattern = ({ color }: { color: string }) => (
  <div className="absolute -top-12 -right-12 w-64 h-64 pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms] ease-out z-0">
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.48] group-hover:opacity-[0.8] transition-opacity duration-700 animate-spin-reverse-ultra-slow" fill="none" stroke={color} strokeWidth="1.2">
      <circle cx="100" cy="100" r="15" />
      <circle cx="100" cy="100" r="80" strokeDasharray="10 10" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return <circle key={deg} cx={100 + 80 * Math.cos(rad)} cy={100 + 80 * Math.sin(rad)} r="4" fill={color} fillOpacity="0.4" />;
      })}
      <path d="M100 20 L100 180 M20 100 L180 100" strokeOpacity="0.3" dasharray="4 4" />
    </svg>
  </div>
);

interface DashboardCardData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  route: string;
  vedicType: 'health' | 'climate' | 'risk' | 'earthbrief';
}

const DASHBOARD_CARDS: DashboardCardData[] = [
  {
    id: 'health',
    title: 'SITE HEALTH',
    subtitle: 'PRECIZION NDVI INTEL',
    description: 'Deep-spectral analysis of crop vigor indices.',
    icon: Leaf,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
    route: '/',
    vedicType: 'health'
  },
  {
    id: 'climate',
    title: 'CLIMATE NODE',
    subtitle: 'RESILIENCE & EMISSIONS',
    description: '2030 climate adaptation roadmaps.',
    icon: Cloud,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
    route: '/climate',
    vedicType: 'climate'
  },
  {
    id: 'risks',
    title: 'RISK VECTORS',
    subtitle: 'TACTICAL THREAT DETECTION',
    description: 'Surveillance of disaster vectors.',
    icon: ShieldAlert,
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)',
    route: '/disasters',
    vedicType: 'risk'
  },
  {
    id: 'earthbrief',
    title: 'EARTHBRIEF',
    subtitle: 'GLOBAL INTEL STREAM',
    description: 'Synthesized agricultural news & trends.',
    icon: Globe,
    color: '#FF6F00',
    gradient: 'linear-gradient(135deg, rgba(255, 111, 0, 0.15) 0%, rgba(255, 193, 7, 0.05) 100%)',
    route: '/earthbrief',
    vedicType: 'earthbrief'
  }
];

const MagicalDirectiveCard: React.FC<{
  card: DashboardCardData,
  isActive: boolean,
  onClick: () => void
}> = ({ card, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative group overflow-hidden rounded-[2rem] p-8 text-left transition-all duration-700 w-full min-h-[220px] flex flex-col justify-between border-[2px] backdrop-blur-3xl
        ${isActive ? 'scale-[1.05] z-10' : 'hover:-translate-y-3 hover:scale-[1.02]'}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: isActive ? card.color : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isActive
          ? `0 0 40px -10px ${card.color}40, inset 0 0 20px ${card.color}10`
          : `0 15px 35px -10px rgba(0,0,0,0.5)`
      }}
    >
      <div className="absolute inset-0 transition-opacity duration-700" style={{ background: card.gradient, opacity: isActive ? 1 : 0.4 }} />
      {card.vedicType === 'health' && <HealthPattern color={card.color} />}
      {card.vedicType === 'climate' && <ClimatePattern color={card.color} />}
      {card.vedicType === 'risk' && <RiskPattern color={card.color} />}
      {card.vedicType === 'earthbrief' && <EarthBriefPattern color={card.color} />}

      <div className="relative z-10 w-full">
        <div className="flex items-start justify-between mb-6">
          <div className="p-4 rounded-xl shadow-xl transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-110 border border-white/10" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', color: card.color }}>
            <card.icon size={28} strokeWidth={2.5} />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">{card.title}</h2>
          <p className="text-[10px] font-black tracking-widest uppercase text-stone-500">{card.subtitle}</p>
        </div>
      </div>

      {isActive && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Active</span>
        </div>
      )}
    </button>
  );
};

const TacticalMetric: React.FC<{ label: string, value: string | number, unit: string, icon: React.ElementType, color: string }> = ({ label, value, unit, icon: Icon, color }) => (
  <div className="relative group overflow-hidden rounded-[2.5rem] p-8 bg-white transition-all duration-700 border-[3.5px] hover:scale-[1.03] hover:-translate-y-1 min-h-[250px] flex flex-col items-center justify-center text-center dashboard-card-glow"
    style={{
      borderColor: color,
      boxShadow: `0 10px 40px -10px ${color}30`,
    }}>
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundColor: color }} />
    <div className="flex flex-col items-center gap-6 relative z-10 w-full">
      <div className="p-3.5 rounded-2xl shadow-lg transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 bg-white border border-stone-100 shrink-0 animate-marker-pulse" style={{ color }}>
        <Icon size={28} strokeWidth={3} />
      </div>
      <div className="flex items-baseline gap-2 justify-center">
        <span className="text-6xl font-black text-stone-900 tracking-tighter leading-none">{value}</span>
        <span className="text-sm font-black text-stone-400 uppercase tracking-[0.2em]">{unit}</span>
      </div>
      <div className="px-5 py-2.5 rounded-2xl flex items-center justify-center min-h-[44px] w-full" style={{ backgroundColor: `${color}10` }}>
        <p className="text-sm font-black tracking-tight uppercase leading-tight text-center" style={{ color }}>{label}</p>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accentColor } = useTheme();

  const [allFarms, setAllFarms] = useState<FarmData[]>(MOCK_FARMS.slice(0, 8));
  const [activeFarm, setActiveFarm] = useState<FarmData>(allFarms[0]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFarmSelectorOpen, setIsFarmSelectorOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData>(activeFarm.weather);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [filterCrop, setFilterCrop] = useState<string>('CROP ALL');

  // Firecrawl Enhancement State
  const [isWebEnhancementEnabled, setIsWebEnhancementEnabled] = useState(false);
  const [firecrawlAnalysisType, setFirecrawlAnalysisType] = useState<'quick-search' | 'deep-analysis' | 'portal-sync'>('quick-search');

  const displayedFarms = useMemo(() => {
    return allFarms.filter(f => {
      if (filterCrop !== 'CROP ALL' && f.crop.toUpperCase() !== filterCrop.toUpperCase()) return false;
      return true;
    });
  }, [allFarms, filterCrop]);

  // Robustly derive nearby farms from the mock dataset instead of random generation
  const nearbyFarms = useMemo(() => {
    // Calculate distances and sort all other farms by proximity
    // Since we have a small set of farms globally, we'll show the 4 closest regardless of distance
    return allFarms
      .filter(f => {
        // Don't include the active farm itself
        if (f.id === activeFarm.id) return false;
        return true; // Include all other farms for sorting
      })
      .sort((a, b) => {
        // Sort by distance to show closest farms first
        const distA = Math.sqrt(Math.pow(a.lat - activeFarm.lat, 2) + Math.pow(a.lon - activeFarm.lon, 2));
        const distB = Math.sqrt(Math.pow(b.lat - activeFarm.lat, 2) + Math.pow(b.lon - activeFarm.lon, 2));
        return distA - distB;
      })
      .slice(0, 4); // Limit to 4 closest farms
  }, [activeFarm, allFarms]);

  useEffect(() => { setSavedReports(getSavedReports()); }, []);

  useEffect(() => {
    const syncWeather = async () => {
      try {
        const [liveData, forecastData] = await Promise.all([
          fetchRealTimeWeather(activeFarm.lat, activeFarm.lon),
          fetchForecast(activeFarm.lat, activeFarm.lon)
        ]);
        setWeather(liveData);
        setForecast(forecastData);
      } catch (error) { console.warn("Weather telemetry interrupted."); }
    };
    syncWeather();
  }, [activeFarm]);

  const handleFarmSelect = (farm: FarmData) => {
    setActiveFarm(farm);
    setIsFarmSelectorOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInitializeDiagnosis = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const visualAssets = await generateDualFarmImages(activeFarm);

      let result;
      if (isWebEnhancementEnabled) {
        // Call the enhanced API if web enhancement is enabled
        const response = await fetch('/api/firecrawl-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cropType: activeFarm.crop,
            region: activeFarm.location,
            farmerId: activeFarm.id,
            analysisType: firecrawlAnalysisType
          })
        });
        const enhancedResult = await response.json();

        if (enhancedResult.success) {
          // Combine data for the report
          result = {
            ...enhancedResult.data.geminiAnalysis,
            firecrawlInsights: enhancedResult.data.firecrawlInsights,
            healthScore: enhancedResult.data.combinedScore
          };
        } else {
          // Fallback to gemini only
          result = enhancedResult.data.geminiAnalysis;
        }
      } else {
        // Default Gemini-only analysis
        result = await analyzeFarmHealth(activeFarm, NDVI_STATS, "", activeFarm.soil);
      }

      navigate(`/report/${activeFarm.id}`, {
        state: {
          farm: activeFarm,
          report: result,
          generatedImages: visualAssets,
          isWebEnhanced: isWebEnhancementEnabled
        }
      });
    } catch (e) {
      console.error("Diagnosis critical failure:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfb] flex flex-col relative overflow-x-hidden">
      <nav className="bg-stone-950/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[60] px-8 py-5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            {/* Leaf-Data Fusion Logo - Organic veins + Circuit pathways */}
            <div className="relative w-[44px] h-[44px] transition-all group-hover:brightness-110 group-hover:scale-105">
              <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                <defs>
                  <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <clipPath id="leftHalf">
                    <rect x="0" y="0" width="24" height="48" />
                  </clipPath>
                  <clipPath id="rightHalf">
                    <rect x="24" y="0" width="24" height="48" />
                  </clipPath>
                </defs>
                {/* Leaf outline */}
                <path
                  d="M24 4C24 4 8 14 8 28C8 38 15 44 24 44C33 44 40 38 40 28C40 14 24 4 24 4Z"
                  stroke="url(#leafGradient)"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Left side: Organic veins */}
                <g clipPath="url(#leftHalf)">
                  <path d="M24 44V12" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.8" />
                  <path d="M24 18C20 20 14 22 12 26" stroke="#10b981" strokeWidth="1" strokeOpacity="0.6" />
                  <path d="M24 26C20 27 16 30 14 34" stroke="#10b981" strokeWidth="1" strokeOpacity="0.6" />
                  <path d="M24 34C21 35 18 37 16 40" stroke="#10b981" strokeWidth="1" strokeOpacity="0.5" />
                </g>
                {/* Right side: Circuit pathways */}
                <g clipPath="url(#rightHalf)">
                  <path d="M24 44V12" stroke="#06b6d4" strokeWidth="1.5" strokeOpacity="0.8" />
                  <path d="M24 18L30 18L30 22L36 22" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.7" />
                  <path d="M24 28L32 28L32 32" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.7" />
                  <path d="M24 36L28 36L28 40L32 40" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.6" />
                  {/* Circuit nodes */}
                  <circle cx="36" cy="22" r="2" fill="#06b6d4" className="animate-logo-pulse" />
                  <circle cx="32" cy="32" r="1.5" fill="#06b6d4" fillOpacity="0.8" />
                  <circle cx="32" cy="40" r="1.5" fill="#06b6d4" fillOpacity="0.6" />
                </g>
              </svg>
            </div>
            <span className="hidden sm:inline font-black text-white tracking-tighter text-xl uppercase italic">
              CROPHEALTH <span style={{ color: accentColor }}>AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {[
              { id: '/', label: 'SITE HEALTH', icon: LayoutDashboard, color: '#10b981' },
              { id: '/climate', label: 'CLIMATE NODE', icon: Activity, color: '#3b82f6' },
              { id: '/disasters', label: 'RISK VECTORS', icon: ShieldAlert, color: '#f43f5e' },
              { id: '/earthbrief', label: 'EARTHBRIEF', icon: Globe, color: '#10b981', isSpecial: true }
            ].map(link => {
              const isActive = link.id === '/' ? location.pathname === '/' : location.pathname.startsWith(link.id);
              return (
                <button
                  key={link.id}
                  onClick={() => navigate(link.id)}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative
                    ${isActive ? 'bg-white/10 text-white border border-white/20' : 'text-stone-500 hover:text-white'}`}
                  style={{ color: isActive ? link.color : undefined }}
                >
                  <div className="relative">
                    <link.icon size={14} strokeWidth={isActive ? 3 : 2.5} />
                    {link.isSpecial && (
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    )}
                  </div>
                  {link.label}
                  {link.isSpecial && <Sparkles size={8} className="text-emerald-500 animate-pulse ml-[-4px]" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 pr-4 border-r border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">L5.Neural_Ready</span>
          </div>
          <button onClick={() => setIsConfigOpen(true)} className="p-2.5 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white transition-all">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

      {analyzing && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in p-12 text-center text-white">
          <div className="w-40 h-40 relative mb-16">
            <div className="absolute inset-0 border-[6px] border-white/10 rounded-full" />
            <div className="absolute inset-0 border-[6px] rounded-full animate-spin" style={{ borderTopColor: accentColor }} />
            <div className="absolute inset-0 flex items-center justify-center"><Zap size={56} style={{ color: accentColor }} className="animate-pulse" /></div>
          </div>
          <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">Initializing Deep Scan</h2>
          <p className="text-emerald-400 font-bold uppercase tracking-[0.6em] text-xs">AI Core Synchronizing with Satellite Pass L2_RGB...</p>
        </div>
      )}

      <main className="flex-1 w-full bg-stone-950">
        {/* HERO SECTION REDESIGN - CROPHEALTH Intelligence Pipeline */}
        <section className="relative pt-32 pb-48 overflow-hidden bg-stone-950 min-h-[85vh] flex items-center">
          {/* Enhanced Forest Background with Vignette */}
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2560" className="w-full h-full object-cover scale-105 blur-[3px] brightness-[0.2]" alt="Canopy" />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/50 to-stone-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)]" />
            {/* Deep vignette effect */}
            <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px 100px rgba(0,0,0,0.7)' }} />
          </div>

          {/* Floating Data Particles */}
          <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-emerald-500/30 animate-float-particle"
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100 + 50}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${Math.random() * 15 + 15}s`,
                  opacity: Math.random() * 0.5 + 0.2,
                  boxShadow: `0 0 ${Math.random() * 8 + 4}px rgba(16, 185, 129, 0.4)`,
                }}
              />
            ))}
            {/* Larger accent particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`large-${i}`}
                className="absolute rounded-full bg-emerald-400/20 animate-float-particle-slow"
                style={{
                  width: `${Math.random() * 12 + 8}px`,
                  height: `${Math.random() * 12 + 8}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100 + 60}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${Math.random() * 20 + 25}s`,
                  opacity: Math.random() * 0.3 + 0.1,
                  boxShadow: `0 0 ${Math.random() * 15 + 10}px rgba(16, 185, 129, 0.3)`,
                }}
              />
            ))}
          </div>

          <div className="max-w-[1400px] mx-auto px-8 relative z-10 space-y-24 w-full">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-10">
              <div className="space-y-12">
                {/* Glowing Emerald Accent Line */}
                <div className="flex justify-center mb-8">
                  <div
                    className="h-[3px] w-28 rounded-full animate-glow-pulse"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 20px ${accentColor}, 0 0 40px ${accentColor}50, 0 0 60px ${accentColor}30`
                    }}
                  />
                </div>

                <div className="space-y-6">
                  {/* AUTONOMOUS - Spaced Letters with Fade-in */}
                  <h1 className="text-[11px] md:text-[13px] font-medium text-white/70 uppercase animate-hero-fade-1" style={{ letterSpacing: '0.3em' }}>
                    A U T O N O M O U S
                  </h1>

                  {/* Main Headline - Bold Italic Sans-Serif */}
                  <h2 className="text-4xl md:text-6xl lg:text-[80px] font-black text-white tracking-[-0.02em] leading-[0.9] uppercase italic animate-hero-fade-2">
                    READING THE LAND.<br />WRITING THE FUTURE.
                  </h2>
                </div>

                {/* Tagline with Typewriter Effect */}
                <div className="pt-4 animate-hero-fade-3">
                  <p className="text-lg md:text-xl lg:text-[22px] font-normal text-white/90 leading-relaxed max-w-3xl mx-auto" style={{ letterSpacing: '0.02em' }}>
                    <span className="hero-typewriter">"The earth speaks in data. We speak back in action."</span>
                  </p>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-hero-fade-4">
              {DASHBOARD_CARDS.map((card) => (
                <MagicalDirectiveCard
                  key={card.id}
                  card={card}
                  isActive={location.pathname === card.route || (card.id === 'health' && location.pathname === '/')}
                  onClick={() => navigate(card.route)}
                />
              ))}
            </div>
          </div>

          {/* FUTURE OF FARMING - Bottom Right Corner */}
          <div className="absolute bottom-8 right-10 z-10">
            <p className="text-[11px] md:text-[13px] font-bold uppercase tracking-[0.25em] italic text-emerald-500/50 hover:text-emerald-500/80 transition-opacity duration-500 cursor-default">
              FUTURE OF FARMING
            </p>
          </div>
        </section>

        {/* Transition content area with lighter background */}
        <div className="max-w-[1400px] mx-auto px-8 -mt-20 relative z-20 space-y-24">
          <section className="bg-white rounded-[4rem] shadow-2xl border border-stone-100 p-16 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-20 items-start relative z-10">
              <div className="flex-1 w-full space-y-16">
                <div className="space-y-8 relative">
                  <button
                    onClick={() => setIsFarmSelectorOpen(!isFarmSelectorOpen)}
                    className={`w-full text-left bg-white px-10 py-9 rounded-[3rem] border-[4px] transition-all duration-700 flex items-center justify-between cursor-pointer relative z-[61] ${isFarmSelectorOpen ? 'shadow-3xl ring-4 ring-blue-100 border-blue-400' : 'shadow-2xl hover:shadow-xl border-stone-100'}`}
                  >
                    <div className="flex items-center gap-10">
                      <div className="p-6 rounded-[2rem] shadow-inner bg-blue-50 border border-blue-100 flex items-center justify-center animate-marker-pulse text-blue-500">
                        <Target size={42} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-5xl font-black tracking-tighter text-stone-900 leading-none">{activeFarm.name}</h2>
                        <div className="flex items-center gap-4 mt-5">
                          <span className="font-black uppercase text-[11px] tracking-[0.4em] text-white px-5 py-2 rounded-full shadow-lg" style={{ backgroundColor: accentColor }}>Target_Locked</span>
                          <span className="font-bold text-sm text-stone-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={16} /> {activeFarm.location}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown size={32} className={`text-blue-500 transition-transform duration-500 ${isFarmSelectorOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFarmSelectorOpen && (
                    <div className="absolute top-[calc(100%+15px)] left-0 w-full bg-white rounded-[3.5rem] shadow-3xl border border-blue-100 z-[70] animate-scale-in overflow-hidden">
                      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {allFarms.map((farm) => (
                          <div
                            key={farm.id}
                            onClick={() => handleFarmSelect(farm)}
                            className="px-12 py-8 cursor-pointer transition-all flex justify-between items-center group/item border-b border-stone-50 last:border-none hover:bg-blue-50"
                          >
                            <div className="flex items-center gap-8">
                              <MapPin size={28} className={farm.id === activeFarm.id ? 'text-blue-600' : 'text-stone-400'} />
                              <span className={`text-2xl font-black ${farm.id === activeFarm.id ? 'text-blue-600' : 'text-stone-700'} group-hover/item:text-blue-600`}>{farm.name}</span>
                            </div>
                            {farm.id === activeFarm.id && <CheckCircle size={36} className="text-blue-600" strokeWidth={3} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Backdrop for dropdown closing */}
                  {isFarmSelectorOpen && <div className="fixed inset-0 z-[60]" onClick={() => setIsFarmSelectorOpen(false)} />}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  <TacticalMetric label="Sector Size" value={activeFarm.sizeHa} unit="Ha" icon={Maximize2} color="#10b981" />
                  <TacticalMetric label="Soil pH Profile" value={activeFarm.soil.ph} unit="pH" icon={Droplet} color="#f59e0b" />
                  <TacticalMetric label="Node Temperature" value={weather.temp} unit="°C" icon={Thermometer} color="#3b82f6" />
                </div>
              </div>
              <div className="w-full lg:w-[480px] shrink-0 flex flex-col gap-12">
                <div key={activeFarm.id} className="aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white relative group ring-2 ring-stone-100 bg-stone-100 dashboard-card-glow">
                  <img src={activeFarm.imageUrl} className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-150" alt="Satellite Preview" />
                </div>
                <div className="flex flex-col gap-6">
                  <button onClick={handleInitializeDiagnosis} disabled={analyzing} className="w-full text-white py-9 rounded-[3rem] shadow-xl transition-all flex items-center justify-center gap-6 group relative overflow-hidden active:scale-[0.97] disabled:opacity-50" style={{ backgroundColor: accentColor }}>
                    <Activity size={38} strokeWidth={3} className="relative z-10 animate-marker-pulse" />
                    <span className="text-3xl font-black tracking-tighter relative z-10 uppercase italic">Initiate Diagnosis</span>
                  </button>
                  <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => setIsEditModalOpen(true)} className="bg-stone-100 text-stone-700 py-6 rounded-[2rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest hover:bg-stone-200 transition-all border border-stone-200"><Settings size={20} /> Site_Profile</button>
                    <button onClick={() => setIsHistoryOpen(true)} className="bg-stone-900 text-white py-6 rounded-[2rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl"><History size={20} /> Audit_History</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 pb-24">
            <div className="lg:col-span-3 space-y-10">
              <h2 className="text-[14px] font-black text-stone-400 uppercase tracking-[0.8em] flex items-center gap-5 ml-2"><div className="h-6 w-2 rounded-full" style={{ backgroundColor: accentColor }} /> Geospatial Intelligence Mesh</h2>
              <div className="geospatial-map-container bg-white rounded-[4.5rem] shadow-2xl border border-stone-100 p-4 overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all">
                <FarmMap
                  farms={allFarms}
                  activeFarmId={activeFarm.id}
                  onSelectFarm={handleFarmSelect}
                  className="w-full h-full rounded-[3.5rem]"
                  filterCrop={filterCrop}
                  onFilterChange={setFilterCrop}
                />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center justify-between ml-2">
                <h2 className="text-[14px] font-black text-stone-400 uppercase tracking-[0.8em] flex items-center gap-5"><Search size={24} style={{ color: accentColor }} strokeWidth={3} /> Sector Proximity</h2>
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest bg-stone-100 px-3 py-1 rounded-full">{displayedFarms.length} Farms Visible</span>
              </div>
              <div className="space-y-6 max-h-[750px] overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
                {displayedFarms.map(farm => (
                  <div key={farm.id} className={`transition-all duration-500 ${farm.id === activeFarm.id ? 'translate-x-4' : 'hover:-translate-x-2'}`}>
                    <FarmDiscoveryCard farm={farm} isSelected={farm.id === activeFarm.id} onSelect={handleFarmSelect} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Firecrawl Enhanced Analysis Section */}
      <section className="max-w-[1400px] mx-auto px-8 pb-24">
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: accentColor }}></div>
            <h2 className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em]">Web Data Enhancement</h2>
          </div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Powered by Firecrawl</p>
        </div>
        <FirecrawlEnhancedAnalysis
          farm={activeFarm}
          isEnabled={isWebEnhancementEnabled}
          setIsEnabled={setIsWebEnhancementEnabled}
          analysisType={firecrawlAnalysisType}
          setAnalysisType={setFirecrawlAnalysisType}
        />
      </section>

      <Footer />

      {isHistoryOpen && (<SavedReportsModal reports={savedReports} onLoad={(r) => navigate(`/report/${r.farmId}`, { state: { farm: allFarms.find(f => f.id === r.farmId), report: r.report } })} onDelete={(id) => setSavedReports(deleteSavedReport(id))} onClose={() => setIsHistoryOpen(false)} />)}
      <FarmEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} farm={activeFarm} onSave={(u) => { setAllFarms(allFarms.map(f => f.id === u.id ? u : f)); setActiveFarm(u); }} />
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-gentle { 0%, 100% { opacity: 0.25; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.08); } }
        .animate-spin-extra-slow { animation: spin-slow 80s linear infinite; }
        .animate-pulse-gentle { animation: pulse-gentle 4s ease-in-out infinite; }
        @keyframes dashboard-glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.1); } }
        @keyframes marker-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .dashboard-card-glow { animation: dashboard-glow 4s ease-in-out infinite; }
        .animate-marker-pulse { animation: marker-pulse 2s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        
        /* Hero Section Animations */
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes float-particle-slow {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-120vh) translateX(-30px); opacity: 0; }
        }
        .animate-float-particle { animation: float-particle linear infinite; }
        .animate-float-particle-slow { animation: float-particle-slow linear infinite; }
        
        /* Staggered Fade-in Animations */
        @keyframes hero-fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-fade-1 { animation: hero-fade-in 0.8s ease-out forwards; animation-delay: 0s; opacity: 0; }
        .animate-hero-fade-2 { animation: hero-fade-in 0.8s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
        .animate-hero-fade-3 { animation: hero-fade-in 0.8s ease-out forwards; animation-delay: 0.5s; opacity: 0; }
        .animate-hero-fade-4 { animation: hero-fade-in 0.8s ease-out forwards; animation-delay: 0.8s; opacity: 0; }
        
        /* Glow Pulse Animation */
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px #10b981, 0 0 40px #10b98150, 0 0 60px #10b98130; }
          50% { box-shadow: 0 0 30px #10b981, 0 0 60px #10b98180, 0 0 90px #10b98150; }
        }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
        
        /* Typewriter Effect */
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blink-caret {
          from, to { border-color: transparent; }
          50% { border-color: #10b981; }
        }
        .hero-typewriter {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 3s steps(52, end) 1s forwards;
          border-right: 2px solid #10b981;
          animation: typewriter 3s steps(52, end) 1s forwards, blink-caret 0.75s step-end infinite;
          width: 0;
        }
        
        /* Earth Signal Logo Animations */
        @keyframes logo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.3); }
        }
        @keyframes logo-ring-expand {
          0% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 0.2; transform: scale(1.1); }
          100% { opacity: 0.5; transform: scale(0.9); }
        }
        @keyframes logo-contour {
          0%, 100% { stroke-opacity: 0.4; }
          50% { stroke-opacity: 0.7; }
        }
        .animate-logo-pulse { 
          animation: logo-pulse 2s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-logo-ring-1 { 
          animation: logo-ring-expand 2.5s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-logo-ring-2 { 
          animation: logo-ring-expand 2.5s ease-in-out infinite 0.5s;
          transform-origin: center;
        }
        .animate-logo-ring-3 { 
          animation: logo-ring-expand 2.5s ease-in-out infinite 1s;
          transform-origin: center;
        }
        .animate-logo-contour { animation: logo-contour 3s ease-in-out infinite; }
        .animate-logo-contour-delay { animation: logo-contour 3s ease-in-out infinite 1s; }
        
        /* Map Container Fix - Responsive */
        .geospatial-map-container {
          width: 100%;
          min-height: 400px;
          height: 50vh; /* Mobile Default */
          background: #f5f5f5;
          position: relative;
        }
        @media (min-width: 768px) {
          .geospatial-map-container { height: 60vh; }
        }
        @media (min-width: 1024px) {
          .geospatial-map-container { height: 750px; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
