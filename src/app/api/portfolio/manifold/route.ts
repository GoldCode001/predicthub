import { NextResponse } from 'next/server';

const MANIFOLD_API = 'https://api.manifold.markets/v0';

interface Position {
  id: string;
  platform: 'manifold';
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
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({
      error: 'Username required',
      positions: [],
      totalValue: 0,
      totalPnl: 0,
    });
  }

  console.log('[Manifold Portfolio] Fetching positions for:', username);

  try {
    // First, get user ID from username
    const userResponse = await fetch(`${MANIFOLD_API}/user/${username}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        return NextResponse.json({
          error: 'User not found',
          positions: [],
          totalValue: 0,
          totalPnl: 0,
        });
      }
      return NextResponse.json({
        error: `API error: ${userResponse.status}`,
        positions: [],
        totalValue: 0,
        totalPnl: 0,
      });
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Fetch user's bets
    const betsResponse = await fetch(`${MANIFOLD_API}/bets?userId=${userId}&limit=1000`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!betsResponse.ok) {
      return NextResponse.json({
        error: 'Failed to fetch bets',
        positions: [],
        totalValue: 0,
        totalPnl: 0,
      });
    }

    const bets = await betsResponse.json();
    console.log('[Manifold Portfolio] Found', bets.length, 'bets');

    // Aggregate bets by contract to get positions
    const contractPositions: Record<string, {
      contractId: string;
      shares: number;
      totalSpent: number;
      outcome: string;
      question?: string;
      url?: string;
      probability?: number;
    }> = {};

    for (const bet of bets) {
      if (bet.isSold || bet.isCancelled) continue;
      
      const key = `${bet.contractId}-${bet.outcome}`;
      
      if (!contractPositions[key]) {
        contractPositions[key] = {
          contractId: bet.contractId,
          shares: 0,
          totalSpent: 0,
          outcome: bet.outcome,
          question: bet.question,
          url: bet.contractUrl,
          probability: bet.probAfter,
        };
      }
      
      contractPositions[key].shares += bet.shares || 0;
      contractPositions[key].totalSpent += bet.amount || 0;
      if (bet.probAfter) contractPositions[key].probability = bet.probAfter;
    }

    // Fetch current market data for each position
    const positions: Position[] = [];
    let totalValue = 0;
    let totalPnl = 0;

    for (const [key, pos] of Object.entries(contractPositions)) {
      if (pos.shares <= 0) continue;

      try {
        // Fetch current market info
        let currentPrice = pos.probability || 0.5;
        let marketUrl = pos.url || '';
        let marketQuestion = pos.question || '';

        try {
          const marketResponse = await fetch(`${MANIFOLD_API}/market/${pos.contractId}`, {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
          });
          
          if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            currentPrice = marketData.probability || currentPrice;
            marketUrl = marketData.url || marketUrl;
            marketQuestion = marketData.question || marketQuestion;
            
            // Skip resolved markets
            if (marketData.isResolved) continue;
          }
        } catch (e) {
          // Use cached data if market fetch fails
        }

        const size = pos.shares;
        const avgPrice = pos.totalSpent / size;
        
        // For NO positions, invert the probability
        const effectivePrice = pos.outcome === 'YES' ? currentPrice : (1 - currentPrice);
        
        const investment = pos.totalSpent;
        const currentValue = size * effectivePrice;
        const pnl = currentValue - investment;
        const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;

        totalValue += currentValue;
        totalPnl += pnl;

        positions.push({
          id: key,
          platform: 'manifold',
          market: marketQuestion,
          outcome: pos.outcome,
          size,
          avgPrice,
          currentPrice: effectivePrice,
          pnl,
          pnlPercent,
          url: marketUrl,
        });
      } catch (e) {
        console.log('[Manifold Portfolio] Error processing position:', e);
      }
    }

    // Sort by absolute P&L
    positions.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

    // Limit to top 50 positions
    const topPositions = positions.slice(0, 50);

    console.log('[Manifold Portfolio] Parsed', topPositions.length, 'positions');

    return NextResponse.json({
      positions: topPositions,
      totalValue,
      totalPnl,
      error: null,
    });

  } catch (error) {
    console.error('[Manifold Portfolio] Error:', error);
    return NextResponse.json({
      positions: [],
      totalValue: 0,
      totalPnl: 0,
      error: 'Failed to fetch positions',
    });
  }
}




