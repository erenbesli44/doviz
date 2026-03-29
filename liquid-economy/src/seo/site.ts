export const SITE = {
  name: 'Döviz Veri',
  url: 'https://dovizveri.com',
  defaultTitle: 'Canlı Döviz, Altın, Endeks, Emtia ve Kripto Verileri | Döviz Veri',
  defaultDescription:
    'Türkiye odaklı canlı döviz kurları, altın fiyatları, kapalıçarşı verileri, endeks, emtia ve kripto piyasalarını anlık takip edin.',
} as const;

export interface SeoSymbol {
  slug: string;
  symbol: string;
  name: string;
  category: 'doviz' | 'altin' | 'kapalicarsi' | 'endeks' | 'emtia' | 'kripto';
  description: string;
  related: string[];
}

export const SEO_SYMBOLS: SeoSymbol[] = [
  {
    slug: 'dolar-kuru-usd-try',
    symbol: 'USD/TRY',
    name: 'Dolar Kuru (USD/TRY)',
    category: 'doviz',
    description: 'Canlı dolar kuru, günlük değişim, anlık fiyat ve geçmiş grafik.',
    related: ['euro-kuru-eur-try', 'sterlin-kuru-gbp-try', 'gram-altin'],
  },
  {
    slug: 'euro-kuru-eur-try',
    symbol: 'EUR/TRY',
    name: 'Euro Kuru (EUR/TRY)',
    category: 'doviz',
    description: 'Canlı euro kuru, anlık fiyat ve güncel değişim verileri.',
    related: ['dolar-kuru-usd-try', 'sterlin-kuru-gbp-try'],
  },
  {
    slug: 'sterlin-kuru-gbp-try',
    symbol: 'GBP/TRY',
    name: 'Sterlin Kuru (GBP/TRY)',
    category: 'doviz',
    description: 'Canlı sterlin kuru ve güncel piyasa değişimi.',
    related: ['dolar-kuru-usd-try', 'euro-kuru-eur-try'],
  },
  {
    slug: 'gram-altin',
    symbol: 'GAUTRY',
    name: 'Gram Altın',
    category: 'altin',
    description: 'Canlı gram altın fiyatı, değişim oranı ve fiyat grafiği.',
    related: ['ons-altin-xauusd', 'gumus-gram-gagtry', 'kapalicarsi-gram-altin'],
  },
  {
    slug: 'ons-altin-xauusd',
    symbol: 'XAU/USD',
    name: 'Ons Altın (XAU/USD)',
    category: 'altin',
    description: 'Canlı ons altın fiyatı ve piyasa değişimi.',
    related: ['gram-altin', 'gumus-ons-xagusd'],
  },
  {
    slug: 'gumus-ons-xagusd',
    symbol: 'XAG/USD',
    name: 'Gümüş Ons (XAG/USD)',
    category: 'emtia',
    description: 'Canlı gümüş ons fiyatı, anlık değişim ve grafik.',
    related: ['gumus-gram-gagtry', 'brent-petrol'],
  },
  {
    slug: 'gumus-gram-gagtry',
    symbol: 'GAGTRY',
    name: 'Gram Gümüş',
    category: 'altin',
    description: 'Canlı gram gümüş fiyatı, değişim ve grafik verileri.',
    related: ['gram-altin', 'gumus-ons-xagusd'],
  },
  {
    slug: 'kapalicarsi-gram-altin',
    symbol: 'HAREM1KG',
    name: 'Kapalıçarşı Gram Altın (Harem 1kg)',
    category: 'kapalicarsi',
    description: 'Kapalıçarşı odaklı yerel altın göstergesi ve güncel fiyat durumu.',
    related: ['gram-altin'],
  },
  {
    slug: 'sp500-endeksi',
    symbol: 'SPX',
    name: 'S&P 500',
    category: 'endeks',
    description: 'S&P 500 canlı endeks verileri ve anlık değişim.',
    related: ['nasdaq-100-endeksi', 'dow-jones-endeksi'],
  },
  {
    slug: 'nasdaq-100-endeksi',
    symbol: 'NDX',
    name: 'Nasdaq 100',
    category: 'endeks',
    description: 'Nasdaq 100 canlı endeks verileri ve değişim grafiği.',
    related: ['sp500-endeksi', 'dow-jones-endeksi'],
  },
  {
    slug: 'dow-jones-endeksi',
    symbol: 'DJI',
    name: 'Dow Jones',
    category: 'endeks',
    description: 'Dow Jones canlı endeks verileri ve piyasa değişimi.',
    related: ['sp500-endeksi', 'nasdaq-100-endeksi'],
  },
  {
    slug: 'bist-100-endeksi',
    symbol: 'XU100',
    name: 'BIST 100',
    category: 'endeks',
    description: 'BIST 100 canlı endeks verileri ve güncel piyasa görünümü.',
    related: ['sp500-endeksi', 'nasdaq-100-endeksi'],
  },
  {
    slug: 'brent-petrol',
    symbol: 'BRENT',
    name: 'Brent Petrol',
    category: 'emtia',
    description: 'Brent petrol canlı fiyatı ve güncel emtia değişimi.',
    related: ['wti-petrol', 'dogal-gaz-natgas'],
  },
  {
    slug: 'wti-petrol',
    symbol: 'WTI',
    name: 'WTI Petrol',
    category: 'emtia',
    description: 'WTI ham petrol canlı fiyatı ve anlık değişim.',
    related: ['brent-petrol', 'dogal-gaz-natgas'],
  },
  {
    slug: 'dogal-gaz-natgas',
    symbol: 'NATGAS',
    name: 'Doğal Gaz',
    category: 'emtia',
    description: 'Doğal gaz canlı emtia verileri ve fiyat hareketleri.',
    related: ['brent-petrol', 'wti-petrol'],
  },
  {
    slug: 'bitcoin-btc-usd',
    symbol: 'BTC/USD',
    name: 'Bitcoin (BTC/USD)',
    category: 'kripto',
    description: 'Bitcoin canlı fiyatı, değişim ve grafik takibi.',
    related: ['ethereum-kavramsal', 'dolar-kuru-usd-try'],
  },
];

export const SEO_SYMBOL_MAP = new Map(SEO_SYMBOLS.map((item) => [item.slug, item]));

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}
