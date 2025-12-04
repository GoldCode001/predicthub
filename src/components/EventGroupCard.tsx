'use client';

import { useState } from 'react';
import { UnifiedMarket, platformNames, categoryLabels } from '@/types/market';
import { PlatformBadge } from './PlatformLogo';
import { EventGroup } from '@/utils/grouping';

interface EventGroupCardProps {
  group: EventGroup;
  onMarketClick?: (market: UnifiedMarket) => void;
  onSetAlert?: (market: UnifiedMarket) => void;
  isWatched?: (marketId: string) => boolean;
  onToggleWatchlist?: (marketId: string) => void;
}

function formatVolume(vol: number): string {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

export default function EventGroupCard({ 
  group, 
  onMarketClick, 
  onSetAlert,
  isWatched,
  onToggleWatchlist,
}: EventGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Single market groups render differently
  if (group.markets.length === 1) {
    const market = group.markets[0];
    return (
      <div 
        className="bg-ph-card rounded-xl border border-subtle p-4 cursor-pointer hover:border-ph-primary/30 transition-all"
        onClick={() => onMarketClick?.(market)}
      >
        <div className="flex items-start gap-3">
          <PlatformBadge platform={market.platform} size="sm" showName={false} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-ph-text line-clamp-2">{market.question}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-ph-text-secondary">
              <span>{formatVolume(market.volume)}</span>
              <span className="font-bold text-ph-primary">{market.probability.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-ph-card rounded-xl border border-subtle overflow-hidden hover:border-ph-primary/30 transition-all">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-ph-hover/30 transition-colors"
      >
        {/* Platform icons */}
        <div className="flex -space-x-2">
          {group.platforms.slice(0, 3).map((platform, i) => (
            <div key={platform} className="relative" style={{ zIndex: 3 - i }}>
              <PlatformBadge platform={platform} size="sm" showName={false} />
            </div>
          ))}
          {group.platforms.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-ph-hover flex items-center justify-center text-xs font-bold text-ph-text-secondary">
              +{group.platforms.length - 3}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Group name */}
          <h3 className="text-base font-semibold text-ph-text line-clamp-2">{group.name}</h3>
          
          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="text-ph-text-secondary">
              {group.markets.length} markets
            </span>
            <span className="text-ph-profit font-medium">
              {formatVolume(group.totalVolume)}
            </span>
            <span className="px-2 py-0.5 rounded bg-ph-hover text-ph-text-muted">
              {categoryLabels[group.category as keyof typeof categoryLabels]}
            </span>
            <span className="text-ph-primary font-bold">
              ~{group.avgProbability.toFixed(0)}% avg
            </span>
          </div>
        </div>
        
        {/* Expand/collapse icon */}
        <svg 
          className={`w-5 h-5 text-ph-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Expanded markets list */}
      {isExpanded && (
        <div className="border-t border-subtle">
          {group.markets.map((market, index) => (
            <div
              key={market.id}
              className={`p-3 px-4 flex items-center gap-3 cursor-pointer hover:bg-ph-hover/50 transition-colors ${
                index !== group.markets.length - 1 ? 'border-b border-subtle/50' : ''
              }`}
              onClick={() => onMarketClick?.(market)}
            >
              <PlatformBadge platform={market.platform} size="sm" showName={false} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ph-text-secondary line-clamp-1">{market.question}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-ph-text-muted">
                  {formatVolume(market.volume)}
                </span>
                <span className={`text-sm font-bold tabular-nums ${
                  market.probability >= 70 ? 'text-ph-profit' :
                  market.probability <= 30 ? 'text-ph-loss' : 'text-ph-primary'
                }`}>
                  {market.probability.toFixed(0)}%
                </span>
                
                {/* Quick actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist?.(market.id);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    isWatched?.(market.id) 
                      ? 'text-ph-warning' 
                      : 'text-ph-text-muted hover:text-ph-warning'
                  }`}
                  title={isWatched?.(market.id) ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <svg className="w-3.5 h-3.5" fill={isWatched?.(market.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Grid view for event groups
interface EventGroupGridProps {
  groups: EventGroup[];
  onMarketClick?: (market: UnifiedMarket) => void;
  onSetAlert?: (market: UnifiedMarket) => void;
  isWatched?: (marketId: string) => boolean;
  onToggleWatchlist?: (marketId: string) => void;
}

export function EventGroupGrid({ 
  groups, 
  onMarketClick, 
  onSetAlert,
  isWatched,
  onToggleWatchlist,
}: EventGroupGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-12 h-12 text-ph-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-lg font-semibold text-ph-text mb-1">No groups found</h3>
        <p className="text-sm text-ph-text-secondary">Try adjusting your filters</p>
      </div>
    );
  }

  // Separate multi-market groups from singles
  const multiGroups = groups.filter(g => g.markets.length >= 2);
  const singles = groups.filter(g => g.markets.length === 1);

  return (
    <div className="space-y-6">
      {/* Multi-market groups */}
      {multiGroups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-ph-text">Event Groups</span>
            <span className="text-xs text-ph-text-muted bg-ph-hover px-2 py-0.5 rounded-full">
              {multiGroups.length} groups
            </span>
          </div>
          <div className="space-y-3">
            {multiGroups.map(group => (
              <EventGroupCard
                key={group.id}
                group={group}
                onMarketClick={onMarketClick}
                onSetAlert={onSetAlert}
                isWatched={isWatched}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        </div>
      )}

      {/* Single markets */}
      {singles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-ph-text">Individual Markets</span>
            <span className="text-xs text-ph-text-muted bg-ph-hover px-2 py-0.5 rounded-full">
              {singles.length} markets
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {singles.map(group => (
              <EventGroupCard
                key={group.id}
                group={group}
                onMarketClick={onMarketClick}
                onSetAlert={onSetAlert}
                isWatched={isWatched}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


