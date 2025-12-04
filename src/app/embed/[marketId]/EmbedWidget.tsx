'use client';

import { useEffect, useState } from 'react';

interface Market {
  id: string;
  question: string;
  platform: string;
  probability: number;
  volume: number;
  url: string;
  endDate: string | null;
}

interface EmbedWidgetProps {
  marketId: string;
  theme?: 'dark' | 'light';
}

const platformColors: Record<string, string> = {
  polymarket: '#8b5cf6',
  kalshi: '#3b82f6',
  manifold: '#10b981',
  metaculus: '#f59e0b',
};

export default function EmbedWidget({ marketId, theme = 'dark' }: EmbedWidgetProps) {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await fetch(`/api/embed/${encodeURIComponent(marketId)}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setMarket(data.market);
        }
      } catch (err) {
        setError('Failed to load market');
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#fafafa' : '#18181b';
  const mutedColor = isDark ? '#71717a' : '#a1a1aa';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  if (loading) {
    return (
      <div
        style={{
          padding: '16px',
          background: bgColor,
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          minWidth: '280px',
        }}
      >
        <div
          style={{
            height: '20px',
            background: isDark ? '#27272a' : '#f4f4f5',
            borderRadius: '4px',
            marginBottom: '12px',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div
          style={{
            height: '40px',
            background: isDark ? '#27272a' : '#f4f4f5',
            borderRadius: '8px',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div
        style={{
          padding: '16px',
          background: bgColor,
          borderRadius: '12px',
          border: `1px solid ${borderColor}`,
          textAlign: 'center',
          color: mutedColor,
          fontSize: '14px',
        }}
      >
        {error || 'Market not found'}
      </div>
    );
  }

  const platformColor = platformColors[market.platform] || '#8b5cf6';
  const isHighProb = market.probability >= 70;
  const isLowProb = market.probability <= 30;
  const probColor = isHighProb ? '#22c55e' : isLowProb ? '#ef4444' : platformColor;

  return (
    <div
      style={{
        padding: '16px',
        background: bgColor,
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minWidth: '280px',
        maxWidth: '400px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: platformColor,
          }}
        />
        <span style={{ fontSize: '12px', color: mutedColor, textTransform: 'capitalize' }}>
          {market.platform}
        </span>
      </div>

      {/* Question */}
      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          fontWeight: 500,
          color: textColor,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {market.question}
      </p>

      {/* Probability Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            height: '8px',
            background: isDark ? '#27272a' : '#f4f4f5',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${market.probability}%`,
              height: '100%',
              background: probColor,
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '12px',
          }}
        >
          <span style={{ color: mutedColor }}>YES</span>
          <span style={{ color: probColor, fontWeight: 700 }}>{market.probability.toFixed(0)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <a
          href={market.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            color: platformColor,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Trade →
        </a>
        <a
          href="https://predicthub.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '10px',
            color: mutedColor,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          PredictHub
        </a>
      </div>
    </div>
  );
}


