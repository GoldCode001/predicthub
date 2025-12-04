'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'predicthub_watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWatchlist(new Set(parsed));
        }
      }
    } catch (e) {
      console.error('Failed to load watchlist:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...watchlist]));
      } catch (e) {
        console.error('Failed to save watchlist:', e);
      }
    }
  }, [watchlist, isLoaded]);

  const addToWatchlist = useCallback((marketId: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.add(marketId);
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((marketId: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      next.delete(marketId);
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback((marketId: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(marketId)) {
        next.delete(marketId);
      } else {
        next.add(marketId);
      }
      return next;
    });
  }, []);

  const isWatched = useCallback((marketId: string) => {
    return watchlist.has(marketId);
  }, [watchlist]);

  const clearWatchlist = useCallback(() => {
    setWatchlist(new Set());
  }, []);

  return {
    watchlist,
    watchlistCount: watchlist.size,
    isLoaded,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isWatched,
    clearWatchlist,
  };
}

// Export a singleton for global state (optional - for use outside React components)
let globalWatchlist: Set<string> = new Set();
let globalListeners: ((watchlist: Set<string>) => void)[] = [];

export function getGlobalWatchlist(): Set<string> {
  return globalWatchlist;
}

export function subscribeToWatchlist(listener: (watchlist: Set<string>) => void) {
  globalListeners.push(listener);
  return () => {
    globalListeners = globalListeners.filter(l => l !== listener);
  };
}


