/**
 * Market symbols ↔ editorial topics.
 *
 * Topic keys are the ones GET /inference/latest and /consensus actually return
 * (bitcoin, dolar-tl, bist, us-markets, altin, gumus, petrol-enerji, …). A topic
 * can cover several instruments; each topic names one primary symbol for its live price.
 */

export interface AssetMeta {
  symbol: string;   // primary market symbol, for the live price tile
  topicKey: string;
}

const TOPIC_PRIMARY_SYMBOL: Record<string, string> = {
  bitcoin: 'BTC/USD',
  'dolar-tl': 'USD/TRY',
  bist: 'XU100',
  'us-markets': 'SPX',
  altin: 'GAUTRY',
  gumus: 'XAG/USD',
  'petrol-enerji': 'BRENT',
};

/** symbol → topic key. Symbols without an entry have no expert coverage. */
export const SYMBOL_TO_TOPIC_KEY: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'bitcoin',
  'USD/TRY': 'dolar-tl',
  XU100: 'bist',
  SPX: 'us-markets',
  NDX: 'us-markets',
  DJI: 'us-markets',
  GAUTRY: 'altin',
  'XAU/USD': 'altin',
  'XAG/USD': 'gumus',
  GAGTRY: 'gumus',
  BRENT: 'petrol-enerji',
  WTI: 'petrol-enerji',
  NATGAS: 'petrol-enerji',
};

/** Resolve the live-price symbol for a topic page (/piyasa/:slug). */
export function assetFromSlug(slug: string): AssetMeta | null {
  const symbol = TOPIC_PRIMARY_SYMBOL[slug];
  return symbol ? { symbol, topicKey: slug } : null;
}

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'Tümü',
  fx: 'Döviz',
  gold: 'Altın',
  index: 'Endeks',
  commodity: 'Emtia',
  crypto: 'Kripto',
};
