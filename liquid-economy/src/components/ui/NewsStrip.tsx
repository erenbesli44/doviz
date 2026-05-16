import { Link } from 'react-router-dom';
import { useLatestNews } from '../../hooks/useLatestNews';
import NewsCard from './NewsCard';

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-60 rounded-2xl bg-[var(--color-surface-container)] animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl bg-[var(--color-surface-container)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export default function NewsStrip() {
  const { status, stories } = useLatestNews(7);
  const [featured, ...rest] = stories;

  return (
    <section id="haberler" className="mb-10 scroll-mt-20">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 ml-1 mr-1">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold tracking-[0.08em] uppercase text-[var(--color-on-surface-variant)]">
            Piyasa Gündemi
          </h2>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          </span>
        </div>
        <Link
          to="/haberler"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] opacity-80 hover:opacity-100 transition-opacity"
        >
          Tümünü gör
          <span className="material-symbols-outlined text-[14px] leading-none">arrow_forward</span>
        </Link>
      </div>

      {status === 'loading' && <Skeleton />}

      {status === 'error' && (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-6 text-sm text-[var(--color-on-surface-variant)]">
          Haberler şu anda yüklenemedi.
        </div>
      )}

      {status === 'success' && stories.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-6 text-sm text-[var(--color-on-surface-variant)]">
          Henüz yayınlanmış özet bulunmuyor.
        </div>
      )}

      {status === 'success' && stories.length > 0 && (
        <>
          {/* Desktop: featured hero + 3-col grid */}
          <div className="hidden md:flex flex-col gap-3">
            <NewsCard story={featured} featured />
            {rest.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {rest.map((s) => (
                  <NewsCard key={s.video.id} story={s} />
                ))}
              </div>
            )}
          </div>

          {/* Mobile: simple single-col list */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stories.map((s) => (
              <NewsCard key={s.video.id} story={s} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
