// ── Shared ──────────────────────────────────────────────────────────────────

export type AssetCategory = 'fx' | 'gold' | 'index' | 'commodity' | 'crypto';

export type MarketStatus = 'open' | 'closed' | 'pre-market' | null;

export type Provider = 'finnhub' | 'fmp' | 'coingecko' | 'yahoo' | 'harem_altin' | 'derived';

// ── Quote ────────────────────────────────────────────────────────────────────

export interface QuoteData {
  symbol: string;         // e.g. "USD/TRY" — always uses "/" separator
  name: string;           // e.g. "Dolar/TL"
  price: number;
  change_pct: number;     // 0.12 = +0.12%, -1.5 = -1.5%
  open: number | null;
  high: number | null;
  low: number | null;
  currency: string;       // e.g. "TRY" or "USD"
  category: AssetCategory;
  unit: string | null;    // "troy oz" | "gram" | "barrel" | "MMBtu" | "lb" | "bushel" | null
}

export interface QuoteMeta {
  provider: Provider;
  is_live: boolean;
  delay_minutes: number | null;
  fetched_at: string;            // ISO-8601
  market_status: MarketStatus;
}

export interface QuoteResponse {
  data: QuoteData;
  meta: QuoteMeta;
}

export interface BatchQuoteResponse {
  quotes: QuoteResponse[];
  errors: Record<string, string>;
}

// ── History ──────────────────────────────────────────────────────────────────

export interface HistoryPoint {
  time: string;   // "HH:MM" for intraday or ISO-8601 date for multi-day
  value: number;
}

export interface HistoryResponse {
  symbol: string;
  points: HistoryPoint[];
  provider: Provider;
  is_live: boolean;
  fetched_at: string;
}

// ── Market ───────────────────────────────────────────────────────────────────

export interface MarketOverviewResponse {
  quotes: QuoteResponse[];
}

export interface MarketSummaryResponse {
  fx: QuoteResponse[];
  gold: QuoteResponse[];
  indexes: QuoteResponse[];
  commodities: QuoteResponse[];
  crypto: QuoteResponse[];
}

// ── Health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ProviderHealthResponse {
  [provider: string]: 'ok' | 'unavailable';
}

// ── Error ────────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  error: string;
  message: string;
  symbol: string | null;
}
