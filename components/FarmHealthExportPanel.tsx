
import React from 'react';
import { FarmHealthAnalysis } from '../types/FarmHealthAnalysis';
import { 
  generateFarmHealthPDF, 
  exportFarmHealthToCSV,
  exportFarmHealthToJSON,
  exportFarmHealthToExcel 
} from '../utils/farmHealthReportExport';

interface Props {
  data: FarmHealthAnalysis;
}

export const FarmHealthExportPanel: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Analysis Report
        </h3>
        <span className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded">
            ID: {data.reportId}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => generateFarmHealthPDF(data)}
          className="flex flex-col items-center justify-center gap-2 px-4 py-4 
                     bg-green-600 hover:bg-green-700 text-white rounded-lg 
                     transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="font-bold text-sm">PDF Report</span>
        </button>
        
        <button 
          onClick={() => exportFarmHealthToExcel(data)}
          className="flex flex-col items-center justify-center gap-2 px-4 py-4 
                     bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg 
                     transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="font-bold text-sm">Excel</span>
        </button>

        <button 
          onClick={() => exportFarmHealthToCSV(data)}
          className="flex flex-col items-center justify-center gap-2 px-4 py-4 
                     bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                     transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <span className="font-bold text-sm">CSV Data</span>
        </button>
        
        <button 
          onClick={() => exportFarmHealthToJSON(data)}
          className="flex flex-col items-center justify-center gap-2 px-4 py-4 
                     bg-purple-600 hover:bg-purple-700 text-white rounded-lg 
                     transition-all duration-200 shadow-sm hover:shadow-md group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span className="font-bold text-sm">JSON API</span>
        </button>
      </div>
      <p className="text-xs text-stone-400 mt-4 text-center">
        Formats include full diagnostic data, imagery references, and intervention plans.
      </p>
    </div>
  );
};
