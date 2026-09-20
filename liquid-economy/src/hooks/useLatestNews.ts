import { useEffect, useState } from 'react';
import { newsApi } from '../lib/newsClient';
import type { NewsStory } from '../data/news-types';

type Status = 'loading' | 'success' | 'error';

// Per-limit cache. Lets "Back" from an article render the feed instantly, so the
// reader returns to the exact spot they left. Stale entries still render, then refresh.
const FRESH_MS = 60_000;
const cache = new Map<number, { stories: NewsStory[]; at: number }>();

export function useLatestNews(limit = 5) {
  const cached = cache.get(limit);
  const [status, setStatus] = useState<Status>(cached ? 'success' : 'loading');
  const [stories, setStories] = useState<NewsStory[]>(cached?.stories ?? []);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const hit = cache.get(limit);
    if (hit) {
      setStories(hit.stories);
      setStatus('success');
      if (Date.now() - hit.at < FRESH_MS) return;
    }

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setIsFetching(true);
      try {
        const res = await newsApi.latest(limit, ctl.signal);
        if (cancelled) return;
        cache.set(limit, { stories: res.stories, at: Date.now() });
        setStories(res.stories);
        setStatus('success');
      } catch {
        if (cancelled) return;
        // Keep whatever is already on screen; only a first load with nothing to show is an error.
        setStatus((s) => (s === 'success' ? s : 'error'));
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
      ctl.abort();
    };
  }, [limit]);

  return { status, stories, isFetching };
}
