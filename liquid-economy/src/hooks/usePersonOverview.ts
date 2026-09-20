/**
 * usePersonOverview
 *
 * Returns one channel's current stance per topic — the stance table on
 * /uzmanlar/:slug.
 *
 * GET /api/v1/channels/{slug}/overview
 */

import { useState, useEffect } from 'react';
import { channelsApi } from '../lib/inferenceClient';
import type { PersonTopicStance } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface PersonOverviewResult {
  status: Status;
  stances: PersonTopicStance[];
}

export function usePersonOverview(channelSlug: string): PersonOverviewResult {
  const [status, setStatus] = useState<Status>('loading');
  const [stances, setStances] = useState<PersonTopicStance[]>([]);

  useEffect(() => {
    if (!channelSlug) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setStances([]);
      try {
        const res = await channelsApi.overview(channelSlug, ctl.signal);
        if (cancelled) return;
        setStances(res);
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
  }, [channelSlug]);

  return { status, stances };
}
