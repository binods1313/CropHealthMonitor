
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import {
    Sparkles, BookOpen, Globe, Newspaper, Zap,
    Search, ShieldAlert, Cloud, Leaf, LayoutDashboard,
    Settings, ChevronRight, BarChart3, Map as MapIcon,
    MessageSquare, Share2, Download, Plus, Quote,
    ExternalLink, TrendingUp, AlertTriangle, ThermometerSun,
    Activity, AlertCircle, Flag, RefreshCcw, X
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import Footer from './Footer';
import ConfigModal from './ConfigModal';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { processNewsWithGeocoding, getMapboxSuggestions } from '../services/geocodingService';
import { fetchNASACropData, fetchNASAEvents } from '../services/nasaService';

// --- Types ---
interface Notebook {
    id: string;
    title: string;
    subtitle: string;
    source: string;
    category: string;
    date: string;
    sourceCount: number;
    coverImage: string;
    content?: string;
}

const NotebookDetailModal: React.FC<{ notebook: Notebook, onClose: () => void }> = ({ notebook, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
            <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-3xl" onClick={onClose} />

            <div className="relative w-full max-w-7xl h-full bg-stone-900 rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-3xl animate-hero-fade-in">
                <button onClick={onClose} className="absolute top-8 right-8 z-[110] p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                    <ChevronRight className="rotate-180" size={24} />
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <div className="relative h-[450px] shrink-0">
                        <img src={notebook.coverImage} className="w-full h-full object-cover brightness-[0.4]" alt={notebook.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-stone-900/40" />

                        <div className="absolute bottom-16 left-16 right-16 space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="px-5 py-2 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black uppercase tracking-widest">{notebook.category}</span>
                                <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{notebook.date} • {notebook.sourceCount} verified sources</span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.85]">{notebook.title}</h2>
                            <div className="flex items-center gap-4 pt-4 border-t border-white/10 w-fit">
                                <div className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center">
                                    <BookOpen size={20} className="text-emerald-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Initial Publication</span>
                                    <span className="text-xs font-bold text-white uppercase">{notebook.source} Intelligence Unit</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-6">
                                <h3 className="flex items-center gap-3 text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">
                                    <Sparkles size={18} />
                                    AI Intelligence Synthesis
                                </h3>
                                <p className="text-2xl font-black text-white leading-tight uppercase italic">{notebook.subtitle}</p>
                                <div className="prose prose-invert prose-stone max-w-none">
                                    <p className="text-stone-400 text-lg leading-relaxed">
                                        This research synthesis explores the critical intersection of {notebook.category.toLowerCase()} development and planetary resilience.
                                        Analyzed through 48 distinct neural pathways and cross-referenced with real-time agricultural telemetry from 12 regions.
                                    </p>
                                    <div className="my-10 p-8 bg-white/5 border-l-4 border-emerald-500 rounded-r-3xl space-y-4">
                                        <Quote className="text-emerald-500 opacity-40 mb-2" size={32} />
                                        <p className="text-xl font-black text-white italic uppercase tracking-tight leading-snug">
                                            "The data suggests an accelerated recursive loop between {notebook.category} efficiency and localized soil regeneration by late 2026."
                                        </p>
                                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">— PRIMARY SYNTHESIS NODE_V4.2</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="p-8 bg-stone-800/40 rounded-[2rem] border border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Key Vulnerability Vector</h4>
                                    <p className="text-2xl font-black text-rose-500 uppercase tracking-tighter italic">Thermal Pathogen Load</p>
                                    <p className="text-xs text-stone-400 font-medium">Monitoring indicates a 14% increase in vector velocity across semi-arid boundaries.</p>
                                </div>
                                <div className="p-8 bg-stone-800/40 rounded-[2rem] border border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Strategic Opportunity</h4>
                                    <p className="text-2xl font-black text-emerald-500 uppercase tracking-tighter italic">Bio-Regen Yield_Up</p>
                                    <p className="text-xs text-stone-400 font-medium">Crops utilizing the new protocol show 22% higher resilience to sporadic rainfall.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest pb-4 border-b border-white/10 flex justify-between items-center">
                                    Source Citations
                                    <span className="text-stone-500">{notebook.sourceCount} total</span>
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { s: 'Global Crop Initiative', d: 'Primary Dataset', p: 98, url: 'https://example.com/gci' },
                                        { s: 'UN FAO Research', d: 'Yield Projections', p: 92, url: 'https://example.com/fao' },
                                        { s: 'Planetary Health Hub', d: 'Climate Modeling', p: 89, url: 'https://example.com/phh' },
                                        { s: 'AgroGenomics Lab', d: 'DNA Architecture', p: 95, url: 'https://example.com/agl' }
                                    ].map(cit => (
                                        <div
                                            key={cit.s}
                                            onClick={() => window.open(cit.url, '_blank')}
                                            className="group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-white uppercase group-hover:text-emerald-400 transition-colors">{cit.s}</span>
                                                <ExternalLink size={10} className="text-stone-600 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] text-stone-500 uppercase tracking-widest">{cit.d}</p>
                                                <span className="text-[9px] font-bold text-emerald-500/80">{cit.p}% PRECISION</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-emerald-500 rounded-[2.5rem] space-y-6">
                                <div className="w-12 h-12 rounded-2xl bg-stone-950 flex items-center justify-center">
                                    <Zap size={24} className="text-emerald-500" fill="currentColor" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-stone-950 font-black uppercase italic text-xl">Engage Action</h4>
                                    <p className="text-stone-800 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Cross-reference this notebook with your sector metrics for a customized 2030 roadmap.</p>
                                </div>
                                <button className="w-full py-4 bg-stone-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[.25em] shadow-xl active:scale-95 transition-all">Connect Data Now</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-stone-950 shrink-0 border-t border-white/10 flex items-center justify-between">
                    <div className="flex gap-4">
                        <button className="p-3 bg-stone-900 rounded-xl text-stone-400 hover:text-white transition-all group relative">
                            <Share2 size={20} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-800 text-[9px] text-white font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Share Intelligence</span>
                        </button>
                        <button className="p-3 bg-stone-900 rounded-xl text-stone-400 hover:text-white transition-all group relative">
                            <Download size={20} />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-800 text-[9px] text-white font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Export Brief</span>
                        </button>
                        <button
                            className="flex items-center gap-3 px-5 py-3 bg-stone-900 border border-white/5 rounded-xl text-stone-500 hover:text-rose-400 hover:border-rose-400/30 transition-all text-[10px] font-black uppercase tracking-widest"
                            onClick={() => alert("Intelligence Feedback logged. Audit node initiated.")}
                        >
                            <Flag size={14} />
                            Report Intelligence Issue
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em]">Intelligence Stream_L5.Ready</p>
                        <button onClick={onClose} className="px-10 py-3 bg-white text-stone-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Close Intelligence Overview</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface NewsItem {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    category: 'Clips' | 'Climate' | 'Health' | 'Risks';
    summary?: string;
    isNASA?: boolean; // Special flag for NASA events
}



// --- Mock Data ---
const FEATURED_NOTEBOOKS: Notebook[] = [
    {
        id: 'world-ahead-2026',
        title: 'The World Ahead 2026',
        subtitle: 'A guide to the future of crops and global changes',
        source: 'The Economist',
        category: 'Innovation',
        date: 'Apr 26, 2025',
        sourceCount: 45,
        coverImage: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=1000'
    },
    {
        id: 'super-agers',
        title: 'Secrets of the Super Agers',
        subtitle: 'Adaptation and resilience in aged crops',
        source: 'The Atlantic',
        category: 'Genetics',
        date: 'May 02, 2025',
        sourceCount: 32,
        coverImage: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000'
    },
    {
        id: 'build-a-life',
        title: 'How to Build a Life',
        subtitle: 'Disaster risk reduction strategies and experimentation',
        source: 'The Atlantic',
        category: 'Resilience',
        date: 'May 10, 2025',
        sourceCount: 28,
        coverImage: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1000'
    },
    {
        id: 'plant-genome',
        title: 'What\'s in Your Genome?',
        subtitle: 'Climate patterns encoded in plant DNA',
        source: 'Google Research',
        category: 'Science',
        date: 'May 15, 2025',
        sourceCount: 56,
        coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000'
    }
];

const DAILY_DIGEST: NewsItem[] = [
    { id: '1', title: 'Global Wheat Yields Hit Record High in Semi-Arid Regions', source: 'AgriNews', timestamp: '2h ago', category: 'Health' },
    { id: '2', title: 'Unexpected Pest Outbreak in Southeast Asian Rice Belts', source: 'FAO', timestamp: '4h ago', category: 'Risks' },
    { id: '3', title: 'El Niño Patterns Stabilizing for Northern Hemispheres', source: 'NOAA', timestamp: '6h ago', category: 'Climate' },
    { id: '4', title: 'New CRISPR Protocol Increases Maize Drought Resistance', source: 'BioTech Daily', timestamp: '8h ago', category: 'Health' },
    { id: '5', title: 'Flash Flood Alert: Monitoring Citrus Groves in Florida', source: 'National Weather', timestamp: '10h ago', category: 'Risks' }
];

// --- Sub-components ---

const UnifiedNav: React.FC<{ onConfig: () => void }> = ({ onConfig }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { accentColor } = useTheme();

    return (
        <nav className="bg-stone-950/80 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[60] px-8 py-5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                    <div className="relative w-[44px] h-[44px] transition-all group-hover:brightness-110 group-hover:scale-105">
                        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                            <defs>
                                <linearGradient id="leafGradientEarth" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M24 4C24 4 8 14 8 28C8 38 15 44 24 44C33 44 40 38 40 28C40 14 24 4 24 4Z"
                                stroke="url(#leafGradientEarth)"
                                strokeWidth="2"
                                fill="none"
                            />
                            <path d="M24 44V12" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.8" />
                            <path d="M24 18C20 20 14 22 12 26" stroke="#10b981" strokeWidth="1" strokeOpacity="0.6" />
                            <path d="M24 28L32 28L32 32" stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.7" />
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
                <button onClick={onConfig} className="p-2.5 hover:bg-white/10 rounded-xl text-stone-400 hover:text-white transition-all">
                    <Settings size={20} />
                </button>
            </div>
        </nav>
    );
};

const NotebookCard: React.FC<{ notebook: Notebook, onClick: () => void }> = ({ notebook, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Fallback gradients matching brand colors
    const fallbackGradients: Record<string, string> = {
        'THE ATLANTIC': 'linear-gradient(135deg, #1a4d2e 0%, #0d2818 100%)',
        'GOOGLE RESEARCH': 'linear-gradient(135deg, #1a3a4d 0%, #0d1f28 100%)',
        'THE ECONOMIST': 'linear-gradient(135deg, #1f4037 0%, #0d2818 100%)',
        'DEFAULT': 'linear-gradient(135deg, #1c1917 0%, #292524 100%)'
    };

    const getGradient = () => fallbackGradients[notebook.source.toUpperCase()] || fallbackGradients['DEFAULT'];
    const shouldShowGradient = !notebook.coverImage || imageError || !imageLoaded;

    return (
        <div onClick={onClick} className="group relative overflow-hidden rounded-[2.5rem] bg-stone-900 aspect-[4/5] cursor-pointer transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
            <div
                className="absolute inset-0"
                style={{
                    background: shouldShowGradient
                        ? getGradient()
                        : `url(${notebook.coverImage}) center/cover no-repeat`
                }}
            >
                {notebook.coverImage && (
                    <img
                        src={notebook.coverImage}
                        alt={notebook.title}
                        style={{ display: 'none' }}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}
                {shouldShowGradient && (
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent" />
            </div>

            <div className="absolute top-8 left-8">
                <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    {notebook.source}
                </span>
            </div>

            <div className="absolute bottom-10 left-10 right-10 space-y-4">
                <h3 className="text-3xl font-black text-white leading-tight tracking-tight uppercase italic group-hover:text-emerald-400 transition-colors">
                    {notebook.title}
                </h3>
                <p className="text-stone-400 text-xs font-medium leading-relaxed max-w-[90%] line-clamp-2">
                    {notebook.subtitle}
                </p>
                <div className="pt-4 flex items-center justify-between border-t border-white/10">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest group-hover:text-stone-300">
                        {notebook.date}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        {notebook.sourceCount} Sources
                    </span>
                </div>
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <button className="px-8 py-3 rounded-full bg-white text-stone-950 font-black text-xs uppercase tracking-widest shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                    Open Notebook
                </button>
            </div>
        </div>
    );
};

const NASACropInsights: React.FC = () => {
    const [expanded, setExpanded] = useState(false);
    const [cropData, setCropData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchNASACropData = async () => {
      setLoading(true);
      try {
        // Using a default location for demonstration
        const data = await fetchNASACropData(28.7, 77.1); // Delhi coordinates as example
        setCropData(data);
      } catch (error) {
        console.error('NASA API error:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
        <div className="nasa-crop-insights-card">
            <div
                className="card-header"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="header-left">
                    <span className="nasa-badge">NASA</span>
                    <h3> Satellite Crop Intelligence</h3>
                </div>
                <button className="expand-btn">
                    {expanded ? '▼' : '▶'}
                </button>
            </div>

            {expanded && (
                <div className="card-content">
                    {loading ? (
                        <div className="loading">Analyzing satellite data...</div>
                    ) : cropData ? (
                        <>
                            <div className="metric-row">
                                <div className="metric">
                                    <span className="label">Avg Temperature</span>
                                    <span className="value">{cropData.avgTemp}°C</span>
                                </div>
                                <div className="metric">
                                    <span className="label">Precipitation</span>
                                    <span className="value">{cropData.precipitation}mm</span>
                                </div>
                                <div className="metric">
                                    <span className="label">Solar Radiation</span>
                                    <span className="value">{cropData.solarRad} MJ/m²</span>
                                </div>
                            </div>
                            <div className="crop-suitability">
                                <h4>Crop Suitability Index</h4>
                                <div className="suitability-bar">
                                    <div
                                        className="fill"
                                        style={{ width: `${cropData.suitability}%` }}
                                    />
                                </div>
                                <p className="insight">{cropData.recommendation}</p>
                            </div>
                        </>
                    ) : (
                        <button onClick={fetchNASACropData}>
                            Analyze Current Region
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const InfographicCarousel: React.FC = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    // Include NASA satellite data in the chart
    const data = [
        { name: 'Soil PH', value: 6.8, target: 7.0, nasa: 2 },
        { name: 'Nitrogen', value: 45, target: 50, nasa: 3 },
        { name: 'Moisture', value: 32, target: 30, nasa: 1 },
        { name: 'Organic', value: 4.2, target: 5.0, nasa: 4 }
    ];

    return (
        <div className="bg-stone-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Intelligence Infographic</h3>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Soil Health Indices — Regional Group 04</p>
                </div>

                <NASACropInsights />
                <p className="text-stone-400 text-sm leading-relaxed">
                    Real-time cross-referencing of satellite NDVI data with localized soil sensory nodes reveals a 4.2% stability increase in organic carbon sequestration.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => setActiveSlide(0)} className={`w-3 h-3 rounded-full transition-all ${activeSlide === 0 ? 'bg-emerald-500 scale-125' : 'bg-stone-800'}`} />
                    <button onClick={() => setActiveSlide(1)} className={`w-3 h-3 rounded-full transition-all ${activeSlide === 1 ? 'bg-emerald-500 scale-125' : 'bg-stone-800'}`} />
                    <button onClick={() => setActiveSlide(2)} className={`w-3 h-3 rounded-full transition-all ${activeSlide === 2 ? 'bg-emerald-500 scale-125' : 'bg-stone-800'}`} />
                </div>
            </div>
            <div className="w-full md:w-[300px] h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <Bar dataKey="value" fill="#10b981" radius={[10, 10, 0, 0]} />
                        <Bar dataKey="target" fill="#1e293b" radius={[10, 10, 0, 0]} />
                        {/* NEW - Add NASA satellite observations */}
                        <Bar dataKey="nasa" fill="#0066ff" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-stone-400">News Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-stone-400">NASA Events</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DailyDigestPanel: React.FC = () => {
    const [digestItems, setDigestItems] = useState<NewsItem[]>(DAILY_DIGEST);
    const [loading, setLoading] = useState(false);

    // Fetch NASA events and merge with daily digest
    useEffect(() => {
        const loadCombinedNews = async () => {
            setLoading(true);
            try {
                // Get NASA events
                const nasaEvents = await fetchNASAEvents();

                // Convert NASA events to NewsItem format
                const nasaNewsItems: NewsItem[] = nasaEvents.map((event: any) => ({
                    id: `nasa-${event.id}`,
                    title: event.title,
                    source: 'NASA EONET',
                    timestamp: new Date(event.date).toLocaleDateString(),
                    category: 'Risks', // Default category for NASA events
                    isNASA: true // Special flag
                }));

                // Combine with existing digest items
                const combinedItems = [...DAILY_DIGEST, ...nasaNewsItems].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                setDigestItems(combinedItems);
            } catch (error) {
                console.error('Error loading combined news:', error);
                // Fallback to original digest if NASA data fails
                setDigestItems(DAILY_DIGEST);
            } finally {
                setLoading(false);
            }
        };

        loadCombinedNews();
    }, []);

    return (
        <div className="bg-stone-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-10 space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-[0.3em]">
                    <Newspaper size={18} className="text-emerald-500" />
                    Daily Digest
                </h3>
                <button className="p-2 hover:bg-white/5 rounded-full text-stone-500 hover:text-white transition-all">
                    <ExternalLink size={16} />
                </button>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-stone-500">Loading intelligence feed...</p>
                    </div>
                ) : (
                    digestItems.map((item) => (
                        <div key={item.id} className="group flex items-start gap-6 pb-6 border-b border-white/5 last:border-none cursor-pointer">
                            <div className="pt-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${item.isNASA ? 'bg-blue-500 shadow-[0_0_8px_#0066ff]' :
                                    item.category === 'Risks' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' :
                                    item.category === 'Climate' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' :
                                    'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                                    }`} />
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[15px] font-black text-white/90 group-hover:text-emerald-400 transition-colors leading-snug">
                                        {item.title}
                                    </h4>
                                    {item.isNASA && <span className="nasa-source-badge">🛰️ NASA</span>}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                                    <span>{item.source}</span>
                                    <span className="w-1 h-1 rounded-full bg-stone-700" />
                                    <span>{item.timestamp}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-stone-400 text-[11px] font-black uppercase tracking-[0.25em] hover:bg-white/10 hover:text-white transition-all">
                Load More Intelligence
            </button>
        </div>
    );
};

const QueryResultsModal: React.FC<{ result: any, onClose: () => void }> = ({ result, onClose }) => {
    const data = result.data?.firecrawlInsights || result.data?.geminiAnalysis || {};
    const content = data.answer || data.markdown || data.content || JSON.stringify(data, null, 2);
    const citations = data.citations || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in">
            <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-3xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-full max-h-[85vh] bg-stone-900 rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-3xl animate-hero-fade-in">
                <div className="p-10 border-b border-white/10 flex items-center justify-between shrink-0 bg-stone-900/50 backdrop-blur-md">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className="text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Intelligence Synthesis</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight uppercase line-clamp-1">{result.query}</h2>
                    </div>
                    <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="prose prose-invert prose-stone max-w-none">
                                <p className="text-lg leading-relaxed text-stone-300 whitespace-pre-wrap">{typeof content === 'string' ? content : JSON.stringify(content)}</p>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-stone-800/50 p-6 rounded-3xl border border-white/5 space-y-4">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Globe size={14} className="text-emerald-500" /> Source Nodes
                                </h3>
                                {citations.length > 0 ? (
                                    <div className="space-y-3">
                                        {citations.slice(0, 5).map((cit: string, i: number) => (
                                            <a key={i} href={cit} target="_blank" rel="noopener noreferrer" className="block p-3 bg-stone-900 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all">
                                                <p className="text-[10px] font-bold text-stone-400 truncate">{new URL(cit).hostname}</p>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-stone-500 italic">Internal Knowledge Graph</p>
                                )}
                            </div>
                            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Confidence Metric</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black text-white">94%</span>
                                    <span className="text-[10px] font-bold text-stone-400 mb-1.5 uppercase">Verified</span>
                                </div>
                                <div className="h-1.5 w-full bg-emerald-900/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[94%] shadow-[0_0_10px_#10b981]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-white text-stone-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-50 transition-colors">Close Briefing</button>
                </div>
            </div>
        </div>
    );
};

const SmartQueryBar: React.FC<{ onResult: (data: any) => void }> = ({ onResult }) => {
    const [query, setQuery] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const handleEngage = async () => {
        if (!query.trim()) return;
        setIsThinking(true);
        try {
            const response = await fetch('/api/firecrawl-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analysisType: 'general-intelligence',
                    query: query
                })
            });
            const data = await response.json();
            if (data.success || data.data) {
                onResult({ ...data, query });
                setQuery('');
            } else {
                alert("Intelligence retrieval returned no data. Source nodes may be offline.");
            }
        } catch (error) {
            console.error('Intelligence Query Error:', error);
            alert("Intelligence retrieval failed due to network anomaly.");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="relative group max-w-4xl mx-auto w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[2.5rem] opacity-20 group-hover:opacity-40 blur-xl transition-all" />
            <div className="relative bg-stone-900 border border-white/10 rounded-[2.2rem] flex items-center p-2 shadow-2xl">
                <div className="pl-6 pr-4 text-emerald-500">
                    <Sparkles size={24} className={isThinking ? "animate-spin text-cyan-400" : "animate-pulse"} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEngage()}
                    placeholder={isThinking ? "Synthesizing global datasets..." : "Analyze crop trends, disease risks, or climate shifts..."}
                    className="flex-1 bg-transparent py-4 text-white font-medium placeholder-stone-600 focus:outline-none disabled:opacity-50"
                    disabled={isThinking}
                />
                <button
                    onClick={handleEngage}
                    disabled={isThinking}
                    className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2 disabled:bg-stone-800 disabled:text-stone-600"
                >
                    {isThinking ? <RefreshCcw size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                    {isThinking ? "Thinking..." : "Engage"}
                </button>
            </div>
        </div>
    );
};

// Custom Zoom Control Component
const ZoomControl = () => {
    const map = useMap();
    return (
        <div className="custom-zoom-control">
            <button onClick={() => map.zoomIn()}>+</button>
            <button onClick={() => map.zoomOut()}>−</button>
        </div>
    );
};

// Custom Layer Control Component
const LayerControl = ({ activeLayer, onChange }: { activeLayer: string, onChange: (l: string) => void }) => {
    return (
        <div className="layer-control">
            {['SATELLITE', 'WEATHER', 'CROPLANDS', 'REFERENCE', 'TERRAIN'].map(layer => (
                <button
                    key={layer}
                    className={activeLayer === layer.toLowerCase() ? 'active' : ''}
                    onClick={() => onChange(layer.toLowerCase())}
                >
                    {layer}
                </button>
            ))}
        </div>
    );
};

interface GeoNewsItem {
    id: number;
    lat: number;
    lng: number;
    title: string;
    snippet: string;
    source: string;
    category: 'crops' | 'health' | 'climate' | 'disaster';
    date: string;
    location?: string;
    relatedNotebooks?: string[];
}

const GeoNewsMap: React.FC = () => {
    const [activeLayer, setActiveLayer] = useState('satellite'); // Changed default to satellite to match new order
    const [newsData, setNewsData] = useState<GeoNewsItem[]>([]);
    const [timeFilter, setTimeFilter] = useState('week');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNASAEvents, setShowNASAEvents] = useState(true); // Default to show NASA events

    // Initialize with mock data and geocode them
    useEffect(() => {
        const initializeNewsData = async () => {
            setLoading(true);
            // Convert mock data to omit lat/lng temporarily for geocoding
            const mockNewsWithoutCoords = MOCK_NEWS_LOCATIONS.map(({ lat, lng, ...rest }) => rest);
            const geocodedNews = await processNewsWithGeocoding(mockNewsWithoutCoords);
            setNewsData(geocodedNews);
            setLoading(false);
        };

        initializeNewsData();
    }, []);

    // Filter logic
    const filteredNews = newsData.filter(news => {
        const matchesCategory = selectedCategory === 'all' || news.category === selectedCategory;
        const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            news.location?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const tileLayers: Record<string, string> = {
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        weather: `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${import.meta.env.VITE_OPENWEATHER_API_KEY || ''}`,
        croplands: 'https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/Soil_Survey_Map/MapServer/tile/{z}/{y}/{x}', // Using soil map as proxy for croplands visual
        reference: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        terrain: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_API_KEY || ''}`
    };

    const getMarkerIcon = (category: string) => {
        const colors: Record<string, string> = {
            crops: '#10b981', // green
            health: '#eab308', // yellow
            climate: '#f97316', // orange
            disaster: '#ef4444' // red
        };
        const color = colors[category] || '#10b981';

        return L.divIcon({
            className: 'custom-news-marker',
            html: `
            <div style="
              background: ${color};
              width: 16px;
              height: 16px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 10px ${color};
              animation: pulse 2s infinite;
            "></div>
          `,
            iconSize: [20, 20]
        });
    };

    // NASA marker icon function
    const getNASAMarkerIcon = (category: string) => {
        const icons: Record<string, string> = {
            'Wildfires': '🔥',
            'Floods': '🌊',
            'Droughts': '☀️',
            'Severe Storms': '⛈️'
        };

        return L.divIcon({
            className: 'nasa-event-marker',
            html: `
              <div class="nasa-marker-icon">
                <span class="icon">${icons[category] || '⚠️'}</span>
              </div>
            `,
            iconSize: [30, 30]
        });
    };

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [nasaEvents, setNasaEvents] = useState<any[]>([]);

    // Fetch NASA events on component mount
    useEffect(() => {
        const loadNasaEvents = async () => {
            const events = await fetchNASAEvents();
            setNasaEvents(events);
        };
        loadNasaEvents();
    }, []);

    const fetchSuggestions = async (searchText: string) => {
        if (searchText.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const data = await getMapboxSuggestions(searchText);
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Mapbox search failed:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        fetchSuggestions(value);
    };

    const handleSuggestionClick = (suggestion: any) => {
        const [lng, lat] = suggestion.center;
        setSearchQuery(suggestion.place_name);
        setShowSuggestions(false);
        // You could potentially center the map on the selected location
        // This would require access to the map instance
    };

    return (
        <div className="geonews-map-section">
            {/* Search Bar - Top Left */}
            <div className="map-search-bar">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="🔍 Search location or news topic..."
                        className="map-search-input"
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {/* Suggestions dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="search-suggestions-dropdown">
                            {suggestions.map((suggestion, idx) => (
                                <div
                                    key={idx}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <span className="suggestion-icon">📍</span>
                                    <span className="suggestion-text">{suggestion.place_name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Filter - Below Search */}
            <div className="category-filter">
                {['all', 'crops', 'health', 'climate', 'disaster'].map(cat => (
                    <button
                        key={cat}
                        className={selectedCategory === cat ? 'active' : ''}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat.toUpperCase()}
                    </button>
                ))}
                {/* NASA toggle */}
                <label className="nasa-toggle">
                    <input
                        type="checkbox"
                        checked={showNASAEvents}
                        onChange={(e) => setShowNASAEvents(e.target.checked)}
                    />
                    <span className="nasa-label">
                        <span className="nasa-icon">🛰️</span>
                        NASA Events
                    </span>
                </label>
            </div>

            {/* Map Container */}
            <div className="map-container">
                <MapContainer
                    center={[20, 0]}
                    zoom={2.2}
                    style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                    zoomControl={false}
                    minZoom={2}
                >
                    <TileLayer url={activeLayer === 'weather' ? tileLayers['reference'] : tileLayers[activeLayer]} />

                    {activeLayer === 'weather' && (
                        <TileLayer url={tileLayers['weather']} opacity={0.6} />
                    )}

                    {/* Controls Inside Map Context */}
                    <LayerControl activeLayer={activeLayer} onChange={setActiveLayer} />
                    <ZoomControl />

                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                        iconCreateFunction={(cluster) => {
                            const count = cluster.getChildCount();
                            return L.divIcon({
                                html: `<div class="cluster-icon">${count}</div>`,
                                className: 'marker-cluster',
                                iconSize: L.point(40, 40)
                            });
                        }}
                    >
                        {filteredNews.map((news) => (
                            <Marker
                                key={`news-${news.id}`}
                                position={[news.lat, news.lng]}
                                icon={getMarkerIcon(news.category)}
                            >
                                <Popup className="custom-popup" maxWidth={300}>
                                    <div className="news-popup">
                                        <span className="category-badge">{news.category}</span>
                                        <h4>{news.title}</h4>
                                        <p>{news.snippet}</p>
                                        <div className="popup-meta">
                                            <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center font-bold text-[10px] text-stone-600">
                                                {news.source.substring(0, 1)}
                                            </div>
                                            <span className="font-bold text-stone-600">{news.source}</span>
                                            <span className="date">{news.date}</span>
                                        </div>
                                        <button onClick={() => alert(`Opening story: ${news.title}`)}>
                                            Read Full Story →
                                        </button>
                                        {news.relatedNotebooks && (
                                            <a href="#notebooks" onClick={(e) => e.preventDefault()}>View Related Notebooks</a>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {/* NASA Event Markers - Only show if toggle is on */}
                        {showNASAEvents && nasaEvents.map((event, idx) => (
                            <Marker
                                key={`nasa-${idx}`}
                                position={[event.lat, event.lng]}
                                icon={getNASAMarkerIcon(event.category)}
                            >
                                <Popup className="custom-popup" maxWidth={300}>
                                    <div className="nasa-event-popup">
                                        <span className="nasa-badge">NASA</span>
                                        <h4>{event.title}</h4>
                                        <p className="category">{event.category}</p>
                                        <p className="date">{new Date(event.date).toLocaleDateString()}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>

            {/* Risk Pulse Bar - Bottom (clear of map) */}
            <div className="risk-pulse-bar">
                <div className="risk-pulse-left">
                    <span className="label">RISK PULSE</span>
                    <span className="value critical">Pathogen Alert: Northwest Region</span>
                </div>
                <div className="risk-pulse-right">
                    <span className="label">SENTIMENT</span>
                    <span className="value bullish">Market Recovery: Strong</span>
                </div>
                <div className="live-updates">
                    <span className="indicator">🟢</span>
                    <span className="text">LIVE UPDATES</span>
                    <span className="count">Scanning 42 sources/sec</span>
                </div>
            </div>

            {/* Time Filter - Below Risk Pulse */}
            <div className="time-filter-bar">
                {['today', 'week', 'month'].map(period => (
                    <button
                        key={period}
                        className={timeFilter === period ? 'active' : ''}
                        onClick={() => setTimeFilter(period)}
                    >
                        {period === 'today' ? 'TODAY' : period === 'week' ? 'THIS WEEK' : 'THIS MONTH'}
                    </button>
                ))}
                <button
                    className={showHeatmap ? 'active' : ''}
                    onClick={() => setShowHeatmap(!showHeatmap)}
                >
                    📊 HEATMAP
                </button>
            </div>
        </div>
    );
};

const MOCK_NEWS_LOCATIONS: GeoNewsItem[] = [
    { id: 1, lat: 20.5937, lng: 78.9629, title: "Heatwave Alert", snippet: "Critical temp rise in Northern Belt impacting wheat harvest projections.", source: "IMD", category: "climate", date: "2h ago", location: "India" },
    { id: 2, lat: -4.4419, lng: 15.2663, title: "Crop Pathogen", snippet: "New fungal strain detected in Congo maize fields.", source: "WHO", category: "health", date: "5h ago", location: "Congo" },
    { id: 3, lat: 36.7783, lng: -119.4179, title: "Drought Recovery", snippet: "California reservoir levels up 12% after storms.", source: "US Drought Monitor", category: "crops", date: "1d ago", location: "California" },
    { id: 4, lat: 51.5074, lng: -0.1278, title: "Policy Shift", snippet: "UK mandates sustainable fertilizer usage for 2026.", source: "BBC Agri", category: "crops", date: "3h ago", location: "UK" },
    { id: 5, lat: -14.2350, lng: -51.9253, title: "Soybean Rust", snippet: "Outbreak reported in Mato Grosso, Brazil.", source: "Embrapa", category: "health", date: "4h ago", location: "Brazil" },
    { id: 6, lat: 35.8617, lng: 104.1954, title: "Rice Flood Damage", snippet: "Heavy rains flood paddies in Southern China.", source: "CCTV", category: "disaster", date: "6h ago", location: "China" },
    { id: 7, lat: -33.8688, lng: 151.2093, title: "Wheat Yield Up", snippet: "Bumper crop expected in NSW despite dry start.", source: "ABC Rural", category: "crops", date: "12h ago", location: "Australia" },
    { id: 8, lat: 48.8566, lng: 2.3522, title: "Vineyard Frost", snippet: "Unexpected late frost hits Champagne region.", source: "France24", category: "climate", date: "8h ago", location: "France" },
    { id: 9, lat: 55.7558, lng: 37.6173, title: "Grain Export Ban", snippet: "New restrictions on grain exports announced.", source: "Reuters", category: "disaster", date: "2d ago", location: "Russia" },
    { id: 10, lat: 39.9334, lng: 32.8597, title: "Locust Swarm", snippet: "Locusts threatening crops in Southern Turkey.", source: "FAO", category: "health", date: "1d ago", location: "Turkey" }
];

const EarthBrief: React.FC = () => {
    const { accentColor } = useTheme();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
    const [queryResult, setQueryResult] = useState<any>(null);

    return (
        <div className="min-h-screen bg-stone-950 flex flex-col relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
            <UnifiedNav onConfig={() => setIsConfigOpen(true)} />
            <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

            {selectedNotebook && (
                <NotebookDetailModal notebook={selectedNotebook} onClose={() => setSelectedNotebook(null)} />
            )}

            {queryResult && (
                <QueryResultsModal result={queryResult} onClose={() => setQueryResult(null)} />
            )}

            <main className="flex-1 w-full pb-24">
                {/* Hero / Header Section */}
                <section className="relative pt-24 pb-16 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />

                    <div className="max-w-[1400px] mx-auto px-8 relative z-10 space-y-16">
                        <div className="flex flex-col items-center text-center space-y-12">
                            <div className="space-y-4">
                                <p className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.5em] animate-fade-in italic">
                                    Daily Intelligence Stream
                                </p>
                                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.85] animate-hero-fade-in">
                                    EARTH<span style={{ color: accentColor }}>BRIEF</span>
                                </h1>
                                <p className="text-stone-500 font-bold uppercase tracking-[0.2em] text-[11px] animate-hero-fade-in">
                                    Synchronizing Global Agricultural Neural Networks
                                </p>
                            </div>

                            <SmartQueryBar onResult={setQueryResult} />
                            <div className="w-full max-w-5xl animate-hero-fade-in" style={{ animationDelay: '200ms' }}>
                                <InfographicCarousel />
                            </div>
                        </div>

                        {/* Featured Notebooks Grid */}
                        <div className="space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Featured Notebooks</h2>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Curated research & AI-synthesized intelligence</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/5 transition-all">Latest</button>
                                    <button className="px-5 py-2 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-black uppercase tracking-widest shadow-lg">Trending</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {FEATURED_NOTEBOOKS.map(notebook => (
                                    <NotebookCard key={notebook.id} notebook={notebook} onClick={() => setSelectedNotebook(notebook)} />
                                ))}
                            </div>
                        </div>

                        {/* Middle Section: Digest + Map Placeholder */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-4">
                                <DailyDigestPanel />
                            </div>

                            <div className="lg:col-span-8 bg-stone-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 overflow-hidden flex flex-col relative group min-h-[500px]">
                                {/* Real Map Container for GeoNews */}
                                <div className="flex-1 relative z-0">
                                    <GeoNewsMap />
                                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-stone-950/40 to-transparent z-10" />
                                </div>


                            </div>
                        </div>

                        {/* Bottom Section: Risk Pulse / Notebook Tracker Widgets */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-stone-900/60 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={20} className="text-rose-500" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Global Risk Pulse</h3>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Drought Intensity', value: 78, color: '#f59e0b' },
                                        { label: 'Pathogen Velocity', value: 42, color: '#10b981' },
                                        { label: 'Thermal Anomaly', value: 91, color: '#f43f5e' }
                                    ].map(risk => (
                                        <div key={risk.label} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-stone-500">{risk.label}</span>
                                                <span style={{ color: risk.color }}>{risk.value}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${risk.value}%`, backgroundColor: risk.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-stone-900/60 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                    <Quote size={80} fill="currentColor" className="text-white" />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Insight of the Day</span>
                                    <p className="text-lg font-black text-white leading-tight uppercase italic line-clamp-3">
                                        "The convergence of genomic surveillance and climate predictive modeling is no longer optional—it is the baseline for 2026 food security."
                                    </p>
                                </div>
                                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-6">— Dr. Alisa Vovk, BioAgra Systems</p>
                            </div>

                            <div className="bg-stone-900/60 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center items-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Plus size={32} className="text-emerald-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-white font-black uppercase italic text-xl">Create Workspace</h3>
                                    <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest max-w-[180px]">Upload your PDFs and generate custom notebooks</p>
                                </div>
                                <button className="px-8 py-3 rounded-full border border-stone-800 text-[10px] font-black text-stone-400 uppercase tracking-widest hover:border-emerald-500 hover:text-white transition-all">
                                    Initialize Upload
                                </button>
                            </div>
                        </div>

                    </div>
                </section>
            </main>

            <Footer />

            <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hero-fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-hero-fade-in { animation: hero-fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Mapbox Custom Styles */
        .news-marker {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid white;
            cursor: pointer;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
            animation: marker-pulse 2s infinite;
        }
        @keyframes marker-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
            70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 0;
            border: 2px solid #10b981;
        }

        /* Map Custom Styles */
        /* Map Section Container */
        .geonews-map-section {
            position: relative;
            padding: 20px;
            background: #0a0a0a;
            border-radius: 16px;
            margin-top: 40px;
        }

        /* Search Bar */
        .map-search-bar {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1003;
            width: 350px;
        }

        .map-search-input {
            width: 100%;
            padding: 12px 16px 12px 40px;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #10b981;
            border-radius: 8px;
            color: #fff;
            font-size: 13px;
            outline: none;
            transition: all 0.3s;
        }

        .map-search-input:focus {
            border-color: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        /* Search Suggestions Dropdown */
        .search-suggestions-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            margin-top: 4px;
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #00ff00;
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1005; /* Increased to ensure it's above other map elements */
            box-shadow: 0 4px 12px rgba(0, 255, 0, 0.2);
        }

        .suggestion-item {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .suggestion-item:last-child {
            border-bottom: none;
        }

        .suggestion-item:hover {
            background: rgba(0, 255, 0, 0.1);
        }

        .suggestion-text {
            color: #fff;
            font-size: 13px;
        }

        /* Category Filter */
        .category-filter {
            position: absolute;
            top: 75px;
            left: 20px;
            z-index: 1003;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            max-width: 350px;
        }

        .category-filter button {
            padding: 6px 14px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #333;
            color: #fff;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            transition: all 0.3s;
        }

        .category-filter button:hover {
            border-color: #10b981;
            color: #10b981;
        }

        .category-filter button.active {
            background: #10b981;
            color: #000;
            border-color: #10b981;
        }

        /* Layer Control */
        .layer-control {
            position: absolute;
            top: 20px;
            right: 57px; /* Moved 0.6cm (approx 23px) to the right from original position of 80px (80-23=57) */
            z-index: 1003; /* Increased to ensure it's above other map elements */
            display: flex;
            gap: 6px;
        }

        .layer-control button {
            padding: 8px 8px; /* Reduced horizontal padding to make buttons narrower (0.2cm reduction) */
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #333;
            color: #fff;
            border-radius: 6px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            transition: all 0.3s;
            white-space: nowrap;
            min-width: 60px; /* Reduced width to accommodate the 0.2cm reduction */
        }

        .layer-control button:hover {
            border-color: #10b981;
        }

        .layer-control button.active {
            background: #10b981;
            color: #000;
            border-color: #10b981;
        }

        /* Zoom Controls */
        .custom-zoom-control {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1004; /* Increased to ensure it's above other map elements */
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .zoom-btn {
            width: 44px; /* Increased from 40px to ensure minimum 40px touch target */
            height: 44px; /* Increased from 40px to ensure minimum 40px touch target */
            background: rgba(0, 0, 0, 0.95);
            border: 1px solid #10b981;
            color: #10b981;
            font-size: 24px;
            font-weight: 300;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            min-width: 40px; /* Ensure minimum touch target size */
            min-height: 40px; /* Ensure minimum touch target size */
        }

        .zoom-btn:hover {
            background: #10b981;
            color: #000;
            transform: scale(1.05);
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); /* Add visual indicator */
        }

        .zoom-btn:active {
            transform: scale(0.95); /* Visual feedback when clicked */
            background: #059669; /* Darker green when active */
            color: #000;
        }

        /* Map Container */
        .map-container {
            position: relative;
            width: 100%;
            height: 500px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(0, 255, 0, 0.2);
            z-index: 1;
        }

        .leaflet-container {
            background: #0a0a0a !important;
            font-family: inherit;
        }

        /* Risk Pulse Bar - Now BELOW map */
        .risk-pulse-bar {
            position: relative;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(0, 0, 0, 0.95);
            padding: 16px 24px;
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 0, 0.3);
            z-index: 1;
        }

        .risk-pulse-left,
        .risk-pulse-right {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .risk-pulse-bar .label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .risk-pulse-bar .value {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .value.critical {
            color: #ff0000;
        }

        .value.bullish {
            color: #10b981;
        }

        .live-updates {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .live-updates .indicator {
            animation: blink 2s infinite;
        }

        .live-updates .text {
            color: #10b981;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .live-updates .count {
            color: #888;
            font-size: 10px;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        /* Time Filter Bar */
        .time-filter-bar {
            position: relative;
            margin-top: 16px;
            display: flex;
            justify-content: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0, 0, 0, 0.95);
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 0, 0.3);
        }

        .time-filter-bar button {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid #333;
            color: #fff;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            transition: all 0.3s;
        }

        .time-filter-bar button:hover {
            border-color: #10b981;
            color: #10b981;
        }

        .time-filter-bar button.active {
            background: #10b981;
            color: #000;
            border-color: #10b981;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .map-search-bar {
                width: calc(100% - 40px);
                right: 20px;
            }
            .category-filter {
                max-width: calc(100% - 40px);
            }
            .layer-control {
                top: 130px;
                left: 20px;
                right: auto;
            }
            .custom-zoom-control {
                top: 130px;
            }
            .risk-pulse-bar {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }
        }

        /* Marker & Cluster (Preserved) */
        .marker-cluster {
            background: rgba(16, 185, 129, 0.9);
            border-radius: 50%;
            text-align: center;
            color: #000;
            font-weight: 900;
            font-size: 12px;
            border: 4px solid rgba(0,0,0,0.5);
        }

        .cluster-icon {
            line-height: 32px;
        }

        .news-popup {
            padding: 4px;
        }
        .category-badge {
            display: inline-block;
            padding: 3px 6px;
            background: #10b981;
            color: #000;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
        }
        .news-popup h4 {
            font-size: 14px;
            font-weight: 800;
            color: #111;
            margin-bottom: 6px;
            line-height: 1.2;
        }
        .news-popup p {
            font-size: 11px;
            line-height: 1.4;
            color: #555;
            margin-bottom: 12px;
        }
        .popup-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-top: 8px;
            border-top: 1px solid #eee;
        }
        .popup-meta .date {
            margin-left: auto;
            color: #999;
            font-size: 10px;
            font-weight: 600;
        }
        .news-popup button {
            width: 100%;
            padding: 8px;
            background: #1c1917;
            color: #10b981;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 900;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 12px;
            transition: all 0.2s;
        }
        .news-popup button:hover {
            background: #000;
            color: #34d399;
        }
        .news-popup a {
            display: block;
            text-align: center;
            margin-top: 8px;
            color: #666;
            text-decoration: none;
            font-size: 10px;
            font-weight: 600;
        }
        .news-popup a:hover {
            text-decoration: underline;
        }

        /* NASA Crop Insights Card */
        .nasa-crop-insights-card {
            margin-top: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid rgba(0, 100, 255, 0.3);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s;
        }

        .card-header {
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .card-header:hover {
            background: rgba(0, 100, 255, 0.1);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .nasa-badge {
            background: #0066ff;
            color: #fff;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }

        .card-header h3 {
            color: #fff;
            font-size: 16px;
            margin: 0;
        }

        .expand-btn {
            background: transparent;
            border: none;
            color: #00ff00;
            font-size: 16px;
            cursor: pointer;
        }

        .card-content {
            padding: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .metric-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }

        .metric {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .metric .label {
            color: #888;
            font-size: 11px;
            text-transform: uppercase;
        }

        .metric .value {
            color: #00ff00;
            font-size: 20px;
            font-weight: bold;
        }

        .crop-suitability h4 {
            color: #fff;
            font-size: 14px;
            margin-bottom: 12px;
        }

        .suitability-bar {
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 12px;
        }

        .suitability-bar .fill {
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #ffcc00, #00ff00);
            transition: width 0.5s ease;
        }

        .insight {
            color: #ccc;
            font-size: 13px;
            line-height: 1.5;
        }

        .nasa-marker-icon {
            background: rgba(0, 100, 255, 0.9);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
            box-shadow: 0 0 15px rgba(0, 100, 255, 0.6);
            animation: nasaPulse 2s infinite;
        }

        .nasa-marker-icon .icon {
            font-size: 16px;
        }

        @keyframes nasaPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }

        .nasa-event-popup .nasa-badge {
            background: #0066ff;
            color: #fff;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 8px;
        }

        .nasa-event-popup h4 {
            margin: 8px 0;
            color: #000;
            font-size: 14px;
        }

        .nasa-event-popup .category {
            color: #0066ff;
            font-weight: bold;
            font-size: 12px;
        }

        .nasa-event-popup .date {
            color: #666;
            font-size: 11px;
            margin-top: 4px;
        }

        /* NASA Toggle */
        .nasa-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #0066ff;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .nasa-toggle:hover {
            background: rgba(0, 100, 255, 0.1);
        }

        .nasa-toggle input[type="checkbox"] {
            accent-color: #0066ff;
            cursor: pointer;
        }

        .nasa-label {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .nasa-source-badge {
            background: #0066ff;
            color: #fff;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.98) !important;
            border-radius: 16px !important;
            border: none !important;
            box-shadow: 0 20px 50px -10px rgba(0,0,0,0.5) !important;
        }
        .leaflet-container {
            font-family: 'Inter', sans-serif !important;
        }
      `}</style>
        </div>
    );
};

export default EarthBrief;
