'use client';

import { UnifiedMarket, Platform, platformNames } from '@/types/market';
import { highlightSearchTerms } from './EnhancedSearch';
import { PlatformBadge } from './PlatformLogo';

interface MarketTableProps {
  markets: UnifiedMarket[];
  searchQuery?: string;
  onMarketClick?: (market: UnifiedMarket) => void;
  onSetAlert?: (market: UnifiedMarket) => void;
  hasArbitrage?: (marketId: string) => boolean;
}

function formatVolume(volume: number, label: string): string {
  if (label === 'Forecasters' || label === 'Forecasts') {
    return `${volume.toLocaleString()} forecasts`;
  }
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays}d`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

interface MarketCardProps {
  market: UnifiedMarket;
  searchQuery?: string;
  onClick?: () => void;
  onSetAlert?: () => void;
  hasArbitrage?: boolean;
}

function MarketCard({ market, searchQuery, onClick, onSetAlert, hasArbitrage }: MarketCardProps) {
  const isHighProb = market.probability >= 70;
  const isLowProb = market.probability <= 30;

  return (
    <div className={`relative group zebra-row`}>
      {/* Arbitrage indicator */}
      {hasArbitrage && (
        <div className="absolute top-2 right-2 z-10">
          <span className="px-2 py-0.5 bg-ph-loss/20 text-ph-loss text-xs font-bold rounded-full flex items-center gap-1 border border-ph-loss/30">
            🔥 Arb
          </span>
        </div>
      )}

      <div
        onClick={onClick}
        className="block p-4 border-b border-subtle cursor-pointer table-row-hover transition-all duration-200"
      >
        <div className="flex items-start gap-4">
          {/* Platform Logo */}
          <div className="flex-shrink-0 pt-1">
            <PlatformBadge platform={market.platform} size="sm" showName={false} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Top row: Platform badge + End date */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ph-text-secondary">
                  {platformNames[market.platform]}
                </span>
                {market.isPlayMoney && (
                  <span className="text-xs text-ph-text-muted bg-ph-hover px-1.5 py-0.5 rounded">
                    Play $
                  </span>
                )}
              </div>
              <span className="text-xs text-ph-text-muted font-medium">
                {formatDate(market.endDate)}
              </span>
            </div>

            {/* Question with highlight */}
            <h3 className="text-base text-ph-text font-medium leading-snug mb-3 line-clamp-2 group-hover:text-ph-primary transition-colors">
              {searchQuery ? highlightSearchTerms(market.question, searchQuery) : market.question}
            </h3>

            {/* Bottom row: Probability + Volume + Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Probability */}
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-ph-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighProb ? 'bg-ph-profit' : isLowProb ? 'bg-ph-loss' : 'bg-ph-primary'
                      }`}
                      style={{ width: `${market.probability}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${
                    isHighProb ? 'text-ph-profit' : isLowProb ? 'text-ph-loss' : 'text-ph-primary'
                  }`}>
                    {market.probability.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Volume */}
                <span className="text-sm text-ph-text-secondary font-medium tabular-nums">
                  {formatVolume(market.volume, market.volumeLabel)}
                </span>

                {/* Quick actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetAlert?.();
                    }}
                    className="p-2 text-ph-text-muted hover:text-ph-warning hover:bg-ph-hover rounded-lg transition-all"
                    title="Set alert"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  <a
                    href={market.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-ph-text-muted hover:text-ph-profit hover:bg-ph-hover rounded-lg transition-all"
                    title="Trade"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 text-ph-text-muted group-hover:text-ph-text-secondary transition-colors pt-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketTable({ 
  markets, 
  searchQuery, 
  onMarketClick, 
  onSetAlert,
  hasArbitrage 
}: MarketTableProps) {
  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
        <div className="w-16 h-16 mb-4 rounded-full bg-ph-hover flex items-center justify-center">
          <svg className="w-8 h-8 text-ph-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-ph-text mb-1">No markets found</h3>
        <p className="text-sm text-ph-text-secondary">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="bg-ph-card rounded-xl border border-subtle overflow-hidden shadow-card animate-fadeIn">
      {/* Header */}
      <div className="px-4 py-3 border-b border-subtle bg-ph-hover sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ph-text">
            {markets.length.toLocaleString()} market{markets.length !== 1 ? 's' : ''}
            {searchQuery && <span className="text-ph-text-secondary"> matching "{searchQuery}"</span>}
          </span>
          <div className="hidden md:flex items-center gap-4 text-xs text-ph-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-polymarket" /> Polymarket
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-kalshi" /> Kalshi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-manifold" /> Manifold
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-metaculus" /> Metaculus
            </span>
          </div>
        </div>
      </div>

      {/* Markets list */}
      <div>
        {markets.map((market) => (
          <MarketCard 
            key={market.id} 
            market={market} 
            searchQuery={searchQuery}
            onClick={() => onMarketClick?.(market)}
            onSetAlert={() => onSetAlert?.(market)}
            hasArbitrage={hasArbitrage?.(market.id)}
          />
        ))}
      </div>
    </div>
  );
}
