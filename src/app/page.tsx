'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { 
  UnifiedMarket, 
  Platform, 
  Category,
  PlatformStatus,
} from '@/types/market';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import MarketTable from '@/components/MarketTable';
import FilterBar, { SortField, SortDirection, ViewMode } from '@/components/FilterBar';
import { EventGroupGrid } from '@/components/EventGroupCard';
import { groupMarketsByEvent } from '@/utils/grouping';
import Portfolio from '@/components/Portfolio';
import QuickStats from '@/components/QuickStats';
import TrendingSection from '@/components/TrendingSection';
import ArbitrageSection from '@/components/ArbitrageSection';
import MarketDetailModal from '@/components/MarketDetailModal';
import AlertModal, { Alert } from '@/components/AlertModal';
import EnhancedSearch from '@/components/EnhancedSearch';
import PremiumBanner from '@/components/PremiumBanner';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import AlertsPanel from '@/components/AlertsPanel';
import PlatformLogo from '@/components/PlatformLogo';
import WatchlistView from '@/components/WatchlistView';
import { useWatchlist } from '@/hooks/useWatchlist';
import { findArbitrageOpportunities, ArbitrageOpportunity } from '@/utils/arbitrage';

const ALL_PLATFORMS: Platform[] = ['polymarket', 'kalshi', 'manifold', 'metaculus'];
const ALL_CATEGORIES: Category[] = ['politics', 'crypto', 'sports', 'technology', 'economics', 'science', 'entertainment', 'world', 'other'];

const PLATFORM_ENDPOINTS: { platform: Platform; url: string }[] = [
  { platform: 'polymarket', url: '/api/markets/polymarket' },
  { platform: 'kalshi', url: '/api/markets/kalshi' },
  { platform: 'manifold', url: '/api/markets/manifold' },
  { platform: 'metaculus', url: '/api/markets/metaculus' },
];

interface PlatformResponse {
  markets: UnifiedMarket[];
  error: string | null;
}

export default function Home() {
  const [allMarkets, setAllMarkets] = useState<UnifiedMarket[]>([]);
  const [platformStatus, setPlatformStatus] = useState<Record<Platform, PlatformStatus>>(() => {
    const initial: Record<Platform, PlatformStatus> = {} as Record<Platform, PlatformStatus>;
    ALL_PLATFORMS.forEach(p => {
      initial[p] = { platform: p, loading: true, error: null, marketCount: 0 };
    });
    return initial;
  });

  // Basic filters
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set(ALL_PLATFORMS));
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState<'markets' | 'portfolio' | 'watchlist'>('markets');

  // Watchlist
  const { watchlist, watchlistCount, isWatched, toggleWatchlist, clearWatchlist } = useWatchlist();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    volumeRange: [0, 10000000],
    probabilityRange: [0, 100],
    endingWithin: 'all',
    categories: new Set(ALL_CATEGORIES),
  });

  // Modals
  const [selectedMarket, setSelectedMarket] = useState<UnifiedMarket | null>(null);
  const [alertMarket, setAlertMarket] = useState<UnifiedMarket | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Arbitrage opportunities
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load alerts from localStorage
  useEffect(() => {
    const savedAlerts = localStorage.getItem('price_alerts');
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        // Invalid JSON
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('price_alerts', JSON.stringify(alerts));
  }, [alerts]);

// Fetch all platforms concurrently on mount
useEffect(() => {
  let cancelled = false;

  const loadMarkets = async () => {
    const loadingStatus: Record<Platform, PlatformStatus> = {} as Record<Platform, PlatformStatus>;
    PLATFORM_ENDPOINTS.forEach(({ platform }) => {
      loadingStatus[platform] = {
        platform,
        loading: true,
        error: null,
        marketCount: 0,
      };
    });
    setPlatformStatus(loadingStatus);

    const responses = await Promise.allSettled(
      PLATFORM_ENDPOINTS.map(({ platform, url }) =>
        fetch(url).then(async (res) => ({
          platform,
          ok: res.ok,
          data: (await res.json()) as PlatformResponse,
        }))
      )
    );

    if (cancelled) return;

    const aggregatedMarkets: UnifiedMarket[] = [];
    const nextStatus: Record<Platform, PlatformStatus> = {} as Record<Platform, PlatformStatus>;

    responses.forEach((result, index) => {
      const { platform } = PLATFORM_ENDPOINTS[index];

      if (result.status === 'fulfilled' && result.value.ok) {
        const markets = Array.isArray(result.value.data?.markets) ? result.value.data.markets : [];
        aggregatedMarkets.push(...markets);
        nextStatus[platform] = {
          platform,
          loading: false,
          error: result.value.data?.error,
          marketCount: markets.length,
        };
      } else if (result.status === 'fulfilled') {
        nextStatus[platform] = {
          platform,
          loading: false,
          error: result.value.data?.error || 'Failed to fetch markets',
          marketCount: 0,
        };
      } else {
        nextStatus[platform] = {
          platform,
          loading: false,
          error: result.reason instanceof Error ? result.reason.message : 'Failed to fetch markets',
          marketCount: 0,
        };
      }
    });

    if (!cancelled) {
      setPlatformStatus(nextStatus);
      setAllMarkets(aggregatedMarkets);
    }
  };

  loadMarkets();

  return () => {
    cancelled = true;
  };
}, []);

  // Calculate arbitrage opportunities when markets change
  useEffect(() => {
    if (allMarkets.length > 0) {
      const opportunities = findArbitrageOpportunities(allMarkets, 3);
      setArbitrageOpportunities(opportunities);
    }
  }, [allMarkets]);

  // Check alerts
  useEffect(() => {
    const checkAlerts = () => {
      const updatedAlerts = alerts.map(alert => {
        if (alert.triggered) return alert;
        
        const market = allMarkets.find(m => m.id === alert.marketId);
        if (!market) return alert;

        const triggered = alert.condition === 'above' 
          ? market.probability >= alert.threshold
          : market.probability <= alert.threshold;

        if (triggered && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('PredictHub Price Alert', {
            body: `${market.question} is now at ${market.probability.toFixed(1)}%`,
            icon: '/favicon.ico',
          });
        }

        return { ...alert, triggered };
      });

      if (JSON.stringify(updatedAlerts) !== JSON.stringify(alerts)) {
        setAlerts(updatedAlerts);
      }
    };

    checkAlerts();
  }, [allMarkets, alerts]);

  // Toggle platform filter
  const handlePlatformToggle = useCallback((platform: Platform) => {
    setActivePlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  // Add alert
  const handleAddAlert = useCallback((alert: Alert) => {
    setAlerts(prev => [...prev, alert]);
  }, []);

  // Delete alert
  const handleDeleteAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<Category | 'all', number> = { all: 0 } as Record<Category | 'all', number>;
    ALL_CATEGORIES.forEach(c => counts[c] = 0);
    
    allMarkets
      .filter(m => activePlatforms.has(m.platform))
      .forEach(m => {
        counts[m.category] = (counts[m.category] || 0) + 1;
        counts['all']++;
      });
    
    return counts;
  }, [allMarkets, activePlatforms]);

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let result = allMarkets;

    // Platform filter
    result = result.filter(m => activePlatforms.has(m.platform));

    // Category filter (basic)
    if (activeCategory !== 'all') {
      result = result.filter(m => m.category === activeCategory);
    }

    // Advanced filters
    result = result.filter(m => {
      // Volume range
      if (m.volume < advancedFilters.volumeRange[0] || m.volume > advancedFilters.volumeRange[1]) {
        return false;
      }

      // Probability range
      if (m.probability < advancedFilters.probabilityRange[0] || m.probability > advancedFilters.probabilityRange[1]) {
        return false;
      }

      // Ending within
      if (advancedFilters.endingWithin !== 'all' && m.endDate) {
        const endDate = new Date(m.endDate);
        const now = new Date();
        const diffHours = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (advancedFilters.endingWithin === '24h' && diffHours > 24) return false;
        if (advancedFilters.endingWithin === 'week' && diffHours > 24 * 7) return false;
        if (advancedFilters.endingWithin === 'month' && diffHours > 24 * 30) return false;
      }

      // Categories
      if (!advancedFilters.categories.has(m.category)) {
        return false;
      }

      return true;
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.question.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'volume':
          comparison = a.volume - b.volume;
          break;
        case 'probability':
          comparison = a.probability - b.probability;
          break;
        case 'endDate':
          const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allMarkets, activePlatforms, activeCategory, searchQuery, sortField, sortDirection, advancedFilters]);

  // Find similar markets for selected market
  const similarMarkets = useMemo(() => {
    if (!selectedMarket) return [];
    return allMarkets
      .filter(m => 
        m.id !== selectedMarket.id && 
        m.platform !== selectedMarket.platform &&
        m.category === selectedMarket.category
      )
      .slice(0, 5);
  }, [selectedMarket, allMarkets]);

  // Group markets by event
  const groupedMarkets = useMemo(() => {
    return groupMarketsByEvent(filteredMarkets, 0.4);
  }, [filteredMarkets]);

  // Check if market has arbitrage opportunity
  const hasArbitrage = useCallback((marketId: string) => {
    return arbitrageOpportunities.some(opp => 
      opp.markets.some(m => m.market.id === marketId)
    );
  }, [arbitrageOpportunities]);

  const isAnyLoading = Object.values(platformStatus).some(s => s.loading);

  return (
    <div className="min-h-screen bg-ph-bg bg-pattern">
      {/* Quick Stats Bar */}
      <div className="pt-[120px] lg:pt-0 lg:ml-[280px]">
        <QuickStats markets={allMarkets} platformStatus={platformStatus} />
      </div>

      {/* Sidebar - Desktop */}
      <Sidebar
        platforms={ALL_PLATFORMS}
        activePlatforms={activePlatforms}
        platformStatus={platformStatus}
        onToggle={handlePlatformToggle}
        totalMarkets={allMarkets.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        watchlistCount={watchlistCount}
        advancedFilters={
          <AdvancedFilters
            filters={advancedFilters}
            onChange={setAdvancedFilters}
            totalMarkets={allMarkets.length}
            filteredCount={filteredMarkets.length}
          />
        }
        alertsPanel={
          <AlertsPanel alerts={alerts} onDeleteAlert={handleDeleteAlert} />
        }
      />

      {/* Mobile Navigation */}
      <MobileNav
        platforms={ALL_PLATFORMS}
        activePlatforms={activePlatforms}
        platformStatus={platformStatus}
        onToggle={handlePlatformToggle}
        totalMarkets={allMarkets.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        watchlistCount={watchlistCount}
      />

      {/* Main Content */}
      <main className="lg:ml-[280px] min-h-screen relative z-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-ph-bg/95 backdrop-blur-sm border-b border-subtle pt-[60px] lg:pt-0">
          <div className="px-4 lg:px-6 py-4">
            {activeTab === 'markets' && (
              <>
                {/* Enhanced Search */}
                <div className="mb-4">
                  <EnhancedSearch
                    onSearch={setSearchQuery}
                    placeholder="Search markets, questions, topics..."
                    recentSearches={recentSearches}
                    onRecentSearchesChange={setRecentSearches}
                    totalResults={searchQuery ? filteredMarkets.length : undefined}
                  />
                </div>

                {/* Filters */}
                <FilterBar
                  categories={ALL_CATEGORIES}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  marketCounts={categoryCounts}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 lg:px-6 py-6">
          {activeTab === 'markets' ? (
            <>
              {/* Premium Banner */}
              <PremiumBanner />

              {/* Arbitrage Opportunities */}
              {arbitrageOpportunities.length > 0 && (
                <ArbitrageSection
                  opportunities={arbitrageOpportunities}
                  onMarketClick={(marketId) => {
                    const market = allMarkets.find(m => m.id === marketId);
                    if (market) setSelectedMarket(market);
                  }}
                />
              )}

              {/* Trending Section */}
              {!searchQuery && allMarkets.length > 0 && (
                <TrendingSection 
                  markets={allMarkets} 
                  onMarketClick={setSelectedMarket}
                />
              )}

              {/* Markets Table or Grouped View */}
              {isAnyLoading && allMarkets.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="shimmer h-24 rounded-xl" />
                  ))}
                </div>
              ) : viewMode === 'grouped' ? (
                <EventGroupGrid
                  groups={groupedMarkets}
                  onMarketClick={setSelectedMarket}
                  onSetAlert={setAlertMarket}
                  isWatched={isWatched}
                  onToggleWatchlist={toggleWatchlist}
                />
              ) : (
                <MarketTable 
                  markets={filteredMarkets}
                  searchQuery={searchQuery}
                  onMarketClick={setSelectedMarket}
                  onSetAlert={setAlertMarket}
                  hasArbitrage={hasArbitrage}
                  isWatched={isWatched}
                  onToggleWatchlist={toggleWatchlist}
                />
              )}
            </>
          ) : activeTab === 'watchlist' ? (
            <WatchlistView
              markets={allMarkets}
              watchlist={watchlist}
              onMarketClick={setSelectedMarket}
              onSetAlert={setAlertMarket}
              hasArbitrage={hasArbitrage}
              isWatched={isWatched}
              onToggleWatchlist={toggleWatchlist}
              onClearWatchlist={clearWatchlist}
            />
          ) : (
            <Portfolio />
          )}
        </div>

        {/* Footer */}
        <footer className="px-4 lg:px-6 py-8 border-t border-subtle">
          {/* Data from section */}
          <div className="mb-6 text-center">
            <p className="text-xs text-ph-text-muted mb-3 font-medium uppercase tracking-wider">Data from</p>
            <div className="flex items-center justify-center gap-6">
              {ALL_PLATFORMS.map(platform => (
                <PlatformLogo 
                  key={platform} 
                  platform={platform} 
                  size="lg" 
                  showName={true}
                  linkToSite={true}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ph-text-muted pt-6 border-t border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <Image
                  src="/@favicon.svg"
                  alt="PredictHub logo"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-ph-text gradient-text text-lg">PredictHub</span>
            </div>
            <p className="text-xs text-ph-text-muted text-center max-w-md">
              PredictHub is an independent aggregator. Not affiliated with any platform. 
              Market data is for informational purposes only.
            </p>
          </div>
        </footer>
      </main>

      {/* Market Detail Modal */}
      {selectedMarket && (
        <MarketDetailModal
          market={selectedMarket}
          similarMarkets={similarMarkets}
          onClose={() => setSelectedMarket(null)}
          onSetAlert={setAlertMarket}
        />
      )}

      {/* Alert Modal */}
      {alertMarket && (
        <AlertModal
          market={alertMarket}
          onClose={() => setAlertMarket(null)}
          onSave={handleAddAlert}
        />
      )}
    </div>
  );
}
