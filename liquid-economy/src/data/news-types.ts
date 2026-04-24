// News tracker API — shapes used by the frontend.

export interface TrackerChannel {
  id: number;
  name: string;
  slug: string;
  platform: string;
  channel_handle?: string | null;
  channel_url?: string | null;
  bio?: string | null;
}

export interface TrackerVideo {
  id: number;
  channel_id: number | null;
  person_id: number | null;
  platform: string;
  video_id: string;
  video_url: string;
  title: string;
  published_at: string | null;
  created_at: string;
  duration: number | null;
}

export interface TrackerVideoSummary {
  id: number;
  video_id: number;
  short_summary: string;
  long_summary: string;
  highlights: string[];
  language: string;
  source: string;
  created_at: string;
  updated_at: string | null;
}

// Composed shape used by news cards + detail page.
export interface NewsStory {
  video: TrackerVideo;
  channel: TrackerChannel | null;
  summary: TrackerVideoSummary;
}

export interface LatestNewsResponse {
  stories: NewsStory[];
}
