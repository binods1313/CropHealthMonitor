
import React from 'react';
import { Settings, Palette, Check, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { accentColor, setAccentColor, colors } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Settings size={18} className="text-white/40" />
            <h2 className="text-white font-medium text-base tracking-tight">Configuration</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-white/90">
              <Palette size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold">Appearance Theme</h3>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.hex)}
                  className={`relative aspect-square rounded-full transition-all duration-300 transform active:scale-90
                    ${accentColor === color.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111827]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color.hex }}
                >
                  {accentColor === color.hex && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <Check size={14} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 font-medium pt-1">
              Select an accent color for the application.
            </p>
          </section>

          <hr className="border-white/5" />

          <div className="bg-[#1a202c] rounded-lg p-5 border border-white/5 space-y-3">
            <p className="text-xs text-white/50 leading-relaxed">
              Note: API Key is managed via environment variables.
            </p>
            <p className="text-xs text-white/50 leading-relaxed">
              If no key is detected, the application runs in Simulation Mode with synthetic data.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3.5 bg-[#1f2937] hover:bg-[#374151] text-white text-sm font-semibold rounded-lg transition-all border border-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
