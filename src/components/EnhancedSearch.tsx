'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface EnhancedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  recentSearches?: string[];
  onRecentSearchesChange?: (searches: string[]) => void;
  totalResults?: number;
}

const POPULAR_SEARCHES = [
  'Trump',
  'Bitcoin',
  'Fed rate',
  'Election',
  'AI',
  'Super Bowl',
  'Elon Musk',
  'Ukraine',
];

export default function EnhancedSearch({ 
  onSearch, 
  placeholder = 'Search markets...', 
  recentSearches = [],
  onRecentSearchesChange,
  totalResults,
}: EnhancedSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved && onRecentSearchesChange) {
      try {
        onRecentSearchesChange(JSON.parse(saved));
      } catch (e) {
        // Invalid JSON
      }
    }
  }, [onRecentSearchesChange]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setShowSuggestions(false);
    
    // Save to recent searches
    if (searchQuery.trim() && onRecentSearchesChange) {
      const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      onRecentSearchesChange(updated);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
  }, [recentSearches, onRecentSearchesChange]);

  const clearRecent = () => {
    if (onRecentSearchesChange) {
      onRecentSearchesChange([]);
      localStorage.removeItem('recent_searches');
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className={`relative flex items-center bg-ph-card border rounded-xl transition-all duration-200 ${
        isFocused ? 'border-ph-primary shadow-glow-blue' : 'border-subtle'
      }`}>
        <svg 
          className="absolute left-4 w-5 h-5 text-ph-text-muted" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
            }
            if (e.key === 'Escape') {
              setShowSuggestions(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent pl-12 pr-24 py-3.5 text-ph-text placeholder-ph-text-muted focus:outline-none text-base"
        />

        {/* Result count or clear button */}
        <div className="absolute right-4 flex items-center gap-2">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1.5 text-ph-text-muted hover:text-ph-text hover:bg-ph-hover rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {totalResults !== undefined && query && (
            <span className="text-xs text-ph-text-muted font-medium tabular-nums">{totalResults} results</span>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && !query && (recentSearches.length > 0 || POPULAR_SEARCHES.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-ph-card border border-subtle rounded-xl shadow-card z-50 overflow-hidden animate-fadeIn">
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="p-4 border-b border-subtle">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ph-text-muted uppercase tracking-wider">Recent Searches</span>
                <button
                  onClick={clearRecent}
                  className="text-xs text-ph-text-muted hover:text-ph-loss transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-ph-hover hover:bg-ph-bg rounded-lg text-sm text-ph-text-secondary hover:text-ph-text transition-colors"
                  >
                    <svg className="w-3 h-3 text-ph-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular searches */}
          <div className="p-4">
            <span className="text-xs font-semibold text-ph-text-muted uppercase tracking-wider mb-3 block">Popular Searches</span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((search, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(search)}
                  className="px-3 py-1.5 bg-ph-hover hover:bg-ph-primary/20 hover:text-ph-primary rounded-lg text-sm text-ph-text-secondary transition-all"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No results state */}
      {query && totalResults === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-5 bg-ph-card border border-subtle rounded-xl shadow-card z-50 text-center animate-fadeIn">
          <p className="text-ph-text-secondary mb-2">No markets found for "{query}"</p>
          <p className="text-xs text-ph-text-muted">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {POPULAR_SEARCHES.slice(0, 4).map((search, i) => (
              <button
                key={i}
                onClick={() => handleSearch(search)}
                className="px-3 py-1.5 bg-ph-hover hover:bg-ph-bg rounded-lg text-xs text-ph-text-secondary transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Highlight search terms in text
export function highlightSearchTerms(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  
  const parts = text.split(regex);
  
  return parts.map((part, i) => {
    const isMatch = terms.some(term => part.toLowerCase() === term);
    return isMatch ? (
      <mark key={i} className="bg-ph-primary/30 text-ph-primary px-0.5 rounded">
        {part}
      </mark>
    ) : part;
  });
}
