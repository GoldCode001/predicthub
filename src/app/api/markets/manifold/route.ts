import { NextResponse } from 'next/server';
import { UnifiedMarket, inferCategory } from '@/types/market';

const MANIFOLD_API = 'https://api.manifold.markets/v0/search-markets';

export async function GET() {
  try {
    console.log('[Manifold API] Fetching markets...');
    
    const response = await fetch(
      `${MANIFOLD_API}?term=&sort=liquidity&filter=open&limit=100`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('[Manifold API] Error:', response.status);
      return NextResponse.json(
        { error: `Manifold API returned ${response.status}`, markets: [] },
        { status: 200 }
      );
    }

    const data = await response.json();
    const rawMarkets = Array.isArray(data) ? data : [];
    
    console.log('[Manifold API] Raw markets count:', rawMarkets.length);
    
    const parsedMarkets = rawMarkets.map((market: any) => {
      try {
        // Only include binary markets that aren't resolved
        if (market.outcomeType && market.outcomeType !== 'BINARY') return null;
        if (market.isResolved) return null;

        // Probability is 0-1
        const probability = market.probability !== undefined 
          ? Math.round(market.probability * 100) 
          : 50;

        const volume = market.volume || 0;
        if (!market.question) return null;

        // Manifold provides direct URL
        const url = market.url || `https://manifold.markets/${market.creatorUsername}/${market.slug}`;

        return {
          id: `manifold-${market.id}`,
          question: market.question,
          platform: 'manifold' as const,
          probability,
          volume: Math.round(volume),
          volumeLabel: 'Mana (Play $)',
          category: inferCategory(market.question),
          endDate: market.closeTime ? new Date(market.closeTime).toISOString() : null,
          url,
          imageUrl: market.coverImageUrl,
          isPlayMoney: true,
          historyId: market.id,
        };
      } catch (e) {
        console.error('[Manifold] Parse error:', e);
        return null;
      }
    });
    
    const markets = parsedMarkets.filter((m): m is NonNullable<typeof m> => m !== null) as UnifiedMarket[];

    console.log('[Manifold API] Parsed', markets.length, 'markets');
    if (markets.length > 0) {
      console.log('[Manifold API] Sample:', markets[0].question, '|', markets[0].url);
    }
    
    return NextResponse.json({ markets, error: null });
  } catch (error) {
    console.error('[Manifold API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', markets: [] },
      { status: 200 }
    );
  }
}
