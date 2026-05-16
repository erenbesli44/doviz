import { Link } from 'react-router-dom';
import { useInference } from '../../hooks/useInference';
import { InferenceTopicCard, InferenceTopicCardSkeleton } from './InferenceTopicCard';

const FEATURED_KEYS = ['dolar-tl', 'bist', 'altin-tl'] as const;

export default function InsightStrip() {
  const { status, data } = useInference();

  const featuredTopics = FEATURED_KEYS.map((key) =>
    data?.topics.find((t) => t.topic_key === key) ?? null
  );

  const generatedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 ml-1 mr-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold tracking-[0.08em] uppercase text-[var(--color-on-surface-variant)]">
            Piyasa Analizi
          </h2>
          <span className="text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full tracking-wide">
            AI
          </span>
          {generatedAt && (
            <span className="text-[10px] text-[var(--color-on-surface-variant)]/50 font-medium">
              {generatedAt} itibarıyla
            </span>
          )}
        </div>
        <Link
          to="/analiz"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] opacity-80 hover:opacity-100 transition-opacity"
        >
          Tümünü gör
          <span className="material-symbols-outlined text-[14px] leading-none">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {status === 'loading' &&
          FEATURED_KEYS.map((k) => <InferenceTopicCardSkeleton key={k} />)
        }

        {status === 'error' && (
          <div className="col-span-3 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-4 text-sm text-[var(--color-on-surface-variant)]">
            Analiz şu anda yüklenemedi.
          </div>
        )}

        {status === 'success' && featuredTopics.map((topic, i) =>
          topic ? (
            <InferenceTopicCard key={topic.topic_key} topic={topic} />
          ) : (
            <div
              key={FEATURED_KEYS[i]}
              className="rounded-2xl p-3.5 bg-[var(--color-surface-container-low)] flex items-center justify-center text-xs text-[var(--color-on-surface-variant)]/50"
            >
              —
            </div>
          )
        )}
      </div>
    </section>
  );
}
