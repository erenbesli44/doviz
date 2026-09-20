/**
 * Shapes returned by the consensus / channels endpoints on finance-api.
 * Mirrors `app/schemas/{channels,inference,consensus}.py` in finance-api.
 */

// 5-band aggregate label used by /v1/consensus.
export type ConsensusDirection =
  | 'strong_bullish'
  | 'mild_bullish'
  | 'neutral'
  | 'mild_bearish'
  | 'strong_bearish'
  | 'uncertain';

export type FreshSignalDirection =
  | 'bullish_shift'
  | 'bearish_shift'
  | 'stable'
  | 'mixed'
  | 'high_volatility'
  | 'no_fresh_data';

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface ConsensusBlock {
  window: string;
  direction: ConsensusDirection;
  confidence: number;
  bullish_score: number;
  bearish_score: number;
  neutral_score: number;
  summary: string;
}

export interface FreshSignalBlock {
  window: string;
  direction: FreshSignalDirection;
  confidence: number;
  summary: string;
}

export interface HighWeightExpertView {
  direction: ConsensusDirection;
  summary: string;
  expert_count: number;
}

export interface ContrarianViewT {
  direction: Sentiment;
  summary: string;
  expert_name: string | null;
}

export interface ImportantExpert {
  expert_name: string;
  channel_slug: string | null;
  direction: Sentiment;
  weight: number;
  main_claim: string;
  video_url: string | null;
}

export interface ConsensusStats {
  opinion_count: number;
  expert_count: number;
  high_weight_expert_count: number;
}

export interface AssetConsensus {
  asset: string;
  asset_code: string;
  display_name: string;
  group: string;
  generated_at: string;
  main_consensus: ConsensusBlock;
  fresh_signal: FreshSignalBlock;
  high_weight_expert_view: HighWeightExpertView | null;
  top_reasons: string[];
  contrarian_view: ContrarianViewT | null;
  important_experts: ImportantExpert[];
  stats: ConsensusStats;
}

export interface AssetConsensusSummary {
  asset: string;
  asset_code: string;
  display_name: string;
  group: string;
  consensus_direction: ConsensusDirection;
  confidence: number;
  fresh_signal: FreshSignalDirection;
  short_summary: string;
  opinion_count: number;
  updated_at: string;
}


export interface TopicOpinion {
  video_id: number;
  channel_id: number;
  channel_name: string;
  channel_avatar_url: string | null;
  person_name: string | null;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  key_levels: string[];
  published_at: string;
  video_url: string;
  start_time_seconds: number | null;
}

export interface ChannelOverview {
  id: number;
  name: string;
  slug: string;
  avatar_url: string | null;
  bio: string | null;
  channel_url: string | null;
  subscriber_count: number | null;
  top_topic_key: string | null;
  top_topic_label: string | null;
  recent_sentiment: 'bullish' | 'bearish' | 'neutral' | null;
  video_count: number;
}

export interface PersonTopicStance {
  topic_key: string;
  topic_label: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  last_updated: string;
  video_count: number;
}

export interface PersonTimelinePoint {
  date: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  video_id: number;
  summary: string;
}
