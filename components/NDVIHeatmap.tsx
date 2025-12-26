
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NDVI_STATS } from '../constants';
import { useTheme } from '../ThemeContext';

interface NDVIHeatmapProps {
  data: number[][];
  className?: string;
}

const COLORS = {
  SOIL:     { r: 139, g: 69,  b: 19 }, 
  CRITICAL: { r: 239, g: 68,  b: 68 }, 
  STRESSED: { r: 234, g: 179, b: 8  }, 
  HEALTHY:  { r: 34,  g: 197, b: 94 }, 
  LUSH:     { r: 20,  g: 83,  b: 45 }  
};

const COLOR_STOPS = [
  { val: 0.0, color: COLORS.SOIL, label: 'Soil' },
  { val: 0.25, color: COLORS.CRITICAL, label: 'Critical' },
  { val: 0.50, color: COLORS.STRESSED, label: 'Stressed' },
  { val: 0.75, color: COLORS.HEALTHY, label: 'Healthy' },
  { val: 1.0, color: COLORS.LUSH, label: 'Lush' }
];

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const lerpColor = (c1: typeof COLORS.SOIL, c2: typeof COLORS.SOIL, t: number) => {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t))
  };
};

const getInterpolatedColor = (ndvi: number) => {
  const val = Math.max(0, Math.min(1, ndvi));
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const start = COLOR_STOPS[i];
    const end = COLOR_STOPS[i+1];
    if (val >= start.val && val <= end.val) {
      const t = (val - start.val) / (end.val - start.val);
      const c = lerpColor(start.color, end.color, t);
      return `rgb(${c.r},${c.g},${c.b})`;
    }
  }
  const last = COLOR_STOPS[COLOR_STOPS.length - 1].color;
  return `rgb(${last.r},${last.g},${last.b})`;
};

const NDVIHeatmap: React.FC<NDVIHeatmapProps> = ({ data, className }) => {
  const { accentColor } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number, value: number, screenX: number, screenY: number } | null>(null);
  
  const lastPos = useRef({ x: 0, y: 0 });
  const baseWidth = 800;
  const baseHeight = 800;

  const statsInView = useMemo(() => {
    if (!data.length || !data[0].length) return { min: 0, max: 0 };
    const rows = data.length;
    const cols = data[0].length;
    const visibleXStart = Math.max(0, Math.floor((-transform.x / transform.k) / (baseWidth / cols)));
    const visibleXEnd = Math.min(cols - 1, Math.ceil(((baseWidth - transform.x) / transform.k) / (baseWidth / cols)));
    const visibleYStart = Math.max(0, Math.floor((-transform.y / transform.k) / (baseHeight / rows)));
    const visibleYEnd = Math.min(rows - 1, Math.ceil(((baseHeight - transform.y) / transform.k) / (baseHeight / rows)));
    let min = 1; let max = -1;
    for (let y = visibleYStart; y <= visibleYEnd; y++) {
      for (let x = visibleXStart; x <= visibleXEnd; x++) {
        const val = data[y][x];
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
    return { min, max };
  }, [data, transform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    const rows = data.length;
    const cols = data[0].length;
    const cellW = baseWidth / cols;
    const cellH = baseHeight / rows;
    let totalNDVI = 0; let count = 0;
    for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { totalNDVI += data[r][c]; count++; } }
    const avgNDVI = count > 0 ? totalNDVI / count : 0;
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, baseWidth, baseHeight);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);
    ctx.imageSmoothingEnabled = false; 
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ndvi = data[y][x];
        ctx.fillStyle = getInterpolatedColor(ndvi);
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.4, cellH + 0.4);
      }
    }
    const ambientT = Math.max(0, Math.min(1, (avgNDVI - 0.2) / 0.6));
    const ambientR = lerp(180, 255, ambientT);
    const ambientG = lerp(200, 240, ambientT);
    const ambientB = lerp(220, 200, ambientT);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(${ambientR}, ${ambientG}, ${ambientB}, 0.25)`;
    ctx.fillRect(0, 0, baseWidth, baseHeight);
    ctx.restore();
  }, [data, transform]);

  const clampTransform = (x: number, y: number, k: number) => {
    const minX = baseWidth * (1 - k);
    const minY = baseHeight * (1 - k);
    return { k, x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    if (isDragging) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTransform(prev => {
        const scaleFactor = baseWidth / rect.width; 
        return clampTransform(prev.x + dx * scaleFactor, prev.y + dy * scaleFactor, prev.k);
      });
      setHoveredCell(null);
    } else {
      const rows = data.length;
      const cols = data[0].length;
      const internalX = (screenX / rect.width) * baseWidth;
      const internalY = (screenY / rect.height) * baseHeight;
      const gridX = Math.floor((internalX - transform.x) / transform.k / (baseWidth / cols));
      const gridY = Math.floor((internalY - transform.y) / transform.k / (baseHeight / rows));
      if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols) {
        setHoveredCell({ x: gridX, y: gridY, value: data[gridY][gridX], screenX, screenY });
      } else {
        setHoveredCell(null);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomIntensity = 0.001; 
    const delta = -e.deltaY;
    const factor = Math.exp(delta * zoomIntensity);
    setTransform(prev => {
      let newK = prev.k * factor;
      newK = Math.max(1, Math.min(8, newK));
      const rect = canvasRef.current!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = (px / rect.width) * baseWidth;
      const cy = (py / rect.height) * baseHeight;
      const newX = cx - (cx - prev.x) * (newK / prev.k);
      const newY = cy - (cy - prev.y) * (newK / prev.k);
      return clampTransform(newX, newY, newK);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    setHoveredCell(null);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ndvi-heatmap-${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-xl shadow-2xl border border-stone-200 bg-stone-900 group ${className}`}>
      <canvas 
        ref={canvasRef} 
        className={`w-full h-full object-cover touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setHoveredCell(null); }}
      />

      {hoveredCell && (
        <div 
          className="absolute pointer-events-none z-50 animate-scale-in"
          style={{ left: hoveredCell.screenX + 15, top: hoveredCell.screenY - 45 }}
        >
          <div className="bg-stone-900/90 backdrop-blur-md text-white border-2 p-2.5 rounded-xl shadow-2xl min-w-[140px]" style={{ borderColor: getInterpolatedColor(hoveredCell.value) }}>
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">L2 Precision NDVI</span>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getInterpolatedColor(hoveredCell.value) }}></div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: getInterpolatedColor(hoveredCell.value) }}>
                {hoveredCell.value.toFixed(4)}
              </span>
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Index</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[9px] font-bold text-stone-400">
              <span className="uppercase tracking-tighter">Coord: {hoveredCell.x}, {hoveredCell.y}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono uppercase">Verified</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <div className="bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none select-none border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Precision Sensor Network (Active)
        </div>
        {transform.k > 1 && <div className="bg-emerald-600/80 text-white text-[9px] px-2 py-1 rounded-md backdrop-blur-sm border border-emerald-400 font-bold self-start animate-fade-in">MAGNIFICATION: {transform.k.toFixed(1)}x</div>}
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={handleDownload} className="bg-white hover:bg-stone-100 text-stone-700 p-2.5 rounded-xl shadow-xl border border-stone-200 transition-all active:scale-95" title="Export Frame">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
      </div>

      <div className="absolute bottom-6 right-6 z-20 w-16 md:w-20 group/legend">
          <div className="bg-stone-900/80 backdrop-blur-lg rounded-2xl p-3 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-black text-white/50 tracking-tighter">NDVI</span>
                <div className="relative h-48 w-4 rounded-full overflow-hidden flex flex-col-reverse shadow-inner bg-black/40">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#8b4513] via-[#ef4444] via-[#eab308] via-[#22c55e] to-[#14532d]"></div>
                    <div className="absolute w-full bg-white/40 border-y border-white transition-all duration-500" style={{ bottom: `${Math.max(0, statsInView.min * 100)}%`, height: `${Math.max(2, (statsInView.max - statsInView.min) * 100)}%` }}>
                        <div className="absolute -left-1 -top-1 w-6 h-0.5 bg-white shadow-sm"></div>
                        <div className="absolute -left-1 -bottom-1 w-6 h-0.5 bg-white shadow-sm"></div>
                    </div>
                </div>
                <div className="flex flex-col justify-between h-48 py-1"><span className="text-[10px] font-black text-white">1.0</span><span className="text-[10px] font-black text-white/40">0.5</span><span className="text-[10px] font-black text-white">0.0</span></div>
            </div>
            <div className="absolute inset-0 opacity-0 group-hover/legend:opacity-100 transition-opacity bg-stone-900/90 flex items-center justify-center p-2 text-center pointer-events-none"><div className="space-y-1"><p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Active Frame</p><p className="text-[10px] font-bold text-white leading-none">Min: {statsInView.min.toFixed(2)}</p><p className="text-[10px] font-bold text-white leading-none">Max: {statsInView.max.toFixed(2)}</p></div></div>
          </div>
          <div className="mt-2 text-center"><span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Scientific Scale</span></div>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none transition-opacity duration-500 group-hover:opacity-0"><p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-stone-900/40 backdrop-blur-sm px-2 py-1 rounded">Scroll to zoom • Drag to pan</p></div>
    </div>
  );
};

export default NDVIHeatmap;
