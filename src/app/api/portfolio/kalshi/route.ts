import { NextResponse } from 'next/server';

const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

interface Position {
  id: string;
  platform: 'kalshi';
  market: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json({
      error: 'API key required',
      positions: [],
      totalValue: 0,
      totalPnl: 0,
    });
  }

  console.log('[Kalshi Portfolio] Fetching positions...');

  try {
    // Fetch user positions from Kalshi
    const response = await fetch(`${KALSHI_API}/portfolio/positions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({
          error: 'Invalid API key',
          positions: [],
          totalValue: 0,
          totalPnl: 0,
        });
      }
      console.log('[Kalshi Portfolio] API error:', response.status);
      return NextResponse.json({
        error: `API error: ${response.status}`,
        positions: [],
        totalValue: 0,
        totalPnl: 0,
      });
    }

    const data = await response.json();
    console.log('[Kalshi Portfolio] Raw data:', JSON.stringify(data).slice(0, 500));

    const positions: Position[] = [];
    let totalValue = 0;
    let totalPnl = 0;

    // Process positions
    const rawPositions = data.market_positions || data.positions || [];
    
    for (const pos of rawPositions) {
      try {
        const size = Math.abs(pos.position || pos.total_traded || 0);
        if (size === 0) continue;

        const avgPrice = pos.average_price || pos.cost_basis / size || 0.5;
        const currentPrice = pos.last_price || pos.settlement_price || 0.5;
        
        const investment = size * avgPrice;
        const currentValue = size * currentPrice;
        const pnl = currentValue - investment;
        const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;

        totalValue += currentValue;
        totalPnl += pnl;

        const ticker = pos.ticker || pos.market_ticker || '';
        
        positions.push({
          id: `kalshi-${ticker}-${pos.position > 0 ? 'yes' : 'no'}`,
          platform: 'kalshi',
          market: pos.title || pos.market_title || ticker,
          outcome: pos.position > 0 ? 'YES' : 'NO',
          size,
          avgPrice,
          currentPrice,
          pnl,
          pnlPercent,
          url: `https://kalshi.com/markets/${ticker.split('-')[0]}`,
        });
      } catch (e) {
        console.log('[Kalshi Portfolio] Error parsing position:', e);
      }
    }

    console.log('[Kalshi Portfolio] Parsed', positions.length, 'positions');

    return NextResponse.json({
      positions,
      totalValue,
      totalPnl,
      error: null,
    });

  } catch (error) {
    console.error('[Kalshi Portfolio] Error:', error);
    return NextResponse.json({
      positions: [],
      totalValue: 0,
      totalPnl: 0,
      error: 'Failed to fetch positions',
    });
  }
}




