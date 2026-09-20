/**
 * useTopicHistory
 *
 * Fetches the direction + confidence history for a single topic.
 * Used to render the "Görüş geçmişi" 30-day chart on asset detail pages.
 *
 * Real API: ✅ GET /api/v1/inference/topics/{topic_key}/history?days=N
 */

import { useState, useEffect } from 'react';
import { inferenceApi } from '../lib/inferenceClient';
import type { TopicHistoryEntry } from '../data/inference-types';

type Status = 'loading' | 'success' | 'error';

export interface TopicHistoryResult {
  status: Status;
  entries: TopicHistoryEntry[];
}

export function useTopicHistory(
  topicKey: string,
  days = 30,
): TopicHistoryResult {
  const [status, setStatus] = useState<Status>('loading');
  const [entries, setEntries] = useState<TopicHistoryEntry[]>([]);

  useEffect(() => {
    if (!topicKey) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setEntries([]);
      try {
        const res = await inferenceApi.topicHistory(topicKey, days, ctl.signal);
        if (cancelled) return;
        setEntries(res);
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
  }, [topicKey, days]);

  return { status, entries };
}
