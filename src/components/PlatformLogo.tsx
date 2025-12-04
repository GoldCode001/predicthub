'use client';

import Image from 'next/image';
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

const logoPaths: Record<Platform, string> = {
  polymarket: '/logos/polymarket.png',
  kalshi: '/logos/kalshi.png',
  manifold: '/logos/manifold.png',
  metaculus: '/logos/metaculus.png',
};

// Updated theme colors based on actual logos
const platformColors: Record<Platform, string> = {
  polymarket: '#2150ff', // Royal blue from Polymarket logo
  kalshi: '#14b8a6', // Teal-green from Kalshi logo
  manifold: '#8b5cf6', // Purple from Manifold crane logo
  metaculus: '#4a5568', // Dark blue-grey from Metaculus logo (lighter for UI)
};

export default function PlatformLogo({ 
  platform, 
  size = 'md', 
  showName = false,
  className = '',
  linkToSite = false,
}: PlatformLogoProps) {
  const color = platformColors[platform];
  const logoPath = logoPaths[platform];
  
  // Calculate image dimensions based on size
  const imageSizes: Record<PlatformLogoProps['size'], number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };
  
  const content = (
    <div 
      className={`inline-flex items-center gap-1.5 platform-logo ${className}`}
      style={{ color }}
    >
      <Image
        src={logoPath}
        alt={`${platformNames[platform]} logo`}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={`${sizeClasses[size]} object-contain rounded-md`}
        unoptimized
      />
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
  const color = platformColors[platform];
  const logoPath = logoPaths[platform];
  
  const paddingClasses = {
    sm: 'px-1.5 py-0.5',
    md: 'px-2 py-1',
    lg: 'px-3 py-1.5',
    xl: 'px-4 py-2',
  };

  const imageSizes: Record<PlatformLogoProps['size'], number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-xl font-medium ${paddingClasses[size]} ${textSizes[size]} ${className}`}
      style={{ 
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <Image
        src={logoPath}
        alt={`${platformNames[platform]} logo`}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={`${sizeClasses[size]} object-contain rounded-md`}
        unoptimized
      />
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
  const color = platformColors[platform];
  const logoPath = logoPaths[platform];
  
  const iconBgSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const imageSizes: Record<PlatformLogoProps['size'], number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  return (
    <div 
      className={`${iconBgSizes[size]} rounded-xl flex items-center justify-center overflow-hidden ${className}`}
      style={{ 
        backgroundColor: `${color}20`,
        color,
      }}
      title={platformNames[platform]}
    >
      <Image
        src={logoPath}
        alt={`${platformNames[platform]} logo`}
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={`${sizeClasses[size]} object-contain rounded-md`}
        unoptimized
      />
    </div>
  );
}

// Export platform data for use elsewhere
export { platformUrls, platformNames, platformColors };




