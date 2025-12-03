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
    // Calculate time range
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
      case 'all':
        startTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = now - 7 * 24 * 60 * 60 * 1000;
    }

    // Try to fetch from Polymarket CLOB API
    // The CLOB API has a /prices/history endpoint
    const clobUrl = `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(marketId)}&startTs=${Math.floor(startTime / 1000)}&endTs=${Math.floor(now / 1000)}&fidelity=60`;
    
    console.log(`[Polymarket History] Fetching from: ${clobUrl}`);
    
    const response = await fetch(clobUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PredictHub/1.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // Fallback: try the gamma API
      const gammaUrl = `https://gamma-api.polymarket.com/markets/${encodeURIComponent(marketId)}`;
      console.log(`[Polymarket History] CLOB failed, trying gamma: ${gammaUrl}`);
      
      const gammaResponse = await fetch(gammaUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictHub/1.0',
        },
        next: { revalidate: 300 },
      });

      if (gammaResponse.ok) {
        const gammaData = await gammaResponse.json();
        // Gamma doesn't have full history, just generate some mock points based on current price
        const currentPrice = parseFloat(gammaData.outcomePrices?.[0] || '0.5') * 100;
        const history = generateMockHistory(currentPrice, range);
        
        return NextResponse.json({ history, source: 'gamma-estimated' });
      }

      return NextResponse.json({ 
        error: 'History not available for this market',
        history: [] 
      });
    }

    const data = await response.json();
    
    // Parse the CLOB history format
    // The response should be an array of { t: timestamp, p: price } or similar
    let history: HistoryPoint[] = [];
    
    if (Array.isArray(data.history)) {
      history = data.history.map((point: any) => ({
        time: typeof point.t === 'number' ? point.t : Math.floor(new Date(point.t).getTime() / 1000),
        value: (typeof point.p === 'number' ? point.p : parseFloat(point.p)) * 100,
      }));
    } else if (Array.isArray(data)) {
      history = data.map((point: any) => ({
        time: typeof point.t === 'number' ? point.t : Math.floor(new Date(point.t || point.timestamp).getTime() / 1000),
        value: (typeof point.p === 'number' ? point.p : parseFloat(point.p || point.price)) * 100,
      }));
    }

    // Sort by time and filter out invalid points
    history = history
      .filter(p => !isNaN(p.time) && !isNaN(p.value) && p.value >= 0 && p.value <= 100)
      .sort((a, b) => a.time - b.time);

    return NextResponse.json({ history, source: 'clob' });
  } catch (error) {
    console.error('[Polymarket History] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch history',
      history: [] 
    });
  }
}

// Generate estimated history based on current price with some variance
function generateMockHistory(currentPrice: number, range: string): HistoryPoint[] {
  const now = Math.floor(Date.now() / 1000);
  let points: number;
  let interval: number;
  
  switch (range) {
    case '24h':
      points = 24;
      interval = 3600; // 1 hour
      break;
    case '7d':
      points = 28;
      interval = 6 * 3600; // 6 hours
      break;
    case '30d':
      points = 30;
      interval = 24 * 3600; // 1 day
      break;
    default:
      points = 52;
      interval = 7 * 24 * 3600; // 1 week
  }

  const history: HistoryPoint[] = [];
  let price = currentPrice;
  
  // Generate backwards from now with random walk
  for (let i = points; i >= 0; i--) {
    const time = now - (i * interval);
    history.push({ time, value: Math.max(1, Math.min(99, price)) });
    // Random walk for next (earlier) point
    price = price + (Math.random() - 0.5) * 5;
  }

  // Ensure the last point matches current price
  history[history.length - 1].value = currentPrice;
  
  return history.sort((a, b) => a.time - b.time);
}

