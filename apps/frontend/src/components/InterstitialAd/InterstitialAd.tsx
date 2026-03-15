import React, { useState, useEffect } from 'react';
import { adService } from '../../services/adService';
import { X, ExternalLink } from 'lucide-react';

const InterstitialAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Initialize the AdService
    adService.initialize();

    // Register this component as the "AdMob SDK" renderer
    adService.setOnShowListener(() => {
      setIsVisible(true);
      setCountdown(5);
    });
  }, []);

  useEffect(() => {
    let timer: any;
    if (isVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVisible, countdown]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-1">
        {/* Close Button (Simulated 'X' after 5s) */}
        <button 
          onClick={() => setIsVisible(false)}
          disabled={countdown > 0}
          className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-all ${
            countdown > 0 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-black hover:scale-110'
          }`}
        >
          {countdown > 0 ? (
            <span className="font-mono text-xs">{countdown}s</span>
          ) : (
            <X size={20} />
          )}
        </button>

        {/* Ad Content */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <div className="h-48 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center relative">
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-yellow-400 text-black px-3 py-1 text-xs font-bold uppercase tracking-widest rounded">
                Ad
              </span>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <h3 className="text-2xl font-display text-white mb-2">Upgrade to PRO</h3>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              Unlock unlimited AI generations, priority support, and exclusive fire safety insights.
            </p>
            
            <button 
              className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              onClick={() => window.open('https://example.com/upgrade', '_blank')}
            >
              Learn More <ExternalLink size={16} />
            </button>
            
            <p className="mt-4 text-[10px] text-gray-500 uppercase tracking-widest">
              Sponsored Content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterstitialAd;
