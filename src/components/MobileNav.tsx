'use client';

import { useState } from 'react';
import { Platform, platformNames, PlatformStatus } from '@/types/market';
import WalletButton from './WalletButton';
import { PlatformIcon } from './PlatformLogo';

interface MobileNavProps {
  platforms: Platform[];
  activePlatforms: Set<Platform>;
  platformStatus: Record<Platform, PlatformStatus>;
  onToggle: (platform: Platform) => void;
  totalMarkets: number;
  activeTab: 'markets' | 'portfolio' | 'watchlist';
  onTabChange: (tab: 'markets' | 'portfolio' | 'watchlist') => void;
  watchlistCount?: number;
}

export default function MobileNav({
  platforms,
  activePlatforms,
  platformStatus,
  onToggle,
  totalMarkets,
  activeTab,
  onTabChange,
  watchlistCount = 0,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-ph-card/95 backdrop-blur-sm border-b border-subtle z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-premium flex items-center justify-center shadow-glow-blue">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-lg font-bold gradient-text">PredictHub</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="scale-90">
            <WalletButton />
          </div>
          <button 
            onClick={() => setIsOpen(true)} 
            className="text-ph-text-secondary hover:text-ph-text transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab buttons below header */}
      <div className="flex gap-1 px-4 pb-3">
        <button
          onClick={() => onTabChange('markets')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'markets'
              ? 'bg-ph-hover text-ph-text'
              : 'text-ph-text-secondary'
          }`}
        >
          Markets
        </button>
        <button
          onClick={() => onTabChange('watchlist')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all relative ${
            activeTab === 'watchlist'
              ? 'bg-ph-hover text-ph-text'
              : 'text-ph-text-secondary'
          }`}
        >
          Watchlist
          {watchlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-ph-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {watchlistCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('portfolio')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'portfolio'
              ? 'bg-ph-hover text-ph-text'
              : 'text-ph-text-secondary'
          }`}
        >
          Portfolio
        </button>
      </div>

      {/* Slide-out panel */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-ph-card border-l border-subtle z-50 overflow-y-auto animate-fadeIn">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <span className="font-bold text-ph-text">Filters</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-ph-text-muted hover:text-ph-text rounded-lg hover:bg-ph-hover transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-subtle">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ph-bg rounded-xl p-3">
                  <div className="text-2xl font-bold text-ph-text tabular-nums">{totalMarkets.toLocaleString()}</div>
                  <div className="text-xs text-ph-text-muted">Markets</div>
                </div>
                <div className="bg-ph-bg rounded-xl p-3">
                  <div className="text-2xl font-bold text-ph-text tabular-nums">{platforms.filter(p => activePlatforms.has(p)).length}</div>
                  <div className="text-xs text-ph-text-muted">Active Sources</div>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="p-4">
              <div className="text-xs font-semibold text-ph-text-muted uppercase tracking-wider mb-3">Data Sources</div>
              <div className="space-y-2">
                {platforms.map((platform) => {
                  const status = platformStatus[platform];
                  const isActive = activePlatforms.has(platform);
                  
                  return (
                    <button
                      key={platform}
                      onClick={() => onToggle(platform)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-ph-hover border border-subtle' 
                          : 'border border-transparent hover:bg-ph-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={platform} size="md" />
                        <span className={`font-medium ${isActive ? 'text-ph-text' : 'text-ph-text-secondary'}`}>
                          {platformNames[platform]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.loading ? (
                          <div className="w-2 h-2 rounded-full bg-ph-warning animate-pulse" />
                        ) : status.error ? (
                          <div className="w-2 h-2 rounded-full bg-ph-loss" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-ph-profit" />
                        )}
                        <span className="text-sm tabular-nums text-ph-text-secondary">
                          {status.loading ? '...' : status.marketCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
