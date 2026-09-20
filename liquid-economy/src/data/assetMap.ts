/**
 * assetMap.ts
 *
 * Bidirectional mapping between:
 *   - topic_key  (inference API slug, e.g. "bitcoin")
 *   - symbol     (market API key,    e.g. "BTC/USD")
 *   - urlSlug    (URL path segment,  e.g. "bitcoin"  — same as topic_key when available)
 *
 * ⚠️  topic_key values must match exactly what GET /inference/latest returns.
 *     Verify by inspecting `topic_key` fields in the live response.
 *     Unmapped symbols will show price-only tiles (no ConsensusBar).
 */

export interface AssetMeta {
  symbol: string;      // market API key
  topicKey: string;    // inference topic_key (slug)
  label: string;       // short display label for category chips
  category: 'fx' | 'gold' | 'index' | 'commodity' | 'crypto';
}

/** topic_key → asset metadata */
export const TOPIC_KEY_MAP: Record<string, AssetMeta> = {
  bitcoin:    { symbol: 'BTC/USD',  topicKey: 'bitcoin',    label: 'Bitcoin',       category: 'crypto'    },
  ethereum:   { symbol: 'ETH/USD',  topicKey: 'ethereum',   label: 'Ethereum',      category: 'crypto'    },
  'usd-try':  { symbol: 'USD/TRY',  topicKey: 'usd-try',    label: 'Dolar/TL',      category: 'fx'        },
  'eur-try':  { symbol: 'EUR/TRY',  topicKey: 'eur-try',    label: 'Euro/TL',       category: 'fx'        },
  altin:      { symbol: 'GAUTRY',   topicKey: 'altin',      label: 'Gram Altın',    category: 'gold'      },
  'ons-altin':{ symbol: 'XAU/USD',  topicKey: 'ons-altin',  label: 'Ons Altın',     category: 'gold'      },
  bist100:    { symbol: 'XU100',    topicKey: 'bist100',    label: 'BIST 100',      category: 'index'     },
  nasdaq:     { symbol: 'NDX',      topicKey: 'nasdaq',     label: 'Nasdaq 100',    category: 'index'     },
  sp500:      { symbol: 'SPX',      topicKey: 'sp500',      label: 'S&P 500',       category: 'index'     },
  brent:      { symbol: 'BRENT',    topicKey: 'brent',      label: 'Brent Petrol',  category: 'commodity' },
};

/** symbol → topic_key (for reverse lookup from market data) */
export const SYMBOL_TO_TOPIC_KEY: Record<string, string> = Object.fromEntries(
  Object.values(TOPIC_KEY_MAP).map((m) => [m.symbol, m.topicKey]),
);

/** Resolve asset metadata from a URL slug (= topic_key). */
export function assetFromSlug(slug: string): AssetMeta | null {
  return TOPIC_KEY_MAP[slug] ?? null;
}

/** Category label for filter chips. */
export const CATEGORY_LABELS: Record<string, string> = {
  all:       'Tümü',
  fx:        'Döviz',
  gold:      'Altın',
  index:     'Endeks',
  commodity: 'Emtia',
  crypto:    'Kripto',
};
