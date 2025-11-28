// Unified market type for all platforms
export type Platform = 'polymarket' | 'kalshi' | 'manifold' | 'metaculus';

export type Category = 
  | 'politics'
  | 'crypto'
  | 'sports'
  | 'science'
  | 'economics'
  | 'entertainment'
  | 'technology'
  | 'world'
  | 'other';

export interface UnifiedMarket {
  id: string;
  question: string;
  platform: Platform;
  probability: number; // 0-100
  volume: number; // USD equivalent
  volumeLabel: string; // For display (e.g., "Play Money" for Manifold)
  category: Category;
  endDate: string | null;
  url: string;
  imageUrl?: string;
  isPlayMoney: boolean;
}

export interface PlatformStatus {
  platform: Platform;
  loading: boolean;
  error: string | null;
  marketCount: number;
}

// Platform colors for badges
export const platformColors: Record<Platform, { bg: string; text: string; border: string; glow: string }> = {
  polymarket: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'rgba(168, 85, 247, 0.15)',
  },
  kalshi: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  manifold: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  metaculus: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'rgba(249, 115, 22, 0.15)',
  },
};

export const platformNames: Record<Platform, string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  manifold: 'Manifold',
  metaculus: 'Metaculus',
};

export const categoryLabels: Record<Category, string> = {
  politics: 'Politics',
  crypto: 'Crypto',
  sports: 'Sports',
  science: 'Science',
  economics: 'Economics',
  entertainment: 'Entertainment',
  technology: 'Technology',
  world: 'World Events',
  other: 'Other',
};

// Helper to infer category from question text
export function inferCategory(question: string, tags?: string[]): Category {
  const q = question.toLowerCase();
  const t = (tags || []).map(tag => tag.toLowerCase()).join(' ');
  const combined = `${q} ${t}`;

  if (combined.match(/trump|biden|election|president|congress|senate|governor|democrat|republican|vote|polling|political/)) {
    return 'politics';
  }
  if (combined.match(/bitcoin|ethereum|crypto|btc|eth|token|blockchain|defi|nft/)) {
    return 'crypto';
  }
  if (combined.match(/nfl|nba|mlb|soccer|football|basketball|baseball|tennis|olympics|championship|super bowl|world cup/)) {
    return 'sports';
  }
  if (combined.match(/ai|artificial intelligence|gpt|openai|google|apple|microsoft|tech|software|startup/)) {
    return 'technology';
  }
  if (combined.match(/climate|science|research|study|nasa|space|physics|biology|medicine|vaccine|virus/)) {
    return 'science';
  }
  if (combined.match(/gdp|inflation|fed|interest rate|stock|market|economy|recession|unemployment|trade/)) {
    return 'economics';
  }
  if (combined.match(/movie|oscar|emmy|grammy|album|song|celebrity|netflix|disney|entertainment|tv|show/)) {
    return 'entertainment';
  }
  if (combined.match(/war|ukraine|russia|china|country|international|global|nation|treaty/)) {
    return 'world';
  }
  return 'other';
}

// ==========================================
// POLYMARKET TYPES
// ==========================================
export interface PolymarketRaw {
  id: string;
  question: string;
  slug: string;
  image: string;
  outcomePrices: string;
  volume: string;
  volumeNum: number;
  endDateIso: string;
  active: boolean;
  closed: boolean;
  groupItemTitle?: string;
}

export function parsePolymarket(market: PolymarketRaw): UnifiedMarket | null {
  try {
    let probability = 50;
    try {
      const prices = JSON.parse(market.outcomePrices || '[]');
      if (prices.length >= 1) {
        probability = Math.round(parseFloat(prices[0]) * 100);
      }
    } catch {}

    const volume = market.volumeNum || parseFloat(market.volume) || 0;
    if (!market.question || volume <= 0) return null;

    return {
      id: `polymarket-${market.id}`,
      question: market.question,
      platform: 'polymarket',
      probability,
      volume,
      volumeLabel: 'USDC',
      category: inferCategory(market.question),
      endDate: market.endDateIso || null,
      url: `https://polymarket.com/event/${market.slug}`,
      imageUrl: market.image,
      isPlayMoney: false,
    };
  } catch {
    return null;
  }
}

// ==========================================
// KALSHI TYPES
// ==========================================
export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  category?: string;
  yes_bid?: number;
  yes_ask?: number;
  last_price?: number;
  volume?: number;
  volume_24h?: number;
  open_interest?: number;
  close_time?: string;
  status?: string;
}

export interface KalshiResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

export function parseKalshi(market: KalshiMarket): UnifiedMarket | null {
  try {
    // Use last_price, or midpoint of bid/ask, or 50 as default
    let probability = 50;
    if (market.last_price !== undefined) {
      probability = Math.round(market.last_price * 100);
    } else if (market.yes_bid !== undefined && market.yes_ask !== undefined) {
      probability = Math.round(((market.yes_bid + market.yes_ask) / 2) * 100);
    }

    const volume = market.volume || market.volume_24h || 0;
    if (!market.title) return null;

    const question = market.subtitle 
      ? `${market.title}: ${market.subtitle}`
      : market.title;

    return {
      id: `kalshi-${market.ticker}`,
      question,
      platform: 'kalshi',
      probability,
      volume,
      volumeLabel: 'USD',
      category: inferCategory(question, market.category ? [market.category] : []),
      endDate: market.close_time || null,
      url: `https://kalshi.com/markets/${market.ticker}`,
      isPlayMoney: false,
    };
  } catch {
    return null;
  }
}

// ==========================================
// MANIFOLD TYPES
// ==========================================
export interface ManifoldMarket {
  id: string;
  question: string;
  slug: string;
  creatorUsername: string;
  probability?: number;
  pool?: { YES?: number; NO?: number };
  totalLiquidity?: number;
  volume?: number;
  volume24Hours?: number;
  closeTime?: number;
  isResolved?: boolean;
  resolution?: string;
  tags?: string[];
  groupSlugs?: string[];
  coverImageUrl?: string;
  outcomeType?: string;
}

export function parseManifold(market: ManifoldMarket): UnifiedMarket | null {
  try {
    // Only include binary markets
    if (market.outcomeType && market.outcomeType !== 'BINARY') return null;
    if (market.isResolved) return null;

    const probability = market.probability !== undefined 
      ? Math.round(market.probability * 100) 
      : 50;

    const volume = market.volume || 0;
    if (!market.question) return null;

    return {
      id: `manifold-${market.id}`,
      question: market.question,
      platform: 'manifold',
      probability,
      volume,
      volumeLabel: 'Mana (Play $)',
      category: inferCategory(market.question, market.groupSlugs),
      endDate: market.closeTime ? new Date(market.closeTime).toISOString() : null,
      url: `https://manifold.markets/${market.creatorUsername}/${market.slug}`,
      imageUrl: market.coverImageUrl,
      isPlayMoney: true,
    };
  } catch {
    return null;
  }
}

// ==========================================
// METACULUS TYPES
// ==========================================
export interface MetaculusQuestion {
  id: number;
  title: string;
  title_short?: string;
  url?: string;
  page_url?: string;
  url_with_id?: string;
  created_at?: string;
  publish_time?: string;
  close_time?: string;
  effected_close_time?: string;
  resolve_time?: string;
  resolution?: number | null;
  community_prediction?: {
    full?: { q2?: number; y?: number[] };
    history?: Array<{ x: number; y: number }>;
  };
  metaculus_prediction?: {
    full?: { q2?: number };
  };
  number_of_forecasters?: number;
  forecasts_count?: number;
  type?: string;
  possibilities?: { type: string };
  active_state?: string;
  prediction_count?: number;
  question_weight?: number;
}

export interface MetaculusResponse {
  results: MetaculusQuestion[];
  next?: string;
  count?: number;
}

export function parseMetaculus(question: MetaculusQuestion): UnifiedMarket | null {
  try {
    // Skip if resolved
    if (question.resolution !== null && question.resolution !== undefined) return null;

    // Try to get probability from community prediction
    let probability = 50;
    if (question.community_prediction?.full?.q2 !== undefined) {
      probability = Math.round(question.community_prediction.full.q2 * 100);
    } else if (question.metaculus_prediction?.full?.q2 !== undefined) {
      probability = Math.round(question.metaculus_prediction.full.q2 * 100);
    }

    const title = question.title || question.title_short;
    if (!title) return null;

    const forecastCount = question.number_of_forecasters || question.forecasts_count || question.prediction_count || 0;

    return {
      id: `metaculus-${question.id}`,
      question: title,
      platform: 'metaculus',
      probability,
      volume: forecastCount,
      volumeLabel: 'Forecasts',
      category: inferCategory(title),
      endDate: question.close_time || question.effected_close_time || null,
      url: question.url_with_id || question.page_url || `https://www.metaculus.com/questions/${question.id}/`,
      isPlayMoney: true, // No real money
    };
  } catch {
    return null;
  }
}
