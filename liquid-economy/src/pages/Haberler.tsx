import { useState } from 'react';
import { useLatestNews } from '../hooks/useLatestNews';
import NewsCard from '../components/ui/NewsCard';
import SeoHead from '../components/seo/SeoHead';

const BATCH = 20;

function Skeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-2xl bg-surface-2 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function Haberler() {
  const [limit, setLimit] = useState(BATCH);
  const { status, stories } = useLatestNews(limit);

  const canLoadMore = status === 'success' && stories.length === limit;

  return (
    <section>
      <SeoHead
        path="/haberler"
        title="Tüm Haberler | Döviz Veri"
        description="Piyasa gündemine dair YouTube kanallarından derlenen tüm haber özetleri, tam metinleriyle."
      />

      <div className="flex items-center justify-between mb-5 ml-1 mr-1">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-text">
            Tüm Haberler
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            YouTube kanallarından derlenen piyasa özetleri, tam metinleriyle
          </p>
        </div>
        <span className="text-[10px] font-medium text-text-muted hidden sm:inline-flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="ml-0.5">youtube özetleri</span>
        </span>
      </div>

      {status === 'loading' && <Skeleton count={limit} />}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stories.map((s) => (
              <NewsCard key={s.video.id} story={s} />
            ))}
          </div>

          {canLoadMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setLimit((prev) => prev + BATCH)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">expand_more</span>
                Daha Fazla Yükle
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
