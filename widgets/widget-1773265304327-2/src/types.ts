export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  liquidity: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  image: string;
  icon: string;
  description: string;
  volume24hr?: number;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  active: boolean;
  closed: boolean;
  markets: PolymarketMarket[];
  volume: number;
  volume24hr: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  commentCount: number;
}

export interface ParsedMarket {
  id: string;
  question: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  image: string;
}

export type SortField = 'question' | 'yesPrice' | 'volume' | 'liquidity' | 'endDate';
export type SortDir = 'asc' | 'desc';
