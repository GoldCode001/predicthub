'use client';

import { UnifiedMarket } from '@/types/market';
import MarketTable from './MarketTable';

interface WatchlistViewProps {
  markets: UnifiedMarket[];
  watchlist: Set<string>;
  onMarketClick?: (market: UnifiedMarket) => void;
  onSetAlert?: (market: UnifiedMarket) => void;
  hasArbitrage?: (marketId: string) => boolean;
  isWatched: (marketId: string) => boolean;
  onToggleWatchlist: (marketId: string) => void;
  onClearWatchlist?: () => void;
}

export default function WatchlistView({
  markets,
  watchlist,
  onMarketClick,
  onSetAlert,
  hasArbitrage,
  isWatched,
  onToggleWatchlist,
  onClearWatchlist,
}: WatchlistViewProps) {
  // Filter markets to only show watched ones
  const watchedMarkets = markets.filter(m => watchlist.has(m.id));

  if (watchedMarkets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
        <div className="w-20 h-20 mb-6 rounded-full bg-ph-hover flex items-center justify-center">
          <svg className="w-10 h-10 text-ph-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-ph-text mb-2">No Markets Saved</h3>
        <p className="text-sm text-ph-text-secondary mb-6 max-w-md">
          Click the star icon on any market to add it to your watchlist. 
          Your watchlist is saved locally in your browser.
        </p>
        <div className="flex items-center gap-2 text-xs text-ph-text-muted bg-ph-hover px-4 py-2 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tip: Hover over a market card to see the star button
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ph-text">Your Watchlist</h2>
          <p className="text-sm text-ph-text-secondary">
            {watchedMarkets.length} market{watchedMarkets.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {onClearWatchlist && watchedMarkets.length > 0 && (
          <button
            onClick={onClearWatchlist}
            className="px-3 py-1.5 text-xs font-medium text-ph-loss hover:bg-ph-loss/10 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Markets Table */}
      <MarketTable
        markets={watchedMarkets}
        onMarketClick={onMarketClick}
        onSetAlert={onSetAlert}
        hasArbitrage={hasArbitrage}
        isWatched={isWatched}
        onToggleWatchlist={onToggleWatchlist}
      />
    </div>
  );
}

