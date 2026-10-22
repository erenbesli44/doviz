/**
 * useInstrumentViews
 *
 * Fetches opinions for several instruments in parallel.
 * GET /api/v1/inference/topics/{key}/opinions?limit=50&days={days}
 *
 * Results are keyed by `${key}:${days}` and only ever set after a fetch
 * resolves, so the effect itself never calls setState synchronously.
 */

import { useEffect, useState } from 'react';
import { inferenceApi } from '../lib/inferenceClient';
import type { TopicOpinion } from '../data/consensus-types';

type Status = 'loading' | 'success' | 'error';

export interface InstrumentViews {
  status: Status;
  opinions: TopicOpinion[];
}

type Entry = { opinions: TopicOpinion[]; error: boolean };

export function useInstrumentViews(keys: string[], days = 30): Record<string, InstrumentViews> {
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const keyStr = keys.join(',');

  useEffect(() => {
    const ctl = new AbortController();
    let cancelled = false;
    for (const key of keyStr.split(',').filter(Boolean)) {
      const id = `${key}:${days}`;
      inferenceApi
        .topicOpinions(key, 50, days, ctl.signal)
        .then((opinions) => { if (!cancelled) setEntries((p) => ({ ...p, [id]: { opinions, error: false } })); })
        .catch(() => { if (!cancelled) setEntries((p) => ({ ...p, [id]: { opinions: [], error: true } })); });
    }
    return () => { cancelled = true; ctl.abort(); };
  }, [keyStr, days]);

  const out: Record<string, InstrumentViews> = {};
  for (const key of keyStr.split(',').filter(Boolean)) {
    const e = entries[`${key}:${days}`];
    out[key] = e ? { status: e.error ? 'error' : 'success', opinions: e.opinions } : { status: 'loading', opinions: [] };
  }
  return out;
}
