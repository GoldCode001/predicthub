'use client';

import { useEffect, useRef, useState } from 'react';
import { Platform } from '@/types/market';

interface PriceChartProps {
  marketId: string;
  platform: Platform;
  currentProbability: number;
}

interface HistoryPoint {
  time: number;
  value: number;
}

type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function PriceChart({ marketId, platform, currentProbability }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Extract the original market ID without the platform prefix
        const originalId = marketId.replace(`${platform}-`, '');
        const response = await fetch(`/api/history/${platform}?id=${encodeURIComponent(originalId)}&range=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setHistory([]);
        } else {
          setHistory(data.history || []);
        }
      } catch (err) {
        setError('History not available');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [marketId, platform, timeRange]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current || loading) return;

    const initChart = async () => {
      const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
      
      // Cleanup previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const container = chartContainerRef.current;
      if (!container) return;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#71717a',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          vertLine: { color: 'rgba(139, 92, 246, 0.5)', style: LineStyle.Dashed },
          horzLine: { color: 'rgba(139, 92, 246, 0.5)', style: LineStyle.Dashed },
        },
        handleScale: false,
        handleScroll: false,
      });

      chartRef.current = chart;

      // Create area series using v4+ API
      const series = chart.addSeries({
        type: 'Area',
        options: {
          lineColor: '#8b5cf6',
          topColor: 'rgba(139, 92, 246, 0.4)',
          bottomColor: 'rgba(139, 92, 246, 0)',
          lineWidth: 2,
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => `${price.toFixed(0)}%`,
          },
        },
      } as any);

      seriesRef.current = series;

      // Set data
      if (history.length > 0) {
        const chartData = history.map(point => ({
          time: point.time as any,
          value: point.value,
        }));
        series.setData(chartData);
        chart.timeScale().fitContent();
      } else {
        // Show current probability as a single point if no history
        const now = Math.floor(Date.now() / 1000);
        series.setData([{ time: now as any, value: currentProbability }]);
      }

      // Handle resize
      const handleResize = () => {
        if (container && chart) {
          chart.applyOptions({ width: container.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    };

    initChart();
  }, [history, loading, currentProbability]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="space-y-3">
      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ph-text-secondary">Price History</span>
        <div className="flex gap-1">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                timeRange === option.value
                  ? 'bg-ph-primary text-white'
                  : 'bg-ph-hover text-ph-text-secondary hover:text-ph-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative bg-ph-bg rounded-lg overflow-hidden" style={{ minHeight: 200 }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="shimmer w-full h-full" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ph-text-muted">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">{error}</span>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full" style={{ height: 200 }} />
        )}
      </div>

      {/* Chart legend */}
      {!loading && !error && history.length > 0 && (
        <div className="flex items-center justify-between text-xs text-ph-text-muted">
          <span>
            {history.length > 0 && (
              <>
                Low: <span className="text-ph-loss">{Math.min(...history.map(h => h.value)).toFixed(0)}%</span>
              </>
            )}
          </span>
          <span>
            {history.length > 0 && (
              <>
                High: <span className="text-ph-profit">{Math.max(...history.map(h => h.value)).toFixed(0)}%</span>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

