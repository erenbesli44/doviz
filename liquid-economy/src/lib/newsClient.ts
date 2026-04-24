import type {
  TrackerChannel,
  TrackerVideo,
  TrackerVideoSummary,
} from '../data/news-types';

// All requests go through the same-origin /api/news proxy
// (Vite dev server + nginx in prod). Browser never sees the upstream host
// or any future X-API-Key — both live server-side.
const BASE = '/api/news';

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = new Error(`news_api_${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const newsApi = {
  listChannels: (signal?: AbortSignal) =>
    get<TrackerChannel[]>('/channels/', { signal }),

  listVideos: (channelId: number, signal?: AbortSignal) =>
    get<TrackerVideo[]>(`/videos/?channel_id=${channelId}`, { signal }),

  getSummary: (videoId: number, signal?: AbortSignal) =>
    get<TrackerVideoSummary>(`/videos/${videoId}/summary`, { signal }),
};
