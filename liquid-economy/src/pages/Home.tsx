/**
 * Home — / (Gündem)
 *
 * A front page, not a card wall. Attention is rationed by size:
 *   1. one lead story
 *   2. three secondary stories
 *   3. a compact chronological feed
 * with a topics rail beside the lead so readers can jump straight to a subject.
 */

import { Link } from 'react-router-dom';
import { useLatestNews } from '../hooks/useLatestNews';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { StoryLead, StoryCard, StoryRow, StoryRowSkeleton } from '../components/news/Story';
import DirectionTag from '../components/topics/DirectionTag';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';

const FEED_SIZE = 14; // 1 lead + 3 secondary + 10 feed rows
const RAIL_TOPICS = 6;

function TopicsRail() {
  const { status, topics } = useConsensusDashboard();
  if (status === 'error' || (status === 'success' && topics.length === 0)) return null;

  return (
    <aside aria-label="Konular">
      <div className="section-head">
        <h2>Konular</h2>
        <Link to="/konular" className="text-[13px] font-semibold text-accent no-underline hover:underline underline-offset-4">
          Tümü
        </Link>
      </div>

      {status === 'loading' ? (
        <div className="space-y-4 pt-3" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10" />)}
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {topics.slice(0, RAIL_TOPICS).map((t) => (
            <li key={t.topic_key} className="border-b border-border last:border-b-0">
              <Link to={`/konular?highlight=${encodeURIComponent(t.topic_key)}`} className="group block py-3 no-underline">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="headline-link text-[15px] font-semibold text-text">{t.topic_label}</span>
                  <DirectionTag direction={t.direction} />
                </div>
                <p className="mt-1 mb-0 text-[13px] leading-5 text-text-muted line-clamp-2">{t.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function LeadSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:gap-7" aria-hidden="true">
      <div className="skeleton aspect-video" />
      <div className="space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-8 w-full" />
        <div className="skeleton h-8 w-4/5" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
      </div>
    </div>
  );
}

export default function Home() {
  const { status, stories } = useLatestNews(FEED_SIZE);
  const [lead, ...others] = stories;
  const secondary = others.slice(0, 3);
  const feed = others.slice(3);

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

  return (
    <>
      <SeoHead
        path="/"
        title="Piyasa Haberleri ve Uzman Özetleri | Döviz Veri"
        description="YouTube'daki finans kanallarından derlenen güncel piyasa haberleri, tam özetleri ve konu bazlı uzman görüşleri — Bitcoin, Dolar/TL, BIST 100, Altın ve daha fazlası."
      />

      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="m-0 font-serif text-[30px] leading-tight font-semibold tracking-tight text-text md:text-[38px]">
          Piyasa Gündemi
        </h1>
        <p className="m-0 text-[13px] text-text-muted first-letter:uppercase">{today}</p>
      </header>

      {status === 'error' && (
        <p role="alert" className="border-y border-border py-6 text-[15px] text-text-muted">
          Haberler şu anda yüklenemedi. Lütfen biraz sonra tekrar deneyin.
        </p>
      )}

      {status === 'success' && stories.length === 0 && (
        <p className="border-y border-border py-6 text-[15px] text-text-muted">Henüz yayınlanmış özet bulunmuyor.</p>
      )}

      {/* Lead + secondary stories, with the topics rail alongside */}
      {status !== 'error' && (status === 'loading' || lead) && (
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="border-t-2 border-rule pt-6">
            {lead ? <StoryLead story={lead} /> : <LeadSkeleton />}

            {secondary.length > 0 && (
              <section aria-label="Öne çıkan haberler" className="mt-8 grid gap-8 border-t border-border pt-8 sm:grid-cols-3 sm:gap-6">
                {secondary.map((s) => <StoryCard key={s.video.id} story={s} />)}
              </section>
            )}
          </div>
          <TopicsRail />
        </div>
      )}

      {/* Chronological feed */}
      {(status === 'loading' || feed.length > 0) && (
        <section aria-labelledby="son-haberler" className="mt-12 lg:max-w-[760px]">
          <div className="section-head">
            <h2 id="son-haberler">Son Haberler</h2>
          </div>
          {status === 'loading'
            ? Array.from({ length: 5 }).map((_, i) => <StoryRowSkeleton key={i} />)
            : feed.map((s) => <StoryRow key={s.video.id} story={s} />)}

          {status === 'success' && (
            <Link
              to="/haberler"
              className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-accent no-underline hover:underline underline-offset-4"
            >
              Tüm haberler
              <Icon name="arrow-right" size={16} />
            </Link>
          )}
        </section>
      )}
    </>
  );
}
