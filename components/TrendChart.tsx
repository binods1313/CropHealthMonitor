
import React, { useState, useMemo } from 'react';
import { MOCK_FARMS } from '../constants';
import { FarmData } from '../types';

export interface TrendPoint {
  date: string;
  score: number;
}

interface TrendChartProps {
  data?: TrendPoint[];
  className?: string;
  title?: string;
  allFarms?: FarmData[]; // Pass in farms to allow selecting comparisons
}

// Default mock history showing a decline leading up to the current issue
const MOCK_HISTORY: TrendPoint[] = [
  { date: 'May 15', score: 88 },
  { date: 'May 22', score: 86 },
  { date: 'May 29', score: 82 },
  { date: 'Jun 05', score: 75 },
  { date: 'Jun 12', score: 71 },
  { date: 'Jun 19', score: 65 },
];

// Deterministic pseudo-random number generator based on a string seed
const getSeededRandom = (seedStr: string) => {
  let h = 0xdeadbeef;
  for(let i = 0; i < seedStr.length; i++)
    h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h >>> 0) / 4294967296;
  }
};

const generateComparisonData = (farmId: string, templateData: TrendPoint[]): TrendPoint[] => {
  const rng = getSeededRandom(farmId);
  
  return templateData.map(point => {
    // Generate a different trend curve
    // Base variance between -15 and +15
    const variance = (rng() * 30) - 15;
    
    // Sometimes farms have different trends, let's add a sine wave factor based on index
    // to make lines cross or diverge
    const trendFactor = Math.sin(rng() * 10) * 10;
    
    let newScore = Math.round(75 + variance + trendFactor);
    newScore = Math.max(40, Math.min(100, newScore));
    
    return {
      date: point.date,
      score: newScore
    };
  });
};

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
];

const TrendChart: React.FC<TrendChartProps> = ({ 
  data = MOCK_HISTORY, 
  className = "",
  title = "Health Index History (30 Days)",
  allFarms = MOCK_FARMS
}) => {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Chart layout configuration
  const width = 600;
  const height = 260; // Slightly increased for legend
  const padding = { top: 60, right: 30, bottom: 40, left: 40 };

  // Computed dimensions
  const contentWidth = width - padding.left - padding.right;
  const contentHeight = height - padding.top - padding.bottom;

  // Scales
  const maxScore = 100;
  const minScore = 40; 
  
  const getX = (index: number) => 
    padding.left + (index / (data.length - 1)) * contentWidth;
    
  const getY = (value: number) => 
    padding.top + contentHeight - ((value - minScore) / (maxScore - minScore)) * contentHeight;

  // Generate Comparison Data Arrays
  const comparisonSeries = useMemo(() => {
    return compareIds.map((id, idx) => {
        const farm = allFarms.find(f => f.id === id);
        return {
            id,
            name: farm?.name || id,
            color: COLORS[idx % COLORS.length],
            data: generateComparisonData(id, data)
        };
    });
  }, [compareIds, data, allFarms]);

  // Generate SVG Path for the primary line
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  
  // Generate Area Path (close the loop at the bottom)
  const areaPath = `
    M ${getX(0)},${padding.top + contentHeight} 
    ${points.split(' ').map(p => `L ${p}`).join(' ')} 
    L ${getX(data.length - 1)},${padding.top + contentHeight} 
    Z
  `;

  const toggleFarm = (id: string) => {
      setCompareIds(prev => 
        prev.includes(id) 
            ? prev.filter(p => p !== id) 
            : [...prev, id].slice(0, 3) // Limit to 3 comparisons
      );
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-stone-700">{title}</h3>
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 bg-white px-2 py-1 rounded-full border border-stone-100 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-agri-500"></span> 
                <span>Trend</span>
            </div>
          </div>
          
          {/* Comparison Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 text-xs font-medium rounded-lg py-1.5 px-3 hover:border-agri-300 transition-colors"
            >
              <span>Compare Farms ({compareIds.length})</span>
               <svg className={`w-3 h-3 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isSelectorOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-lg z-20 p-2 max-h-60 overflow-y-auto">
                    <p className="text-xs font-bold text-stone-400 uppercase mb-2 px-2">Select up to 3</p>
                    {allFarms.map(farm => (
                        <div 
                            key={farm.id} 
                            onClick={() => toggleFarm(farm.id)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs ${compareIds.includes(farm.id) ? 'bg-agri-50 text-agri-700 font-semibold' : 'hover:bg-stone-50 text-stone-600'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${compareIds.includes(farm.id) ? 'bg-agri-500 border-agri-500' : 'border-stone-300'}`}>
                                {compareIds.includes(farm.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="truncate">{farm.name}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Click outside closer overlay */}
            {isSelectorOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsSelectorOpen(false)}></div>
            )}
          </div>
      </div>

      {/* Legend if Comparison Active */}
      {comparisonSeries.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 mb-2 text-xs font-medium px-2">
            <div className="flex items-center gap-1.5 text-stone-600">
                <div className="relative w-3 h-3 flex items-center justify-center">
                    <div className="absolute w-3 h-0.5 bg-agri-600"></div>
                    <div className="absolute w-2 h-2 rounded-full border border-agri-600 bg-white"></div>
                </div>
                Current
            </div>
            {comparisonSeries.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-1.5" style={{ color: s.color }}>
                    <div className="relative w-3 h-3 flex items-center justify-center">
                        <div className="absolute w-3 h-0.5" style={{ backgroundColor: s.color, opacity: 0.5 }}></div>
                        <div className="absolute w-1.5 h-1.5 bg-white border" style={{ borderColor: s.color }}></div>
                    </div>
                    {s.name}
                </div>
            ))}
        </div>
      )}
      
      <div className="relative w-full aspect-[21/9] bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden group/chart">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Gradients */}
            <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                </linearGradient>
            </defs>

            {/* Grid Lines & Y-Axis Labels */}
            {[40, 60, 80, 100].map(tick => (
                <g key={tick}>
                    <line 
                        x1={padding.left} 
                        y1={getY(tick)} 
                        x2={width - padding.right} 
                        y2={getY(tick)} 
                        stroke="#f5f5f4" 
                        strokeWidth="1" 
                    />
                    <text 
                        x={padding.left - 10} 
                        y={getY(tick) + 4} 
                        textAnchor="end" 
                        className="text-[10px] fill-stone-400 font-mono"
                    >
                        {tick}
                    </text>
                </g>
            ))}

            {/* Area Fill (Only for primary) */}
            <path 
                d={areaPath} 
                fill="url(#chartGradient)" 
            />

            {/* Comparison Lines & Markers */}
            {comparisonSeries.map((series, sIdx) => {
                 const compPoints = series.data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
                 // Alternating stroke styles for better distinction
                 const strokeDash = sIdx % 2 === 0 ? "6,4" : "2,4";
                 return (
                    <g key={series.id}>
                        <path 
                            d={`M ${compPoints}`} 
                            fill="none" 
                            stroke={series.color}
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            strokeDasharray={strokeDash}
                            className="opacity-70"
                        />
                        {series.data.map((d, i) => (
                            <g key={i} className="group/comp">
                                {/* Invisible hit area */}
                                <circle cx={getX(i)} cy={getY(d.score)} r="8" fill="transparent" />
                                
                                {/* Square Marker for Comparison */}
                                <rect 
                                    x={getX(i) - 2.5} 
                                    y={getY(d.score) - 2.5} 
                                    width="5" 
                                    height="5" 
                                    fill="white" 
                                    stroke={series.color} 
                                    strokeWidth="1.5"
                                    className="transition-transform group-hover/comp:scale-150 origin-center"
                                />
                                <title>{`${series.name} (${d.date}): ${d.score}`}</title>
                            </g>
                        ))}
                    </g>
                 );
            })}

            {/* Primary Trend Line */}
            <path 
                d={`M ${points}`} 
                fill="none" 
                stroke="#16a34a" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="drop-shadow-sm"
            />

            {/* Primary Data Points & Tooltips (Rendered last to be on top) */}
            {data.map((d, i) => (
                <g key={i} className="group/point cursor-pointer">
                    {/* Invisible hit area for easier hovering */}
                    <circle cx={getX(i)} cy={getY(d.score)} r="20" fill="transparent" />
                    
                    {/* Visible Point - Circular for Primary */}
                    <circle 
                        cx={getX(i)} 
                        cy={getY(d.score)} 
                        r="4" 
                        fill="white" 
                        stroke="#15803d" 
                        strokeWidth="2" 
                        className="transition-all duration-300 group-hover/point:r-6 group-hover/point:stroke-agri-400"
                    />

                    {/* X-Axis Date Label */}
                    <text 
                        x={getX(i)} 
                        y={height - 15} 
                        textAnchor="middle" 
                        className={`text-[11px] font-medium transition-colors duration-200
                            ${i === data.length - 1 ? 'fill-stone-800 font-bold' : 'fill-stone-400 group-hover/point:fill-agri-700'}`}
                    >
                        {d.date}
                    </text>

                    {/* Enhanced Tooltip */}
                    <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                        <g transform={`translate(${getX(i)}, ${getY(d.score) - 12})`}>
                            {/* Background Box */}
                            <rect x="-45" y="-50" width="90" height="42" rx="6" fill="#1c1917" className="shadow-xl" />
                            <path d="M -6 -8 L 0 -2 L 6 -8 Z" fill="#1c1917" />
                            
                            <text x="0" y="-32" textAnchor="middle" fill="#a8a29e" fontSize="10" fontWeight="500">
                                {d.date}
                            </text>
                             <text x="0" y="-18" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                                Index: {d.score}
                            </text>
                        </g>
                    </g>
                </g>
            ))}
        </svg>
      </div>
    </div>
  );
};

export default TrendChart;
