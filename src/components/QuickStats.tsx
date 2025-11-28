'use client';

import { useEffect, useState } from 'react';
import { UnifiedMarket, Platform, PlatformStatus } from '@/types/market';
import { PlatformIcon } from './PlatformLogo';

interface QuickStatsProps {
  markets: UnifiedMarket[];
  platformStatus: Record<Platform, PlatformStatus>;
}

export default function QuickStats({ markets, platformStatus }: QuickStatsProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');

  // Update time ago
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
      
      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (seconds < 3600) {
        setTimeAgo(`${Math.floor(seconds / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(seconds / 3600)}h ago`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Update lastUpdated when markets change
  useEffect(() => {
    if (markets.length > 0) {
      setLastUpdated(new Date());
    }
  }, [markets.length]);

  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
  const activePlatforms = Object.values(platformStatus).filter(s => !s.loading && !s.error && s.marketCount > 0).length;
  const isLoading = Object.values(platformStatus).some(s => s.loading);

  return (
    <div className="bg-ph-card border-b border-subtle">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {/* Total Markets */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ph-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-ph-text-secondary">Markets:</span>
            <span className="font-bold text-ph-text tabular-nums">
              {isLoading ? (
                <span className="inline-block w-12 h-4 shimmer rounded" />
              ) : (
                markets.length.toLocaleString()
              )}
            </span>
          </div>

          {/* Total Volume */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ph-profit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-ph-text-secondary">24h Volume:</span>
            <span className="font-bold text-ph-profit tabular-nums">
              {isLoading ? (
                <span className="inline-block w-16 h-4 shimmer rounded" />
              ) : (
                `$${totalVolume >= 1000000 
                  ? `${(totalVolume / 1000000).toFixed(1)}M`
                  : totalVolume >= 1000 
                    ? `${(totalVolume / 1000).toFixed(0)}K`
                    : totalVolume.toFixed(0)
                }`
              )}
            </span>
          </div>

          {/* Active Platforms */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ph-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-ph-text-secondary">Platforms:</span>
            <div className="flex items-center gap-1.5">
              {(['polymarket', 'kalshi', 'manifold', 'metaculus'] as Platform[]).map((platform) => {
                const status = platformStatus[platform];
                return (
                  <div
                    key={platform}
                    className={`transition-opacity ${
                      status.loading ? 'animate-pulse opacity-50' :
                      status.error ? 'opacity-30' :
                      status.marketCount > 0 ? 'opacity-100' : 'opacity-30'
                    }`}
                    title={`${platform}: ${status.loading ? 'Loading...' : status.error || `${status.marketCount} markets`}`}
                  >
                    <PlatformIcon platform={platform} size="sm" />
                  </div>
                );
              })}
              <span className="font-bold text-ph-text ml-1 tabular-nums">{activePlatforms}/4</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-2 ml-auto">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-ph-warning animate-pulse' : 'bg-ph-profit'}`} />
            <span className="text-ph-text-muted text-xs">Updated {timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
