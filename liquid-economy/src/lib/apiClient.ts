import type {
  QuoteResponse,
  BatchQuoteResponse,
  HistoryResponse,
  MarketOverviewResponse,
  MarketSummaryResponse,
  HealthResponse,
  ProviderHealthResponse,
} from '../data/api-types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/v1';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

// "USD/TRY" → "USD-TRY", "GAUTRY" → "GAUTRY"
const toPath = (symbol: string) => symbol.replace('/', '-');

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ error: 'unknown', message: res.statusText, symbol: null }));
    throw Object.assign(new Error(body.message ?? res.statusText), {
      code: body.error,
      status: res.status,
    });
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: 'unknown', message: res.statusText, symbol: null }));
    throw Object.assign(new Error(err.message ?? res.statusText), {
      code: err.error,
      status: res.status,
    });
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** Single live quote. symbol accepts "USD/TRY" or "GAUTRY" form. */
  getQuote: (symbol: string) =>
    get<QuoteResponse>(`/quotes/${toPath(symbol)}`),

  /** Up to 20 symbols in one request. */
  getBatchQuotes: (symbols: string[]) =>
    post<BatchQuoteResponse>('/quotes/batch', symbols.map(toPath)),

  /** Price history: hours 1–168 (default 24). */
  getHistory: (symbol: string, hours = 24) =>
    get<HistoryResponse>(`/quotes/${toPath(symbol)}/history?hours=${hours}`),

  /** Curated dashboard 5: USD/TRY, GAUTRY, EUR/TRY, NDX, SPX. */
  getMarketOverview: () =>
    get<MarketOverviewResponse>('/market/overview'),

  /** All 25 instruments grouped by category. */
  getMarketSummary: () =>
    get<MarketSummaryResponse>('/market/summary'),

  /** Liveness check. */
  getHealth: () => get<HealthResponse>('/health'),

  /** Per-provider health. */
  getProviderHealth: () => get<ProviderHealthResponse>('/health/providers'),
};
