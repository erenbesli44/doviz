export type Direction = 'up' | 'down' | 'sideways' | 'mixed';
export type TopicStatus = 'new' | 'updated' | 'carried_over' | 'error';

export interface InferenceSource {
  video_id: number;
  title: string;
  channel_name: string;
  person_name: string;
  weight_used: number;
  contribution_note: string;
}

export interface InferenceTopic {
  topic_key: string;
  topic_label: string;
  direction: Direction;
  confidence: number;
  summary: string;
  tags: string[];
  status: TopicStatus;
  changed_from_prev: boolean;
  change_reason: string | null;
  sources: InferenceSource[];
}

export interface InferenceLatestResponse {
  run_id: number;
  run_date: string;
  status: string;
  generated_at: string;
  window_start?: string;
  window_end?: string;
  topics: InferenceTopic[];
}

export interface TopicHistoryEntry {
  run_date: string;
  direction: Direction;
  confidence: number;
  changed_from_prev: boolean;
}
