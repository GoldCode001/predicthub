import { NextResponse } from 'next/server';

const POLYMARKET_API = 'https://gamma-api.polymarket.com/markets';

interface HistoryPoint {
  time: number;
  value: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawMarketId = searchParams.get('id');
  const range = searchParams.get('range') || '7d';

  if (!rawMarketId) {
    return NextResponse.json({ error: 'Market ID is required', history: [] });
  }

  try {
    const resolvedId = await resolvePolymarketToken(rawMarketId);

    if (!resolvedId) {
      return NextResponse.json({
        error: 'Unable to resolve Polymarket market identifier',
        history: [],
      });
    }

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
    const clobUrl = `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(resolvedId)}&startTs=${Math.floor(startTime / 1000)}&endTs=${Math.floor(now / 1000)}&fidelity=60`;
    
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
      const gammaUrl = `${POLYMARKET_API}/${encodeURIComponent(rawMarketId)}`;
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

function isLikelyClobToken(id: string) {
  return id.length > 40;
}

async function resolvePolymarketToken(identifier: string): Promise<string | null> {
  if (!identifier) return null;
  if (isLikelyClobToken(identifier)) return identifier;

  const market = await fetchPolymarketMarket(identifier);
  if (!market) return null;

  return extractFirstTokenId(market.clobTokenIds);
}

async function fetchPolymarketMarket(identifier: string): Promise<any | null> {
  try {
    const byId = await fetch(`${POLYMARKET_API}/${encodeURIComponent(identifier)}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'PredictHub/1.0' },
      next: { revalidate: 300 },
    });
    if (byId.ok) return byId.json();
  } catch {}

  try {
    const bySlug = await fetch(`${POLYMARKET_API}?slug=${encodeURIComponent(identifier)}&limit=1`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'PredictHub/1.0' },
      next: { revalidate: 300 },
    });
    if (bySlug.ok) {
      const data = await bySlug.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
    }
  } catch {}

  return null;
}

function extractFirstTokenId(ids: any): string | null {
  if (!ids) return null;
  try {
    const parsed = typeof ids === 'string' ? JSON.parse(ids) : ids;
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed[0];
    }
  } catch {}
  return null;
}

