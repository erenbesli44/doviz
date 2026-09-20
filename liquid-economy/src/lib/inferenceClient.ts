import type { InferenceLatestResponse, TopicHistoryEntry } from '../data/inference-types';
import type {
  AssetConsensus,
  AssetConsensusSummary,
  ChannelOverview,
  PersonTopicStance,
  PersonTimelinePoint,
  TopicOpinion,
} from '../data/consensus-types';

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

  // tracker's `limit` is a per-channel cap, not a total — default 50 fetches the full opinion set; slice client-side.
  topicOpinions: (topicKey: string, limit = 50, days = 30, signal?: AbortSignal) =>
    get<TopicOpinion[]>(
      `/inference/topics/${topicKey}/opinions?limit=${limit}&days=${days}`,
      signal,
    ),

  triggerRun: (signal?: AbortSignal) =>
    post<unknown>('/inference/runs:trigger', signal),
};

export const consensusApi = {
  list: (signal?: AbortSignal) =>
    get<AssetConsensusSummary[]>('/consensus/', signal),

  asset: (assetKey: string, signal?: AbortSignal) =>
    get<AssetConsensus>(`/consensus/${encodeURIComponent(assetKey)}`, signal),
};

export const channelsApi = {
  list: (signal?: AbortSignal) =>
    get<ChannelOverview[]>('/channels/', signal),

  overview: (slug: string, signal?: AbortSignal) =>
    get<PersonTopicStance[]>(`/channels/${encodeURIComponent(slug)}/overview`, signal),

  timeline: (slug: string, topicKey: string, signal?: AbortSignal) =>
    get<PersonTimelinePoint[]>(
      `/channels/${encodeURIComponent(slug)}/timeline?topic_key=${encodeURIComponent(topicKey)}`,
      signal,
    ),
};
