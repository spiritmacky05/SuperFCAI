
import React, { useState, useEffect } from 'react';
import HistoryView from './pages/HistoryView';
import AssistantModal from './components/AssistantModal';
import AdminView from './pages/AdminView';
import DrawerNavigation from './components/DrawerNavigation';
import { storageService } from './services/storageService';
import AccountView from './pages/AccountView';
import AuthView from './pages/AuthView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MainView from './pages/MainView';
import { SavedReport } from './types';
import { Menu, X, Search, History, Shield, User as UserIcon, LogOut } from 'lucide-react';
import { useToast } from './components/ToastContext';
import { useSession } from './hooks/useSession';
import { useReportGenerator } from './hooks/useReportGenerator';

type View = 'main' | 'history' | 'admin' | 'account';

const App: React.FC = () => {
  const { user, login, logout, setUser } = useSession();
  const reportGen = useReportGenerator(user);
  
  const [view, setView] = useState<View>('main');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');

    if (success) {
      showToast('Payment successful! Your account has been upgraded to Pro.', 'success');
      if (user && user.role !== 'pro' && user.role !== 'admin' && user.role !== 'super_admin') {
        const updatedUser = { ...user, role: 'pro' as const };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Use 'user' key consistent with storageService
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (canceled) {
      showToast('Payment canceled.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user, setUser, showToast]);

  // Periodic session & role validation
  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) return; // Wait until session_id is persisted

      try {
        const response = await fetch('/api/login/status', {
          headers: storageService.getAuthHeaders()
        });

        if (response.status === 401) {
          const data = await response.json().catch(() => ({}));
          handleLogout();
          showToast(data.error || 'Session expired. Please log in again.', 'info');
          return;
        }

        if (response.ok) {
          const freshUser = await response.json();
          // If role or status changed, update state without logout
          if (freshUser.role !== user.role || freshUser.status !== user.status) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
            if (freshUser.role === 'pro' && user.role === 'free') {
              showToast('Your PRO features have been activated!', 'success');
            }
          }
        }
      } catch (e) {
        console.error('Session sync failed:', e);
      }
    };

    const interval = setInterval(syncUser, 30000); // Sync every 30 seconds
    syncUser(); // Initial sync

    return () => clearInterval(interval);
  }, [user, setUser, showToast]);

  const handleLogout = () => {
    logout();
    setView('main');
    reportGen.reset();
    setIsMobileDrawerOpen(false);
  };

  const handleSelectHistory = (report: SavedReport) => {
    reportGen.loadReport(report);
    setView('main');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMobileNav = (newView: View) => {
    setView(newView);
    setIsMobileDrawerOpen(false);
  };

  if (!user) {
    return <AuthView onLogin={(u) => { login(u); setView('main'); }} />;
  }

  const ui = {
    page: 'min-h-screen bg-obsidian text-silver flex font-sans relative overflow-x-hidden',
    backgroundLayer: 'fixed inset-0 pointer-events-none z-0',
    main: 'flex-grow md:ml-20 lg:ml-64 transition-all duration-300 relative z-10 min-w-0 pb-24 md:pb-10',
    mobileHeader: 'md:hidden glass-panel border-b border-glass px-3 sm:px-4 py-3 sticky top-0 z-40 flex items-center justify-between',
    mobileDrawerOverlay: 'fixed inset-0 z-50 md:hidden',
    mobileDrawerPanel: 'absolute left-0 top-0 bottom-0 w-[85vw] max-w-xs bg-obsidian border-r border-glass p-5 sm:p-6 flex flex-col animate-slide-in-left',
    mobileNavButtonBase: 'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
    fab: 'fixed bottom-[7rem] sm:bottom-24 md:bottom-6 right-4 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 bg-cobalt/10 text-cobalt rounded-full shadow-[0_0_30px_rgba(0,242,255,0.3)] hover:bg-cobalt hover:text-obsidian hover:scale-110 active:scale-95 transition-all z-[110] flex items-center justify-center border border-cobalt backdrop-blur-md group',
  };

  return (
    <div className={ui.page}>
      {/* Background Elements */}
      <div className={ui.backgroundLayer}>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cobalt/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tangerine/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-radial-[ellipse_at_top,rgba(255,255,255,0.06),transparent_55%] opacity-30"></div>
      </div>

      <DrawerNavigation activeView={view} setView={setView} user={user} onLogout={handleLogout} />

      <main className={ui.main}>
        <div className={ui.mobileHeader}>
          <button 
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          >
            <Menu size={24} />
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-lg font-display text-white tracking-wider">SUPER FC AI</h1>
          </div>
          <div className="w-10"></div>
        </div>

        {isMobileDrawerOpen && (
          <div className={ui.mobileDrawerOverlay}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileDrawerOpen(false)}></div>
            <div className={ui.mobileDrawerPanel}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-display text-white tracking-wider">MENU</h2>
                <button onClick={() => setIsMobileDrawerOpen(false)} className="text-muted hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-2 flex-1">
                <button 
                  onClick={() => handleMobileNav('main')}
                  className={`${ui.mobileNavButtonBase} ${view === 'main' ? 'bg-cobalt/10 text-cobalt border border-cobalt/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                  <Search size={20} />
                  <span className="font-mono text-sm tracking-wider">NEW SEARCH</span>
                </button>
                <button 
                  onClick={() => handleMobileNav('history')}
                  className={`${ui.mobileNavButtonBase} ${view === 'history' ? 'bg-cobalt/10 text-cobalt border border-cobalt/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                  <History size={20} />
                  <span className="font-mono text-sm tracking-wider">HISTORY</span>
                </button>
                <button 
                  onClick={() => handleMobileNav('account')}
                  className={`${ui.mobileNavButtonBase} ${view === 'account' ? 'bg-cobalt/10 text-cobalt border border-cobalt/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
                >
                  <UserIcon size={20} />
                  <span className="font-mono text-sm tracking-wider">ACCOUNT</span>
                </button>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <button 
                    onClick={() => handleMobileNav('admin')}
                    className={`${ui.mobileNavButtonBase} ${view === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-muted hover:text-white hover:bg-white/5'}`}
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

        {view === 'admin' && (user.role === 'admin' || user.role === 'super_admin') ? (
          <AdminView currentUser={user} />
        ) : view === 'history' ? (
          <HistoryView 
            onSelect={handleSelectHistory} 
            onBack={() => setView('main')}
          />
        ) : view === 'account' ? (
          <AccountView user={user} />
        ) : (
          <MainView 
            user={user} 
            reportGen={reportGen} 
            setIsAssistantOpen={setIsAssistantOpen} 
            setView={setView}
          />
        )}
      </main>

      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      <PWAInstallPrompt />

      <button
        onClick={() => setIsAssistantOpen(true)}
        className={ui.fab}
        title="Ask Super AI Assistant"
      >
        <span className="text-3xl group-hover:rotate-12 transition-transform">🤖</span>
      </button>
    </div>
  );
};

export default App;
