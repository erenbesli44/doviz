import { useEffect, useState } from 'react';
import { newsApi } from '../lib/newsClient';
import type { NewsStory, TrackerVideo } from '../data/news-types';

type Status = 'loading' | 'success' | 'not_found' | 'error';

// Upstream doesn't expose a working GET /videos/{id}, so we locate the
// video by scanning each channel's listing in parallel.
async function findVideo(id: number, signal: AbortSignal): Promise<{
  video: TrackerVideo;
  channelId: number;
} | null> {
  const channels = await newsApi.listChannels(signal);
  const lists = await Promise.all(
    channels.map((c) =>
      newsApi
        .listVideos(c.id, signal)
        .then((videos) => ({ channelId: c.id, videos }))
        .catch(() => ({ channelId: c.id, videos: [] as TrackerVideo[] })),
    ),
  );
  for (const { channelId, videos } of lists) {
    const match = videos.find((v) => v.id === id);
    if (match) return { video: match, channelId };
  }
  return null;
}

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
        const [summary, located, channels] = await Promise.all([
          newsApi.getSummary(videoId, ctl.signal),
          findVideo(videoId, ctl.signal),
          newsApi.listChannels(ctl.signal).catch(() => []),
        ]);

        if (!located) {
          if (cancelled) return;
          setStatus('not_found');
          return;
        }

        const channel =
          channels.find((c) => c.id === located.channelId) ?? null;

        if (cancelled) return;
        setStory({ video: located.video, summary, channel });
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
