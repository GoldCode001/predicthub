'use client';

import { useEffect, useState } from 'react';
import { UnifiedMarket, categoryLabels } from '@/types/market';
import { PlatformBadge, platformColors } from './PlatformLogo';

interface MarketDetailModalProps {
  market: UnifiedMarket | null;
  similarMarkets?: UnifiedMarket[];
  onClose: () => void;
  onSetAlert?: (market: UnifiedMarket) => void;
}

export default function MarketDetailModal({ 
  market, 
  similarMarkets = [], 
  onClose, 
  onSetAlert 
}: MarketDetailModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!market) return null;

  const handleShare = async () => {
    const shareUrl = market.url;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: market.question,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No end date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const platformColor = platformColors[market.platform];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-ph-card border border-subtle rounded-2xl shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ph-text-muted hover:text-ph-text hover:bg-ph-hover rounded-lg transition-all z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 border-b border-subtle">
          <div className="flex items-start gap-3 pr-10">
            <PlatformBadge platform={market.platform} size="md" />
            <div>
              <h2 className="text-xl font-bold text-ph-text mb-2">{market.question}</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="px-2 py-0.5 rounded-lg bg-ph-hover text-ph-text-secondary text-xs font-medium">
                  {categoryLabels[market.category]}
                </span>
                {market.endDate && (
                  <span className="text-ph-text-muted text-xs">
                    Ends: {formatDate(market.endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="p-6 border-b border-subtle">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-ph-text-secondary font-medium">Current Probability</span>
            <span className={`text-4xl font-bold tabular-nums ${
              market.probability >= 70 ? 'text-ph-profit' :
              market.probability <= 30 ? 'text-ph-loss' : 'text-ph-text'
            }`}>
              {market.probability.toFixed(1)}%
            </span>
          </div>
          
          {/* Visual gauge */}
          <div className="relative h-10 bg-ph-bg rounded-xl overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 rounded-xl transition-all duration-500"
              style={{ 
                width: `${market.probability}%`,
                background: `linear-gradient(90deg, ${platformColor} 0%, ${platformColor}80 100%)`
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-4 text-sm font-bold">
              <span className={market.probability > 50 ? 'text-white' : 'text-ph-text-secondary'}>YES</span>
              <span className={market.probability < 50 ? 'text-white' : 'text-ph-text-secondary'}>NO</span>
            </div>
          </div>

          {/* Yes/No prices */}
          <div className="flex justify-between mt-4 text-sm">
            <div className="bg-ph-profit/10 px-4 py-2 rounded-lg">
              <span className="text-ph-text-muted">YES: </span>
              <span className="text-ph-profit font-bold tabular-nums">{market.probability.toFixed(0)}¢</span>
            </div>
            <div className="bg-ph-loss/10 px-4 py-2 rounded-lg">
              <span className="text-ph-text-muted">NO: </span>
              <span className="text-ph-loss font-bold tabular-nums">{(100 - market.probability).toFixed(0)}¢</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-subtle">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-ph-bg rounded-xl p-4">
              <div className="text-xs text-ph-text-muted mb-1">Volume</div>
              <div className="text-xl font-bold text-ph-profit tabular-nums">{formatVolume(market.volume)}</div>
            </div>
            <div className="bg-ph-bg rounded-xl p-4">
              <div className="text-xs text-ph-text-muted mb-1">Platform</div>
              <div className="text-lg font-bold" style={{ color: platformColor }}>
                {market.platform.charAt(0).toUpperCase() + market.platform.slice(1)}
              </div>
            </div>
            <div className="bg-ph-bg rounded-xl p-4">
              <div className="text-xs text-ph-text-muted mb-1">Category</div>
              <div className="text-lg font-bold text-ph-text">{categoryLabels[market.category]}</div>
            </div>
            <div className="bg-ph-bg rounded-xl p-4">
              <div className="text-xs text-ph-text-muted mb-1">End Date</div>
              <div className="text-sm font-bold text-ph-text">
                {market.endDate 
                  ? new Date(market.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'TBD'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Similar Markets */}
        {similarMarkets.length > 0 && (
          <div className="p-6 border-b border-subtle">
            <h3 className="text-sm font-bold text-ph-text-secondary mb-3">Similar Markets on Other Platforms</h3>
            <div className="space-y-2">
              {similarMarkets.slice(0, 3).map((similar) => (
                <a
                  key={similar.id}
                  href={similar.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-ph-bg rounded-xl hover:bg-ph-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={similar.platform} size="sm" showName={false} />
                    <span className="text-sm text-ph-text-secondary line-clamp-1">{similar.question}</span>
                  </div>
                  <span className="text-sm font-bold text-ph-text tabular-nums">{similar.probability.toFixed(0)}%</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex flex-col sm:flex-row gap-3">
          <a
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white transition-all btn-premium"
          >
            Trade on {market.platform.charAt(0).toUpperCase() + market.platform.slice(1)}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <button
            onClick={() => onSetAlert?.(market)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-ph-hover hover:bg-ph-bg text-ph-text rounded-xl font-bold transition-all border border-subtle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Set Alert
          </button>

          <button
            onClick={handleShare}
            className="px-6 py-3.5 bg-ph-hover hover:bg-ph-bg text-ph-text rounded-xl font-bold transition-all border border-subtle"
          >
            {copied ? '✓ Copied!' : '📤 Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
