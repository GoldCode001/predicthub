export interface Position {
  id: string;
  platform: 'polymarket' | 'kalshi' | 'manifold';
  marketQuestion: string;
  outcome: string;  // YES, NO, or specific outcome
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  investmentAmount: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  closeDate: string | null;
  marketUrl: string;
  isActive: boolean;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  activePositions: number;
  closedPositions: number;
  winRate: number;  // % of profitable positions
  bestPosition: Position | null;
  worstPosition: Position | null;
}

export interface PortfolioFilters {
  platform: 'all' | 'polymarket' | 'kalshi' | 'manifold';
  status: 'all' | 'active' | 'closed';
  profitability: 'all' | 'profit' | 'loss';
  sortBy: 'profitLoss' | 'currentValue' | 'closeDate' | 'profitLossPercent';
  sortDirection: 'asc' | 'desc';
}



