import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-24 z-50 animate-fade-in-up">
      <div className="glass-panel p-4 rounded-xl border border-cobalt/30 shadow-[0_0_30px_rgba(0,242,255,0.15)] flex items-center justify-between gap-4 max-w-md">
        <div className="flex items-center gap-3">
          <div className="bg-cobalt/10 p-2 rounded-lg text-cobalt">
            <Download size={24} />
          </div>
          <div>
            <h3 className="font-display text-sm text-white tracking-wider">INSTALL APP</h3>
            <p className="text-xs text-muted font-mono">Add to home screen for better experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="p-2 text-muted hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          <button 
            onClick={handleInstallClick}
            className="cyber-button px-4 py-2 rounded-lg text-xs font-bold hover:bg-cobalt/20 transition-all"
          >
            INSTALL
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
