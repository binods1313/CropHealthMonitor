
import React, { useState, useMemo } from 'react';
import { SavedReport } from '../types';

interface SavedReportsModalProps {
  reports: SavedReport[];
  onLoad: (report: SavedReport) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const SavedReportsModal: React.FC<SavedReportsModalProps> = ({ reports, onLoad, onDelete, onClose }) => {
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const d = new Date(r.dateSaved).getTime();
      const start = filterStart ? new Date(filterStart).getTime() : 0;
      const end = filterEnd ? new Date(filterEnd).getTime() + 86400000 : Infinity; // Add 1 day to include end date
      return d >= start && d < end;
    });
  }, [reports, filterStart, filterEnd]);

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-agri-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analysis History
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="px-6 py-3 bg-white border-b border-stone-100 flex gap-3 text-sm">
           <div className="flex-1">
             <label htmlFor="history-start-date" className="block text-xs text-stone-400 mb-1">From</label>
             <input 
                id="history-start-date"
                name="history-start-date"
                type="date" 
                value={filterStart} 
                onChange={e => setFilterStart(e.target.value)} 
                className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-stone-700"
             />
           </div>
           <div className="flex-1">
             <label htmlFor="history-end-date" className="block text-xs text-stone-400 mb-1">To</label>
             <input 
                id="history-end-date"
                name="history-end-date"
                type="date" 
                value={filterEnd} 
                onChange={e => setFilterEnd(e.target.value)} 
                className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-stone-700"
             />
           </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 bg-stone-50/50 flex-1">
          {filteredReports.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No reports found in this period.</p>
            </div>
          ) : (
            filteredReports.map((item) => (
              <div key={item.id} className="bg-white border border-stone-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-stone-800 text-sm">{item.farmName}</h4>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                            <span>{item.crop}</span>
                            <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                            <span>{new Date(item.dateSaved).toLocaleDateString()}</span>
                        </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold
                        ${item.report.overall_health_score > 70 ? 'bg-green-100 text-green-700' : 
                          item.report.overall_health_score > 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        Score: {item.report.overall_health_score}
                    </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                    <button 
                        onClick={() => onLoad(item)}
                        className="flex-1 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                    >
                        Load Analysis
                    </button>
                    <button 
                        onClick={() => onDelete(item.id)}
                        className="px-3 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors"
                        title="Delete Report"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedReportsModal;
