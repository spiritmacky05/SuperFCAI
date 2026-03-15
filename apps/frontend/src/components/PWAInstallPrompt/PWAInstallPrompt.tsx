import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
                         
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice && !hasDismissed) {
      // Show iOS specific prompt after a short delay
      setTimeout(() => setIsVisible(true), 3000);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!hasDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    } else {
      console.log('User dismissed the install prompt');
      handleDismiss();
    }

    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-24 z-50 animate-fade-in-up">
      <div className="glass-panel p-4 rounded-xl border border-cobalt/30 shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col md:flex-row items-center justify-between gap-4 max-w-md">
        <div className="flex items-center gap-3 w-full">
          <div className="bg-cobalt/10 p-2 rounded-lg text-cobalt shrink-0">
            <Download size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm text-white tracking-wider">INSTALL APP</h3>
            <p className="text-xs text-muted font-mono">
              {isIOS ? 'Tap Share then "Add to Home Screen"' : 'Add to home screen for better experience'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleDismiss}
              className="p-2 text-muted hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            {!isIOS && (
              <button 
                onClick={handleInstallClick}
                className="cyber-button px-4 py-2 rounded-lg text-xs font-bold hover:bg-cobalt/20 transition-all"
              >
                INSTALL
              </button>
            )}
            {isIOS && (
              <div className="bg-obsidian/50 p-2 rounded-lg text-muted">
                <Share size={18} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
