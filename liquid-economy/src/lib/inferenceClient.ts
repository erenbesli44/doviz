import type { InferenceLatestResponse, TopicHistoryEntry } from '../data/inference-types';

// Same BFF proxy as the rest of the API — nginx injects X-API-Key server-side.
const BASE = '/api/v1';

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) {
    throw new Error(`inference_api_${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', signal });
  if (!res.ok) {
    throw new Error(`inference_api_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const inferenceApi = {
  latest: (signal?: AbortSignal) =>
    get<InferenceLatestResponse>('/inference/latest', signal),

  topicHistory: (topicKey: string, days = 30, signal?: AbortSignal) =>
    get<TopicHistoryEntry[]>(`/inference/topics/${topicKey}/history?days=${days}`, signal),

  triggerRun: (signal?: AbortSignal) =>
    post<unknown>('/inference/runs:trigger', signal),
};
