/**
 * useAssetConsensus
 *
 * Full per-asset consensus block — main (5d) + fresh (24h) + top reasons,
 * contrarian view, important experts, stats. Drives /piyasa/:slug.
 *
 * GET /api/v1/consensus/{asset_key}
 */

import { useEffect, useState } from 'react';
import { consensusApi } from '../lib/inferenceClient';
import type { AssetConsensus } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface AssetConsensusResult {
  status: Status;
  consensus: AssetConsensus | null;
}

export function useAssetConsensus(assetKey: string): AssetConsensusResult {
  const [status, setStatus] = useState<Status>('loading');
  const [consensus, setConsensus] = useState<AssetConsensus | null>(null);

  useEffect(() => {
    if (!assetKey) return;
    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setConsensus(null);
      try {
        const res = await consensusApi.asset(assetKey, ctl.signal);
        if (cancelled) return;
        setConsensus(res);
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
  }, [assetKey]);

  return { status, consensus };
}
