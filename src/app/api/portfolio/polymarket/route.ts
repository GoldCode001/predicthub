import { NextResponse } from 'next/server';

const CLOB_API = 'https://clob.polymarket.com';
const GAMMA_API = 'https://gamma-api.polymarket.com';

interface Position {
  id: string;
  platform: 'polymarket';
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
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({
      error: 'Wallet address is required',
      positions: [],
      totalValue: 0,
      totalPnl: 0,
    });
  }

  const normalizedAddress = address.toLowerCase();
  console.log('[Polymarket Portfolio] Fetching positions for:', normalizedAddress);

  const positions: Position[] = [];
  let totalValue = 0;
  let totalPnl = 0;

  // Try multiple API endpoints
  const endpoints = [
    // CLOB positions endpoint
    `${CLOB_API}/positions?user=${normalizedAddress}`,
    // Alternative CLOB endpoint
    `${CLOB_API}/data/positions?user=${normalizedAddress}`,
    // Gamma API
    `${GAMMA_API}/positions?user=${normalizedAddress}`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log('[Polymarket Portfolio] Trying:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PredictHub/1.0',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.log('[Polymarket Portfolio] Endpoint returned:', response.status);
        continue;
      }

      const data = await response.json();
      console.log('[Polymarket Portfolio] Response type:', typeof data, 'isArray:', Array.isArray(data));
      console.log('[Polymarket Portfolio] Sample:', JSON.stringify(data).slice(0, 1000));

      // Parse response - handle different formats
      const positionsList = Array.isArray(data) ? data : 
                          data.positions ? data.positions :
                          data.data ? data.data : [];

      if (positionsList.length === 0) continue;

      for (const pos of positionsList) {
        try {
          // Handle various field names
          const size = parseFloat(
            pos.size || pos.balance || pos.amount || pos.shares || 
            pos.totalShares || pos.quantity || '0'
          );
          
          if (size < 0.01) continue;

          // Get market details
          const conditionId = pos.conditionId || pos.condition_id || pos.marketId || pos.market_id || '';
          const tokenId = pos.asset || pos.tokenId || pos.token_id || pos.assetId || '';
          
          let marketTitle = pos.title || pos.question || pos.market || pos.marketTitle || '';
          let marketUrl = pos.url || '';
          let currentPrice = parseFloat(pos.price || pos.currentPrice || pos.lastPrice || '0.5');

          // Determine outcome
          let outcome = pos.outcome || pos.side || 'YES';
          if (typeof outcome === 'number') {
            outcome = outcome === 0 ? 'YES' : 'NO';
          }
          if (tokenId && tokenId.toLowerCase().includes('no')) {
            outcome = 'NO';
          }

          // Try to fetch market info if we have condition ID
          if ((!marketTitle || !marketUrl) && conditionId) {
            try {
              const marketRes = await fetch(
                `${GAMMA_API}/markets?condition_id=${conditionId}&_limit=1`,
                { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
              );
              if (marketRes.ok) {
                const marketData = await marketRes.json();
                const market = Array.isArray(marketData) ? marketData[0] : marketData;
                if (market) {
                  marketTitle = market.question || marketTitle;
                  const slug = market.slug || market.conditionId;
                  marketUrl = slug ? `https://polymarket.com/event/${slug}` : marketUrl;
                  
                  // Get current price from market
                  if (market.outcomePrices) {
                    const prices = typeof market.outcomePrices === 'string' 
                      ? JSON.parse(market.outcomePrices) 
                      : market.outcomePrices;
                    currentPrice = outcome === 'YES' ? parseFloat(prices[0]) : parseFloat(prices[1]);
                  }
                }
              }
            } catch (e) {
              console.log('[Polymarket Portfolio] Failed to fetch market:', conditionId);
            }
          }

          // Calculate P&L
          const avgPrice = parseFloat(pos.avgPrice || pos.averagePrice || pos.entryPrice || '0.5');
          const investment = size * avgPrice;
          const currentValue = size * currentPrice;
          const pnl = currentValue - investment;
          const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;

          totalValue += currentValue;
          totalPnl += pnl;

          positions.push({
            id: `poly-${conditionId || tokenId}-${outcome}`,
            platform: 'polymarket',
            market: marketTitle || `Position ${(conditionId || tokenId).slice(0, 8)}...`,
            outcome,
            size,
            avgPrice,
            currentPrice,
            pnl,
            pnlPercent,
            url: marketUrl || 'https://polymarket.com',
          });
        } catch (e) {
          console.log('[Polymarket Portfolio] Error parsing position:', e);
        }
      }

      // If we got positions from this endpoint, stop trying others
      if (positions.length > 0) {
        console.log('[Polymarket Portfolio] Found', positions.length, 'positions from', endpoint);
        break;
      }
    } catch (e) {
      console.log('[Polymarket Portfolio] Endpoint failed:', endpoint, e);
    }
  }

  // Sort by value
  positions.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));

  console.log('[Polymarket Portfolio] Returning', positions.length, 'positions');

  return NextResponse.json({
    positions,
    totalValue,
    totalPnl,
    error: null,
  });
}
