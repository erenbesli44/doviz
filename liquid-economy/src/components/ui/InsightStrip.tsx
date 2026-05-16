import { Link } from 'react-router-dom';
import { useInference } from '../../hooks/useInference';
import type { Direction, InferenceTopic } from '../../data/inference-types';

const FEATURED_KEYS = ['dolar-tl', 'bist', 'us-markets'] as const;

const DIR_CONFIG: Record<Direction, {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  barBg: string;
}> = {
  up: {
    icon: 'trending_up',
    label: 'Yükseliş',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-600',
    barBg: 'bg-emerald-500',
  },
  down: {
    icon: 'trending_down',
    label: 'Düşüş',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    textColor: 'text-rose-600',
    barBg: 'bg-rose-500',
  },
  sideways: {
    icon: 'trending_flat',
    label: 'Yatay',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    textColor: 'text-slate-500',
    barBg: 'bg-slate-400',
  },
  mixed: {
    icon: 'swap_vert',
    label: 'Karma',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-600',
    barBg: 'bg-amber-500',
  },
};

function MiniCard({ topic }: { topic: InferenceTopic }) {
  const dir = DIR_CONFIG[topic.direction];
  const isCarriedOver = topic.status === 'carried_over';

  return (
    <Link
      to="/analiz"
      className={`block rounded-2xl p-3.5 bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container)] transition-colors group ${isCarriedOver ? 'opacity-60' : ''}`}
    >
      {/* Direction icon + badges */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dir.iconBg}`}>
          <span className={`material-symbols-outlined text-[18px] ${dir.iconColor}`}>
            {dir.icon}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {topic.status === 'new' && (
            <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Yeni
            </span>
          )}
          {topic.changed_from_prev && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Değişti
            </span>
          )}
        </div>
      </div>

      {/* Label + direction label */}
      <p className="text-xs font-bold leading-tight text-[var(--color-on-surface)] mb-0.5 group-hover:text-[var(--color-primary)] transition-colors">
        {topic.topic_label}
      </p>
      <p className={`text-[10px] font-semibold mb-2.5 ${dir.textColor}`}>
        {dir.label}
      </p>

      {/* Confidence bar */}
      <div className="h-1 bg-[var(--color-surface-container-highest)] rounded-full mb-3">
        <div
          className={`h-1 rounded-full ${dir.barBg}`}
          style={{ width: `${topic.confidence * 100}%` }}
        />
      </div>

      {/* Summary */}
      <p className="text-[11px] text-[var(--color-on-surface-variant)] line-clamp-2 leading-snug">
        {topic.summary}
      </p>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-3.5 bg-[var(--color-surface-container-low)] space-y-3 animate-pulse">
      <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-container-high)]" />
      <div className="h-3 w-3/4 bg-[var(--color-surface-container-high)] rounded" />
      <div className="h-1 bg-[var(--color-surface-container-high)] rounded-full" />
      <div className="space-y-1.5">
        <div className="h-2.5 bg-[var(--color-surface-container-high)] rounded w-full" />
        <div className="h-2.5 bg-[var(--color-surface-container-high)] rounded w-4/5" />
      </div>
    </div>
  );
}

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
      {/* Header */}
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

      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-2">
        {status === 'loading' &&
          FEATURED_KEYS.map((k) => <SkeletonCard key={k} />)
        }

        {status === 'error' && (
          <div className="col-span-3 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-4 text-sm text-[var(--color-on-surface-variant)]">
            Analiz şu anda yüklenemedi.
          </div>
        )}

        {status === 'success' && featuredTopics.map((topic, i) =>
          topic ? (
            <MiniCard key={topic.topic_key} topic={topic} />
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
