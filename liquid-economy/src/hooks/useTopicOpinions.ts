/**
 * useTopicOpinions
 *
 * Returns per-source opinions for an asset: sentiment chip, confidence,
 * key_levels[], and a summary per pro.
 *
 * GET /api/v1/inference/topics/{topic_key}/opinions
 */

import { useState, useEffect } from 'react';
import { inferenceApi } from '../lib/inferenceClient';
import type { TopicOpinion } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface TopicOpinionsResult {
  status: Status;
  opinions: TopicOpinion[];
}

export function useTopicOpinions(topicKey: string): TopicOpinionsResult {
  const [status, setStatus] = useState<Status>('loading');
  const [opinions, setOpinions] = useState<TopicOpinion[]>([]);

  useEffect(() => {
    if (!topicKey) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setOpinions([]);
      try {
        const res = await inferenceApi.topicOpinions(topicKey, 50, 30, ctl.signal);
        if (cancelled) return;
        setOpinions(res);
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
  }, [topicKey]);

  return { status, opinions };
}
