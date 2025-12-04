import { NextResponse } from 'next/server';
import { UnifiedMarket, inferCategory } from '@/types/market';

const POLYMARKET_API = 'https://gamma-api.polymarket.com/markets';

export async function GET() {
  try {
    console.log('[Polymarket API] Fetching markets...');
    
    // Fetch active, non-closed markets sorted by volume
    const response = await fetch(
      `${POLYMARKET_API}?limit=100&active=true&closed=false&order=volume&ascending=false`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictionAggregator/1.0',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('[Polymarket API] Error:', response.status);
      return NextResponse.json(
        { error: `Polymarket API returned ${response.status}`, markets: [] },
        { status: 200 }
      );
    }

    const data = await response.json();
    
    const markets: UnifiedMarket[] = data
      .map((market: any) => {
        try {
          // Skip closed markets
          if (market.closed === true) return null;
          
          let probability = 50;
          try {
            const prices = JSON.parse(market.outcomePrices || '[]');
            if (prices.length >= 1) {
              probability = Math.round(parseFloat(prices[0]) * 100);
            }
          } catch {}

          const volume = market.volumeNum || parseFloat(market.volume) || 0;
          if (!market.question || volume <= 0) return null;

          let historyId: string | undefined;
          try {
            const tokenIds = JSON.parse(market.clobTokenIds || '[]');
            if (Array.isArray(tokenIds) && tokenIds.length > 0) {
              historyId = tokenIds[0];
            }
          } catch {
            // ignore
          }

          // Get the event slug from the events array - this is the correct permalink
          // Polymarket URLs use: https://polymarket.com/event/{event_slug}
          let eventSlug = market.slug; // fallback to market slug
          
          if (market.events && market.events.length > 0) {
            // Use the first event's slug as the permalink
            eventSlug = market.events[0].slug || market.events[0].ticker || market.slug;
          }
          
          // Build the correct Polymarket URL
          const url = `https://polymarket.com/event/${eventSlug}`;
          
          return {
            id: `polymarket-${market.id}`,
            question: market.question,
            platform: 'polymarket' as const,
            probability,
            volume,
            volumeLabel: 'USDC',
            category: inferCategory(market.question),
            endDate: market.endDateIso || market.endDate || null,
            url,
            imageUrl: market.image,
            isPlayMoney: false,
            historyId,
          };
        } catch (e) {
          console.error('[Polymarket] Parse error:', e);
          return null;
        }
      })
      .filter((m: any): m is UnifiedMarket => m !== null);

    console.log('[Polymarket API] Parsed', markets.length, 'markets');
    if (markets.length > 0) {
      console.log('[Polymarket API] Sample URL:', markets[0].url);
    }
    
    return NextResponse.json({ markets, error: null });
  } catch (error) {
    console.error('[Polymarket API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', markets: [] },
      { status: 200 }
    );
  }
}
