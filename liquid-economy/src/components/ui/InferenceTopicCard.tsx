import { useState } from 'react';
import type { Direction, InferenceTopic } from '../../data/inference-types';

export const DIR_CONFIG: Record<Direction, {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  barBg: string;
  topAccent: string;
}> = {
  up: {
    icon: 'trending_up',
    label: 'Yükseliş',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    textColor: 'text-emerald-600',
    barBg: 'bg-emerald-500',
    topAccent: 'bg-emerald-500',
  },
  down: {
    icon: 'trending_down',
    label: 'Düşüş',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    textColor: 'text-rose-600',
    barBg: 'bg-rose-500',
    topAccent: 'bg-rose-500',
  },
  sideways: {
    icon: 'trending_flat',
    label: 'Yatay',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    textColor: 'text-slate-500',
    barBg: 'bg-slate-400',
    topAccent: 'bg-slate-400',
  },
  mixed: {
    icon: 'swap_vert',
    label: 'Karma',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-600',
    barBg: 'bg-amber-500',
    topAccent: 'bg-amber-500',
  },
};

export function InferenceTopicCard({ topic }: { topic: InferenceTopic }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const dir = DIR_CONFIG[topic.direction];
  const isCarriedOver = topic.status === 'carried_over';

  return (
    <div
      className={`rounded-2xl bg-[var(--color-surface-container-low)] overflow-hidden border border-[var(--color-outline-variant)]/20 transition-opacity ${
        isCarriedOver ? 'opacity-55' : ''
      }`}
    >
      <div className={`h-[3px] w-full ${dir.topAccent}`} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dir.iconBg}`}>
              <span className={`material-symbols-outlined text-[22px] ${dir.iconColor}`}>
                {dir.icon}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-[var(--color-on-surface)]">
                {topic.topic_label}
              </p>
              <p className={`text-[11px] font-semibold mt-0.5 ${dir.textColor}`}>
                {dir.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {topic.status === 'new' && (
              <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-full uppercase tracking-wider">
                Yeni
              </span>
            )}
            {topic.changed_from_prev && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-full uppercase tracking-wider">
                Değişti
              </span>
            )}
            {isCarriedOver && (
              <span className="text-[9px] font-medium text-[var(--color-on-surface-variant)]/60 bg-[var(--color-surface-container)] px-2 py-1 rounded-full uppercase tracking-wide">
                Değişmedi
              </span>
            )}
            {topic.status === 'error' && (
              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-1 rounded-full uppercase tracking-wider">
                Hata
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]/50">
              Güven
            </span>
            <span className="text-[11px] font-bold tabular-nums text-[var(--color-on-surface-variant)]">
              {Math.round(topic.confidence * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${dir.barBg}`}
              style={{ width: `${topic.confidence * 100}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-[var(--color-on-surface)] leading-relaxed mb-4">
          {topic.summary}
        </p>

        {topic.change_reason && (
          <p className="text-xs text-[var(--color-on-surface-variant)]/70 italic mb-4 pl-3 border-l-2 border-[var(--color-outline-variant)]/40 leading-relaxed">
            {topic.change_reason}
          </p>
        )}

        {topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {topic.sources.length > 0 && (
          <>
            <button
              onClick={() => setSourcesOpen((o) => !o)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-on-surface-variant)]/60 hover:text-[var(--color-on-surface-variant)] transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] leading-none">
                {sourcesOpen ? 'expand_less' : 'expand_more'}
              </span>
              {topic.sources.length} kaynak
            </button>

            {sourcesOpen && (
              <div className="mt-3 pt-3 border-t border-[var(--color-outline-variant)]/20 space-y-3">
                {topic.sources.map((src) => {
                  const isHighWeight = src.weight_used >= 2.0;
                  const isLowWeight = src.weight_used <= 0.5;
                  return (
                    <div
                      key={src.video_id}
                      className={`flex items-start justify-between gap-3 ${isLowWeight ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs leading-snug ${
                            isHighWeight ? 'font-bold' : 'font-medium'
                          } text-[var(--color-on-surface)]`}
                        >
                          {src.person_name}
                          <span className="font-normal text-[var(--color-on-surface-variant)]/50 ml-1">
                            · {src.channel_name}
                          </span>
                        </p>
                        <p className="text-[10px] text-[var(--color-on-surface-variant)]/50 mt-0.5 leading-snug italic truncate">
                          {src.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-on-surface-variant)]/70 mt-1 leading-snug">
                          {src.contribution_note}
                        </p>
                      </div>
                      {isHighWeight && (
                        <span className="flex-shrink-0 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          Öne Çıkan
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function InferenceTopicCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[var(--color-surface-container-low)] overflow-hidden border border-[var(--color-outline-variant)]/20 animate-pulse">
      <div className="h-[3px] bg-[var(--color-surface-container-high)]" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-container-high)]" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-[var(--color-surface-container-high)] rounded" />
            <div className="h-2.5 w-16 bg-[var(--color-surface-container-high)] rounded" />
          </div>
        </div>
        <div className="h-1.5 bg-[var(--color-surface-container-high)] rounded-full" />
        <div className="space-y-2">
          <div className="h-3 bg-[var(--color-surface-container-high)] rounded w-full" />
          <div className="h-3 bg-[var(--color-surface-container-high)] rounded w-5/6" />
          <div className="h-3 bg-[var(--color-surface-container-high)] rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}
