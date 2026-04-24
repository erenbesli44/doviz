import type { LatestNewsResponse, NewsStory } from '../data/news-types';

// Relative base — nginx BFF proxy injects X-API-Key server-side.
const BASE = '/api/v1';

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) {
    const err = new Error(`news_api_${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const newsApi = {
  latest: (limit = 5, signal?: AbortSignal) =>
    get<LatestNewsResponse>(`/news/latest?limit=${limit}`, signal),

  story: (videoId: number, signal?: AbortSignal) =>
    get<NewsStory>(`/news/stories/${videoId}`, signal),
};
