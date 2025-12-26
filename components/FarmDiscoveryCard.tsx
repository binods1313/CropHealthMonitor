
import React from 'react';
import { FarmData } from '../types';
import { generateFallbackImageUrl } from '../constants';

interface FarmDiscoveryCardProps {
  farm: FarmData;
  isSelected: boolean;
  onSelect: (farm: FarmData) => void;
}

const FarmDiscoveryCard: React.FC<FarmDiscoveryCardProps> = ({ farm, isSelected, onSelect }) => {
  // Generate a predictable mock NDVI score for visual display
  const mockNDVI = (0.5 + (farm.name.length % 5) * 0.1).toFixed(2);
  const isHealthy = parseFloat(mockNDVI) > 0.6;

  return (
    <div 
      className={`relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer group bg-white
        ${isSelected 
          ? 'border-agri-600 ring-2 ring-agri-500 ring-offset-2 shadow-lg transform scale-[1.02]' 
          : 'border-stone-200 hover:border-agri-300 hover:shadow-md'}
      `}
      onClick={() => onSelect(farm)}
    >
      <div className="relative h-28 w-full bg-stone-100 overflow-hidden">
        <img 
          src={farm.imageUrl} 
          alt={farm.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = generateFallbackImageUrl(farm.lat, farm.lon, farm.crop);
          }}
        />
        
        {/* Selected Overlay & Badge */}
        {isSelected && (
            <div className="absolute inset-0 bg-agri-900/10 z-10 transition-opacity">
                <div className="absolute top-2 left-2 bg-agri-600 text-white rounded-full p-1.5 shadow-lg border-2 border-white animate-fade-in-up">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
        )}

        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium z-20">
          {farm.sizeHa} ha
        </div>
      </div>
      
      <div className="p-3">
        <h4 className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-agri-700' : 'text-stone-800'}`} title={farm.name}>
            {farm.name}
        </h4>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded">{farm.crop}</span>
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-stone-600 font-mono">NDVI {mockNDVI}</span>
          </div>
        </div>
        
        <button 
          className={`mt-3 w-full py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5
            ${isSelected 
              ? 'bg-agri-600 text-white shadow-sm ring-1 ring-agri-600' 
              : 'bg-stone-50 text-stone-600 hover:bg-agri-50 hover:text-agri-700'}
          `}
        >
          {isSelected ? (
            <>
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Selected
            </>
          ) : (
            'Select Farm'
          )}
        </button>
      </div>
    </div>
  );
};

export default FarmDiscoveryCard;
