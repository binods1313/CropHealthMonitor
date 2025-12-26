
import React from 'react';
import { Twitter, Facebook, Instagram, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const Footer: React.FC = () => {
  const { accentColor } = useTheme();

  return (
    <footer className="relative bg-stone-950 overflow-hidden pt-20">
      {/* Scenic Forest Background Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none select-none overflow-hidden">
        <svg viewBox="0 0 1440 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
          <path d="M0 400V350C100 330 200 370 300 350C400 330 500 280 600 310C700 340 800 380 900 360C1000 340 1100 300 1200 320C1300 340 1400 310 1440 330V400H0Z" fill={accentColor} />
          {/* Stylized Trees/Watchtower Silhouette Vibe */}
          <rect x="700" y="240" width="40" height="80" fill={accentColor} opacity="0.4" />
          <path d="M680 240H760L720 200L680 240Z" fill={accentColor} opacity="0.4" />
          <path d="M50 350L100 250L150 350Z" fill={accentColor} opacity="0.2" />
          <path d="M1200 320L1300 200L1400 320Z" fill={accentColor} opacity="0.2" />
          <path d="M400 330L500 180L600 330Z" fill={accentColor} opacity="0.1" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Top Center Brand Logo */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="w-[320px] h-[60px] cursor-pointer transition-all hover:brightness-110 flex items-center justify-center gap-4 group">
            {/* Leaf-Data Fusion Logo - White variant */}
            <div className="w-[44px] h-[44px]">
              <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
                <path
                  d="M24 4C24 4 8 14 8 28C8 38 15 44 24 44C33 44 40 38 40 28C40 14 24 4 24 4Z"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Left: Organic veins */}
                <path d="M24 44V12" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
                <path d="M24 18C20 20 14 22 12 26" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                <path d="M24 26C20 27 16 30 14 34" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                {/* Right: Circuit paths */}
                <path d="M24 18L30 18L30 22L36 22" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
                <path d="M24 28L32 28L32 32" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
                <circle cx="36" cy="22" r="2" fill="white" fillOpacity="0.8" />
                <circle cx="32" cy="32" r="1.5" fill="white" fillOpacity="0.6" />
              </svg>
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase transition-colors group-hover:text-[#10b981]">CROPHEALTH <span style={{ color: accentColor }}>AI</span></span>
          </div>
        </div>

        {/* Quote Section - Updated Brand Voice */}
        <div className="text-center mb-16 space-y-6">
          <div className="flex justify-center mb-6">
            <div className="h-[2px] w-16 rounded-full animate-pulse" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}50` }}></div>
          </div>
          <h3 className="text-xl md:text-3xl font-black tracking-tight text-white italic uppercase">
            READING THE LAND. WRITING THE <span style={{ color: accentColor }}>FUTURE</span>.
          </h3>
          <p className="text-base md:text-lg font-normal text-white/80 tracking-wide">
            "The earth speaks in data. We speak back in action."
          </p>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.6em]">Brand Philosophy</p>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-20 border-b border-white/5">
          {/* Column 1 */}
          <div className="space-y-6">
            <h4 className="text-white font-black text-xs uppercase tracking-widest border-b border-white/10 pb-4">Services</h4>
            <ul className="space-y-4">
              {['Contact Us', 'Support Forum', 'Free Trial'].map(link => (
                <li key={link}>
                  <a href="#" className="text-stone-400 hover:text-white transition-colors text-sm font-bold tracking-tight">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <h4 className="text-white font-black text-xs uppercase tracking-widest border-b border-white/10 pb-4">Company</h4>
            <ul className="space-y-4">
              {['Careers', 'Our Blog', 'Affiliates'].map(link => (
                <li key={link}>
                  <a href="#" className="text-stone-400 hover:text-white transition-colors text-sm font-bold tracking-tight">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-6">
            <h4 className="text-white font-black text-xs uppercase tracking-widest border-b border-white/10 pb-4">Legal</h4>
            <ul className="space-y-4">
              {['EULA', 'Privacy Policy', 'Terms & Conditions'].map(link => (
                <li key={link}>
                  <a href="#" className="text-stone-400 hover:text-white transition-colors text-sm font-bold tracking-tight">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Site Identity Block (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-8 lg:pl-12 border-l border-white/5">
            <h4 className="text-white font-black text-xs uppercase tracking-widest border-b border-white/10 pb-4 italic text-right opacity-50">Global_Site_Presence</h4>

            <div className="space-y-4">
              <div className="flex items-start gap-4 text-stone-400">
                <MapPin size={18} className="shrink-0 mt-1" style={{ color: accentColor }} />
                <p className="text-sm font-medium leading-relaxed uppercase tracking-wide">
                  CropHealth AI HQ<br />
                  42 Precision Lane, Sector 9<br />
                  Bengaluru, KA 560099, India
                </p>
              </div>
              <div className="flex items-center gap-4 text-stone-400">
                <Phone size={18} style={{ color: accentColor }} />
                <p className="text-sm font-bold">+91 98765 43210</p>
              </div>
              <div className="flex items-center gap-4 text-stone-400">
                <Mail size={18} style={{ color: accentColor }} />
                <p className="text-sm font-bold hover:text-white cursor-pointer transition-colors">support@crophealth.ai</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              {[Twitter, Facebook, Instagram].map((Icon, i) => (
                <button key={i} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:border-white/30 transition-all hover:scale-110">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest text-center md:text-left">
              © 2025 CROPHEALTH AI. DEEP-MIND RESILIENCE CLUSTER V4.1
            </p>
            <p className="text-[9px] font-bold text-stone-600 uppercase tracking-widest text-center md:text-left italic">
              Coded and designed with Precision. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
            <div className="flex flex-col items-center gap-1">
              <CreditCard size={24} className="text-white" />
              <span className="text-[8px] font-black text-white uppercase">Secure Payments</span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            {/* Mock Payment Logos */}
            <div className="flex gap-4">
              <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center font-black text-[8px] text-white">VISA</div>
              <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center font-black text-[8px] text-white">MC</div>
              <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center font-black text-[8px] text-white">PAYPAL</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
