import { UnifiedMarket, Platform } from '@/types/market';

export interface ArbitrageOpportunity {
  id: string;
  eventName: string;
  markets: {
    platform: Platform;
    market: UnifiedMarket;
    price: number;
  }[];
  priceDifference: number;
  potentialProfit: number;
  lowestPrice: number;
  highestPrice: number;
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract key terms from a market question
function extractKeyTerms(question: string): string[] {
  const normalized = normalizeText(question);
  const stopWords = new Set(['will', 'the', 'be', 'to', 'in', 'on', 'at', 'by', 'for', 'of', 'a', 'an', 'is', 'are', 'or', 'and', 'yes', 'no', 'before', 'after', 'during', 'when', 'what', 'how', 'who', 'where', 'which']);
  
  return normalized
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Calculate similarity between two sets of key terms
function calculateSimilarity(terms1: string[], terms2: string[]): number {
  if (terms1.length === 0 || terms2.length === 0) return 0;
  
  const set1 = new Set(terms1);
  const set2 = new Set(terms2);
  
  let matches = 0;
  for (const term of set1) {
    if (set2.has(term)) matches++;
  }
  
  // Jaccard similarity
  const union = new Set([...set1, ...set2]);
  return matches / union.size;
}

// Check if two markets are likely the same event
function areSameEvent(market1: UnifiedMarket, market2: UnifiedMarket): boolean {
  // Must be different platforms
  if (market1.platform === market2.platform) return false;
  
  // Must be same category
  if (market1.category !== market2.category) return false;
  
  // Extract and compare key terms
  const terms1 = extractKeyTerms(market1.question);
  const terms2 = extractKeyTerms(market2.question);
  
  const similarity = calculateSimilarity(terms1, terms2);
  
  // Consider same event if >60% similarity
  return similarity > 0.6;
}

// Find arbitrage opportunities across markets
export function findArbitrageOpportunities(
  markets: UnifiedMarket[],
  minDifferencePercent: number = 3
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  const processedPairs = new Set<string>();
  
  // Group markets by similar topics
  for (let i = 0; i < markets.length; i++) {
    const market1 = markets[i];
    const relatedMarkets: UnifiedMarket[] = [market1];
    
    for (let j = i + 1; j < markets.length; j++) {
      const market2 = markets[j];
      const pairKey = [market1.id, market2.id].sort().join('|');
      
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      
      if (areSameEvent(market1, market2)) {
        relatedMarkets.push(market2);
      }
    }
    
    // If we found markets on multiple platforms for same event
    if (relatedMarkets.length >= 2) {
      // Check for price differences
      const prices = relatedMarkets.map(m => ({
        platform: m.platform,
        market: m,
        price: m.probability,
      }));
      
      const minPrice = Math.min(...prices.map(p => p.price));
      const maxPrice = Math.max(...prices.map(p => p.price));
      const difference = maxPrice - minPrice;
      
      if (difference >= minDifferencePercent) {
        // Calculate potential profit (simplified)
        // Buy YES on low platform, NO on high platform
        const potentialProfit = difference / 100; // Per $1 invested
        
        opportunities.push({
          id: `arb-${market1.id}-${Date.now()}`,
          eventName: market1.question,
          markets: prices,
          priceDifference: difference,
          potentialProfit: potentialProfit * 100, // As percentage
          lowestPrice: minPrice,
          highestPrice: maxPrice,
        });
      }
    }
  }
  
  // Sort by largest price difference
  return opportunities.sort((a, b) => b.priceDifference - a.priceDifference);
}

// Format arbitrage opportunity for display
export function formatArbitrageOpportunity(opp: ArbitrageOpportunity): string {
  const low = opp.markets.find(m => m.price === opp.lowestPrice);
  const high = opp.markets.find(m => m.price === opp.highestPrice);
  
  if (!low || !high) return '';
  
  return `Buy YES on ${low.platform} at ${low.price.toFixed(1)}%, Sell YES on ${high.platform} at ${high.price.toFixed(1)}%`;
}




