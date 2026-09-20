/**
 * useAssetConsensusList
 *
 * Compact per-asset consensus rows for the home page cards.
 *
 * GET /api/v1/consensus/
 */

import { useEffect, useState } from 'react';
import { consensusApi } from '../lib/inferenceClient';
import type { AssetConsensusSummary } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface AssetConsensusListResult {
  status: Status;
  assets: AssetConsensusSummary[];
}

// Shared module-level cache — finance-api also caches but this avoids hits when
// multiple components share the same page.
const CACHE_TTL = 60_000;
let _cache: { data: AssetConsensusSummary[]; fetchedAt: number } | null = null;
const isCacheFresh = () => _cache !== null && Date.now() - _cache.fetchedAt < CACHE_TTL;

export function useAssetConsensusList(): AssetConsensusListResult {
  const [status, setStatus] = useState<Status>(() => (isCacheFresh() ? 'success' : 'loading'));
  const [assets, setAssets] = useState<AssetConsensusSummary[]>(() =>
    isCacheFresh() ? _cache!.data : [],
  );

  useEffect(() => {
    if (isCacheFresh()) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const res = await consensusApi.list(ctl.signal);
        if (cancelled) return;
        _cache = { data: res, fetchedAt: Date.now() };
        setAssets(res);
        setStatus('success');
      } catch {
        if (cancelled) return;
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      ctl.abort();
    };
  }, []);

  return { status, assets };
}
