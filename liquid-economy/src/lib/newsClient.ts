import type { LatestNewsResponse, NewsStory } from '../data/news-types';

// Finance-api proxies to the tracker and injects the tracker key server-side.
// We share VITE_API_BASE_URL + VITE_API_KEY with the existing market data
// client — auth is handled by the finance-api middleware.
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/v1';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': API_KEY },
    signal,
  });
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
