import { UnifiedMarket, Platform } from '@/types/market';

export interface EventGroup {
  id: string;
  name: string;
  markets: UnifiedMarket[];
  totalVolume: number;
  avgProbability: number;
  platforms: Platform[];
  category: string;
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
  const stopWords = new Set([
    'will', 'the', 'be', 'to', 'in', 'on', 'at', 'by', 'for', 'of', 'a', 'an', 
    'is', 'are', 'or', 'and', 'yes', 'no', 'before', 'after', 'during', 'when', 
    'what', 'how', 'who', 'where', 'which', 'this', 'that', 'than', 'more', 
    'less', 'if', 'has', 'have', 'do', 'does', 'did', 'win', 'winning', 'wins',
  ]);
  
  return normalized
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Calculate similarity between two sets of key terms using Jaccard similarity
function calculateSimilarity(terms1: string[], terms2: string[]): number {
  if (terms1.length === 0 || terms2.length === 0) return 0;
  
  const set1 = new Set(terms1);
  const set2 = new Set(terms2);
  
  let matches = 0;
  for (const term of set1) {
    if (set2.has(term)) matches++;
  }
  
  const union = new Set([...set1, ...set2]);
  return matches / union.size;
}

// Extract a common topic name from a group of markets
function extractGroupName(markets: UnifiedMarket[]): string {
  if (markets.length === 0) return 'Unknown';
  if (markets.length === 1) return markets[0].question;
  
  // Count term frequency across all markets
  const termCounts = new Map<string, number>();
  
  for (const market of markets) {
    const terms = extractKeyTerms(market.question);
    for (const term of terms) {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    }
  }
  
  // Get terms that appear in most markets
  const threshold = Math.ceil(markets.length * 0.5);
  const commonTerms = Array.from(termCounts.entries())
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);
  
  if (commonTerms.length === 0) {
    // Fallback: use the shortest question
    return markets.reduce((shortest, m) => 
      m.question.length < shortest.length ? m.question : shortest
    , markets[0].question);
  }
  
  // Capitalize and join
  return commonTerms
    .map(term => term.charAt(0).toUpperCase() + term.slice(1))
    .join(' ');
}

// Group markets by similarity
export function groupMarketsByEvent(
  markets: UnifiedMarket[], 
  similarityThreshold: number = 0.5
): EventGroup[] {
  if (markets.length === 0) return [];
  
  const groups: EventGroup[] = [];
  const assigned = new Set<string>();
  
  // Pre-compute terms for all markets
  const termsMap = new Map<string, string[]>();
  for (const market of markets) {
    termsMap.set(market.id, extractKeyTerms(market.question));
  }
  
  // Find groups
  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    
    if (assigned.has(market.id)) continue;
    
    const terms = termsMap.get(market.id) || [];
    const relatedMarkets: UnifiedMarket[] = [market];
    assigned.add(market.id);
    
    // Find similar markets
    for (let j = i + 1; j < markets.length; j++) {
      const other = markets[j];
      
      if (assigned.has(other.id)) continue;
      
      // Only group markets in the same category
      if (market.category !== other.category) continue;
      
      const otherTerms = termsMap.get(other.id) || [];
      const similarity = calculateSimilarity(terms, otherTerms);
      
      if (similarity >= similarityThreshold) {
        relatedMarkets.push(other);
        assigned.add(other.id);
      }
    }
    
    // Only create a group if there's more than 1 market
    if (relatedMarkets.length >= 2) {
      const platforms = [...new Set(relatedMarkets.map(m => m.platform))];
      const totalVolume = relatedMarkets.reduce((sum, m) => sum + m.volume, 0);
      const avgProbability = relatedMarkets.reduce((sum, m) => sum + m.probability, 0) / relatedMarkets.length;
      
      groups.push({
        id: `group-${market.id}`,
        name: extractGroupName(relatedMarkets),
        markets: relatedMarkets.sort((a, b) => b.volume - a.volume),
        totalVolume,
        avgProbability,
        platforms,
        category: market.category,
      });
    } else {
      // Single market - still add it as a group of 1
      groups.push({
        id: `single-${market.id}`,
        name: market.question,
        markets: relatedMarkets,
        totalVolume: market.volume,
        avgProbability: market.probability,
        platforms: [market.platform],
        category: market.category,
      });
    }
  }
  
  // Sort groups by total volume
  return groups.sort((a, b) => b.totalVolume - a.totalVolume);
}

// Get only multi-market groups (for display)
export function getMultiMarketGroups(groups: EventGroup[]): EventGroup[] {
  return groups.filter(g => g.markets.length >= 2);
}

// Get ungrouped markets (singles)
export function getUngroupedMarkets(groups: EventGroup[]): UnifiedMarket[] {
  return groups
    .filter(g => g.markets.length === 1)
    .map(g => g.markets[0]);
}

