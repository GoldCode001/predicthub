'use client';

import { ReactNode } from 'react';
import { Platform, platformNames, PlatformStatus } from '@/types/market';
import WalletButton from './WalletButton';
import { PlatformIcon } from './PlatformLogo';

interface SidebarProps {
  platforms: Platform[];
  activePlatforms: Set<Platform>;
  platformStatus: Record<Platform, PlatformStatus>;
  onToggle: (platform: Platform) => void;
  totalMarkets: number;
  activeTab: 'markets' | 'portfolio';
  onTabChange: (tab: 'markets' | 'portfolio') => void;
  advancedFilters?: ReactNode;
  alertsPanel?: ReactNode;
}

const platformConfig: Record<Platform, { color: string; description: string }> = {
  polymarket: {
    color: '#8b5cf6',
    description: 'Real money predictions',
  },
  kalshi: {
    color: '#3b82f6',
    description: 'CFTC regulated exchange',
  },
  manifold: {
    color: '#22c55e',
    description: 'Play money markets',
  },
  metaculus: {
    color: '#f59e0b',
    description: 'Forecasting community',
  },
};

export default function Sidebar({
  platforms,
  activePlatforms,
  platformStatus,
  onToggle,
  totalMarkets,
  activeTab,
  onTabChange,
  advancedFilters,
  alertsPanel,
}: SidebarProps) {
  const activeCount = platforms.filter(p => activePlatforms.has(p)).length;

  return (
    <aside className="sidebar fixed left-0 top-0 h-screen w-[280px] flex flex-col z-50 hidden lg:flex bg-ph-card border-r border-subtle">
      {/* Logo/Brand */}
      <div className="p-5 border-b border-subtle">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-premium flex items-center justify-center shadow-glow-blue overflow-hidden">
            <img
              src="/@favicon.svg"
              alt="PredictHub logo"
              className="w-10 h-10 object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">PredictHub</h1>
            <p className="text-xs text-ph-text-muted">Market Aggregator</p>
          </div>
        </div>

        {/* Wallet Button */}
        <WalletButton />
      </div>

      {/* Navigation Tabs */}
      <div className="p-3 border-b border-subtle">
        <div className="flex gap-1 p-1 bg-ph-bg rounded-lg">
          <button
            onClick={() => onTabChange('markets')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'markets'
                ? 'bg-ph-hover text-ph-text shadow-sm'
                : 'text-ph-text-secondary hover:text-ph-text'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Markets
          </button>
          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-ph-hover text-ph-text shadow-sm'
                : 'text-ph-text-secondary hover:text-ph-text'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Portfolio
          </button>
        </div>
      </div>

      {/* Stats - Only show on Markets tab */}
      {activeTab === 'markets' && (
        <div className="p-4 border-b border-subtle">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ph-bg rounded-xl p-4">
              <div className="text-3xl font-bold text-ph-text tabular-nums">{totalMarkets.toLocaleString()}</div>
              <div className="text-xs text-ph-text-muted mt-1">Total Markets</div>
            </div>
            <div className="bg-ph-bg rounded-xl p-4">
              <div className="text-3xl font-bold text-ph-text tabular-nums">{activeCount}</div>
              <div className="text-xs text-ph-text-muted mt-1">Sources Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Filters - Only show on Markets tab */}
      {activeTab === 'markets' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-semibold text-ph-text-muted uppercase tracking-wider mb-3">
            Data Sources
          </div>
          <div className="space-y-2">
            {platforms.map((platform) => {
              const config = platformConfig[platform];
              const status = platformStatus[platform];
              const isActive = activePlatforms.has(platform);

              return (
                <button
                  key={platform}
                  onClick={() => onToggle(platform)}
                  className={`
                    w-full text-left rounded-xl p-3 transition-all duration-200 card-hover
                    ${isActive 
                      ? 'bg-ph-hover border border-subtle' 
                      : 'bg-transparent border border-transparent hover:border-subtle'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={platform} size="lg" />
                      <div>
                        <div className={`font-semibold ${isActive ? 'text-ph-text' : 'text-ph-text-secondary'}`}>
                          {platformNames[platform]}
                        </div>
                        <div className="text-xs text-ph-text-muted">
                          {config.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.loading ? (
                        <div className="w-2 h-2 rounded-full bg-ph-warning animate-pulse" />
                      ) : status.error ? (
                        <div className="w-2 h-2 rounded-full bg-ph-loss" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-ph-profit" />
                      )}
                      <span className={`text-sm font-semibold tabular-nums ${isActive ? 'text-ph-text' : 'text-ph-text-muted'}`}>
                        {status.loading ? '...' : status.marketCount}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Advanced Filters */}
          {advancedFilters && (
            <div className="mt-4">
              {advancedFilters}
            </div>
          )}

          {/* Alerts Panel */}
          {alertsPanel}
        </div>
      )}

      {/* Portfolio info - Only show on Portfolio tab */}
      {activeTab === 'portfolio' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-semibold text-ph-text-muted uppercase tracking-wider mb-3">
            Supported Platforms
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-ph-bg rounded-xl border border-subtle">
              <PlatformIcon platform="polymarket" size="lg" />
              <div className="flex-1">
                <div className="text-sm text-ph-text font-semibold">Polymarket</div>
                <div className="text-xs text-ph-profit">✓ Connected via wallet</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-ph-bg rounded-xl border border-subtle">
              <PlatformIcon platform="manifold" size="lg" />
              <div className="flex-1">
                <div className="text-sm text-ph-text font-semibold">Manifold</div>
                <div className="text-xs text-ph-text-secondary">Via username</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-ph-bg rounded-xl border border-subtle opacity-50">
              <PlatformIcon platform="kalshi" size="lg" />
              <div className="flex-1">
                <div className="text-sm text-ph-text-secondary font-semibold">Kalshi</div>
                <div className="text-xs text-ph-text-muted">Coming soon</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-ph-bg rounded-xl border border-subtle">
            <div className="text-xs text-ph-text-muted mb-2 font-semibold">Security Note</div>
            <p className="text-xs text-ph-text-secondary leading-relaxed">
              Portfolio tracking reads your public on-chain data. We never have access to your private keys or funds.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-subtle">
        <div className="text-xs text-ph-text-muted text-center">
          Real-time data from 4 platforms
        </div>
      </div>
    </aside>
  );
}
