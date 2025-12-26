
import React, { useState } from 'react';
import { DisasterAnalysis } from '../services/DisasterReportEnhancement';
import { 
  exportDisasterToPDF, 
  exportDisasterToCSV, 
  exportDisasterToExcel, 
  exportDisasterToJSON 
} from '../utils/disasterReportExport';

interface DisasterExportPanelProps {
  data: DisasterAnalysis;
  satelliteImg?: string | null;
  impactImg?: string | null;
  qrCodeUrl?: string | null;
}

export const DisasterExportPanel: React.FC<DisasterExportPanelProps> = ({ 
  data, 
  satelliteImg, 
  impactImg, 
  qrCodeUrl 
}) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'csv' | 'json' | 'excel') => {
    setLoading(prev => ({ ...prev, [format]: true }));
    setStatusMsg(`Exporting ${format.toUpperCase()}...`);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 500));

      switch (format) {
        case 'pdf':
          exportDisasterToPDF(data, satelliteImg || null, impactImg || null, qrCodeUrl || null);
          break;
        case 'csv':
          exportDisasterToCSV(data);
          break;
        case 'excel':
          exportDisasterToExcel(data);
          break;
        case 'json':
          exportDisasterToJSON(data);
          break;
      }
      setStatusMsg(`✅ ${format.toUpperCase()} Exported Successfully`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      console.error(error);
      setStatusMsg(`❌ Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(prev => ({ ...prev, [format]: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mt-8">
      <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        Export Report Data
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* PDF Button */}
        <button 
          onClick={() => handleExport('pdf')}
          disabled={loading.pdf}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-stone-200 hover:border-red-500 hover:bg-red-50 transition-all group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            {loading.pdf ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            )}
          </div>
          <span className="text-sm font-bold text-stone-700">PDF Report</span>
          <span className="text-[10px] text-stone-400">Complete Document</span>
        </button>

        {/* Excel Button */}
        <button 
          onClick={() => handleExport('excel')}
          disabled={loading.excel}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-stone-200 hover:border-green-500 hover:bg-green-50 transition-all group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
             {loading.excel ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            )}
          </div>
          <span className="text-sm font-bold text-stone-700">Excel</span>
          <span className="text-[10px] text-stone-400">Analysis Spreadsheet</span>
        </button>

        {/* CSV Button */}
        <button 
          onClick={() => handleExport('csv')}
          disabled={loading.csv}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-stone-200 hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
             {loading.csv ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
          </div>
          <span className="text-sm font-bold text-stone-700">CSV</span>
          <span className="text-[10px] text-stone-400">Raw Data Rows</span>
        </button>

        {/* JSON Button */}
        <button 
          onClick={() => handleExport('json')}
          disabled={loading.json}
          className="flex flex-col items-center justify-center p-4 rounded-lg border border-stone-200 hover:border-amber-500 hover:bg-amber-50 transition-all group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
             {loading.json ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            )}
          </div>
          <span className="text-sm font-bold text-stone-700">JSON</span>
          <span className="text-[10px] text-stone-400">API Format</span>
        </button>
      </div>

      {statusMsg && (
        <div className={`mt-4 text-center text-sm font-bold p-2 rounded-lg ${statusMsg.includes('Success') ? 'bg-green-50 text-green-700' : statusMsg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-stone-50 text-stone-600'}`}>
          {statusMsg}
        </div>
      )}
    </div>
  );
};
