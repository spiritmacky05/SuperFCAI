import React, { useEffect, useRef } from 'react';
import { UserRole } from '../../types';

interface AdBannerProps {
  userRole: UserRole;
  position?: 'top' | 'bottom' | 'sidebar';
}

const AdBanner: React.FC<AdBannerProps> = ({ userRole, position = 'bottom' }) => {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (userRole === 'free' && !pushedRef.current) {
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
          // Ignore the specific error about ads already being filled
          if (!e.message?.includes('already have ads in them')) {
            console.error("AdSense error:", e);
          }
        }
      }
    }
  }, [userRole]);

  if (userRole !== 'free') return null;

  return (
    <div className={`w-full overflow-hidden flex flex-col justify-center items-center relative ${
      position === 'sidebar' 
        ? 'mt-6 min-h-[250px] glass-panel rounded-xl border border-glass bg-obsidian/30' 
        : 'fixed bottom-0 left-0 right-0 z-[100] bg-obsidian/90 backdrop-blur-md border-t border-glass p-2 min-h-[60px]'
    }`}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <span className="text-xs text-muted/30 font-mono uppercase tracking-widest">Advertisement Space</span>
      </div>
      <ins 
           ref={adRef}
           className="adsbygoogle relative z-10"
           style={{ display: 'block', width: '100%', minHeight: position === 'sidebar' ? '250px' : '50px' }}
           data-ad-client="ca-pub-4207995657361355"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdBanner;
