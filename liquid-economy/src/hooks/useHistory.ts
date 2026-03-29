import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import type { ChartDataPoint } from '../data/types';

/**
 * Fetches 24h price history for a symbol and returns it as ChartDataPoint[].
 * Re-fetches whenever `symbol` changes. Does not poll — history is static once loaded.
 */
interface UseHistoryResult {
  points: ChartDataPoint[];
  loading: boolean;
}

export function useHistory(symbol: string, hours = 24): UseHistoryResult {
  const [points, setPoints] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);

    api
      .getHistory(symbol, hours)
      .then((res) => {
        if (!cancelled) setPoints(res.points);
      })
      .catch(() => {
        // keep previous points on transient error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, hours]);

  return { points, loading };
}
