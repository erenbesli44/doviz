/**
 * Konular — /konular
 *
 * Every tracked topic with its current aggregated view. A jump index at the top
 * (recognition over recall), one section per topic, source videos on demand.
 *
 * Data: GET /v1/inference/latest via useConsensusDashboard.
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import TopicSection, { TopicSectionSkeleton } from '../components/topics/TopicSection';
import PageHeader from '../components/layout/PageHeader';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import { DIR_CONFIG } from '../lib/directionConfig';
import { formatDate } from '../lib/newsFormat';

function jumpTo(topicKey: string) {
  document.getElementById(`konu-${topicKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Konular() {
  const { status, topics, changedTopics, generatedAt } = useConsensusDashboard();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!highlight || status !== 'success' || scrolledRef.current) return;
    scrolledRef.current = true;
    requestAnimationFrame(() => jumpTo(highlight));
  }, [highlight, status]);

  const analysedOn = formatDate(generatedAt);

  return (
    <section className="mx-auto max-w-[920px]">
      <SeoHead
        path="/konular"
        title="Konular | Döviz Veri"
        description="Bitcoin, Dolar/TL, BIST 100, Altın, Faiz ve daha fazlası — YouTube'daki uzman videolarından derlenen konu bazlı güncel özetler."
      />

      <PageHeader
        title="Konular"
        description="Her konu için uzman videolarından derlenen ortak görüş: yön, güven düzeyi, gerekçe ve dayandığı kaynaklar."
        aside={analysedOn ? <>Son analiz: <span className="font-semibold text-text">{analysedOn}</span></> : undefined}
      />

      {status === 'error' && (
        <p role="alert" className="border-y border-border py-6 text-[15px] text-text-muted">
          Konu özetleri şu anda yüklenemedi. Lütfen biraz sonra tekrar deneyin.
        </p>
      )}

      {status === 'success' && topics.length === 0 && (
        <p className="border-y border-border py-6 text-[15px] text-text-muted">Henüz yayınlanmış konu özeti bulunmuyor.</p>
      )}

      {status === 'loading' && Array.from({ length: 4 }).map((_, i) => <TopicSectionSkeleton key={i} />)}

      {status === 'success' && topics.length > 0 && (
        <>
          <nav aria-label="Konu dizini" className="mb-2 border-t-2 border-rule pt-4">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {topics.map((t) => {
                const dir = DIR_CONFIG[t.direction];
                return (
                  <li key={t.topic_key}>
                    <button
                      onClick={() => jumpTo(t.topic_key)}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--r-chip)] border border-border bg-transparent px-3 text-[14px] font-semibold text-text transition-colors hover:border-text"
                    >
                      <Icon name={dir.icon} size={14} strokeWidth={2.4} className={dir.text} />
                      {t.topic_label}
                      <span className="sr-only">: {dir.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {changedTopics.length > 0 && (
              <p className="mt-3 mb-0 text-[13px] text-text-muted">
                Son analizde <span className="font-semibold text-text">{changedTopics.length} konuda</span> görüş değişti.
              </p>
            )}
          </nav>

          <div className="mt-6">
            {topics.map((t) => (
              <TopicSection key={t.topic_key} topic={t} highlighted={t.topic_key === highlight} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
