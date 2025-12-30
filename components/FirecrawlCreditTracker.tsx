import React from 'react';
import { firecrawlService } from '../services/firecrawlService';

const FirecrawlCreditTracker: React.FC = () => {
  const creditUsage = firecrawlService.getCreditUsage();
  
  // Calculate percentage used
  const percentageUsed = Math.round((creditUsage.total / 600) * 100);
  
  // Determine color based on usage
  const getUsageColor = () => {
    if (percentageUsed >= 90) return 'text-red-500';
    if (percentageUsed >= 75) return 'text-amber-500';
    return 'text-emerald-500';
  };
  
  // Determine bar color based on usage
  const getBarColor = () => {
    if (percentageUsed >= 90) return '#ef4444'; // red-500
    if (percentageUsed >= 75) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  // Format the last reset date
  const lastResetDate = new Date(creditUsage.lastReset).toLocaleDateString();

  return (
    <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 p-6">
      <h3 className="text-lg font-black text-stone-900 tracking-tight mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Firecrawl Credit Tracker
      </h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-stone-600">Credits Used This Month</span>
            <span className={`text-sm font-black ${getUsageColor()}`}>
              {creditUsage.total}/600
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full" 
              style={{ 
                width: `${Math.min(percentageUsed, 100)}%`, 
                backgroundColor: getBarColor() 
              }}
            ></div>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            {percentageUsed >= 80 
              ? "Approaching monthly limit" 
              : `Monthly reset: ${lastResetDate}`}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Agent</p>
            <p className="text-lg font-black text-stone-900">{creditUsage.agent}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Crawl</p>
            <p className="text-lg font-black text-stone-900">{creditUsage.crawl}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Search</p>
            <p className="text-lg font-black text-stone-900">{creditUsage.search}</p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Scrape</p>
            <p className="text-lg font-black text-stone-900">{creditUsage.scrape}</p>
          </div>
        </div>
        
        <div className="pt-3 border-t border-stone-100">
          <p className="text-xs text-stone-500">
            <span className="font-bold">Est. Remaining:</span> {600 - creditUsage.total} credits
          </p>
          <p className="text-xs text-stone-500 mt-1">
            <span className="font-bold">Reset Date:</span> {lastResetDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirecrawlCreditTracker;