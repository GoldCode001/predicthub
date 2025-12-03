'use client';

import { Platform } from '@/types/market';

interface PlatformLogoProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
  linkToSite?: boolean;
}

const platformUrls: Record<Platform, string> = {
  polymarket: 'https://polymarket.com',
  kalshi: 'https://kalshi.com',
  manifold: 'https://manifold.markets',
  metaculus: 'https://metaculus.com',
};

const platformNames: Record<Platform, string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  manifold: 'Manifold',
  metaculus: 'Metaculus',
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

// SVG Logos for each platform
const PolymarketLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" fillOpacity="0.9"/>
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const KalshiLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 8v8M8 12h4l4-4M12 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ManifoldLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22V12M2 7l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MetaculusLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);

const logoComponents: Record<Platform, React.FC<{ className?: string }>> = {
  polymarket: PolymarketLogo,
  kalshi: KalshiLogo,
  manifold: ManifoldLogo,
  metaculus: MetaculusLogo,
};

const platformColors: Record<Platform, string> = {
  polymarket: '#8b5cf6',
  kalshi: '#3b82f6',
  manifold: '#22c55e',
  metaculus: '#f59e0b',
};

export default function PlatformLogo({ 
  platform, 
  size = 'md', 
  showName = false,
  className = '',
  linkToSite = false,
}: PlatformLogoProps) {
  const LogoComponent = logoComponents[platform];
  const color = platformColors[platform];
  
  const content = (
    <div 
      className={`inline-flex items-center gap-1.5 platform-logo ${className}`}
      style={{ color }}
    >
      <LogoComponent className={sizeClasses[size]} />
      {showName && (
        <span className={`font-medium ${textSizes[size]}`} style={{ color }}>
          {platformNames[platform]}
        </span>
      )}
    </div>
  );

  if (linkToSite) {
    return (
      <a 
        href={platformUrls[platform]} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        title={`Visit ${platformNames[platform]}`}
      >
        {content}
      </a>
    );
  }

  return content;
}

// Badge variant with background
export function PlatformBadge({ 
  platform, 
  size = 'md',
  showName = true,
  className = '',
}: PlatformLogoProps) {
  const LogoComponent = logoComponents[platform];
  const color = platformColors[platform];
  
  const paddingClasses = {
    sm: 'px-1.5 py-0.5',
    md: 'px-2 py-1',
    lg: 'px-3 py-1.5',
    xl: 'px-4 py-2',
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium ${paddingClasses[size]} ${textSizes[size]} ${className}`}
      style={{ 
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <LogoComponent className={sizeClasses[size]} />
      {showName && <span>{platformNames[platform]}</span>}
    </div>
  );
}

// Compact icon-only version
export function PlatformIcon({ 
  platform, 
  size = 'md',
  className = '',
}: Omit<PlatformLogoProps, 'showName' | 'linkToSite'>) {
  const LogoComponent = logoComponents[platform];
  const color = platformColors[platform];
  
  const iconBgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div 
      className={`${iconBgSizes[size]} rounded-lg flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: `${color}20`,
        color,
      }}
      title={platformNames[platform]}
    >
      <LogoComponent className={sizeClasses[size]} />
    </div>
  );
}

// Export platform data for use elsewhere
export { platformUrls, platformNames, platformColors };




