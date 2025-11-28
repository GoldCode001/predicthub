'use client';

import { useState } from 'react';
import { Category, categoryLabels } from '@/types/market';

export interface FilterState {
  volumeRange: [number, number];
  probabilityRange: [number, number];
  endingWithin: 'all' | '24h' | 'week' | 'month';
  categories: Set<Category>;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalMarkets: number;
  filteredCount: number;
}

export default function AdvancedFilters({ filters, onChange, totalMarkets, filteredCount }: AdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(true);

  const updateFilters = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const toggleCategory = (category: Category) => {
    const newCategories = new Set(filters.categories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    updateFilters({ categories: newCategories });
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };

  const allCategories: Category[] = ['politics', 'crypto', 'sports', 'technology', 'economics', 'science', 'entertainment', 'world', 'other'];

  return (
    <div className="border-t border-subtle pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs font-semibold text-ph-text-muted uppercase tracking-wider mb-4"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Advanced Filters
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="space-y-5">
          {/* Volume Range */}
          <div>
            <label className="block text-xs text-ph-text-muted mb-2 font-medium">
              Volume: {formatVolume(filters.volumeRange[0])} - {formatVolume(filters.volumeRange[1])}
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="10000000"
                step="10000"
                value={filters.volumeRange[0]}
                onChange={(e) => updateFilters({ 
                  volumeRange: [Number(e.target.value), filters.volumeRange[1]] 
                })}
                className="flex-1 h-2 bg-ph-bg rounded-full appearance-none cursor-pointer accent-ph-primary"
              />
              <input
                type="range"
                min="0"
                max="10000000"
                step="10000"
                value={filters.volumeRange[1]}
                onChange={(e) => updateFilters({ 
                  volumeRange: [filters.volumeRange[0], Number(e.target.value)] 
                })}
                className="flex-1 h-2 bg-ph-bg rounded-full appearance-none cursor-pointer accent-ph-primary"
              />
            </div>
          </div>

          {/* Probability Range */}
          <div>
            <label className="block text-xs text-ph-text-muted mb-2 font-medium">
              Probability: {filters.probabilityRange[0]}% - {filters.probabilityRange[1]}%
            </label>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.probabilityRange[0]}
                onChange={(e) => updateFilters({ 
                  probabilityRange: [Number(e.target.value), filters.probabilityRange[1]] 
                })}
                className="flex-1 h-2 bg-ph-bg rounded-full appearance-none cursor-pointer accent-ph-primary"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.probabilityRange[1]}
                onChange={(e) => updateFilters({ 
                  probabilityRange: [filters.probabilityRange[0], Number(e.target.value)] 
                })}
                className="flex-1 h-2 bg-ph-bg rounded-full appearance-none cursor-pointer accent-ph-primary"
              />
            </div>
          </div>

          {/* Ending Within */}
          <div>
            <label className="block text-xs text-ph-text-muted mb-2 font-medium">Ending Within</label>
            <div className="flex flex-wrap gap-1">
              {[
                { value: 'all', label: 'Any' },
                { value: '24h', label: '24h' },
                { value: 'week', label: '1 Week' },
                { value: 'month', label: '1 Month' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateFilters({ endingWithin: value as FilterState['endingWithin'] })}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.endingWithin === value
                      ? 'bg-ph-primary/20 text-ph-primary border border-ph-primary/30'
                      : 'bg-ph-bg text-ph-text-secondary border border-subtle hover:border-ph-text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs text-ph-text-muted mb-2 font-medium">Categories</label>
            <div className="flex flex-wrap gap-1">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filters.categories.has(category)
                      ? 'bg-ph-primary/20 text-ph-primary border border-ph-primary/30'
                      : 'bg-ph-bg text-ph-text-secondary border border-subtle hover:border-ph-text-muted'
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Filter count */}
          <div className="pt-3 border-t border-subtle text-xs text-ph-text-muted">
            Showing <span className="text-ph-text font-semibold tabular-nums">{filteredCount}</span> of <span className="tabular-nums">{totalMarkets}</span> markets
          </div>

          {/* Reset */}
          <button
            onClick={() => onChange({
              volumeRange: [0, 10000000],
              probabilityRange: [0, 100],
              endingWithin: 'all',
              categories: new Set(allCategories),
            })}
            className="w-full py-2.5 text-xs text-ph-text-muted hover:text-ph-text bg-ph-bg hover:bg-ph-hover rounded-lg transition-all font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
