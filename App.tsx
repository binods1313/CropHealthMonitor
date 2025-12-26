
import React, { Suspense, lazy } from 'react';
/* Fix: Removed alias 'as Router' and ensuring direct import of HashRouter, Routes, and Route to fix reported missing export errors */
import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './ThemeContext';

// Lazy loading for internal modules only to ensure Dashboard loads instantly
const CropHealthReport = lazy(() => import('./components/CropHealthReport'));
const DisasterDetect = lazy(() => import('./components/DisasterDetect'));
const ClimateVisualizer = lazy(() => import('./components/ClimateVisualizer'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
    <p className="text-stone-500 font-black uppercase tracking-[0.3em] animate-pulse text-xs">Synchronizing Agri-Systems...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      {/* Fix: Using HashRouter directly instead of the aliased Router */}
      <HashRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report/:farmId" element={<CropHealthReport />} />
            <Route path="/disasters" element={<DisasterDetect />} />
            <Route path="/climate" element={<ClimateVisualizer />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
