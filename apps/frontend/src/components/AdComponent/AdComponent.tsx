import React, { useEffect } from 'react';

const AdComponent: React.FC = () => {
  useEffect(() => {
    try {
      // Check if adsbygoogle is already available on window
      const w = window as any;
      if (!w.adsbygoogle) {
         w.adsbygoogle = w.adsbygoogle || [];
      }
      // Push ad to array
      w.adsbygoogle.push({});
    } catch (e) {
      console.error("AdSense Error: ", e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden rounded text-center">
      <div className="bg-obsidian/30 inline-block">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-4207995657361355"
          data-ad-slot="auto"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default AdComponent;
