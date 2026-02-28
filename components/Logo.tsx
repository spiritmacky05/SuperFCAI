import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  return (
    <div className={`relative flex items-center justify-center ${dimensions[size]} ${className}`}>
      {/* Outer Glow Effect */}
      <div className="absolute inset-0 bg-cobalt/20 rounded-full blur-xl animate-pulse"></div>

      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="yellowCape" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Cape - Flowing behind */}
        <path
          d="M60 110 Q 40 160 50 190 L 150 190 Q 160 160 140 110 Z"
          fill="url(#yellowCape)"
          className="animate-pulse-slow origin-top"
        />

        {/* Legs - Floating/Dangling */}
        <path d="M85 160 Q 85 180 75 190" stroke="#1e3a8a" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M115 160 Q 115 180 125 190" stroke="#1e3a8a" strokeWidth="12" strokeLinecap="round" fill="none" />
        {/* Feet */}
        <ellipse cx="75" cy="190" rx="10" ry="6" fill="url(#orangeGradient)" />
        <ellipse cx="125" cy="190" rx="10" ry="6" fill="url(#orangeGradient)" />

        {/* Body - Rounded */}
        <rect x="65" y="100" width="70" height="70" rx="20" fill="url(#blueGradient)" />

        {/* Orange Accents on Body */}
        <path d="M65 140 L 135 140" stroke="#ea580c" strokeWidth="4" strokeOpacity="0.5" />

        {/* Arms - Cheerful pose */}
        <path d="M65 120 Q 40 130 40 110" stroke="#1e3a8a" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M135 120 Q 160 130 160 110" stroke="#1e3a8a" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Hands */}
        <circle cx="40" cy="110" r="8" fill="url(#orangeGradient)" />
        <circle cx="160" cy="110" r="8" fill="url(#orangeGradient)" />

        {/* Head - Rounded */}
        <rect x="55" y="40" width="90" height="75" rx="25" fill="url(#blueGradient)" stroke="#3b82f6" strokeWidth="2" />

        {/* Ears - Orange cylinders */}
        <rect x="45" y="65" width="10" height="25" rx="2" fill="url(#orangeGradient)" />
        <rect x="145" y="65" width="10" height="25" rx="2" fill="url(#orangeGradient)" />

        {/* Face Screen */}
        <rect x="65" y="55" width="70" height="45" rx="10" fill="#000000" />

        {/* Eyes - Glowing Cyan */}
        <ellipse cx="85" cy="75" rx="6" ry="8" fill="#00F2FF" filter="url(#glow)" />
        <ellipse cx="115" cy="75" rx="6" ry="8" fill="#00F2FF" filter="url(#glow)" />

        {/* Mouth - Smiling */}
        <path d="M90 90 Q 100 95 110 90" stroke="#00F2FF" strokeWidth="3" strokeLinecap="round" fill="none" filter="url(#glow)" />

        {/* Badge - FC */}
        <circle cx="100" cy="135" r="18" fill="#ea580c" stroke="#fbbf24" strokeWidth="2" />
        <text x="100" y="141" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif">FC</text>

        {/* Antenna */}
        <line x1="100" y1="40" x2="100" y2="25" stroke="#1e3a8a" strokeWidth="3" />
        <circle cx="100" cy="25" r="4" fill="#fb923c" />

      </svg>
    </div>
  );
};

export default Logo;
