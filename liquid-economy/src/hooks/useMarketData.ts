import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';
import { quoteToAsset, quoteToMarketSummaryItem, quoteToCommodityItem } from '../lib/adapters';
import { newsItems } from '../data/mock';
import { useSSEQuotes } from './useSSEQuotes';
import type { Asset, MarketSummaryItem, NewsItem, CommodityItem } from '../data/types';

// Symbols shown in the Markets page overview — kept fresh via SSE
const OVERVIEW_SYMBOLS = ['USD/TRY', 'EUR/TRY', 'GBP/TRY', 'BTC/USD', 'XAU/USD'];

type Status = 'idle' | 'loading' | 'success' | 'error';

interface MarketData {
  status: Status;
  overviewAssets: Asset[];
  fxAssets: Asset[];
  goldAssets: Asset[];
  indexAssets: Asset[];
  commodityAssets: Asset[];
  commodityCards: CommodityItem[];
  marketSummary: MarketSummaryItem[];
  news: NewsItem[];
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useMarketData(): MarketData {
  const [status,          setStatus]    = useState<Status>('loading');
  const [overviewAssets,  setOverview]  = useState<Asset[]>([]);
  const [fxAssets,        setFx]        = useState<Asset[]>([]);
  const [goldAssets,      setGold]      = useState<Asset[]>([]);
  const [indexAssets,     setIndexes]   = useState<Asset[]>([]);
  const [commodityAssets, setCommodities] = useState<Asset[]>([]);
  const [commodityCards,  setCards]     = useState<CommodityItem[]>([]);
  const [marketSummary,   setSummary]   = useState<MarketSummaryItem[]>([]);
  const [lastUpdated,     setUpdated]   = useState<Date | null>(null);

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

      setUpdated(new Date());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  // Apply SSE real-time overrides to overviewAssets whenever new quotes arrive
  useEffect(() => {
    if (Object.keys(sseQuotes).length === 0) return;
    setOverview((prev) =>
      prev.map((asset) => {
        const live = sseQuotes[asset.id]; // asset.id == internal symbol (e.g. "USD/TRY")
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
    fxAssets,
    goldAssets,
    indexAssets,
    commodityAssets,
    commodityCards,
    marketSummary,
    news: newsItems,
    lastUpdated,
    refresh,
  };
}
