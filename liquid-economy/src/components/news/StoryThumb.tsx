import { useState } from 'react';
import type { NewsStory } from '../../data/news-types';

type Variant = 'lead' | 'card' | 'row';

// hqdefault is 4:3 with letterbox bars; object-cover in a 16:9 box crops them away.
// mqdefault is native 16:9 and always exists — ideal for small rows.
const SOURCES: Record<Variant, string[]> = {
  lead: ['maxresdefault', 'hqdefault'],
  card: ['hqdefault'],
  row: ['mqdefault'],
};

interface Props {
  story: NewsStory;
  variant: Variant;
  /** Above-the-fold image: load eagerly with high priority. */
  priority?: boolean;
  className?: string;
}

/** Fixed 16:9 box, so the feed never shifts while images load. */
export default function StoryThumb({ story, variant, priority = false, className = '' }: Props) {
  const { video, channel } = story;
  const candidates = video.platform === 'youtube'
    ? SOURCES[variant].map((q) => `https://img.youtube.com/vi/${video.video_id}/${q}.jpg`)
    : [];
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => i + 1);
  const name = channel?.name ?? 'Haber';

  return (
    <div className={`relative aspect-video overflow-hidden rounded-[var(--r-chip)] bg-surface-2 ${className}`}>
      {idx < candidates.length ? (
        <img
          key={candidates[idx]}
          src={candidates[idx]}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onError={next}
          // YouTube answers a missing size with a 120px grey placeholder instead of an error.
          onLoad={(e) => { if (e.currentTarget.naturalWidth <= 120) next(); }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center gap-2 px-3">
          {channel?.avatar_url ? (
            <img src={channel.avatar_url} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-bold text-accent">
              {name.charAt(0).toLocaleUpperCase('tr-TR')}
            </span>
          )}
          {variant !== 'row' && <span className="truncate text-[13px] font-semibold text-text-muted">{name}</span>}
        </div>
      )}
    </div>
  );
}
