
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { DisasterAnalysis } from '../services/DisasterReportEnhancement';
import { exportDisasterToPDF, exportDisasterToExcel, exportDisasterToCSV, exportDisasterToJSON } from '../utils/disasterReportExport';

interface DisasterShareReportProps {
  data: DisasterAnalysis;
  satelliteImg: string | null;
  impactImg: string | null;
  onClose: () => void;
}

const DisasterShareReport: React.FC<DisasterShareReportProps> = ({ data, satelliteImg, impactImg, onClose }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const shareUrl = window.location.href; 

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) { console.error("Copy failed", err); }
  };

  const handleWhatsApp = () => {
    const text = `🚨 *SITUATION REPORT*: ${data.metadata.disasterType.toUpperCase()} in ${data.metadata.location.region}. Severity: ${data.metadata.severity}/10. View full report: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExportPDF = async () => {
      let qrDataUrl = null;
      try {
          qrDataUrl = await QRCode.toDataURL(shareUrl, { margin: 1, width: 256, color: { dark: '#1c1917', light: '#ffffff' } });
      } catch(e) {
          console.warn("QR generation for PDF failed", e);
      }
      exportDisasterToPDF(data, satelliteImg, impactImg, qrDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-stone-50 border-r border-stone-200 flex flex-col p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-600 text-white rounded flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </span>
                Export Report
            </h2>

            <div className="space-y-3 mb-8">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Download Formats</p>
                <button 
                    onClick={handleExportPDF}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                    PDF Document
                </button>
                <button 
                    onClick={() => exportDisasterToExcel(data)}
                    className="w-full py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-medium transition-all text-sm"
                >
                    Excel Workbook
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={() => exportDisasterToCSV(data)}
                        className="flex-1 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-medium transition-all text-sm"
                    >
                        CSV
                    </button>
                    <button 
                        onClick={() => exportDisasterToJSON(data)}
                        className="flex-1 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-medium transition-all text-sm"
                    >
                        JSON
                    </button>
                </div>
            </div>

            <div className="mt-auto">
                <button onClick={onClose} className="w-full py-2 text-stone-500 hover:text-stone-800 transition-colors text-sm">Close Window</button>
            </div>
        </div>

        {/* Main Share Area */}
        <div className="flex-1 p-8 bg-white overflow-y-auto">
            <h2 className="text-xl font-bold text-stone-800 mb-2">Share with Response Teams</h2>
            <p className="text-sm text-stone-500 mb-8">Distribute this situation report to local authorities and stakeholders.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Section */}
                <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-stone-200">
                        <QRCodeSVG value={shareUrl} size={150} fgColor="#7f1d1d" />
                    </div>
                    <p className="text-xs font-bold text-stone-400 mt-4 uppercase">Scan for Mobile Access</p>
                </div>

                {/* Direct Links */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase block mb-2">Report Link</label>
                        <div className="flex gap-2">
                            <input readOnly value={shareUrl} className="flex-1 bg-stone-50 border border-stone-200 rounded px-3 py-2 text-sm text-stone-600 outline-none" />
                            <button 
                                onClick={handleCopyLink}
                                className={`px-4 rounded border transition-colors font-bold text-sm ${copySuccess ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200'}`}
                            >
                                {copySuccess ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-400 uppercase block mb-2">Instant Share</label>
                        <button 
                            onClick={handleWhatsApp}
                            className="w-full py-2 bg-[#25D366] hover:bg-[#1DA851] text-white rounded font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            Share on WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterShareReport;
