/**
 * Konular — /konular
 *
 * Topic index. Each tracked topic (Bitcoin, Dolar/TL, Faiz, Jeopolitik, …)
 * gets a card with its current aggregated summary, direction, confidence,
 * and the source videos behind it — each source links into the full
 * article (/haberler/:videoId) for the complete summary.
 *
 * Data: GET /v1/inference/latest via useConsensusDashboard (already cached).
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { InferenceTopicCard, InferenceTopicCardSkeleton } from '../components/ui/InferenceTopicCard';
import SeoHead from '../components/seo/SeoHead';

export default function Konular() {
  const { status, topics, changedTopics } = useConsensusDashboard();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!highlight || status !== 'success' || scrolledRef.current) return;
    const el = document.getElementById(`konu-${highlight}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      scrolledRef.current = true;
    }
  }, [highlight, status]);

  return (
    <section>
      <SeoHead
        path="/konular"
        title="Konular | Döviz Veri"
        description="Bitcoin, Dolar/TL, BIST 100, Altın, Faiz ve daha fazlası — YouTube'daki uzman videolarından derlenen konu bazlı güncel özetler."
      />

      <div className="mb-6 ml-1 mr-1">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-text">Konular</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Piyasa gündemindeki her konu için uzman videolarından derlenen güncel özet
        </p>
      </div>

      {status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <InferenceTopicCardSkeleton key={i} />)}
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
          Konu özetleri şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      )}

      {status === 'success' && topics.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
          Henüz yayınlanmış konu özeti bulunmuyor.
        </div>
      )}

      {status === 'success' && topics.length > 0 && (
        <>
          {changedTopics.length > 0 && (
            <p className="text-xs text-text-muted mb-4 ml-1">
              <span className="font-semibold text-text">{changedTopics.length} konuda</span> bugün görüş değişikliği var.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <InferenceTopicCard key={t.topic_key} topic={t} highlighted={t.topic_key === highlight} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
