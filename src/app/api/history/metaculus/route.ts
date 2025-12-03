import { NextResponse } from 'next/server';

interface HistoryPoint {
  time: number;
  value: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('id');
  const range = searchParams.get('range') || '7d';

  if (!questionId) {
    return NextResponse.json({ error: 'Question ID is required', history: [] });
  }

  try {
    // Metaculus API for question predictions history
    const questionUrl = `https://www.metaculus.com/api/questions/${encodeURIComponent(questionId)}/`;
    console.log(`[Metaculus History] Fetching: ${questionUrl}`);
    
    const response = await fetch(questionUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PredictHub/1.0',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Question not found',
        history: [] 
      });
    }

    const data = await response.json();
    
    // Metaculus provides community_prediction.history
    const predictionHistory = data.community_prediction?.history;
    
    if (Array.isArray(predictionHistory) && predictionHistory.length > 0) {
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
          startTime = 0;
      }

      // History format: [{ x: timestamp, y: probability }, ...]
      // or [{ time: timestamp, q2: median }, ...]
      const history: HistoryPoint[] = predictionHistory
        .map((point: any) => {
          const time = point.x ? point.x : Math.floor(new Date(point.time || point.t).getTime() / 1000);
          const value = point.y !== undefined ? point.y * 100 : (point.q2 !== undefined ? point.q2 * 100 : null);
          return { time, value };
        })
        .filter((p: HistoryPoint) => {
          if (p.value === null || isNaN(p.time) || isNaN(p.value)) return false;
          const timestamp = p.time * 1000;
          return timestamp >= startTime;
        })
        .sort((a: HistoryPoint, b: HistoryPoint) => a.time - b.time);

      if (history.length > 0) {
        return NextResponse.json({ history, source: 'metaculus' });
      }
    }

    // Fallback: use current prediction to generate mock history
    const currentPrediction = data.community_prediction?.full?.q2 || 
                              data.metaculus_prediction?.full?.q2 || 
                              0.5;
    const currentPrice = currentPrediction * 100;
    const history = generateMockHistory(currentPrice, range);
    
    return NextResponse.json({ history, source: 'estimated' });
  } catch (error) {
    console.error('[Metaculus History] Error:', error);
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
    price = price + (Math.random() - 0.5) * 3;
  }

  history[history.length - 1].value = currentPrice;
  
  return history.sort((a, b) => a.time - b.time);
}

