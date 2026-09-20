/**
 * useConsensusDashboard
 *
 * Fetches today's full inference snapshot and provides derived state.
 * Wraps GET /api/v1/inference/latest with a 60-second module-level cache
 * so multiple components on the same page share one request.
 *
 * Real API: ✅ GET /api/v1/inference/latest
 */

import { useState, useEffect } from 'react';
import { inferenceApi } from '../lib/inferenceClient';
import type { InferenceLatestResponse, InferenceTopic } from '../data/inference-types';

type Status = 'loading' | 'success' | 'error';

export interface ConsensusDashboardResult {
  status: Status;
  runDate: string | null;
  generatedAt: string | null;
  topics: InferenceTopic[];
  /** Topics where changed_from_prev === true — used by "Bugün değişen görüşler" rail */
  changedTopics: InferenceTopic[];
  /** Look up a single topic by topic_key without re-fetching */
  getTopic: (key: string) => InferenceTopic | undefined;
}

// ── Module-level cache (shared across all hook instances) ─────────────────────
const CACHE_TTL = 60_000; // ms

let _cache: { data: InferenceLatestResponse; fetchedAt: number } | null = null;

function isCacheFresh(): boolean {
  return _cache !== null && Date.now() - _cache.fetchedAt < CACHE_TTL;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useConsensusDashboard(): ConsensusDashboardResult {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<InferenceLatestResponse | null>(() =>
    isCacheFresh() ? _cache!.data : null,
  );

  useEffect(() => {
    if (isCacheFresh()) {
      setData(_cache!.data);
      setStatus('success');
      return;
    }

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const res = await inferenceApi.latest(ctl.signal);
        if (cancelled) return;
        _cache = { data: res, fetchedAt: Date.now() };
        setData(res);
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

  const topics = data?.topics ?? [];
  const changedTopics = topics.filter((t) => t.changed_from_prev);
  const topicMap = new Map(topics.map((t) => [t.topic_key, t]));

  return {
    status,
    runDate: data?.run_date ?? null,
    generatedAt: data?.generated_at ?? null,
    topics,
    changedTopics,
    getTopic: (key) => topicMap.get(key),
  };
}
