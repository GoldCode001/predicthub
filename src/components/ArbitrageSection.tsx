'use client';

import { useState } from 'react';
import { ArbitrageOpportunity } from '@/utils/arbitrage';
import { PlatformBadge } from './PlatformLogo';

interface ArbitrageSectionProps {
  opportunities: ArbitrageOpportunity[];
  onMarketClick?: (marketId: string) => void;
}

export default function ArbitrageSection({ opportunities, onMarketClick }: ArbitrageSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 animate-fadeIn">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-ph-loss/10 via-ph-warning/10 to-ph-loss/10 
                   border border-ph-loss/20 rounded-xl hover:border-ph-loss/40 transition-all arbitrage-glow"
      >
        <div className="flex items-center gap-4">
          <span className="text-3xl">🔥</span>
          <div className="text-left">
            <h3 className="text-ph-text font-bold text-lg">Arbitrage Opportunities</h3>
            <p className="text-sm text-ph-text-secondary">
              {opportunities.length} opportunit{opportunities.length === 1 ? 'y' : 'ies'} detected across platforms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-ph-loss/20 text-ph-loss text-xs font-bold rounded-full border border-ph-loss/30">
            {opportunities.length} LIVE
          </span>
          <svg 
            className={`w-5 h-5 text-ph-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {opportunities.slice(0, 5).map((opp) => {
            const sortedMarkets = [...opp.markets].sort((a, b) => a.price - b.price);
            const lowest = sortedMarkets[0];
            const highest = sortedMarkets[sortedMarkets.length - 1];

            return (
              <div
                key={opp.id}
                className="relative bg-ph-card border border-subtle rounded-xl p-5 hover:border-ph-primary/30 transition-all cursor-pointer group card-hover"
                onClick={() => onMarketClick?.(lowest.market.id)}
              >
                {/* Hot badge for high difference */}
                {opp.priceDifference >= 10 && (
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-ph-loss text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                    🔥 HOT
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Event Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-ph-text font-medium line-clamp-2 group-hover:text-ph-primary transition-colors">
                      {opp.eventName}
                    </p>
                  </div>

                  {/* Price Comparison */}
                  <div className="flex items-center gap-4">
                    {/* Low Price */}
                    <div className="text-center">
                      <div className="text-xs text-ph-text-muted mb-2">Buy on</div>
                      <PlatformBadge platform={lowest.platform} size="sm" />
                      <div className="text-xl font-bold text-ph-profit mt-2 tabular-nums">
                        {lowest.price.toFixed(1)}%
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-ph-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>

                    {/* High Price */}
                    <div className="text-center">
                      <div className="text-xs text-ph-text-muted mb-2">Sell on</div>
                      <PlatformBadge platform={highest.platform} size="sm" />
                      <div className="text-xl font-bold text-ph-loss mt-2 tabular-nums">
                        {highest.price.toFixed(1)}%
                      </div>
                    </div>

                    {/* Profit */}
                    <div className="text-center pl-4 border-l border-subtle">
                      <div className="text-xs text-ph-text-muted mb-1">Spread</div>
                      <div className="text-2xl font-bold text-ph-warning tabular-nums">
                        {opp.priceDifference.toFixed(1)}%
                      </div>
                      <div className="text-xs text-ph-profit font-medium">
                        ~${(opp.priceDifference * 10).toFixed(0)} per $1k
                      </div>
                    </div>
                  </div>
                </div>

                {/* All platforms involved */}
                {opp.markets.length > 2 && (
                  <div className="mt-4 pt-4 border-t border-subtle flex items-center gap-2 text-xs text-ph-text-muted">
                    <span>Also available on:</span>
                    {opp.markets
                      .filter(m => m.platform !== lowest.platform && m.platform !== highest.platform)
                      .map(m => (
                        <PlatformBadge key={m.platform} platform={m.platform} size="sm" className="opacity-70" />
                      ))
                    }
                  </div>
                )}
              </div>
            );
          })}

          {opportunities.length > 5 && (
            <button className="w-full py-3 text-sm text-ph-text-secondary hover:text-ph-text font-medium transition-colors">
              View all {opportunities.length} opportunities →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
