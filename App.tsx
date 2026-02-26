
import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import ResultDisplay from './components/ResultDisplay';
import HistoryView from './components/HistoryView';
import ChatBox from './components/ChatBox';
import NTCGenerator from './components/NTCGenerator';
import AssistantModal from './components/AssistantModal';
import AdminView from './components/AdminView';
import DrawerNavigation from './components/DrawerNavigation';
import BottomNavigation from './components/BottomNavigation';
import AuthView from './components/AuthView';
import { SearchParams, User, SavedReport } from './types';
import { generateFireSafetyReport } from './services/geminiService';
import { storageService } from './services/storageService';

type View = 'main' | 'history' | 'admin';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('main');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  const [params, setParams] = useState<SearchParams>({
    establishmentType: '',
    area: '',
    stories: ''
  });
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on load (optional, for now we rely on login)
  // In a real app, we'd check a token in localStorage

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('main');
  };

  const handleLogout = () => {
    setUser(null);
    setView('main');
    setResult('');
    setParams({ establishmentType: '', area: '', stories: '' });
  };

  const handleGenerate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      const response = await generateFireSafetyReport(params);
      setResult(response.markdown);
      
      const report: SavedReport = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        params: { ...params },
        result: response.markdown
      };
      storageService.saveReport(user.email, report);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to generate report. Please check your connection and API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (report: SavedReport) => {
    setParams(report.params);
    setResult(report.result);
    setView('main');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-obsidian text-silver flex font-sans relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cobalt/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tangerine/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Desktop Drawer Navigation */}
      <DrawerNavigation activeView={view} setView={setView} user={user} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 pb-20 md:pb-0 transition-all duration-300 relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden glass-panel border-b border-glass p-4 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-cobalt/20 border border-cobalt/50 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
              <span className="text-lg font-bold text-cobalt">⚡</span>
            </div>
            <h1 className="text-lg font-display text-white tracking-wider">SUPER FC AI</h1>
          </div>
          <button 
            onClick={() => setIsAssistantOpen(true)}
            className="p-2 bg-glass border border-glass rounded-full text-cobalt hover:bg-cobalt/10 active:scale-95 transition-all"
          >
            <span className="text-xl">🤖</span>
          </button>
        </div>

        {view === 'admin' && user.role === 'admin' ? (
          <AdminView />
        ) : view === 'history' ? (
          <HistoryView 
            reports={storageService.getReports(user.email)} 
            onSelect={handleSelectHistory} 
            onBack={() => setView('main')}
          />
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form */}
              <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cobalt/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h3 className="text-cobalt font-display text-sm mb-3 flex items-center gap-2 tracking-widest">
                       <span className="text-xl">🛡️</span> SYSTEM STATUS: ONLINE
                    </h3>
                    <div className="bg-obsidian/50 p-3 rounded-lg border border-cobalt/20 mb-2">
                      <p className="text-xs text-silver/80 leading-relaxed font-mono">
                        <strong className="text-cobalt">WARNING:</strong> AI analysis is for reference only. Physical verification required per protocol 9514.
                      </p>
                    </div>
                </div>
                <SearchForm 
                  params={params} 
                  setParams={setParams} 
                  onSubmit={handleGenerate}
                  isLoading={isLoading}
                />

                <div className="glass-panel p-6 rounded-xl hidden lg:block">
                   <h4 className="font-display text-white text-sm mb-2 tracking-widest">EXPERT MODE</h4>
                   <p className="text-xs text-muted mb-4 font-mono">Access deep neural network for specific code citations and penalty calculations.</p>
                   <button 
                     onClick={() => setIsAssistantOpen(true)}
                     className="w-full py-3 cyber-button rounded-lg text-xs font-bold hover:bg-cobalt/20 transition-all shadow-[0_0_10px_rgba(0,242,255,0.1)]"
                   >
                     INITIALIZE ASSISTANT
                   </button>
                </div>
              </div>

              {/* Right Column: Results & Chat */}
              <div className="lg:col-span-8 space-y-8">
                {error && (
                  <div className="bg-red-900/20 border-l-2 border-red-500 p-4 rounded-r-lg backdrop-blur-sm">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <p className="text-sm text-red-400 font-mono">{error}</p>
                    </div>
                  </div>
                )}

                {result ? (
                  <div className="animate-fade-in-up space-y-8">
                    <ResultDisplay content={result} />
                    <ChatBox reportContext={result} />
                    <NTCGenerator params={params} />
                  </div>
                ) : (
                  !isLoading && (
                    <div className="flex flex-col items-center justify-center h-64 glass-panel rounded-xl border border-dashed border-glass text-muted p-8 text-center">
                      <div className="bg-glass h-20 w-20 rounded-full flex items-center justify-center mb-4 border border-glass shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cobalt opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-display text-silver tracking-widest">SYSTEM IDLE</p>
                      <p className="text-xs font-mono text-muted mt-2">Awaiting establishment parameters...</p>
                    </div>
                  )
                )}
                
                {isLoading && (
                  <div className="space-y-6 animate-pulse glass-panel p-8 rounded-xl">
                      <div className="h-8 bg-glass rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-glass rounded w-3/4"></div>
                      <div className="h-4 bg-glass rounded w-1/2"></div>
                      <div className="h-48 bg-glass rounded border border-glass"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation activeView={view} setView={setView} user={user} />

      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 h-16 w-16 bg-cobalt/10 text-cobalt rounded-full shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:bg-cobalt hover:text-obsidian hover:scale-110 active:scale-95 transition-all z-[60] flex items-center justify-center border border-cobalt backdrop-blur-md group"
        title="Ask Super AI Assistant"
      >
        <span className="text-3xl group-hover:rotate-12 transition-transform">🤖</span>
      </button>
    </div>
  );
};

export default App;
