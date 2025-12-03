import { NextResponse } from 'next/server';

interface HistoryPoint {
  time: number;
  value: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('id');
  const range = searchParams.get('range') || '7d';

  if (!marketId) {
    return NextResponse.json({ error: 'Market ID is required', history: [] });
  }

  try {
    // Kalshi API endpoints for historical data
    const now = Date.now();
    let startTime: number;
    
    switch (range) {
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = now - 365 * 24 * 60 * 60 * 1000;
    }

    // Try Kalshi's market history endpoint
    const historyUrl = `https://api.elections.kalshi.com/trade-api/v2/markets/${encodeURIComponent(marketId)}/history`;
    console.log(`[Kalshi History] Fetching: ${historyUrl}`);
    
    const response = await fetch(historyUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PredictHub/1.0',
      },
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.history && Array.isArray(data.history)) {
        const history: HistoryPoint[] = data.history
          .filter((point: any) => {
            const time = new Date(point.ts || point.timestamp).getTime();
            return time >= startTime;
          })
          .map((point: any) => ({
            time: Math.floor(new Date(point.ts || point.timestamp).getTime() / 1000),
            value: (point.yes_price || point.price || 0.5) * 100,
          }))
          .filter((p: HistoryPoint) => !isNaN(p.time) && !isNaN(p.value));

        return NextResponse.json({ history, source: 'kalshi' });
      }
    }

    // Fallback: fetch market details and generate estimated history
    const marketUrl = `https://api.elections.kalshi.com/trade-api/v2/markets/${encodeURIComponent(marketId)}`;
    const marketResponse = await fetch(marketUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PredictHub/1.0',
      },
      next: { revalidate: 300 },
    });

    if (marketResponse.ok) {
      const marketData = await marketResponse.json();
      const currentPrice = (marketData.market?.last_price || marketData.last_price || 0.5) * 100;
      const history = generateMockHistory(currentPrice, range);
      
      return NextResponse.json({ history, source: 'estimated' });
    }

    return NextResponse.json({ 
      error: 'History not available',
      history: [] 
    });
  } catch (error) {
    console.error('[Kalshi History] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch history',
      history: [] 
    });
  }
}

function generateMockHistory(currentPrice: number, range: string): HistoryPoint[] {
  const now = Math.floor(Date.now() / 1000);
  let points: number;
  let interval: number;
  
  switch (range) {
    case '24h':
      points = 24;
      interval = 3600;
      break;
    case '7d':
      points = 28;
      interval = 6 * 3600;
      break;
    case '30d':
      points = 30;
      interval = 24 * 3600;
      break;
    default:
      points = 52;
      interval = 7 * 24 * 3600;
  }

  const history: HistoryPoint[] = [];
  let price = currentPrice;
  
  for (let i = points; i >= 0; i--) {
    const time = now - (i * interval);
    history.push({ time, value: Math.max(1, Math.min(99, price)) });
    price = price + (Math.random() - 0.5) * 5;
  }

  history[history.length - 1].value = currentPrice;
  
  return history.sort((a, b) => a.time - b.time);
}

