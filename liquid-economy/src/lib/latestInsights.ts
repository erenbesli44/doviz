/**
 * Pick the lead section of the home page: the newest videos (feed order =
 * ingestion order) that contain at least one clear, forward-looking view.
 */

import { INSTRUMENTS, directionOf, personOf, type Direction } from './views';
import type { TopicOpinion } from '../data/consensus-types';
import type { NewsStory } from '../data/news-types';

export const VIDEOS = 3;
const VIEWS_PER_VIDEO = 3;

export interface Insight {
  instrument: string;
  direction: Direction;
  opinion: TopicOpinion;
}

export interface VideoInsights {
  story: NewsStory;
  person: string;
  avatarUrl: string | null;
  insights: Insight[];
}

export function latestVideoInsights(
  stories: NewsStory[],
  opinionsByInstrument: Record<string, TopicOpinion[]>,
): VideoInsights[] {
  const byVideo = new Map<number, Insight[]>();
  for (const { key } of INSTRUMENTS) {
    for (const o of opinionsByInstrument[key] ?? []) {
      if (o.outlook == null) continue; // only tracker-classified views here
      const direction = directionOf(o);
      if (!direction) continue;
      byVideo.set(o.video_id, [...(byVideo.get(o.video_id) ?? []), { instrument: key, direction, opinion: o }]);
    }
  }
  const out: VideoInsights[] = [];
  for (const story of stories) {
    const insights = byVideo.get(story.video.id);
    if (!insights?.length) continue;
    // most exact first: a stated horizon and the speaker's own words
    const rank = (i: Insight) => (i.opinion.outlook_horizon ? 2 : 0) + (i.opinion.outlook_quote ? 1 : 0);
    insights.sort((a, b) => rank(b) - rank(a));
    const first = insights[0].opinion;
    out.push({
      story,
      person: personOf(first),
      avatarUrl: first.channel_avatar_url ?? story.channel?.avatar_url ?? null,
      insights: insights.slice(0, VIEWS_PER_VIDEO),
    });
    if (out.length === VIDEOS) break;
  }
  return out;
}

