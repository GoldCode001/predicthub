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
    // Manifold has a bets endpoint that can be used to construct price history
    // GET /v0/market/{marketId}/positions or /v0/bets?marketId={id}
    
    const now = Date.now();
    let afterTime: number;
    
    switch (range) {
      case '24h':
        afterTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        afterTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        afterTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'all':
        afterTime = 0;
        break;
      default:
        afterTime = now - 7 * 24 * 60 * 60 * 1000;
    }

    // Fetch market details first to get current probability
    const marketUrl = `https://api.manifold.markets/v0/market/${encodeURIComponent(marketId)}`;
    console.log(`[Manifold History] Fetching market: ${marketUrl}`);
    
    const marketResponse = await fetch(marketUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PredictHub/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!marketResponse.ok) {
      return NextResponse.json({ 
        error: 'Market not found',
        history: [] 
      });
    }

    const marketData = await marketResponse.json();
    const currentProbability = (marketData.probability || 0.5) * 100;

    // Fetch bets/trades to construct price history
    const betsUrl = `https://api.manifold.markets/v0/bets?marketId=${encodeURIComponent(marketId)}&limit=1000`;
    console.log(`[Manifold History] Fetching bets: ${betsUrl}`);
    
    const betsResponse = await fetch(betsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PredictHub/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!betsResponse.ok) {
      // Fallback: generate estimated history
      const history = generateMockHistory(currentProbability, range);
      return NextResponse.json({ history, source: 'estimated' });
    }

    const bets = await betsResponse.json();
    
    if (!Array.isArray(bets) || bets.length === 0) {
      const history = generateMockHistory(currentProbability, range);
      return NextResponse.json({ history, source: 'estimated' });
    }

    // Convert bets to price points
    // Manifold bets have probBefore and probAfter fields
    const history: HistoryPoint[] = [];
    
    for (const bet of bets) {
      const timestamp = bet.createdTime || bet.updatedTime;
      if (!timestamp || timestamp < afterTime) continue;
      
      const probability = bet.probAfter || bet.probBefore;
      if (typeof probability === 'number') {
        history.push({
          time: Math.floor(timestamp / 1000),
          value: probability * 100,
        });
      }
    }

    // Add current price as latest point
    history.push({
      time: Math.floor(Date.now() / 1000),
      value: currentProbability,
    });

    // Sort by time and deduplicate (keep one point per hour max)
    const deduped = deduplicateHistory(history);
    
    return NextResponse.json({ history: deduped, source: 'bets' });
  } catch (error) {
    console.error('[Manifold History] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch history',
      history: [] 
    });
  }
}

// Deduplicate history keeping one point per interval
function deduplicateHistory(history: HistoryPoint[]): HistoryPoint[] {
  if (history.length === 0) return [];
  
  // Sort by time
  const sorted = [...history].sort((a, b) => a.time - b.time);
  
  // Group by hour and take the last value in each hour
  const hourMap = new Map<number, HistoryPoint>();
  
  for (const point of sorted) {
    const hourKey = Math.floor(point.time / 3600) * 3600;
    hourMap.set(hourKey, point);
  }
  
  return Array.from(hourMap.values())
    .filter(p => !isNaN(p.value) && p.value >= 0 && p.value <= 100)
    .sort((a, b) => a.time - b.time);
}

// Generate estimated history
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

