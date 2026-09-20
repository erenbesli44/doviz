/**
 * useChannels
 *
 * Returns the full channel directory for the /uzmanlar page.
 *
 * GET /api/v1/channels/
 */

import { useState, useEffect } from 'react';
import { channelsApi } from '../lib/inferenceClient';
import type { ChannelOverview } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface ChannelsResult {
  status: Status;
  channels: ChannelOverview[];
}

// Module-level cache shared across components — the directory rarely changes.
const CACHE_TTL = 60_000;
let _cache: { data: ChannelOverview[]; fetchedAt: number } | null = null;
const isCacheFresh = () => _cache !== null && Date.now() - _cache.fetchedAt < CACHE_TTL;

export function useChannels(): ChannelsResult {
  const [status, setStatus] = useState<Status>(() => (isCacheFresh() ? 'success' : 'loading'));
  const [channels, setChannels] = useState<ChannelOverview[]>(() =>
    isCacheFresh() ? _cache!.data : [],
  );

  useEffect(() => {
    if (isCacheFresh()) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const res = await channelsApi.list(ctl.signal);
        if (cancelled) return;
        _cache = { data: res, fetchedAt: Date.now() };
        setChannels(res);
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

  return { status, channels };
}
