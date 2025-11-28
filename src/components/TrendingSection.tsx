'use client';

import { useEffect, useState } from 'react';
import { UnifiedMarket } from '@/types/market';
import { PlatformBadge } from './PlatformLogo';

interface TrendingSectionProps {
  markets: UnifiedMarket[];
  onMarketClick?: (market: UnifiedMarket) => void;
}

export default function TrendingSection({ markets, onMarketClick }: TrendingSectionProps) {
  const [countdown, setCountdown] = useState(60);

  // Countdown for auto-refresh indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get top 5 by volume
  const trending = [...markets]
    .filter(m => m.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  if (trending.length === 0) return null;

  return (
    <div className="mb-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <h2 className="text-xl font-bold text-ph-text">Trending Now</h2>
            <span className="text-xs text-ph-text-muted">by 24h volume</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-ph-text-muted">
          <div className="w-4 h-4 rounded-full border-2 border-ph-text-muted border-t-ph-primary animate-spin" />
          <span>Refreshing in {countdown}s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {trending.map((market, index) => (
          <div
            key={market.id}
            onClick={() => onMarketClick?.(market)}
            className="relative bg-ph-card border border-subtle rounded-xl p-4 
                       hover:border-ph-primary/30 hover:shadow-glow-blue transition-all duration-300 
                       cursor-pointer overflow-hidden group card-hover"
          >
            {/* Gradient overlay based on platform */}
            <div 
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${
                  market.platform === 'polymarket' ? '#8b5cf6' :
                  market.platform === 'kalshi' ? '#3b82f6' :
                  market.platform === 'manifold' ? '#22c55e' : '#f59e0b'
                }20 0%, transparent 100%)`
              }}
            />

            {/* Rank badge */}
            <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-ph-bg/80 backdrop-blur flex items-center justify-center text-sm font-bold text-ph-text">
              #{index + 1}
            </div>

            {/* Platform badge */}
            <div className="absolute top-3 right-3">
              <PlatformBadge platform={market.platform} size="sm" showName={false} />
            </div>

            {/* Content */}
            <div className="mt-8 relative">
              <p className="text-sm text-ph-text font-medium line-clamp-2 mb-4 group-hover:text-ph-primary transition-colors min-h-[40px]">
                {market.question}
              </p>

              <div className="flex items-center justify-between">
                {/* Probability */}
                <div>
                  <div className="text-xs text-ph-text-muted mb-1">Probability</div>
                  <div className={`text-2xl font-bold tabular-nums ${
                    market.probability >= 70 ? 'text-ph-profit' :
                    market.probability <= 30 ? 'text-ph-loss' : 'text-ph-text'
                  }`}>
                    {market.probability.toFixed(0)}%
                  </div>
                </div>

                {/* Volume */}
                <div className="text-right">
                  <div className="text-xs text-ph-text-muted mb-1">Volume</div>
                  <div className="text-lg font-bold text-ph-profit tabular-nums">
                    ${market.volume >= 1000000 
                      ? `${(market.volume / 1000000).toFixed(1)}M`
                      : market.volume >= 1000 
                        ? `${(market.volume / 1000).toFixed(0)}K`
                        : market.volume.toFixed(0)
                    }
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-ph-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-premium rounded-full transition-all duration-500"
                  style={{ width: `${market.probability}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
