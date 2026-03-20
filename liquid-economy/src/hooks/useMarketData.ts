import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';
import { quoteToAsset, quoteToMarketSummaryItem, quoteToCommodityItem, quoteToTickerItem } from '../lib/adapters';
import { newsItems } from '../data/mock';
import { useSSEQuotes } from './useSSEQuotes';
import type { Asset, MarketSummaryItem, NewsItem, CommodityItem, TickerItem } from '../data/types';

// Symbols subscribed to SSE for live price refresh
// XAU/USD is included so we can derive gram altın in real-time (instead of GAUTRY physical price)
const OVERVIEW_SYMBOLS = ['USD/TRY', 'EUR/TRY', 'GBP/TRY', 'BTC/USD', 'XAU/USD', 'XU100', 'NDX', 'SPX', 'GAGTRY', 'BRENT'];

// Ordered list for the main piyasalar ticker board
const TICKER_ORDER = ['GAUTRY', 'USD/TRY', 'EUR/TRY', 'GBP/TRY', 'XU100', 'BTC/USD', 'GAGTRY', 'BRENT'];

// All 10 symbols shown in the extended overview grid (deduplicates the old TickerBoard)
const EXTENDED_OVERVIEW_ORDER = ['USD/TRY', 'EUR/TRY', 'GBP/TRY', 'GAUTRY', 'GAGTRY', 'XU100', 'NDX', 'SPX', 'BTC/USD', 'BRENT'];

type Status = 'idle' | 'loading' | 'success' | 'error';

interface MarketData {
  status: Status;
  overviewAssets: Asset[];
  extendedOverviewAssets: Asset[];
  fxAssets: Asset[];
  goldAssets: Asset[];
  indexAssets: Asset[];
  commodityAssets: Asset[];
  commodityCards: CommodityItem[];
  marketSummary: MarketSummaryItem[];
  tickerItems: TickerItem[];
  news: NewsItem[];
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useMarketData(): MarketData {
  const [status,                 setStatus]           = useState<Status>('loading');
  const [overviewAssets,         setOverview]         = useState<Asset[]>([]);
  const [extendedOverviewAssets, setExtendedOverview] = useState<Asset[]>([]);
  const [fxAssets,               setFx]               = useState<Asset[]>([]);
  const [goldAssets,             setGold]             = useState<Asset[]>([]);
  const [indexAssets,            setIndexes]          = useState<Asset[]>([]);
  const [commodityAssets,        setCommodities]      = useState<Asset[]>([]);
  const [commodityCards,         setCards]            = useState<CommodityItem[]>([]);
  const [marketSummary,          setSummary]          = useState<MarketSummaryItem[]>([]);
  const [tickerItems,            setTicker]           = useState<TickerItem[]>([]);
  const [lastUpdated,            setUpdated]          = useState<Date | null>(null);

  // Real-time SSE for overview symbols — falls back to polling gracefully
  const { quotes: sseQuotes, sseAvailable } = useSSEQuotes(OVERVIEW_SYMBOLS);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const [overview, summary] = await Promise.all([
        api.getMarketOverview(),
        api.getMarketSummary(),
      ]);

      setOverview(overview.quotes.map(quoteToAsset));
      setFx(summary.fx.map(quoteToAsset));
      setGold(summary.gold.map(quoteToAsset));
      setIndexes(summary.indexes.map(quoteToAsset));
      setCommodities(summary.commodities.map(quoteToAsset));

      // Mobile horizontal-scroll commodity cards (first 5)
      setCards(summary.commodities.slice(0, 5).map(quoteToCommodityItem));

      // Desktop "Piyasa Özeti" list — indexes first, then fx, gold, commodities, crypto
      const allQuotes = [
        ...summary.indexes,
        ...summary.fx,
        ...summary.gold,
        ...summary.commodities,
        ...summary.crypto,
      ];
      setSummary(allQuotes.map(quoteToMarketSummaryItem));

      // Main page ticker board — fixed order
      const quoteMap = new Map(allQuotes.map((q) => [q.data.symbol, q]));
      const ordered = TICKER_ORDER.flatMap((sym) => {
        const q = quoteMap.get(sym);
        return q ? [quoteToTickerItem(q)] : [];
      });
      setTicker(ordered);

      // Extended overview grid — GAUTRY is shown as derived formula (XAU/USD / 31.1035 × USD/TRY)
      // so the main page always shows the mathematical calculation, not the physical dealer price.
      const _TROY_OZ_TO_GRAMS = 31.1035;
      const xauQ    = quoteMap.get('XAU/USD');
      const usdtryQ = quoteMap.get('USD/TRY');
      const extended = EXTENDED_OVERVIEW_ORDER.flatMap((sym) => {
        if (sym === 'GAUTRY' && xauQ && usdtryQ) {
          const base = quoteToAsset(quoteMap.get('GAUTRY') ?? xauQ);
          const derivedPrice = (xauQ.data.price / _TROY_OZ_TO_GRAMS) * usdtryQ.data.price;
          const combinedChange = xauQ.data.change_pct + usdtryQ.data.change_pct;
          return [{ ...base, id: 'GAUTRY', price: Math.round(derivedPrice * 100) / 100, change: Math.round(combinedChange * 100) / 100 }];
        }
        const q = quoteMap.get(sym);
        return q ? [quoteToAsset(q)] : [];
      });
      setExtendedOverview(extended);

      setUpdated(new Date());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  // Apply SSE real-time overrides to overview assets whenever new quotes arrive
  useEffect(() => {
    if (Object.keys(sseQuotes).length === 0) return;
    const _TROY_OZ_TO_GRAMS = 31.1035;
    const applyLive = (prev: Asset[]) =>
      prev.map((asset) => {
        const live = sseQuotes[asset.id];
        if (!live) return asset;
        return quoteToAsset(live);
      });
    setOverview(applyLive);
    // Extended overview: GAUTRY is derived from live XAU/USD × USD/TRY, not the physical price
    setExtendedOverview((prev) =>
      prev.map((asset) => {
        if (asset.id === 'GAUTRY') {
          const xauLive    = sseQuotes['XAU/USD'];
          const usdtryLive = sseQuotes['USD/TRY'];
          if (xauLive && usdtryLive) {
            const derivedPrice   = (xauLive.data.price / _TROY_OZ_TO_GRAMS) * usdtryLive.data.price;
            const combinedChange = xauLive.data.change_pct + usdtryLive.data.change_pct;
            return { ...asset, price: Math.round(derivedPrice * 100) / 100, change: Math.round(combinedChange * 100) / 100 };
          }
          return asset;
        }
        const live = sseQuotes[asset.id];
        if (!live) return asset;
        return quoteToAsset(live);
      })
    );
  }, [sseQuotes]);

  useEffect(() => {
    refresh();
    // If SSE is unavailable, keep polling every 30s; otherwise poll less aggressively (120s)
    const interval = sseAvailable ? 120_000 : 30_000;
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, interval);
    return () => clearInterval(id);
  }, [refresh, sseAvailable]);

  return {
    status,
    overviewAssets,
    extendedOverviewAssets,
    fxAssets,
    goldAssets,
    indexAssets,
    commodityAssets,
    commodityCards,
    marketSummary,
    tickerItems,
    news: newsItems,
    lastUpdated,
    refresh,
  };
}
