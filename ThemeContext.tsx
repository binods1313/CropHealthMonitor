
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => void;
  colors: { id: string, hex: string }[];
}

const COLORS = [
  { id: 'emerald', hex: '#10b981' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'purple', hex: '#8b5cf6' },
  { id: 'rose', hex: '#f43f5e' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'cyan', hex: '#06b6d4' }
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('app-accent-color') || '#10b981';
  });

  useEffect(() => {
    localStorage.setItem('app-accent-color', accentColor);
    // Inject CSS variables for global access
    const root = document.documentElement;
    root.style.setProperty('--accent-main', accentColor);
    root.style.setProperty('--accent-soft', `${accentColor}15`); // 15% opacity
    root.style.setProperty('--accent-border', `${accentColor}40`); // 40% opacity
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, colors: COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
