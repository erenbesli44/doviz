/**
 * useTopicSources
 *
 * Enriches the sources[] already embedded in InferenceTopic with full
 * news story data (thumbnail, long summary, video URL).
 *
 * Flow:
 *   1. GET /api/v1/inference/latest  → find topic by key → grab sources[]
 *   2. GET /api/v1/news/stories/{video_id}  for each source (in parallel, best-effort)
 *
 * Real API: ✅ (composes two existing endpoints — no new endpoint needed)
 *
 * NOTE: This gives us attribution + contribution_note but NOT per-source
 * sentiment/confidence/key_levels. Those require the missing endpoint:
 *   GET /api/v1/inference/topics/{key}/opinions
 * Until that ships, see useTopicOpinions (dummy data).
 */

import { useState, useEffect } from 'react';
import { inferenceApi } from '../lib/inferenceClient';
import { newsApi } from '../lib/newsClient';
import type { InferenceSource } from '../data/inference-types';
import type { NewsStory } from '../data/news-types';

type Status = 'loading' | 'success' | 'error';

export interface EnrichedSource {
  source: InferenceSource;
  story: NewsStory | null;  // null when news story fetch failed or not found
}

export interface TopicSourcesResult {
  status: Status;
  sources: EnrichedSource[];
}

export function useTopicSources(topicKey: string): TopicSourcesResult {
  const [status, setStatus] = useState<Status>('loading');
  const [sources, setSources] = useState<EnrichedSource[]>([]);

  useEffect(() => {
    if (!topicKey) return;

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setSources([]);
      try {
        const inference = await inferenceApi.latest(ctl.signal);
        if (cancelled) return;

        const topic = inference.topics.find((t) => t.topic_key === topicKey);
        if (!topic || topic.sources.length === 0) {
          setStatus('success');
          return;
        }

        // Fan out — best-effort; individual 404s silently become null
        const stories = await Promise.all(
          topic.sources.map((src) =>
            newsApi.story(src.video_id, ctl.signal).catch(() => null),
          ),
        );
        if (cancelled) return;

        setSources(
          topic.sources.map((src, i) => ({ source: src, story: stories[i] })),
        );
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

  return { status, sources };
}
