/**
 * Haberler — /haberler
 *
 * The full archive, newest first, grouped by day. Loading more is an explicit
 * button: the list never reorders or grows under the reader.
 */

import { useMemo, useState } from 'react';
import { useLatestNews } from '../hooks/useLatestNews';
import { StoryRow, StoryRowSkeleton } from '../components/news/Story';
import PageHeader from '../components/layout/PageHeader';
import SeoHead from '../components/seo/SeoHead';
import { dayKey, dayLabel } from '../lib/newsFormat';
import type { NewsStory } from '../data/news-types';

const BATCH = 25;
const MAX = 50; // API maximum for /news/latest

function groupByDay(stories: NewsStory[]) {
  const groups: { key: string; label: string; items: NewsStory[] }[] = [];
  for (const s of stories) {
    const iso = s.video.published_at ?? s.video.created_at;
    const key = dayKey(iso);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(s);
    else groups.push({ key, label: dayLabel(iso), items: [s] });
  }
  return groups;
}

export default function Haberler() {
  const [limit, setLimit] = useState(BATCH);
  const { status, stories, isFetching } = useLatestNews(limit);
  const groups = useMemo(() => groupByDay(stories), [stories]);

  const canLoadMore = status === 'success' && stories.length >= limit && limit < MAX;
  const atEnd = status === 'success' && stories.length >= MAX;

  return (
    <section className="mx-auto max-w-[760px]">
      <SeoHead
        path="/haberler"
        title="Tüm Haberler | Döviz Veri"
        description="Finans YouTube kanallarından derlenen tüm piyasa haber özetleri — tarih sırasıyla, tam metinleriyle."
      />

      <PageHeader
        title="Haberler"
        description="Takip ettiğimiz finans kanallarının videolarından derlenen özetler, en yeniden eskiye."
      />

      {status === 'loading' && (
        <div className="border-t-2 border-rule">
          {Array.from({ length: 8 }).map((_, i) => <StoryRowSkeleton key={i} />)}
        </div>
      )}

      {status === 'error' && (
        <p role="alert" className="border-y border-border py-6 text-[15px] text-text-muted">
          Haberler şu anda yüklenemedi. Lütfen biraz sonra tekrar deneyin.
        </p>
      )}

      {status === 'success' && stories.length === 0 && (
        <p className="border-y border-border py-6 text-[15px] text-text-muted">Henüz yayınlanmış özet bulunmuyor.</p>
      )}

      {status === 'success' && groups.map((g) => (
        <section key={g.key} aria-label={g.label} className="mb-8">
          <div className="section-head sticky top-14 z-10 bg-bg pb-2">
            <h2 className="first-letter:uppercase">{g.label}</h2>
            <span className="text-[12px] text-text-subtle">{g.items.length} haber</span>
          </div>
          {g.items.map((s) => <StoryRow key={s.video.id} story={s} />)}
        </section>
      ))}

      {canLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setLimit((prev) => Math.min(prev + BATCH, MAX))}
            disabled={isFetching}
            className="h-11 cursor-pointer rounded-[var(--r-chip)] border border-text bg-transparent px-6 text-[15px] font-semibold text-text transition-colors hover:bg-text hover:text-bg disabled:cursor-default disabled:opacity-60"
          >
            {isFetching ? 'Yükleniyor…' : 'Daha fazla haber yükle'}
          </button>
        </div>
      )}

      {atEnd && (
        <p className="pt-2 text-center text-[13px] text-text-subtle">Arşivde en yeni {MAX} haber gösteriliyor.</p>
      )}
    </section>
  );
}
