import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { X, ExternalLink, Zap } from 'lucide-react';

interface AdBannerProps {
  userRole: UserRole;
  position?: 'top' | 'bottom' | 'sidebar';
}

const MOCK_ADS = [
  {
    id: 1,
    title: "Upgrade to PRO",
    description: "Get unlimited AI generations and priority support.",
    cta: "Upgrade Now",
    color: "from-cobalt/20 to-purple-500/20",
    icon: Zap
  },
  {
    id: 2,
    title: "Fire Safety Equipment",
    description: "Certified extinguishers and alarms. 20% off.",
    cta: "Shop Now",
    color: "from-tangerine/20 to-red-500/20",
    icon: ExternalLink
  },
  {
    id: 3,
    title: "Compliance Seminars",
    description: "Join our next webinar on RA 9514 updates.",
    cta: "Register Free",
    color: "from-green-500/20 to-emerald-500/20",
    icon: ExternalLink
  }
];

const AdBanner: React.FC<AdBannerProps> = ({ userRole, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [ad, setAd] = useState(MOCK_ADS[0]);

  useEffect(() => {
    // Randomly select an ad
    const randomAd = MOCK_ADS[Math.floor(Math.random() * MOCK_ADS.length)];
    setAd(randomAd);
  }, []);

  if (userRole !== 'free' || !isVisible) return null;

  const Icon = ad.icon;

  if (position === 'sidebar') {
    return (
      <div className="glass-panel p-4 rounded-xl border border-glass relative overflow-hidden group mt-6">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-muted hover:text-white z-20"
        >
          <X size={14} />
        </button>
        <div className={`absolute inset-0 bg-gradient-to-br ${ad.color} opacity-50`}></div>
        <div className="relative z-10">
          <span className="text-[9px] font-mono text-muted uppercase border border-muted/30 px-1 rounded mb-2 inline-block">Sponsored</span>
          <h4 className="font-display text-white text-sm mb-1">{ad.title}</h4>
          <p className="text-xs text-silver/80 mb-3 leading-tight">{ad.description}</p>
          <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold text-white transition-colors flex items-center justify-center gap-2">
            {ad.cta} <Icon size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 z-[100] animate-fade-in-up">
      <div className="glass-panel p-4 rounded-xl border border-glass shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-muted hover:text-white z-20"
        >
          <X size={14} />
        </button>
        <div className={`absolute inset-0 bg-gradient-to-r ${ad.color} opacity-30`}></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[8px] font-mono text-muted uppercase border border-muted/30 px-1 rounded">Ad</span>
              <h4 className="font-display text-white text-sm">{ad.title}</h4>
            </div>
            <p className="text-xs text-silver/80 leading-tight">{ad.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
