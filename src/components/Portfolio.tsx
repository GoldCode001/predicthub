'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscribeToWallet } from './WalletButton';

type PlatformType = 'polymarket' | 'kalshi' | 'manifold';

interface Position {
  id: string;
  platform: PlatformType;
  market: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  url: string;
}

interface PlatformConfig {
  name: string;
  color: string;
  icon: string;
  status: 'active' | 'coming-soon' | 'username-required';
  description: string;
}

const PLATFORMS: Record<PlatformType, PlatformConfig> = {
  polymarket: {
    name: 'Polymarket',
    color: '#8b5cf6',
    icon: '◆',
    status: 'active',
    description: 'Real money on Polygon',
  },
  kalshi: {
    name: 'Kalshi',
    color: '#3b82f6',
    icon: '◈',
    status: 'coming-soon',
    description: 'Coming soon',
  },
  manifold: {
    name: 'Manifold',
    color: '#10b981',
    icon: '◇',
    status: 'username-required',
    description: 'Play money',
  },
};

interface PlatformStatus {
  loading: boolean;
  error: string | null;
  positions: Position[];
  connected: boolean;
}

export default function Portfolio() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activePlatforms, setActivePlatforms] = useState<Set<PlatformType>>(new Set(['polymarket', 'manifold']));
  const [platformData, setPlatformData] = useState<Record<PlatformType, PlatformStatus>>({
    polymarket: { loading: false, error: null, positions: [], connected: false },
    kalshi: { loading: false, error: null, positions: [], connected: false },
    manifold: { loading: false, error: null, positions: [], connected: false },
  });
  
  // Manifold username input
  const [manifoldUsername, setManifoldUsername] = useState<string>('');
  const [manifoldInput, setManifoldInput] = useState<string>('');
  const [showManifoldInput, setShowManifoldInput] = useState(false);

  // Subscribe to wallet state changes
  useEffect(() => {
    const unsubscribe = subscribeToWallet((state) => {
      setWalletAddress(state.address);
    });
    return unsubscribe;
  }, []);

  // Load saved Manifold username
  useEffect(() => {
    const saved = localStorage.getItem('manifold_username');
    if (saved) {
      setManifoldUsername(saved);
      setManifoldInput(saved);
    }
  }, []);

  // Fetch Polymarket positions
  const fetchPolymarket = useCallback(async (address: string) => {
    setPlatformData(prev => ({
      ...prev,
      polymarket: { ...prev.polymarket, loading: true, error: null, connected: true }
    }));

    try {
      const response = await fetch(`/api/portfolio/polymarket?address=${address}`);
      const data = await response.json();

      setPlatformData(prev => ({
        ...prev,
        polymarket: {
          loading: false,
          error: data.error,
          positions: data.positions || [],
          connected: true,
        }
      }));
    } catch (err) {
      setPlatformData(prev => ({
        ...prev,
        polymarket: {
          loading: false,
          error: 'Failed to fetch',
          positions: [],
          connected: true,
        }
      }));
    }
  }, []);

  // Fetch Manifold positions
  const fetchManifold = useCallback(async (username: string) => {
    if (!username) {
      setPlatformData(prev => ({
        ...prev,
        manifold: { ...prev.manifold, connected: false, positions: [] }
      }));
      return;
    }

    setPlatformData(prev => ({
      ...prev,
      manifold: { ...prev.manifold, loading: true, error: null, connected: true }
    }));

    try {
      const response = await fetch(`/api/portfolio/manifold?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      setPlatformData(prev => ({
        ...prev,
        manifold: {
          loading: false,
          error: data.error,
          positions: data.positions || [],
          connected: true,
        }
      }));
    } catch (err) {
      setPlatformData(prev => ({
        ...prev,
        manifold: {
          loading: false,
          error: 'Failed to fetch',
          positions: [],
          connected: true,
        }
      }));
    }
  }, []);

  // Fetch all positions when wallet connects
  useEffect(() => {
    if (walletAddress) {
      fetchPolymarket(walletAddress);
    }
  }, [walletAddress, fetchPolymarket]);

  // Fetch Manifold when username is set
  useEffect(() => {
    if (manifoldUsername) {
      fetchManifold(manifoldUsername);
    }
  }, [manifoldUsername, fetchManifold]);

  const connectManifold = () => {
    if (manifoldInput.trim()) {
      localStorage.setItem('manifold_username', manifoldInput.trim());
      setManifoldUsername(manifoldInput.trim());
      setShowManifoldInput(false);
    }
  };

  const disconnectManifold = () => {
    localStorage.removeItem('manifold_username');
    setManifoldUsername('');
    setManifoldInput('');
    setPlatformData(prev => ({
      ...prev,
      manifold: { loading: false, error: null, positions: [], connected: false }
    }));
  };

  const togglePlatform = (platform: PlatformType) => {
    if (PLATFORMS[platform].status === 'coming-soon') return;
    
    setActivePlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  // Aggregate positions from all active platforms
  const allPositions = Object.entries(platformData)
    .filter(([platform]) => activePlatforms.has(platform as PlatformType))
    .flatMap(([, data]) => data.positions);

  const totalValue = allPositions.reduce((sum, p) => sum + (p.size * p.currentPrice), 0);
  const totalPnl = allPositions.reduce((sum, p) => sum + p.pnl, 0);
  const isAnyLoading = Object.values(platformData).some(d => d.loading);

  // Not connected state
  if (!walletAddress) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
          Connect your wallet to automatically track your Polymarket positions and P&L.
        </p>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-zinc-400">
              <span style={{ color: PLATFORMS.polymarket.color }}>◆</span>
              Polymarket
              <span className="text-xs text-emerald-400">Auto</span>
            </span>
            <span className="flex items-center gap-2 text-zinc-500">
              <span style={{ color: PLATFORMS.manifold.color }}>◇</span>
              Manifold
              <span className="text-xs text-zinc-500">Optional</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Read-only access. We never touch your funds.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Platform Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(Object.entries(PLATFORMS) as [PlatformType, PlatformConfig][]).map(([key, config]) => {
          const isActive = activePlatforms.has(key);
          const status = platformData[key];
          const isComingSoon = config.status === 'coming-soon';
          
          return (
            <button
              key={key}
              onClick={() => {
                if (key === 'manifold' && !manifoldUsername) {
                  setShowManifoldInput(true);
                } else {
                  togglePlatform(key);
                }
              }}
              disabled={isComingSoon}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                isComingSoon
                  ? 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : isActive 
                    ? 'bg-zinc-800 border-zinc-700 text-white' 
                    : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span style={{ color: isComingSoon ? '#52525b' : (isActive ? config.color : '#71717a') }}>
                {config.icon}
              </span>
              <span>{config.name}</span>
              
              {status.loading && (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              
              {!status.loading && isComingSoon && (
                <span className="text-xs text-zinc-600">Soon</span>
              )}
              
              {!status.loading && !isComingSoon && status.connected && (
                <span className="text-xs bg-zinc-700/50 px-1.5 py-0.5 rounded">{status.positions.length}</span>
              )}
              
              {!status.loading && key === 'manifold' && !manifoldUsername && (
                <span className="text-xs text-amber-400">+</span>
              )}
            </button>
          );
        })}

        {/* Refresh button */}
        <button
          onClick={() => {
            if (walletAddress) fetchPolymarket(walletAddress);
            if (manifoldUsername) fetchManifold(manifoldUsername);
          }}
          className="ml-auto p-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50"
          title="Refresh all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Manifold Username Input Modal */}
      {showManifoldInput && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-5">
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: PLATFORMS.manifold.color }} className="text-xl">◇</span>
              <h3 className="text-lg font-bold text-white">Connect Manifold</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Enter your Manifold username to track your play money positions.
            </p>
            <input
              type="text"
              value={manifoldInput}
              onChange={(e) => setManifoldInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connectManifold()}
              placeholder="Your Manifold username"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 mb-4 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowManifoldInput(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={connectManifold}
                disabled={!manifoldInput.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Manifold badge */}
      {manifoldUsername && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-zinc-500">Manifold:</span>
          <span className="text-emerald-400">@{manifoldUsername}</span>
          <button
            onClick={disconnectManifold}
            className="text-zinc-600 hover:text-red-400 text-xs"
          >
            disconnect
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Portfolio Value</div>
          <div className="text-2xl font-bold text-white">
            {isAnyLoading && allPositions.length === 0 ? (
              <span className="text-zinc-600">...</span>
            ) : (
              `$${totalValue.toFixed(2)}`
            )}
          </div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {isAnyLoading && allPositions.length === 0 ? (
              <span className="text-zinc-600">...</span>
            ) : (
              `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`
            )}
          </div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Positions</div>
          <div className="text-2xl font-bold text-white">
            {isAnyLoading && allPositions.length === 0 ? (
              <span className="text-zinc-600">...</span>
            ) : (
              allPositions.length
            )}
          </div>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Connected</div>
          <div className="flex items-center gap-2 mt-1">
            {platformData.polymarket.connected && (
              <span style={{ color: PLATFORMS.polymarket.color }} title="Polymarket">◆</span>
            )}
            {platformData.manifold.connected && (
              <span style={{ color: PLATFORMS.manifold.color }} title="Manifold">◇</span>
            )}
            {!platformData.polymarket.connected && !platformData.manifold.connected && (
              <span className="text-zinc-600 text-sm">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isAnyLoading && allPositions.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="shimmer h-20 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isAnyLoading && allPositions.length === 0 && (
        <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">No Open Positions</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            {!manifoldUsername 
              ? "You don't have any Polymarket positions. Add your Manifold username to see play money positions too."
              : "No open positions found on connected platforms."
            }
          </p>
          <div className="flex justify-center gap-3">
            {!manifoldUsername && (
              <button
                onClick={() => setShowManifoldInput(true)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-700 flex items-center gap-2"
              >
                <span style={{ color: PLATFORMS.manifold.color }}>◇</span>
                Add Manifold
              </button>
            )}
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500"
            >
              Trade on Polymarket
            </a>
          </div>
        </div>
      )}

      {/* Positions Table */}
      {allPositions.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/50">
            <span className="text-sm font-medium text-zinc-400">
              {allPositions.length} position{allPositions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-zinc-800/30">
            {allPositions.map((position) => {
              const config = PLATFORMS[position.platform];
              return (
                <div key={position.id} className="p-4 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                          style={{ backgroundColor: `${config.color}15`, color: config.color }}
                        >
                          {config.icon} {config.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          position.outcome === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {position.outcome}
                        </span>
                        {position.platform === 'manifold' && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-500">Play $</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-200 font-medium line-clamp-1">{position.market}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <div className="text-xs text-zinc-500">Size</div>
                        <div className="text-zinc-300 font-mono">{position.size.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Entry</div>
                        <div className="text-zinc-300 font-mono">{(position.avgPrice * 100).toFixed(0)}¢</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">Now</div>
                        <div className="text-zinc-300 font-mono">{(position.currentPrice * 100).toFixed(0)}¢</div>
                      </div>
                      <div className="min-w-[80px]">
                        <div className="text-xs text-zinc-500">P&L</div>
                        <div className={`font-mono font-semibold ${position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {position.pnl >= 0 ? '+' : ''}${Math.abs(position.pnl).toFixed(2)}
                        </div>
                      </div>
                      <a
                        href={position.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-lg transition-colors"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="mt-6 text-center text-xs text-zinc-600">
        <p>PredictHub is read-only. Positions are fetched from public APIs.</p>
      </div>
    </div>
  );
}
