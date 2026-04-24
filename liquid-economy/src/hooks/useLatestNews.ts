import { useEffect, useState } from 'react';
import { newsApi } from '../lib/newsClient';
import type {
  NewsStory,
  TrackerChannel,
  TrackerVideo,
  TrackerVideoSummary,
} from '../data/news-types';

type Status = 'loading' | 'success' | 'error';

// Tracker has no cross-channel "latest" endpoint; we fan out per channel,
// sort, and pick the newest N. Over-fetch candidates so we can skip videos
// whose summaries aren't generated yet (tracker returns 404 in that case).
const CANDIDATE_POOL = 10;

function videoTimestamp(v: TrackerVideo): number {
  return new Date(v.published_at ?? v.created_at).getTime();
}

export function useLatestNews(limit = 5) {
  const [status, setStatus] = useState<Status>('loading');
  const [stories, setStories] = useState<NewsStory[]>([]);

  useEffect(() => {
    const ctl = new AbortController();
    let cancelled = false;

    (async () => {
      setStatus('loading');
      try {
        const channels = await newsApi.listChannels(ctl.signal);
        const channelById = new Map<number, TrackerChannel>(
          channels.map((c) => [c.id, c]),
        );

        const videosPerChannel = await Promise.all(
          channels.map((c) =>
            newsApi.listVideos(c.id, ctl.signal).catch(() => [] as TrackerVideo[]),
          ),
        );

        const candidates = videosPerChannel
          .flat()
          .sort((a, b) => videoTimestamp(b) - videoTimestamp(a))
          .slice(0, CANDIDATE_POOL);

        const summaries = await Promise.all(
          candidates.map((v) =>
            newsApi
              .getSummary(v.id, ctl.signal)
              .then((s) => ({ video: v, summary: s }))
              .catch(() => null),
          ),
        );

        const composed: NewsStory[] = summaries
          .filter((x): x is { video: TrackerVideo; summary: TrackerVideoSummary } => !!x)
          .slice(0, limit)
          .map(({ video, summary }) => ({
            video,
            summary,
            channel: video.channel_id ? channelById.get(video.channel_id) ?? null : null,
          }));

        if (cancelled) return;
        setStories(composed);
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
