'use client';

import { Category, categoryLabels } from '@/types/market';

export type SortField = 'volume' | 'probability' | 'endDate' | 'platform';
export type SortDirection = 'asc' | 'desc';

interface FilterBarProps {
  categories: Category[];
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  marketCounts: Record<Category | 'all', number>;
}

export default function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  sortField,
  sortDirection,
  onSortChange,
  marketCounts,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Category selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-ph-text-muted font-medium">Category:</span>
        <div className="relative">
          <select
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
            className="appearance-none bg-ph-card border border-subtle rounded-lg px-4 py-2 pr-10 text-sm text-ph-text font-medium cursor-pointer hover:border-ph-primary/50 focus:border-ph-primary focus:ring-2 focus:ring-ph-primary/20 focus:outline-none transition-all"
          >
            <option value="all">All ({marketCounts['all']})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {categoryLabels[cat]} ({marketCounts[cat] || 0})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-ph-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Sort options */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-ph-text-muted font-medium">Sort:</span>
        <div className="flex bg-ph-card border border-subtle rounded-lg p-1 gap-1">
          {[
            { field: 'volume' as SortField, label: 'Volume' },
            { field: 'probability' as SortField, label: 'Prob' },
            { field: 'endDate' as SortField, label: 'Date' },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => onSortChange(field)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                sortField === field
                  ? 'bg-ph-primary text-white'
                  : 'text-ph-text-secondary hover:text-ph-text hover:bg-ph-hover'
              }`}
            >
              {label}
              {sortField === field && (
                <svg 
                  className={`w-3.5 h-3.5 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
