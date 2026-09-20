/**
 * The three story formats. Hierarchy comes from size, not decoration:
 *   StoryLead — the one story the page leads with
 *   StoryCard — secondary stories, with image
 *   StoryRow  — compact feed row
 *
 * Every format keeps the same information order (source → headline → summary → time),
 * so readers learn it once.
 */

import { Link } from 'react-router-dom';
import type { NewsStory } from '../../data/news-types';
import { formatRelative } from '../../lib/newsFormat';
import StoryThumb from './StoryThumb';

function Source({ story }: { story: NewsStory }) {
  return <span className="kicker !text-accent">{story.channel?.name ?? 'YouTube'}</span>;
}

function Time({ story }: { story: NewsStory }) {
  const iso = story.video.published_at ?? story.video.created_at;
  const label = formatRelative(iso);
  if (!label) return null;
  return <time dateTime={iso} className="text-[12px] text-text-subtle">{label}</time>;
}

export function StoryLead({ story }: { story: NewsStory }) {
  return (
    <Link to={`/haberler/${story.video.id}`} className="group grid gap-4 no-underline md:grid-cols-[1.2fr_1fr] md:gap-7">
      <StoryThumb story={story} variant="lead" priority />
      <div className="flex flex-col">
        <Source story={story} />
        <h2 className="headline-link mt-2 mb-0 font-serif text-[28px] leading-[1.15] font-semibold tracking-tight text-text md:text-[36px]">
          {story.video.title}
        </h2>
        <p className="mt-3 mb-0 text-[16px] leading-[1.6] text-text-muted line-clamp-5">
          {story.summary.short_summary}
        </p>
        <div className="mt-3"><Time story={story} /></div>
      </div>
    </Link>
  );
}

export function StoryCard({ story }: { story: NewsStory }) {
  return (
    <Link to={`/haberler/${story.video.id}`} className="group flex flex-col no-underline">
      <StoryThumb story={story} variant="card" />
      <div className="mt-3"><Source story={story} /></div>
      <h3 className="headline-link mt-1.5 mb-0 font-serif text-[20px] leading-[1.25] font-semibold text-text line-clamp-3">
        {story.video.title}
      </h3>
      <p className="mt-2 mb-0 text-[14px] leading-[1.55] text-text-muted line-clamp-3">
        {story.summary.short_summary}
      </p>
      <div className="mt-2"><Time story={story} /></div>
    </Link>
  );
}

export function StoryRow({ story }: { story: NewsStory }) {
  return (
    <Link
      to={`/haberler/${story.video.id}`}
      className="group grid grid-cols-[1fr_104px] items-start gap-4 border-b border-border py-5 no-underline sm:grid-cols-[1fr_168px] sm:gap-6"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <Source story={story} />
          <Time story={story} />
        </div>
        <h3 className="headline-link mt-1.5 mb-0 font-serif text-[18px] leading-[1.3] font-semibold text-text sm:text-[21px]">
          {story.video.title}
        </h3>
        <p className="mt-1.5 mb-0 text-[14px] leading-[1.55] text-text-muted line-clamp-2 sm:text-[15px]">
          {story.summary.short_summary}
        </p>
      </div>
      <StoryThumb story={story} variant="row" />
    </Link>
  );
}

export function StoryRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_104px] gap-4 border-b border-border py-5 sm:grid-cols-[1fr_168px] sm:gap-6" aria-hidden="true">
      <div className="space-y-2.5">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-5 w-11/12" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
      </div>
      <div className="skeleton aspect-video" />
    </div>
  );
}
