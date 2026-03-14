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

      <img 
        src="/logo.png" 
        alt="Super FC AI Logo" 
        className="w-full h-full relative z-10 drop-shadow-lg object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
