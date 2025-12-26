import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, useMap, Tooltip, Marker, Popup, ZoomControl } from 'react-leaflet';
import FallbackTileLayer from './FallbackTileLayer';
import L from 'leaflet';
import { FarmData } from '../types';
import { Search, Filter, Calendar, X, ChevronDown, MapPin, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';


interface FarmMapProps {
  farms: FarmData[];
  activeFarmId: string;
  onSelectFarm: (farm: FarmData) => void;
  className?: string;
}

// --- Icons & Helpers ---

const createFarmIcon = (status: 'healthy' | 'warning' | 'critical', isSelected: boolean) => {
  const colorHex = status === 'healthy' ? '#22c55e' : status === 'warning' ? '#eab308' : '#ef4444';
  const size = isSelected ? 24 : 16;
  const pulseClass = status === 'critical' ? 'animate-marker-pulse' : '';
  const selectedClass = isSelected ? 'ring-4 ring-white shadow-[0_0_20px_rgba(59,130,246,0.8)] scale-125 z-[1000]' : 'ring-2 ring-white shadow-md';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${(status === 'critical' || isSelected) ? `<div class="absolute w-full h-full rounded-full ${isSelected ? 'bg-blue-400' : 'bg-red-500'} opacity-75 animate-ping"></div>` : ''}
        <div 
          class="rounded-full transition-all duration-500 ${pulseClass} ${selectedClass}" 
          style="width: ${size}px; height: ${size}px; background-color: ${isSelected ? '#3b82f6' : colorHex};"
        ></div>
      </div>
    `,
    iconSize: [size * 2, size * 2],
    iconAnchor: [size, size],
    popupAnchor: [0, -size]
  });
};

const isValidLatLng = (lat: any, lon: any): boolean => {
  if (lat === null || lon === null || lat === undefined || lon === undefined) return false;
  const latNum = parseFloat(String(lat));
  const lonNum = parseFloat(String(lon));
  return !Number.isNaN(latNum) && !Number.isNaN(lonNum) && Math.abs(latNum) <= 90 && Math.abs(lonNum) <= 180;
};

// --- Sub-Components ---

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && isValidLatLng(center[0], center[1])) {
      try {
        map.flyTo(L.latLng(center[0], center[1]), 15, { duration: 1.5 });
      } catch (e) { /* ignore */ }
    }
  }, [center, map]);
  return null;
};

const PopupContent: React.FC<{ farm: FarmData; activeFarmId: string; onSelect: (f: FarmData) => void }> = ({ farm, activeFarmId, onSelect }) => (
  <div className="text-center min-w-[180px] font-sans p-1">
    <h3 className="font-bold text-stone-800 text-sm mb-2 border-b border-stone-100 pb-2">{farm.name}</h3>
    <div className="text-xs text-stone-600 space-y-2 mb-4 text-left">
      <div className="flex justify-between items-center">
        <span className="text-stone-400 font-medium">Crop:</span>
        <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">{farm.crop}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-stone-400 font-medium">Area:</span>
        <span className="font-bold text-stone-900">{farm.sizeHa} Ha</span>
      </div>
      <div className="flex justify-between items-center border-t border-stone-50 pt-1 mt-1">
        <span className="text-stone-400 font-medium">Coord:</span>
        <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-50 px-1 py-0.5 rounded">
          {farm.lat.toFixed(4)}, {farm.lon.toFixed(4)}
        </span>
      </div>
    </div>
    <button
      onClick={() => onSelect(farm)}
      className={`w-full py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2
                ${farm.id === activeFarmId
          ? 'bg-stone-100 text-stone-400 cursor-default border border-stone-200'
          : 'bg-agri-600 hover:bg-agri-700 text-white active:scale-95'}`}
      disabled={farm.id === activeFarmId}
    >
      {farm.id === activeFarmId ? <><CheckCircle size={14} className="text-green-500" /> Active</> : 'Analyze Module'}
    </button>
  </div>
);

const HoverTooltip: React.FC<{ farm: FarmData }> = ({ farm }) => {
  const isCritical = (farm.maxWindSpeed && farm.weather.windSpeed * 3.6 > farm.maxWindSpeed) || (farm.weather.soilMoisture < 20);
  const mockNDVI = (0.5 + (farm.name.length % 5) * 0.1).toFixed(2);

  return (
    <div className="p-2 space-y-1">
      <p className="font-black text-stone-900 uppercase text-[10px] tracking-widest">{farm.name}</p>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-[10px] font-bold text-stone-500">NDVI: <span className="text-stone-900 font-mono">{mockNDVI}</span></span>
      </div>
      <p className="text-[8px] font-black text-stone-400 uppercase tracking-tighter italic">Click to focus sensor mesh</p>
    </div>
  );
};

const FarmMarkers: React.FC<{ farms: FarmData[]; activeFarmId: string; onSelectFarm: (f: FarmData) => void }> = ({ farms, activeFarmId, onSelectFarm }) => {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore
    if (!L.markerClusterGroup) return;

    // @ts-ignore
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: function (cluster: any) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="bg-stone-900 text-white font-black rounded-full w-10 h-10 flex items-center justify-center border-2 border-white shadow-2xl scale-100 hover:scale-110 transition-transform">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [40, 40]
        });
      }
    });
    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      if (clusterGroupRef.current) map.removeLayer(clusterGroupRef.current);
    };
  }, [map]);

  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    farms.forEach(farm => {
      if (!isValidLatLng(farm.lat, farm.lon)) return;

      const isCritical = (farm.maxWindSpeed && farm.weather.windSpeed * 3.6 > farm.maxWindSpeed) || (farm.weather.soilMoisture < 20);
      const isWarning = (farm.weather.soilMoisture < 35 && !isCritical) || (farm.name.length % 5 === 0);
      const status = isCritical ? 'critical' : isWarning ? 'warning' : 'healthy';
      const isSelected = farm.id === activeFarmId;

      try {
        const marker = L.marker([farm.lat, farm.lon], {
          icon: createFarmIcon(status, isSelected),
          zIndexOffset: isSelected ? 1000 : 0
        });

        const popupNode = document.createElement('div');
        const root = createRoot(popupNode);
        root.render(<PopupContent farm={farm} activeFarmId={activeFarmId} onSelect={(f) => { onSelectFarm(f); map.closePopup(); }} />);

        marker.bindPopup(popupNode, { className: 'tactical-popup', maxWidth: 250 });

        const tooltipNode = document.createElement('div');
        createRoot(tooltipNode).render(<HoverTooltip farm={farm} />);
        marker.bindTooltip(tooltipNode, { direction: 'top', offset: [0, -10], className: 'tactical-tooltip' });

        marker.on('click', () => {
          onSelectFarm(farm);
        });

        clusterGroup.addLayer(marker);
      } catch (e) {
        console.warn(`Skipping marker for ${farm.name}`);
      }
    });

  }, [farms, activeFarmId, onSelectFarm, map]);

  return null;
};

// --- Main Component ---

const FarmMap: React.FC<FarmMapProps> = ({ farms = [], activeFarmId, onSelectFarm, className, filterCrop, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const safeFarms = Array.isArray(farms) ? farms : [];

  const cropOptions = [
    'CROP ALL',
    'ALMOND',
    'AVOCADO',
    'CARDAMOM',
    'GRAPES',
    'GRASS (PASTURE)',
    'MIXED VEGETABLES',
    'OATS',
    'WHEAT'
  ];

  const displayedFarms = useMemo(() => {
    return safeFarms.filter(f => {
      const lowerSearch = searchTerm.toLowerCase();
      if (searchTerm && !f.name.toLowerCase().includes(lowerSearch) && !f.location.toLowerCase().includes(lowerSearch)) {
        return false;
      }
      if (filterCrop !== 'CROP ALL' && f.crop.toUpperCase() !== filterCrop.toUpperCase()) return false;
      return true;
    });
  }, [safeFarms, searchTerm, filterCrop]);

  const stats = useMemo(() => {
    return displayedFarms.reduce((acc, farm) => {
      const isCritical = (farm.maxWindSpeed && farm.weather.windSpeed * 3.6 > farm.maxWindSpeed) || (farm.weather.soilMoisture < 20);
      const isWarning = (farm.weather.soilMoisture < 35 && !isCritical) || (farm.name.length % 5 === 0);
      if (isCritical) acc.critical++;
      else if (isWarning) acc.warning++;
      else acc.healthy++;
      return acc;
    }, { healthy: 0, warning: 0, critical: 0 });
  }, [displayedFarms]);

  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);

  useEffect(() => {
    console.log('=== MAP INTERACTION DEBUG ===');
    console.log('Farms loaded:', farms.length);
    console.log('Active farm:', activeFarmId);

    // Check for pointer-events conflicts in the DOM
    const mapElement = document.querySelector('.leaflet-container');
    if (mapElement) {
      const computedStyle = window.getComputedStyle(mapElement);
      console.log('Map pointer-events:', computedStyle.pointerEvents);
    }
  }, [farms, activeFarmId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setSearchMarker([parseFloat(lat), parseFloat(lon)]);
      } else {
        setSearchError('Location not found');
        setTimeout(() => setSearchError(null), 3000);
      }
    } catch (err) {
      setSearchError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const center = useMemo((): [number, number] => {
    if (searchMarker) return searchMarker;
    const activeFarm = safeFarms.find(f => f.id === activeFarmId);
    if (activeFarm && isValidLatLng(activeFarm.lat, activeFarm.lon)) {
      return [activeFarm.lat, activeFarm.lon];
    }
    const first = safeFarms.find(f => isValidLatLng(f.lat, f.lon));
    return first ? [first.lat, first.lon] : [20.5937, 78.9620];
  }, [safeFarms, activeFarmId, searchMarker]);

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-inner border border-stone-200 z-0 bg-stone-100 ${className}`}>

      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col sm:flex-row gap-3 pointer-events-none">
        <form className="pointer-events-auto w-full sm:w-80" onSubmit={handleSearch}>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 flex items-center px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-agri-400 relative">
            {isSearching ? <div className="w-4 h-4 border-2 border-agri-500 border-t-transparent rounded-full animate-spin mr-2" /> : <Search size={16} className="text-stone-400 mr-2 shrink-0" />}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a location..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-700 font-bold placeholder-stone-400"
              onKeyDown={(e) => e.stopPropagation()}
            />
            {searchError && (
              <div className="absolute top-full left-0 mt-2 bg-red-500 text-white text-[10px] px-3 py-1 rounded-lg font-black uppercase shadow-lg z-[500] animate-scale-in">
                {searchError}
              </div>
            )}
            {searchTerm && !isSearching && <button type="button" onClick={() => setSearchTerm('')} className="text-stone-300 hover:text-red-500 pointer-events-auto"><X size={14} strokeWidth={3} /></button>}
          </div>
        </form>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <div className="relative shrink-0">
            <select
              value={filterCrop}
              onChange={(e) => onFilterChange(e.target.value)}
              className="appearance-none bg-white/95 backdrop-blur-md shadow-lg border border-stone-200 text-[10px] font-black uppercase tracking-widest rounded-xl pl-8 pr-8 py-2.5 text-stone-600 hover:border-agri-500 transition-colors cursor-pointer outline-none"
            >
              {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border transition-all
                    ${isLegendOpen ? 'bg-stone-900 text-white border-stone-800' : 'bg-white/95 border-stone-200 text-stone-600 hover:bg-stone-50'}`}
          >
            <Info size={12} /> Legend
          </button>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
        zoomSnap={1}
        zoomDelta={1}
        trackResize={true}
        className="w-full h-full"
        zoomControl={false}
        whenReady={() => {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 500);
        }}
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />
        <TileLayer
          attribution='&copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />
        <MapUpdater center={center} />
        <FarmMarkers farms={displayedFarms} activeFarmId={activeFarmId} onSelectFarm={onSelectFarm} />

        {searchMarker && (
          <Marker position={searchMarker} icon={L.divIcon({
            className: 'custom-search-marker',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
                <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl relative z-10"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })}>
            <Popup className="tactical-popup">
              <div className="p-2">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Search Result</p>
                <p className="text-xs font-bold text-stone-900 mb-1">{searchTerm}</p>
                <p className="text-[9px] font-mono text-stone-400 bg-stone-50 px-1 py-0.5 rounded inline-block">
                  {searchMarker[0].toFixed(4)}, {searchMarker[1].toFixed(4)}
                </p>
                <div className="mt-3 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setSearchMarker(null)}
                    className="mt-2 text-[8px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Clear Marker
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}


      </MapContainer>

      {isLegendOpen && (
        <div className="absolute bottom-6 left-6 z-[500] animate-scale-in">
          <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-stone-200 min-w-[220px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Node Status Map</span>
              <button onClick={() => setIsLegendOpen(false)} className="text-stone-400 hover:text-stone-900 transition-colors"><X size={14} strokeWidth={3} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] border-2 border-white"></div>
                  <span className="text-xs font-bold text-stone-600">Healthy</span>
                </div>
                <span className="text-[10px] font-black text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">{stats.healthy}</span>
              </div>
              <div className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)] border-2 border-white"></div>
                  <span className="text-xs font-bold text-stone-600">Warning</span>
                </div>
                <span className="text-[10px] font-black text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">{stats.warning}</span>
              </div>
              <div className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-5 h-5 rounded-full bg-red-500/30 animate-ping"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] border-2 border-white relative z-10"></div>
                  </div>
                  <span className="text-xs font-bold text-stone-600">Critical</span>
                </div>
                <span className="text-[10px] font-black text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">{stats.critical}</span>
              </div>
              <div className="pt-3 border-t border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xl relative z-10"></div>
                  </div>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-tighter italic">Active Selection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-[400] pointer-events-none">
        <div className="pointer-events-auto bg-stone-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-white border border-white/10 shadow-2xl flex items-center gap-3">
          <div className="flex flex-col items-start px-2">
            <span className="text-white/40 text-[8px] tracking-[0.2em] mb-0.5">Surveillance Active</span>
            <span>0/{safeFarms.length} Site Nodes Synced</span>
          </div>
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          <div className="flex items-center gap-2 px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <span className="text-emerald-400 italic">Linked</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 bg-stone-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-white z-[400] pointer-events-none border border-white/10 shadow-2xl flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-white/40 text-[8px] tracking-[0.2em] mb-0.5">Focus Module</span>
          <span>{displayedFarms.length} / {safeFarms.length} Active Nodes</span>
        </div>
      </div>

      <style>{`
        .custom-div-icon { background: none; border: none; }
        .animate-marker-pulse { animation: marker-pulse 2s ease-in-out infinite; }
        @keyframes marker-pulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.15); filter: brightness(1.2); } }
        .tactical-popup .leaflet-popup-content-wrapper { background: rgba(255, 255, 255, 0.98); border-radius: 1.25rem; padding: 8px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid rgba(0, 0, 0, 0.05); }
        .tactical-tooltip { background: rgba(255, 255, 255, 0.95); border: 2px solid rgba(0,0,0,0.05); border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 0; }
        .tactical-tooltip::before { border-top-color: rgba(255, 255, 255, 0.95); }
        /* Ensure zoom controls are clickable and premium styled */
        .leaflet-control-zoom { border: none !important; margin-top: 100px !important; margin-right: 20px !important; }
        .leaflet-control-zoom a { 
          background: rgba(255, 255, 255, 0.95) !important; 
          color: #1c1917 !important; 
          border: 1px solid rgba(0,0,0,0.1) !important; 
          border-radius: 12px !important; 
          margin-bottom: 4px !important;
          font-weight: 900 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        .leaflet-control-zoom a:hover { background: white !important; scale: 1.05; }
        .leaflet-container { pointer-events: auto !important; }
      `}</style>
    </div>
  );
};

export default FarmMap;