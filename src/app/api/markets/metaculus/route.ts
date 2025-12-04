import { NextResponse } from 'next/server';
import { UnifiedMarket, inferCategory } from '@/types/market';

const METACULUS_API = 'https://www.metaculus.com/api2/questions/';

export async function GET() {
  try {
    console.log('[Metaculus API] Fetching questions...');
    
    const response = await fetch(
      `${METACULUS_API}?limit=100&status=open&order_by=-activity&type=forecast`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('[Metaculus API] Error:', response.status);
      return NextResponse.json(
        { error: `Metaculus API returned ${response.status}`, markets: [] },
        { status: 200 }
      );
    }

    const data = await response.json();
    const rawQuestions = data.results || [];
    
    console.log('[Metaculus API] Raw questions count:', rawQuestions.length);
    
    const markets: UnifiedMarket[] = rawQuestions
      .map((item: any) => {
        try {
          // Skip resolved questions
          if (item.resolved) return null;
          
          // Only binary questions
          const questionType = item.question?.type;
          if (questionType && questionType !== 'binary') return null;

          // Get probability from aggregations
          let probability = 50;
          const aggregations = item.question?.aggregations?.recency_weighted?.latest;
          if (aggregations?.centers && aggregations.centers.length > 0) {
            probability = Math.round(aggregations.centers[0] * 100);
          }

          const title = item.title || item.short_title;
          if (!title) return null;

          const forecastCount = item.nr_forecasters || item.forecasts_count || 0;
          const slug = item.slug || '';
          
          return {
            id: `metaculus-${item.id}`,
            question: title,
            platform: 'metaculus' as const,
            probability,
            volume: forecastCount,
            volumeLabel: 'Forecasters',
            category: inferCategory(title),
            endDate: item.scheduled_close_time || null,
            url: `https://www.metaculus.com/questions/${item.id}/${slug}/`,
            isPlayMoney: true,
            historyId: item.id?.toString(),
          };
        } catch (e) {
          console.error('[Metaculus] Parse error:', e);
          return null;
        }
      })
      .filter((m: any): m is UnifiedMarket => m !== null);

    console.log('[Metaculus API] Parsed', markets.length, 'markets');
    if (markets.length > 0) {
      console.log('[Metaculus API] Sample:', markets[0].question, '|', markets[0].url);
    }
    
    return NextResponse.json({ markets, error: null });
  } catch (error) {
    console.error('[Metaculus API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', markets: [] },
      { status: 200 }
    );
  }
}
