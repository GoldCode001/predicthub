import { NextResponse } from 'next/server';
import { UnifiedMarket, inferCategory } from '@/types/market';

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;  // This is used for the URL!
  title: string;
  sub_title?: string;
  category?: string;
  mutually_exclusive?: boolean;
}

export async function GET() {
  try {
    console.log('[Kalshi API] Fetching events...');
    
    // Fetch all events
    const eventsRes = await fetch(
      `${KALSHI_BASE}/events?limit=200`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictionAggregator/1.0',
        },
        cache: 'no-store',
      }
    );

    if (!eventsRes.ok) {
      console.error('[Kalshi API] Events error:', eventsRes.status);
      return NextResponse.json(
        { error: `Kalshi API returned ${eventsRes.status}`, markets: [] },
        { status: 200 }
      );
    }

    const eventsData = await eventsRes.json();
    const events: KalshiEvent[] = eventsData.events || [];
    
    // Filter to binary (non-mutually-exclusive) events only
    const binaryEvents = events.filter(e => !e.mutually_exclusive);
    
    console.log('[Kalshi API] Events:', events.length, 'Binary:', binaryEvents.length);
    
    // Fetch markets for all binary events in parallel
    const marketPromises = binaryEvents.map(async (event) => {
      try {
        const res = await fetch(
          `${KALSHI_BASE}/markets?event_ticker=${event.event_ticker}`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'PredictionAggregator/1.0',
            },
            cache: 'no-store',
          }
        );
        
        if (!res.ok) return null;
        
        const data = await res.json();
        const markets = data.markets || [];
        
        if (markets.length === 0) return null;
        
        // Find the best market - prefer one with matching ticker or highest volume
        let mainMarket = markets.find((m: any) => m.ticker === event.event_ticker);
        
        if (!mainMarket) {
          // Sort by volume and take the highest
          const sorted = markets.sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));
          mainMarket = sorted[0];
        }
        
        if (!mainMarket) return null;
        
        // Build unified market
        let title = event.title;
        if (event.sub_title && !title.toLowerCase().includes(event.sub_title.toLowerCase())) {
          title = `${title} (${event.sub_title})`;
        }
        
        // Kalshi prices are in cents (0-100)
        let probability = 50;
        if (mainMarket.last_price !== undefined && mainMarket.last_price > 0) {
          probability = mainMarket.last_price;
        } else if (mainMarket.yes_bid !== undefined && mainMarket.yes_ask !== undefined) {
          const mid = Math.round((mainMarket.yes_bid + mainMarket.yes_ask) / 2);
          if (mid > 0) probability = mid;
        }
        
        probability = Math.max(1, Math.min(99, probability));
        
        // Volume is in cents, convert to dollars
        const volume = (mainMarket.volume || 0) / 100;
        
        // Use series_ticker for the URL - this is what Kalshi's website uses
        // e.g., https://kalshi.com/markets/KXELONMARS (not KXELONMARS-99)
        const seriesTicker = event.series_ticker;
        
        return {
          id: `kalshi-${mainMarket.ticker}`,
          question: title,
          platform: 'kalshi' as const,
          probability,
          volume,
          volumeLabel: 'USD',
          category: inferCategory(title, event.category ? [event.category] : []),
          endDate: mainMarket.close_time || mainMarket.expiration_time || null,
          url: `https://kalshi.com/markets/${seriesTicker}`,
          isPlayMoney: false,
        };
      } catch (e) {
        return null;
      }
    });
    
    const results = await Promise.all(marketPromises);
    const markets = results.filter((m): m is NonNullable<typeof m> => m !== null) as UnifiedMarket[];
    
    // Sort by volume descending
    markets.sort((a, b) => b.volume - a.volume);

    console.log('[Kalshi API] Parsed', markets.length, 'markets from', binaryEvents.length, 'binary events');
    if (markets.length > 0) {
      console.log('[Kalshi API] Top market:', markets[0].question, '| Vol:', markets[0].volume);
    }
    
    return NextResponse.json({ markets, error: null });
  } catch (error) {
    console.error('[Kalshi API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', markets: [] },
      { status: 200 }
    );
  }
}
