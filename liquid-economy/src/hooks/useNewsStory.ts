import { useEffect, useState } from 'react';
import { newsApi } from '../lib/newsClient';
import type { NewsStory } from '../data/news-types';

type Status = 'loading' | 'success' | 'not_found' | 'error';

export function useNewsStory(videoId: number | null) {
  const [status, setStatus] = useState<Status>('loading');
  const [story, setStory] = useState<NewsStory | null>(null);

  useEffect(() => {
    if (videoId == null || Number.isNaN(videoId)) {
      setStatus('not_found');
      setStory(null);
      return;
    }

    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setStory(null);
      try {
        const result = await newsApi.story(videoId, ctl.signal);
        if (cancelled) return;
        setStory(result);
        setStatus('success');
      } catch (err) {
        if (cancelled) return;
        const status404 = (err as { status?: number }).status === 404;
        setStatus(status404 ? 'not_found' : 'error');
      }
    })();

    return () => {
      cancelled = true;
      ctl.abort();
    };
  }, [videoId]);

  return { status, story };
}
