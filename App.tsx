
import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import ResultDisplay from './components/ResultDisplay';
import HistoryView from './components/HistoryView';
import ChatBox from './components/ChatBox';
import Logo from './components/superfcai logo png 2';
import NTCGenerator from './components/NTCGenerator';
import AssistantModal from './components/AssistantModal';
import AdminView from './components/AdminView';
import DrawerNavigation from './components/DrawerNavigation';
import AccountView from './components/AccountView';
import AuthView from './components/AuthView';
import AdBanner from './components/AdBanner';
import { SearchParams, User, SavedReport } from './types';
import { generateFireSafetyReport } from './services/geminiService';
import { storageService } from './services/storageService';
import { Menu, X, Search, History, Shield, User as UserIcon, LogOut } from 'lucide-react';

type View = 'main' | 'history' | 'admin' | 'account';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('main');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const [params, setParams] = useState<SearchParams>({
    establishmentType: '',
    area: '',
    stories: ''
  });
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('superfc_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user session', e);
        localStorage.removeItem('superfc_user');
      }
    }
  }, []);

  // Persist user on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('superfc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('superfc_user');
    }
  }, [user]);

  useEffect(() => {
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success) {
      alert('Payment successful! Your account has been upgraded to Pro.');
      // Ideally, you would fetch the updated user profile here
      // For now, we'll just update the local state if the user is logged in
      if (user) {
        setUser({ ...user, role: 'pro' });
      }
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (canceled) {
      alert('Payment canceled.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]); // Add user dependency so it runs after login if needed, or check on mount

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView('main');
  };

  const handleLogout = () => {
    setUser(null);
    setView('main');
    setResult('');
    setParams({ establishmentType: '', area: '', stories: '' });
    setIsMobileDrawerOpen(false);
  };

  const handleGenerate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      // Increment usage count
      const currentCount = parseInt(localStorage.getItem('gemini_usage_count') || '0', 10);
      localStorage.setItem('gemini_usage_count', (currentCount + 1).toString());

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

  const handleMobileNav = (newView: View) => {
    setView(newView);
    setIsMobileDrawerOpen(false);
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
      <main className="flex-grow md:ml-20 lg:ml-64 transition-all duration-300 relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden glass-panel border-b border-glass p-4 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <h1 className="text-lg font-display text-white tracking-wider">SUPER FC AI</h1>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Overlay */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileDrawerOpen(false)}></div>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-obsidian border-r border-glass p-6 flex flex-col animate-slide-in-left">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display text-white tracking-wider">MENU</h2>
                <button onClick={() => setIsMobileDrawerOpen(false)} className="text-muted hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-2 flex-1">
                <button 
                  onClick={() => handleMobileNav('main')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'main' ? 'bg-cobalt/10 text-cobalt border border-cobalt/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                  <Search size={20} />
                  <span className="font-mono text-sm tracking-wider">NEW SEARCH</span>
                </button>
                <button 
                  onClick={() => handleMobileNav('history')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'history' ? 'bg-cobalt/10 text-cobalt border border-cobalt/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                  <History size={20} />
                  <span className="font-mono text-sm tracking-wider">HISTORY</span>
                </button>
                <button 
                  onClick={() => handleMobileNav('account')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'account' ? 'bg-cobalt/10 text-cobalt border border-cobalt/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                  <UserIcon size={20} />
                  <span className="font-mono text-sm tracking-wider">ACCOUNT</span>
                </button>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => handleMobileNav('admin')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                  >
                    <Shield size={20} />
                    <span className="font-mono text-sm tracking-wider">ADMIN</span>
                  </button>
                )}
              </nav>

              <div className="pt-6 border-t border-glass">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-tangerine hover:bg-tangerine/10 rounded-lg transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-mono text-sm tracking-wider">LOGOUT</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && user.role === 'admin' ? (
          <AdminView />
        ) : view === 'history' ? (
          <HistoryView 
            reports={storageService.getReports(user.email)} 
            onSelect={handleSelectHistory} 
            onBack={() => setView('main')}
          />
        ) : view === 'account' ? (
          <AccountView user={user} />
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
                
                {/* Sidebar Ad for Free Users */}
                <AdBanner userRole={user.role} position="sidebar" />
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

      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 bg-cobalt/10 text-cobalt rounded-full shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:bg-cobalt hover:text-obsidian hover:scale-110 active:scale-95 transition-all z-[60] flex items-center justify-center border border-cobalt backdrop-blur-md group"
        title="Ask Super AI Assistant"
      >
        <span className="text-3xl group-hover:rotate-12 transition-transform">🤖</span>
      </button>

      {/* Bottom Ad Banner for Free Users */}
      <AdBanner userRole={user.role} position="bottom" />
    </div>
  );
};

export default App;
