/**
 * Home — /
 *
 * News-first homepage. dovizveri's core content is video summaries derived
 * from tracked YouTube finance channels — this page leads with that: a
 * featured story, the latest summaries, and a "Konular" (topics) strip so
 * readers can jump straight to a subject (Bitcoin, Dolar/TL, Faiz, …).
 *
 * Piyasa (asset consensus) and Uzmanlar stay reachable from nav, but are no
 * longer the homepage headline.
 */

import { Link } from 'react-router-dom';
import { useLatestNews } from '../hooks/useLatestNews';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { DIR_CONFIG } from '../lib/directionConfig';
import NewsCard from '../components/ui/NewsCard';
import SeoHead from '../components/seo/SeoHead';

const FEED_SIZE = 13; // 1 featured + 12 grid

function StorySkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 rounded-2xl bg-surface-2 animate-pulse" />
      ))}
    </div>
  );
}

function TopicChipRow() {
  const { status, topics } = useConsensusDashboard();

  if (status === 'loading') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-28 shrink-0 rounded-full bg-surface-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (status !== 'success' || topics.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {topics.map((t) => {
        const dir = DIR_CONFIG[t.direction];
        return (
          <Link
            key={t.topic_key}
            to={`/konular?highlight=${encodeURIComponent(t.topic_key)}`}
            className="group flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface pl-2 pr-3.5 py-1.5 hover:border-accent transition-colors focus-ring"
          >
            <span className={`material-symbols-outlined text-[16px] leading-none ${dir.iconColor}`}>
              {dir.icon}
            </span>
            <span className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
              {t.topic_label}
            </span>
            {t.changed_from_prev && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-label="Bugün değişti" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { status, stories } = useLatestNews(FEED_SIZE);
  const [featured, ...rest] = stories;

  return (
    <section>
      <SeoHead
        path="/"
        title="Piyasa Haberleri ve Uzman Özetleri | Döviz Veri"
        description="YouTube'daki finans kanallarından derlenen güncel piyasa haberleri, tam özetleri ve konu bazlı uzman görüşleri — Bitcoin, Dolar/TL, BIST 100, Altın ve daha fazlası."
      />

      <div className="mb-5 ml-1 mr-1">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-text">
          Piyasa Gündemi
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          YouTube'daki uzman analizlerinden derlenen güncel haber özetleri
        </p>
      </div>

      {/* Konular quick strip */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 ml-1 mr-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">
            Konular
          </span>
          <Link to="/konular" className="text-[11px] font-semibold text-accent hover:opacity-80">
            Tümü →
          </Link>
        </div>
        <TopicChipRow />
      </div>

      {status === 'loading' && <StorySkeleton count={FEED_SIZE} />}

      {status === 'error' && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
          Haberler şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      )}

      {status === 'success' && stories.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
          Henüz yayınlanmış özet bulunmuyor.
        </div>
      )}

      {status === 'success' && stories.length > 0 && (
        <>
          {featured && (
            <div className="mb-4">
              <NewsCard story={featured} featured />
            </div>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {rest.map((s) => (
                <NewsCard key={s.video.id} story={s} />
              ))}
            </div>
          )}

          <div className="flex justify-center mt-8">
            <Link
              to="/haberler"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
            >
              Tüm haberleri gör
              <span className="material-symbols-outlined text-[18px] leading-none">arrow_forward</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
