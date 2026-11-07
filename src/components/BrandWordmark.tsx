import React from 'react';

interface BrandWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  onClick?: () => void;
}

export default function BrandWordmark({
  className = '',
  size = 'md',
  showTagline = false,
  onClick
}: BrandWordmarkProps) {
  const sizeStyles = {
    sm: { height: 'h-7 sm:h-8', tagline: 'text-[9px]' },
    md: { height: 'h-9 sm:h-11 md:h-12', tagline: 'text-[10px]' },
    lg: { height: 'h-12 sm:h-14 md:h-16', tagline: 'text-xs' },
    xl: { height: 'h-16 sm:h-20 md:h-24', tagline: 'text-sm' }
  }[size];

  return (
    <div 
      onClick={onClick}
      className={`inline-flex flex-col items-center justify-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      aria-label="DataGhanaNow"
    >
      <img 
        src="/dataghananow-logo.png" 
        alt="DataGhanaNow" 
        className={`${sizeStyles.height} w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] transform-gpu drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]`}
      />

      {showTagline && (
        <span className={`font-bold text-amber-300/90 ${sizeStyles.tagline} tracking-[0.2em] uppercase mt-1 text-center opacity-90 drop-shadow-sm`}>
          Ghana's #1 Data Marketplace
        </span>
      )}
    </div>
  );
}
