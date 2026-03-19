import React from 'react';
import Logo from './Logo';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "INITIALIZING SYSTEM...", 
  subMessage = "ESTABLISHING SECURE CONNECTION",
  fullScreen = true
}) => {
  return (
    <div className={`${fullScreen ? 'fixed inset-0' : 'w-full h-full min-h-[400px]'} z-[200] flex flex-col items-center justify-center bg-obsidian/95 backdrop-blur-md animate-in fade-in duration-500`}>
      {/* Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cobalt/10 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-[60px] animate-pulse delay-700"></div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo with pulse effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-cobalt/20 rounded-full blur-xl animate-ping opacity-50"></div>
          <div className="relative z-10 transition-transform duration-500 scale-110">
            <Logo size="xl" />
          </div>
        </div>

        {/* Loading Spinner ring */}
        <div className="absolute top-[40px] w-24 h-24 border-2 border-cobalt/20 border-t-cobalt rounded-full animate-spin"></div>
        
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-xl font-display text-white tracking-[0.3em] uppercase animate-pulse">
            {message}
          </h2>
          <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] text-muted tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-cobalt rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-cobalt rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-cobalt rounded-full animate-bounce"></span>
            <span className="ml-2">{subMessage}</span>
          </div>
        </div>

        {/* System Bar */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-4 border border-white/5">
          <div className="h-full bg-gradient-to-r from-cobalt via-purple-500 to-cobalt w-1/3 animate-[loading-bar_1.5s_infinite_ease-in-out]"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 50%; }
          100% { transform: translateX(200%); width: 30%; }
        }
      `}} />
    </div>
  );
};

export default LoadingScreen;
