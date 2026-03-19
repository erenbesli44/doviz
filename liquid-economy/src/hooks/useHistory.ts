import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import type { ChartDataPoint } from '../data/types';

/**
 * Fetches 24h price history for a symbol and returns it as ChartDataPoint[].
 * Re-fetches whenever `symbol` changes. Does not poll — history is static once loaded.
 */
export function useHistory(symbol: string, hours = 24): ChartDataPoint[] {
  const [points, setPoints] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    api
      .getHistory(symbol, hours)
      .then((res) => {
        if (!cancelled) setPoints(res.points);
      })
      .catch(() => {
        // keep previous points on transient error
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, hours]);

  return points;
}
