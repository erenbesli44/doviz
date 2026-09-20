/**
 * usePersonTimeline
 *
 * Returns one channel's stance-over-time for a single topic — the sparkline
 * chart + expandable video list on /uzmanlar/:slug.
 *
 * GET /api/v1/channels/{slug}/timeline?topic_key={key}
 */

import { useState, useEffect } from 'react';
import { channelsApi } from '../lib/inferenceClient';
import type { PersonTimelinePoint } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface PersonTimelineResult {
  status: Status;
  points: PersonTimelinePoint[];
}

export function usePersonTimeline(
  channelSlug: string,
  topicKey: string,
): PersonTimelineResult {
  const [status, setStatus] = useState<Status>('loading');
  const [points, setPoints] = useState<PersonTimelinePoint[]>([]);

  useEffect(() => {
    if (!channelSlug || !topicKey) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setPoints([]);
      try {
        const res = await channelsApi.timeline(channelSlug, topicKey, ctl.signal);
        if (cancelled) return;
        setPoints(res);
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
  }, [channelSlug, topicKey]);

  return { status, points };
}
