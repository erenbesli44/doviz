/**
 * Search — /ara?q=
 *
 * Client-side search over what the site already has loaded: recent stories,
 * topics and experts. Honest about its scope (recent stories only).
 */

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLatestNews } from '../hooks/useLatestNews';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { useChannels } from '../hooks/useChannels';
import { StoryRow, StoryRowSkeleton } from '../components/news/Story';
import { ProAvatar } from '../components/consensus/ProAvatar';
import DirectionTag from '../components/topics/DirectionTag';
import PageHeader from '../components/layout/PageHeader';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import { fold } from '../lib/newsFormat';

const SEARCH_WINDOW = 50; // API maximum for /news/latest

/** Keyed by the active query, so a new search from the masthead resets the field. */
function SearchForm({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [draft, setDraft] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(draft.trim()); }} role="search" className="mb-8 flex gap-2">
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Haber, konu veya uzman ara"
        aria-label="Arama terimi"
        autoFocus={!initial}
        className="h-12 min-w-0 flex-1 rounded-[var(--r-chip)] border border-border bg-surface px-4 text-[16px] text-text placeholder:text-text-subtle"
      />
      <button type="submit" className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-[var(--r-chip)] border-0 bg-accent px-5 text-[15px] font-semibold text-on-accent hover:opacity-90">
        <Icon name="search" size={17} />
        Ara
      </button>
    </form>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const { status: newsStatus, stories } = useLatestNews(SEARCH_WINDOW);
  const { topics } = useConsensusDashboard();
  const { channels } = useChannels();

  const results = useMemo(() => {
    const terms = fold(q).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return { stories: [], topics: [], channels: [] };
    const matches = (...fields: Array<string | null | undefined>) => {
      const hay = fold(fields.filter(Boolean).join(' '));
      return terms.every((t) => hay.includes(t));
    };
    return {
      stories: stories.filter((s) => matches(s.video.title, s.summary.short_summary, s.channel?.name)),
      topics: topics.filter((t) => matches(t.topic_label, t.tags.join(' '), t.summary)),
      channels: channels.filter((c) => matches(c.name, c.bio)),
    };
  }, [q, stories, topics, channels]);

  const total = results.stories.length + results.topics.length + results.channels.length;

  return (
    <section className="mx-auto max-w-[760px]">
      <SeoHead path="/ara" title="Arama | Döviz Veri" description="Döviz Veri'de haber, konu ve uzman arayın." robots="noindex,follow" />

      <PageHeader title="Arama" />

      <SearchForm key={q} initial={q} onSearch={(next) => setSearchParams(next ? { q: next } : {})} />

      {!q && <p className="text-[15px] text-text-muted">Aramak istediğiniz kelimeyi yazın — örneğin “altın”, “faiz” ya da bir kanal adı.</p>}

      {q && newsStatus === 'loading' && Array.from({ length: 3 }).map((_, i) => <StoryRowSkeleton key={i} />)}

      {q && newsStatus !== 'loading' && (
        <>
          <p className="mb-6 text-[14px] text-text-muted" role="status">
            “<span className="font-semibold text-text">{q}</span>” için {total} sonuç.
          </p>

          {results.topics.length > 0 && (
            <section aria-labelledby="ara-konular" className="mb-10">
              <div className="section-head"><h2 id="ara-konular">Konular</h2></div>
              <ul className="m-0 list-none p-0">
                {results.topics.map((t) => (
                  <li key={t.topic_key} className="border-b border-border">
                    <Link to={`/konular?highlight=${encodeURIComponent(t.topic_key)}`} className="group block py-3.5 no-underline">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="headline-link font-serif text-[19px] font-semibold text-text">{t.topic_label}</span>
                        <DirectionTag direction={t.direction} />
                      </div>
                      <p className="mt-1 mb-0 text-[14px] leading-[1.55] text-text-muted line-clamp-2">{t.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.channels.length > 0 && (
            <section aria-labelledby="ara-uzmanlar" className="mb-10">
              <div className="section-head"><h2 id="ara-uzmanlar">Uzmanlar</h2></div>
              <ul className="m-0 list-none p-0">
                {results.channels.map((c) => (
                  <li key={c.id} className="border-b border-border">
                    <Link to={`/uzmanlar/${c.slug}`} className="group flex items-center gap-3 py-3.5 no-underline">
                      <ProAvatar channelAvatarUrl={c.avatar_url ?? undefined} name={c.name} size="md" />
                      <span className="headline-link text-[16px] font-semibold text-text">{c.name}</span>
                      <span className="ml-auto text-[13px] text-text-subtle">{c.video_count} video</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.stories.length > 0 && (
            <section aria-labelledby="ara-haberler">
              <div className="section-head"><h2 id="ara-haberler">Haberler</h2></div>
              {results.stories.map((s) => <StoryRow key={s.video.id} story={s} />)}
            </section>
          )}

          {total === 0 && (
            <p className="border-y border-border py-6 text-[15px] leading-6 text-text-muted">
              Sonuç bulunamadı. Daha kısa ya da farklı bir kelime deneyin.
            </p>
          )}

          <p className="mt-8 text-[13px] text-text-subtle">
            Haber araması son {SEARCH_WINDOW} özeti kapsar. Daha eskiler için{' '}
            <Link to="/haberler" className="link">Haberler</Link> arşivine bakın.
          </p>
        </>
      )}
    </section>
  );
}
