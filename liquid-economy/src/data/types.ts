// ---- Asset categories ----
export type AssetCategory = 'fx' | 'gold' | 'index' | 'commodity' | 'crypto';

// ---- Chart data ----
export interface ChartDataPoint {
  time: string;
  value: number;
}

// ---- Core asset ----
export interface Asset {
  id: string;
  name: string;        // e.g. "Dolar/TL"
  code: string;        // e.g. "USD/TRY"
  price: number;
  change: number;      // percentage, e.g. 0.12 means +0.12%
  category: AssetCategory;
  icon: string;        // Material Symbol icon name
  iconBg: string;      // Tailwind bg class
  history: ChartDataPoint[];
}

// ---- Market summary list item ----
export interface MarketSummaryItem {
  id: string;
  ticker: string;      // short label for icon box, e.g. "B10"
  name: string;        // e.g. "BIST 100"
  description: string; // e.g. "İstanbul Menkul Kıymetler"
  price: number;
  change: number;
  history: number[];   // sparkline values (simplified)
}

// ---- News / Insights ----
export interface NewsItem {
  id: string;
  category: string;
  headline: string;
  excerpt?: string;
  image?: string;
  timestamp: string;
  featured: boolean;
}

// ---- Commodity card ----
export interface CommodityItem {
  id: string;
  name: string;
  code: string;
  price: number;
  change: number;
}
