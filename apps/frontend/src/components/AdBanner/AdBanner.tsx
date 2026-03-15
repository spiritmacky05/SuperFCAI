import React, { useEffect, useRef, useState } from 'react';
import { UserRole } from '../../types';
import { X } from 'lucide-react';

interface AdBannerProps {
  userRole: UserRole;
  position?: 'top' | 'bottom' | 'sidebar';
}

const AdBanner: React.FC<AdBannerProps> = ({ userRole, position = 'bottom' }) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (userRole === 'free' && isVisible && !pushedRef.current) {
      // Inject AdSense script if not already present
      let script = document.getElementById('adsense-script') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'adsense-script';
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4207995657361355';
        script.async = true;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Initialize the ad unit if it hasn't been initialized
      const currentAd = adRef.current;
      if (currentAd && !currentAd.getAttribute('data-adsbygoogle-status')) {
        try {
          pushedRef.current = true;
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (e: any) {
          if (!e.message?.includes('already have ads in them')) {
            console.error("AdSense error:", e);
          }
        }
      }
    }
  }, [userRole, isVisible]);

  if (userRole !== 'free' || !isVisible) return null;

  return (
    <div className={`w-full overflow-hidden flex flex-col justify-center items-center relative transition-all duration-300 ${
      position === 'sidebar' 
        ? 'mt-4 min-h-[120px] glass-panel rounded-lg border border-glass bg-obsidian/20' 
        : 'fixed bottom-0 left-0 right-0 z-[100] bg-obsidian/95 backdrop-blur-md border-t border-glass p-1 min-h-[50px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]'
    }`}>
      {position === 'bottom' && (
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-2 p-1 text-muted hover:text-white transition-colors z-[110]"
          title="Dismiss ad"
        >
          <X size={14} />
        </button>
      )}
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span className="text-[10px] text-muted/20 font-mono uppercase tracking-[0.2em]">Advertisement</span>
      </div>
      
      <ins 
           ref={adRef}
           className="adsbygoogle relative z-10"
           style={{ 
             display: 'block', 
             width: '100%', 
             height: 'auto',
             minHeight: position === 'sidebar' ? '120px' : '45px' 
           }}
           data-ad-client="ca-pub-4207995657361355"
           data-ad-format={position === 'sidebar' ? 'rectangle' : 'horizontal'}
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdBanner;
