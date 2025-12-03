import { NextResponse } from 'next/server';

// In-memory cache for embed data
const embedCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(
  request: Request,
  { params }: { params: { marketId: string } }
) {
  const marketId = params.marketId;

  // Add CORS headers for embedding
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=60',
  };

  if (!marketId) {
    return NextResponse.json(
      { error: 'Market ID is required' },
      { status: 400, headers }
    );
  }

  // Check cache
  const cached = embedCache.get(marketId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, { headers });
  }

  try {
    // Parse the market ID to determine platform
    const [platform, ...idParts] = marketId.split('-');
    const originalId = idParts.join('-');

    let marketData = null;

    // Fetch from the appropriate platform
    switch (platform) {
      case 'polymarket': {
        const response = await fetch(
          `https://gamma-api.polymarket.com/markets/${originalId}`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const data = await response.json();
          const prices = JSON.parse(data.outcomePrices || '[]');
          marketData = {
            id: marketId,
            question: data.question,
            platform: 'polymarket',
            probability: prices[0] ? Math.round(parseFloat(prices[0]) * 100) : 50,
            volume: data.volumeNum || 0,
            url: `https://polymarket.com/event/${data.slug}`,
            endDate: data.endDateIso || null,
          };
        }
        break;
      }

      case 'kalshi': {
        const response = await fetch(
          `https://api.elections.kalshi.com/trade-api/v2/markets/${originalId}`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const data = await response.json();
          const market = data.market || data;
          marketData = {
            id: marketId,
            question: market.title || market.subtitle || 'Unknown',
            platform: 'kalshi',
            probability: Math.round((market.last_price || 0.5) * 100),
            volume: market.volume || 0,
            url: `https://kalshi.com/markets/${market.ticker || originalId}`,
            endDate: market.close_time || null,
          };
        }
        break;
      }

      case 'manifold': {
        const response = await fetch(
          `https://api.manifold.markets/v0/market/${originalId}`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const data = await response.json();
          marketData = {
            id: marketId,
            question: data.question,
            platform: 'manifold',
            probability: Math.round((data.probability || 0.5) * 100),
            volume: data.volume || 0,
            url: `https://manifold.markets/${data.creatorUsername}/${data.slug}`,
            endDate: data.closeTime ? new Date(data.closeTime).toISOString() : null,
          };
        }
        break;
      }

      case 'metaculus': {
        const response = await fetch(
          `https://www.metaculus.com/api/questions/${originalId}/`,
          { next: { revalidate: 60 } }
        );
        if (response.ok) {
          const data = await response.json();
          const probability = data.community_prediction?.full?.q2 || 0.5;
          marketData = {
            id: marketId,
            question: data.title,
            platform: 'metaculus',
            probability: Math.round(probability * 100),
            volume: data.number_of_forecasters || 0,
            url: `https://www.metaculus.com/questions/${originalId}/`,
            endDate: data.close_time || null,
          };
        }
        break;
      }
    }

    if (!marketData) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404, headers }
      );
    }

    // Cache the result
    embedCache.set(marketId, { data: { market: marketData }, timestamp: Date.now() });

    return NextResponse.json({ market: marketData }, { headers });
  } catch (error) {
    console.error('[Embed API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

