import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { InferenceTopic } from '../../data/inference-types';
import { DIR_CONFIG } from '../../lib/directionConfig';

export function InferenceTopicCard({ topic, highlighted = false }: { topic: InferenceTopic; highlighted?: boolean }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const dir = DIR_CONFIG[topic.direction];
  const isCarriedOver = topic.status === 'carried_over';

  return (
    <div
      id={`konu-${topic.topic_key}`}
      className={`rounded-2xl bg-surface overflow-hidden border transition-all ${
        highlighted ? 'border-accent ring-2 ring-accent/30' : 'border-border'
      } ${isCarriedOver ? 'opacity-70' : ''}`}
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
              <p className="text-sm font-bold leading-tight text-text">
                {topic.topic_label}
              </p>
              <p className={`text-[11px] font-semibold mt-0.5 ${dir.textColor}`}>
                {dir.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {topic.status === 'new' && (
              <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full uppercase tracking-wider">
                Yeni
              </span>
            )}
            {topic.changed_from_prev && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-full uppercase tracking-wider">
                Değişti
              </span>
            )}
            {isCarriedOver && (
              <span className="text-[9px] font-medium text-text-muted bg-surface-2 px-2 py-1 rounded-full uppercase tracking-wide">
                Değişmedi
              </span>
            )}
            {topic.status === 'error' && (
              <span className="text-[9px] font-bold text-bear bg-bear-bg border border-bear/30 px-2 py-1 rounded-full uppercase tracking-wider">
                Hata
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-subtle">
              Güven
            </span>
            <span className="text-[11px] font-bold tabular-nums text-text-muted">
              {Math.round(topic.confidence * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${dir.barBg}`}
              style={{ width: `${topic.confidence * 100}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-text leading-relaxed mb-4">
          {topic.summary}
        </p>

        {topic.change_reason && (
          <p className="text-xs text-text-muted italic mb-4 pl-3 border-l-2 border-border leading-relaxed">
            {topic.change_reason}
          </p>
        )}

        {topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-text-muted bg-surface-2 px-2.5 py-1 rounded-full"
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
              className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] leading-none">
                {sourcesOpen ? 'expand_less' : 'expand_more'}
              </span>
              {topic.sources.length} kaynak video
            </button>

            {sourcesOpen && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                {topic.sources.map((src) => {
                  const isHighWeight = src.weight_used >= 2.0;
                  const isLowWeight = src.weight_used <= 0.5;
                  return (
                    <Link
                      key={src.video_id}
                      to={`/haberler/${src.video_id}`}
                      className={`flex items-start justify-between gap-3 rounded-lg -mx-2 px-2 py-1 hover:bg-surface-2 transition-colors focus-ring ${isLowWeight ? 'opacity-60' : ''}`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`text-xs leading-snug ${
                            isHighWeight ? 'font-bold' : 'font-medium'
                          } text-text`}
                        >
                          {src.person_name ?? src.channel_name}
                          {src.person_name && (
                            <span className="font-normal text-text-subtle ml-1">
                              · {src.channel_name}
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-text-subtle mt-0.5 leading-snug italic truncate">
                          {src.title}
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-snug">
                          {src.contribution_note}
                        </p>
                        <span className="text-[10px] font-semibold text-accent mt-1 inline-block">
                          Tam özeti oku →
                        </span>
                      </div>
                      {isHighWeight && (
                        <span className="flex-shrink-0 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          Öne Çıkan
                        </span>
                      )}
                    </Link>
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
    <div className="rounded-2xl bg-surface overflow-hidden border border-border animate-pulse">
      <div className="h-[3px] bg-surface-2" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-surface-2 rounded" />
            <div className="h-2.5 w-16 bg-surface-2 rounded" />
          </div>
        </div>
        <div className="h-1.5 bg-surface-2 rounded-full" />
        <div className="space-y-2">
          <div className="h-3 bg-surface-2 rounded w-full" />
          <div className="h-3 bg-surface-2 rounded w-5/6" />
          <div className="h-3 bg-surface-2 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}
