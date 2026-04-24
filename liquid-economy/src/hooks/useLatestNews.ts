import { useEffect, useState } from 'react';
import { newsApi } from '../lib/newsClient';
import type { NewsStory } from '../data/news-types';

type Status = 'loading' | 'success' | 'error';

export function useLatestNews(limit = 5) {
  const [status, setStatus] = useState<Status>('loading');
  const [stories, setStories] = useState<NewsStory[]>([]);

  useEffect(() => {
    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const res = await newsApi.latest(limit, ctl.signal);
        if (cancelled) return;
        setStories(res.stories);
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
  }, [limit]);

  return { status, stories };
}
