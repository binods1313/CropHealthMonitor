import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { firecrawlService } from '../services/firecrawlService';
import { useTheme } from '../ThemeContext';
import { FarmData } from '../types';

interface FirecrawlEnhancedAnalysisProps {
  farm?: FarmData;
  onEnhancement?: (data: any) => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  analysisType: 'quick-search' | 'deep-analysis' | 'portal-sync';
  setAnalysisType: (type: 'quick-search' | 'deep-analysis' | 'portal-sync') => void;
}

const FirecrawlEnhancedAnalysis: React.FC<FirecrawlEnhancedAnalysisProps> = ({
  farm,
  onEnhancement,
  isEnabled,
  setIsEnabled,
  analysisType,
  setAnalysisType
}) => {
  const { accentColor } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');
  const [enhancementData, setEnhancementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get credit usage
  const creditUsage = firecrawlService.getCreditUsage();
  const availableOperations = firecrawlService.getAvailableOperations();

  useEffect(() => {
    // Check if Firecrawl API key is configured using the new config file
    import('../src/config').then(({ isKeyConfigured }) => {
      const isConfigured = isKeyConfigured('firecrawlKey');
      if (!isConfigured) {
        setError('FIRECRAWL_API_KEY not configured. Web enhancement unavailable.');
      }
    }).catch(err => {
      console.error('Error loading config:', err);
      // Fallback to original check
      const hasApiKey = !!(import.meta as any).env.VITE_FIRECRAWL_API_KEY;
      if (!hasApiKey) {
        setError('FIRECRAWL_API_KEY not configured. Web enhancement unavailable.');
      }
    });
  }, []);

  const handleEnhanceAnalysis = async () => {
    if (!farm) {
      setError('No farm data available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('Initiating Analysis...');
    setError(null);

    // Dynamic steps based on analysis type
    const stages = [
      'Synchronizing with farm record...',
      'Fetching local NDVI metrics...',
      'Performing core Gemini analysis...',
      analysisType === 'deep-analysis' ? 'Launching Firecrawl Agent...' : 'Scraping web data...',
      analysisType === 'deep-analysis' ? 'Agent is traversing agricultural portals...' : 'Processing search results...',
      'Merging insights with farm data...',
      'Finalizing report...'
    ];

    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setAnalysisStage(stages[stageIndex]);
        stageIndex++;
      }
    }, 1200); // Even faster (1.2s) to feel more responsive

    try {
      const response = await fetch('/api/firecrawl-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropType: farm.crop,
          region: farm.location,
          farmerId: farm.id,
          analysisType
        })
      });

      const result = await response.json();

      if (result.success) {
        setEnhancementData(result.data);
        onEnhancement?.(result.data);
      } else {
        setError(result.data?.error || 'Failed to enhance analysis');
      }
    } catch (err) {
      console.error('Firecrawl enhancement error:', err);
      setError('Network error or timeout. Using existing analysis.');
    } finally {
      clearInterval(stageInterval);
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  // Determine if the selected operation is available
  const opKeyMap = {
    'quick-search': 'search',
    'deep-analysis': 'agent',
    'portal-sync': 'crawl'
  } as const;

  const isOperationAvailable = availableOperations[opKeyMap[analysisType]];

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-stone-100 p-8 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-stone-900 tracking-tight">Real-time Web Data Enhancement</h3>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
            Credits: {creditUsage.total}/600
          </span>
          <div className="relative inline-block w-12 h-6">
            <input
              type="checkbox"
              className="opacity-0 w-0 h-0 peer"
              id="firecrawl-toggle"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            <label
              htmlFor="firecrawl-toggle"
              className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-stone-300 rounded-full transition-all duration-300 peer-checked:bg-emerald-500 ${isEnabled ? 'after:translate-x-6' : 'after:translate-x-1'
                }`}
              style={{
                backgroundColor: isEnabled ? accentColor : undefined
              }}
            >
              <span
                className={`absolute h-4 w-4 bg-white rounded-full transition-all duration-300 top-1 ${isEnabled ? 'left-7' : 'left-1'
                  }`}
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-amber-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {isEnabled && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setAnalysisType('quick-search')}
              className={`p-4 rounded-2xl border-2 transition-all ${analysisType === 'quick-search'
                ? `border-emerald-500 bg-emerald-50 text-emerald-700`
                : `border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300`
                } ${!availableOperations.search ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!availableOperations.search}
            >
              <div className="text-center">
                <p className="font-black text-xs uppercase tracking-widest mb-1">Quick Search</p>
                <p className="text-[10px] text-stone-400">5-10 credits</p>
              </div>
            </button>

            <button
              onClick={() => setAnalysisType('deep-analysis')}
              className={`p-4 rounded-2xl border-2 transition-all ${analysisType === 'deep-analysis'
                ? `border-blue-500 bg-blue-50 text-blue-700`
                : `border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300`
                } ${!availableOperations.agent ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!availableOperations.agent}
            >
              <div className="text-center">
                <p className="font-black text-xs uppercase tracking-widest mb-1">Deep Analysis</p>
                <p className="text-[10px] text-stone-400">15-20 credits</p>
              </div>
            </button>

            <button
              onClick={() => setAnalysisType('portal-sync')}
              className={`p-4 rounded-2xl border-2 transition-all ${analysisType === 'portal-sync'
                ? `border-purple-500 bg-purple-50 text-purple-700`
                : `border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300`
                } ${!availableOperations.crawl ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!availableOperations.crawl}
            >
              <div className="text-center">
                <p className="font-black text-xs uppercase tracking-widest mb-1">Portal Sync</p>
                <p className="text-[10px] text-stone-400">30-50 credits</p>
              </div>
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={handleEnhanceAnalysis}
              disabled={isAnalyzing || !isOperationAvailable}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${!isOperationAvailable
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                : isAnalyzing
                  ? 'bg-stone-900 text-white cursor-wait animate-pulse shadow-lg'
                  : 'bg-stone-900 text-white hover:bg-black hover:shadow-xl active:scale-95'
                }`}
              style={{
                backgroundColor: !isOperationAvailable ? undefined : accentColor
              }}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] animate-pulse">{analysisStage}</span>
                  </div>
                </>
              ) : (
                <>
                  <span>ENHANCE WITH WEB DATA</span>
                </>
              )}
            </button>

            {!isOperationAvailable && (
              <p className="text-[10px] text-amber-600 font-bold text-center mt-2">
                {analysisType === 'quick-search'
                  ? 'Search operation unavailable (credit limit reached)'
                  : analysisType === 'deep-analysis'
                    ? 'Deep analysis throttled (approaching credit limit)'
                    : 'Portal sync throttled (approaching credit limit)'}
              </p>
            )}
          </div>

          {enhancementData && (
            <div className="mt-6 p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <h4 className="flex items-center gap-2 text-sm font-black text-stone-900 mb-6 uppercase tracking-tight">
                <Sparkles size={18} className="text-emerald-500 animate-pulse" />
                {analysisType === 'quick-search' ? 'Quick Search Analysis' : analysisType === 'deep-analysis' ? 'Deep Analysis Intelligence' : 'Portal Sync Results'}
              </h4>
              <div className="space-y-3 text-sm">
                {enhancementData.firecrawlInsights ? (
                  <div>
                    <p className="font-medium text-stone-600 mb-2">
                      {analysisType === 'quick-search'
                        ? 'Latest crop health information:'
                        : analysisType === 'deep-analysis'
                          ? 'Autonomous analysis results:'
                          : 'Agricultural portal insights:'}
                    </p>
                    <div className="text-stone-800 mt-2 space-y-2">
                      {(() => {
                        const insights = enhancementData.firecrawlInsights;
                        if (!insights) return null;

                        // NEW: Badge for Advanced Intelligence Fallback
                        const isAdvancedIA = insights.poweredBy === 'Perplexity';

                        if (isAdvancedIA) {
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enhanced via Deep Intelligence</span>
                              </div>
                              <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group/card">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/card:opacity-20 transition-opacity">
                                  <svg className="w-8 h-8 text-stone-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l8.15 14.1H3.85L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
                                </div>
                                <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700 relative z-10">
                                  {insights.answer}
                                </p>
                              </div>
                              {insights.citations && insights.citations.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mb-3">Verified Intelligence Sources:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {insights.citations.slice(0, 3).map((cit: string, i: number) => (
                                      <a key={i} href={cit} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold px-3 py-1.5 bg-stone-50 border border-stone-100 text-emerald-600 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all truncate max-w-[180px] flex items-center gap-2">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                        {new URL(cit).hostname.replace('www.', '')}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        // NEW: Handle operation failures explicitly
                        if (insights.status === 'failed' || insights.error || insights.success === false) {
                          return (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                              <p className="text-red-700 font-bold text-xs uppercase tracking-wider mb-1">Analysis Throttled or Failed</p>
                              <p className="text-red-600 text-xs">{insights.error || insights.message || 'The web analysis encountered an issue.'}</p>
                              <p className="text-stone-500 text-[10px] mt-2 italic">Using local metrics for combine score.</p>
                            </div>
                          );
                        }

                        // Support multiple result keys
                        const results = insights.web || insights.data || insights.results;

                        // Handle single page scrape results
                        if (insights.markdown || insights.content || (insights.data && !Array.isArray(insights.data) && insights.data.markdown)) {
                          const markdown = insights.markdown || insights.content || insights.data?.markdown;
                          return (
                            <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-50">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Portal Content Stream</span>
                              </div>
                              <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700 font-medium">
                                {markdown}
                              </p>
                            </div>
                          );
                        }

                        // Handle lists of results
                        if (results && Array.isArray(results)) {
                          return (
                            <div className="space-y-2">
                              {results.slice(0, 3).map((result: any, idx: number) => (
                                <div key={idx} className="p-3 bg-white rounded-lg border border-stone-200">
                                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 hover:text-emerald-700 text-xs line-clamp-1">
                                    {result.title || result.url}
                                  </a>
                                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                                    {result.description || result.snippet || result.content || 'No description available'}
                                  </p>
                                </div>
                              ))}
                              {results.length > 3 && (
                                <p className="text-[10px] text-stone-400 italic text-right">sources: {results.length}</p>
                              )}
                            </div>
                          );
                        }

                        // Handle deep-analysis agent results
                        if (analysisType === 'deep-analysis') {
                          const answer = insights.answer || insights.result || insights.response;
                          const data = insights.data;

                          if (answer) {
                            return (
                              <div className="p-3 bg-white rounded-lg border border-stone-200">
                                <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700">
                                  {typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2)}
                                </p>
                              </div>
                            );
                          } else if (data && typeof data === 'object') {
                            // If it's a structured data object from the agent
                            return (
                              <div className="space-y-2">
                                {Object.entries(data).map(([key, value]: [string, any], idx) => (
                                  <div key={idx} className="p-3 bg-white rounded-lg border border-stone-200">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                                    <div className="text-xs text-stone-700 leading-relaxed">
                                      {typeof value === 'object'
                                        ? <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(value, null, 2)}</pre>
                                        : value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }

                        // Fallback for any other structures
                        if (typeof insights === 'string') {
                          return <p className="text-xs whitespace-pre-wrap">{insights}</p>;
                        }

                        return (
                          <pre className="text-[10px] overflow-auto bg-stone-100 p-3 rounded border border-stone-200 max-h-40">
                            {JSON.stringify(insights, null, 2)}
                          </pre>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-500 italic">No additional web insights available. Using existing analysis.</p>
                )}

                <div className="pt-3 border-t border-stone-200 mt-3">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    Combined Health Score: {enhancementData.combinedScore}/100
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isEnabled && (
        <div className="text-center py-8">
          <p className="text-stone-500 font-medium">
            Web enhancement is currently disabled. Toggle the switch to enable real-time data from agricultural sources.
          </p>
          <p className="text-stone-400 text-sm mt-2">
            This feature provides live insights from agricultural portals, research, and crop health databases.
          </p>
        </div>
      )}
    </div>
  );
};

export default FirecrawlEnhancedAnalysis;