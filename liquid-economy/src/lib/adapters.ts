import type { QuoteResponse } from '../data/api-types';
import type { Asset, MarketSummaryItem, CommodityItem, TickerItem } from '../data/types';

// ── Display labels for main page ticker board ────────────────────────────────
const TICKER_LABEL: Record<string, string> = {
  'GAUTRY':   'GRAM ALTIN',
  'USD/TRY':  'DOLAR',
  'EUR/TRY':  'EURO',
  'GBP/TRY':  'STERLİN',
  'XU100':    'BIST 100',
  'BTC/USD':  'BITCOIN',
  'GAGTRY':   'GRAM GÜMÜŞ',
  'BRENT':    'BRENT',
};

// ── Icon + background per symbol ─────────────────────────────────────────────

const ICON_MAP: Record<string, { icon: string; iconBg: string }> = {
  'USD/TRY':  { icon: 'attach_money',          iconBg: 'bg-secondary-fixed' },
  'EUR/TRY':  { icon: 'euro',                  iconBg: 'bg-secondary-fixed' },
  'GBP/TRY':  { icon: 'currency_pound',        iconBg: 'bg-secondary-fixed' },
  'CHF/TRY':  { icon: 'currency_exchange',     iconBg: 'bg-secondary-fixed' },
  'JPY/TRY':  { icon: 'currency_yen',          iconBg: 'bg-secondary-fixed' },
  'EUR/USD':  { icon: 'euro',                  iconBg: 'bg-secondary-fixed' },
  'GBP/USD':  { icon: 'currency_pound',        iconBg: 'bg-secondary-fixed' },
  'BTC/USD':  { icon: 'currency_bitcoin',      iconBg: 'bg-surface-container-highest' },
  'XAU/USD':  { icon: 'savings',               iconBg: 'bg-tertiary-fixed' },
  'XAG/USD':  { icon: 'toll',                  iconBg: 'bg-surface-container-highest' },
  'GAUTRY':   { icon: 'savings',               iconBg: 'bg-tertiary-fixed' },
  'HAREM1KG': { icon: 'savings',               iconBg: 'bg-tertiary-fixed' },
  'SPX':      { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'DJI':      { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'NDX':      { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'XU100':    { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'DAX':      { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'UKX':      { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'N225':     { icon: 'show_chart',            iconBg: 'bg-primary-fixed' },
  'BRENT':    { icon: 'local_gas_station',     iconBg: 'bg-surface-container-highest' },
  'WTI':      { icon: 'local_gas_station',     iconBg: 'bg-surface-container-highest' },
  'NATGAS':   { icon: 'local_fire_department', iconBg: 'bg-surface-container-highest' },
  'HG':       { icon: 'toll',                  iconBg: 'bg-surface-container-highest' },
  'ZW':       { icon: 'grass',                 iconBg: 'bg-surface-container-highest' },
  'GAGTRY':   { icon: 'toll',                  iconBg: 'bg-surface-container-highest' },
};

const FALLBACK_ICON = { icon: 'trending_up', iconBg: 'bg-surface-container' };

// ── Ticker + description for market summary rows ──────────────────────────────

const SUMMARY_META: Record<string, { ticker: string; description: string }> = {
  'XU100':    { ticker: 'B10', description: 'İstanbul Menkul Kıymetler' },
  'SPX':      { ticker: 'SPX', description: 'New York Borsası' },
  'NDX':      { ticker: 'NDX', description: 'Nasdaq Endeksi' },
  'DJI':      { ticker: 'DJI', description: 'Dow Jones Endeksi' },
  'DAX':      { ticker: 'DAX', description: 'Frankfurt Borsası' },
  'UKX':      { ticker: 'UKX', description: 'Londra Borsası' },
  'N225':     { ticker: 'N25', description: 'Tokyo Borsası' },
  'USD/TRY':  { ticker: '₺$',  description: 'Amerikan Doları' },
  'EUR/TRY':  { ticker: '₺€',  description: 'Avrupa Euro' },
  'GBP/TRY':  { ticker: '₺£',  description: 'İngiliz Sterlini' },
  'CHF/TRY':  { ticker: '₺₣',  description: 'İsviçre Frangı' },
  'JPY/TRY':  { ticker: '₺¥',  description: 'Japon Yeni' },
  'EUR/USD':  { ticker: '€$',  description: 'Euro/Dolar Paritesi' },
  'GBP/USD':  { ticker: '£$',  description: 'Sterlin/Dolar Paritesi' },
  'GAUTRY':   { ticker: 'GAU', description: 'Gram Altın TL' },
  'HAREM1KG': { ticker: '1KG', description: 'Harem 1 Kilogram' },
  'XAU/USD':  { ticker: 'XAU', description: 'Ons Altın (Dolar)' },
  'XAG/USD':  { ticker: 'XAG', description: 'Gümüş (Ons)' },
  'BTC/USD':  { ticker: 'BTC', description: 'Bitcoin' },
  'BRENT':    { ticker: 'OIL', description: 'Ham Petrol Brent' },
  'WTI':      { ticker: 'WTI', description: 'Ham Petrol WTI' },
  'NATGAS':   { ticker: 'GAS', description: 'Doğal Gaz' },
  'HG':       { ticker: 'CU',  description: 'Bakır' },
  'ZW':       { ticker: 'ZW',  description: 'Buğday' },
  'GAGTRY':   { ticker: 'AG',  description: 'Gram Gümüş TL' },
};

// ── Converters ────────────────────────────────────────────────────────────────

/**
 * Convert an API quote to the frontend Asset type.
 * `id` is set to `symbol` (e.g. "USD/TRY") so pages can use symbol codes as IDs.
 * `history` is always [] — fetch separately via useHistory when needed.
 */
export function quoteToAsset(q: QuoteResponse): Asset {
  const { icon, iconBg } = ICON_MAP[q.data.symbol] ?? FALLBACK_ICON;
  return {
    id:       q.data.symbol,
    name:     q.data.name,
    code:     q.data.symbol,
    price:    q.data.price,
    change:   q.data.change_pct,
    category: q.data.category,
    icon,
    iconBg,
    history:  [],
  };
}

/** Convert an API quote to a MarketSummaryItem for the Piyasa Özeti list. */
export function quoteToMarketSummaryItem(q: QuoteResponse): MarketSummaryItem {
  const meta = SUMMARY_META[q.data.symbol] ?? {
    ticker: q.data.symbol.slice(0, 3).toUpperCase(),
    description: q.data.name,
  };
  return {
    id:          q.data.symbol,
    ticker:      meta.ticker,
    name:        q.data.name,
    description: meta.description,
    price:       q.data.price,
    change:      q.data.change_pct,
    history:     [],
  };
}

/** Convert an API quote to a CommodityItem for the mobile horizontal scroll. */
export function quoteToCommodityItem(q: QuoteResponse): CommodityItem {
  return {
    id:     q.data.symbol,
    name:   q.data.name,
    code:   q.data.symbol,
    price:  q.data.price,
    change: q.data.change_pct,
  };
}

/** Convert an API quote to a TickerItem for the main page piyasalar list. */
export function quoteToTickerItem(q: QuoteResponse): TickerItem {
  return {
    id:        q.data.symbol,
    label:     TICKER_LABEL[q.data.symbol] ?? q.data.name.toUpperCase(),
    price:     q.data.price,
    changePct: q.data.change_pct,
    currency:  q.data.currency,
  };
}

/** Locale-aware price formatter respecting each instrument's precision. */
export function formatPrice(price: number, symbol: string, currency: string): string {
  const locale = currency === 'TRY' ? 'tr-TR' : 'en-US';
  if (['SPX', 'DJI', 'NDX', 'XU100', 'DAX', 'UKX', 'N225'].includes(symbol)) {
    return price.toLocaleString(locale, { maximumFractionDigits: 2 });
  }
  if (symbol === 'HAREM1KG' || symbol === 'BTC/USD') {
    return price.toLocaleString(locale, { maximumFractionDigits: 0 });
  }
  return price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
