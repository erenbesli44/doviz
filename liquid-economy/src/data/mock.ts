import type { Asset, MarketSummaryItem, NewsItem, CommodityItem, ChartDataPoint } from './types';

// ---- Helpers ----
const makeHistory = (base: number, points = 24): ChartDataPoint[] => {
  const times = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00',
                  '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00',
                  '00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00'];
  let v = base * 0.99;
  return times.slice(0, points).map((time, i) => {
    v = v + (Math.random() - 0.48) * base * 0.003;
    if (i === points - 1) v = base; // last point is current price
    return { time, value: parseFloat(v.toFixed(4)) };
  });
};

// ---- FX Assets ----
export const fxAssets: Asset[] = [
  {
    id: 'usd-try',
    name: 'Dolar/TL',
    code: 'USD/TRY',
    price: 34.124,
    change: 0.12,
    category: 'fx',
    icon: 'attach_money',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(34.124),
  },
  {
    id: 'eur-try',
    name: 'Euro/TL',
    code: 'EUR/TRY',
    price: 38.154,
    change: -0.08,
    category: 'fx',
    icon: 'euro',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(38.154),
  },
  {
    id: 'gbp-try',
    name: 'Sterlin/TL',
    code: 'GBP/TRY',
    price: 44.21,
    change: 0.31,
    category: 'fx',
    icon: 'currency_pound',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(44.21),
  },
  {
    id: 'chf-try',
    name: 'İsviçre Frangı/TL',
    code: 'CHF/TRY',
    price: 39.85,
    change: -0.05,
    category: 'fx',
    icon: 'currency_exchange',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(39.85),
  },
  {
    id: 'jpy-try',
    name: 'Yen/TL',
    code: 'JPY/TRY',
    price: 0.2265,
    change: 0.19,
    category: 'fx',
    icon: 'currency_yen',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(0.2265),
  },
  {
    id: 'eur-usd',
    name: 'Euro/Dolar',
    code: 'EUR/USD',
    price: 1.1183,
    change: -0.21,
    category: 'fx',
    icon: 'euro',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(1.1183),
  },
  {
    id: 'gbp-usd',
    name: 'Sterlin/Dolar',
    code: 'GBP/USD',
    price: 1.295,
    change: 0.14,
    category: 'fx',
    icon: 'currency_pound',
    iconBg: 'bg-secondary-fixed',
    history: makeHistory(1.295),
  },
];

// ---- Gold Assets ----
export const goldAssets: Asset[] = [
  {
    id: 'gold-gram',
    name: 'Gram Altın',
    code: 'GAUTRY',
    price: 2845.12,
    change: 0.45,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(2845.12),
  },
  {
    id: 'gold-quarter',
    name: 'Çeyrek Altın',
    code: 'QAUTRY',
    price: 4267.5,
    change: 0.47,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(4267.5),
  },
  {
    id: 'gold-half',
    name: 'Yarım Altın',
    code: 'HAUTRY',
    price: 8530.0,
    change: 0.44,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(8530.0),
  },
  {
    id: 'gold-full',
    name: 'Tam Altın',
    code: 'FAUTRY',
    price: 17060.0,
    change: 0.45,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(17060.0),
  },
  {
    id: 'gold-ata',
    name: 'Ata Altın',
    code: 'ATATRY',
    price: 17240.0,
    change: 0.43,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(17240.0),
  },
  {
    id: 'gold-cumhuriyet',
    name: 'Cumhuriyet Altını',
    code: 'CUMTRY',
    price: 17180.0,
    change: 0.44,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(17180.0),
  },
  {
    id: 'xau-usd',
    name: 'Ons Altın',
    code: 'XAU/USD',
    price: 3040.5,
    change: 0.38,
    category: 'gold',
    icon: 'savings',
    iconBg: 'bg-tertiary-fixed',
    history: makeHistory(3040.5),
  },
];

// ---- Index Assets ----
export const indexAssets: Asset[] = [
  {
    id: 'bist100',
    name: 'BIST 100',
    code: 'XU100',
    price: 9142.40,
    change: 1.24,
    category: 'index',
    icon: 'show_chart',
    iconBg: 'bg-primary-fixed',
    history: makeHistory(9142.40),
  },
  {
    id: 'nasdaq',
    name: 'Nasdaq 100',
    code: 'NDX',
    price: 18672.71,
    change: 0.85,
    category: 'index',
    icon: 'show_chart',
    iconBg: 'bg-primary-fixed',
    history: makeHistory(18672.71),
  },
  {
    id: 'sp500',
    name: 'S&P 500',
    code: 'SPX',
    price: 5473.23,
    change: 0.33,
    category: 'index',
    icon: 'show_chart',
    iconBg: 'bg-primary-fixed',
    history: makeHistory(5473.23),
  },
  {
    id: 'dax',
    name: 'DAX 40',
    code: 'DAX',
    price: 18177.62,
    change: -0.47,
    category: 'index',
    icon: 'show_chart',
    iconBg: 'bg-primary-fixed',
    history: makeHistory(18177.62),
  },
  {
    id: 'ftse',
    name: 'FTSE 100',
    code: 'UKX',
    price: 8245.80,
    change: 0.21,
    category: 'index',
    icon: 'show_chart',
    iconBg: 'bg-primary-fixed',
    history: makeHistory(8245.80),
  },
  {
    id: 'nikkei',
    name: 'Nikkei 225',
    code: 'N225',
    price: 40120.50,
    change: -0.32,
    category: 'index',
    icon: 'show_chart',
    iconBg: 'bg-primary-fixed',
    history: makeHistory(40120.50),
  },
];

// ---- Commodity Assets ----
export const commodityAssets: Asset[] = [
  {
    id: 'silver',
    name: 'Gümüş',
    code: 'XAG/USD',
    price: 31.24,
    change: 2.1,
    category: 'commodity',
    icon: 'toll',
    iconBg: 'bg-surface-container-highest',
    history: makeHistory(31.24),
  },
  {
    id: 'brent',
    name: 'Brent Petrol',
    code: 'BRENT',
    price: 72.48,
    change: -1.4,
    category: 'commodity',
    icon: 'local_gas_station',
    iconBg: 'bg-surface-container-highest',
    history: makeHistory(72.48),
  },
  {
    id: 'naturalgas',
    name: 'Doğal Gaz',
    code: 'NATGAS',
    price: 2.31,
    change: 0.8,
    category: 'commodity',
    icon: 'local_fire_department',
    iconBg: 'bg-surface-container-highest',
    history: makeHistory(2.31),
  },
  {
    id: 'copper',
    name: 'Bakır',
    code: 'HG',
    price: 4.72,
    change: 0.55,
    category: 'commodity',
    icon: 'toll',
    iconBg: 'bg-surface-container-highest',
    history: makeHistory(4.72),
  },
  {
    id: 'wheat',
    name: 'Buğday',
    code: 'ZW',
    price: 548.25,
    change: -0.73,
    category: 'commodity',
    icon: 'grass',
    iconBg: 'bg-surface-container-highest',
    history: makeHistory(548.25),
  },
  {
    id: 'wti',
    name: 'WTI Ham Petrol',
    code: 'WTI',
    price: 69.85,
    change: -1.1,
    category: 'commodity',
    icon: 'local_gas_station',
    iconBg: 'bg-surface-container-highest',
    history: makeHistory(69.85),
  },
];

// ---- Markets overview assets (top 5 for desktop grid) ----
export const marketOverviewAssets: Asset[] = [
  fxAssets[0],    // USD/TRY
  goldAssets[0],  // Gram Altın
  fxAssets[1],    // EUR/TRY
  indexAssets[1], // Nasdaq
  indexAssets[2], // S&P 500
];

// ---- Commodity cards (mobile horizontal scroll) ----
export const commodityCards: CommodityItem[] = [
  { id: 'silver',     name: 'Gümüş',       code: 'XAG/USD', price: 31.24, change: 2.1  },
  { id: 'brent',      name: 'Brent Petrol', code: 'BRENT',   price: 72.48, change: -1.4 },
  { id: 'naturalgas', name: 'Doğal Gaz',    code: 'NATGAS',  price: 2.31,  change: 0.8  },
  { id: 'copper',     name: 'Bakır',        code: 'HG',      price: 4.72,  change: 0.55 },
  { id: 'wti',        name: 'WTI Petrol',   code: 'WTI',     price: 69.85, change: -1.1 },
];

// ---- Market summary list ----
export const marketSummaryItems: MarketSummaryItem[] = [
  {
    id: 'bist100',
    ticker: 'B10',
    name: 'BIST 100',
    description: 'İstanbul Menkul Kıymetler',
    price: 9142.40,
    change: 1.24,
    history: [30,25,28,15,18,10,15,5,12,8,2],
  },
  {
    id: 'dax',
    ticker: 'DAX',
    name: 'DAX 40',
    description: 'Almanya Endeksi',
    price: 18177.62,
    change: -0.47,
    history: [10,15,12,25,22,30,25,35,28,32,38],
  },
  {
    id: 'silver',
    ticker: 'AG',
    name: 'Gümüş',
    description: 'XAG/USD',
    price: 31.24,
    change: 2.1,
    history: [35,32,34,20,25,15,18,8,15,12,5],
  },
  {
    id: 'nasdaq',
    ticker: 'NDX',
    name: 'Nasdaq 100',
    description: 'ABD Teknoloji Endeksi',
    price: 18672.71,
    change: 0.85,
    history: [28,24,26,18,20,12,14,6,10,7,3],
  },
];

// ---- News ----
export const newsItems: NewsItem[] = [
  {
    id: 'news-1',
    category: 'Analiz',
    headline: 'FED Faiz Kararı Sonrası Küresel Piyasalar: Yeni Bir Boğa Koşusu mu?',
    excerpt: 'Amerikan Merkez Bankası\'nın son açıklamaları sonrası teknoloji hisselerinde yaşanan ralli piyasalara yeni bir ivme kazandırdı.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format',
    timestamp: '32 dakika önce',
    featured: true,
  },
  {
    id: 'news-2',
    category: 'Merkez Bankası',
    headline: 'TCMB Brüt Rezervleri Geçen Hafta 2.4 Milyar Dolar Arttı',
    excerpt: undefined,
    image: undefined,
    timestamp: '12 dakika önce',
    featured: false,
  },
  {
    id: 'news-3',
    category: 'Kripto',
    headline: 'Bitcoin 65.000 Dolar Direncini Zorluyor: ETF Girişleri Güçleniyor',
    excerpt: undefined,
    image: undefined,
    timestamp: '2 saat önce',
    featured: false,
  },
  {
    id: 'news-4',
    category: 'Emtia',
    headline: 'Petrol Fiyatları OPEC+ Kararı Öncesi Geriledi',
    excerpt: undefined,
    image: undefined,
    timestamp: '3 saat önce',
    featured: false,
  },
];
