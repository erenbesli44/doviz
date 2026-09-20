/**
 * One topic on /konular: stance at a glance on the left, the reasoning on the right,
 * and the evidence (source videos) one click away — progressive disclosure.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi } from '../../lib/newsClient';
import { confidenceBand } from '../../lib/directionConfig';
import { ConfidenceDots } from '../consensus/ConfidenceDots';
import DirectionTag from './DirectionTag';
import Icon from '../ui/Icon';
import type { InferenceSource, InferenceTopic } from '../../data/inference-types';

/** Resolves which sources have a readable article, so we never link to a dead end. */
function SourceList({ sources }: { sources: InferenceSource[] }) {
  const [available, setAvailable] = useState<Set<number> | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    let cancelled = false;
    Promise.all(
      sources.map((s) => newsApi.story(s.video_id, ctl.signal).then(() => s.video_id).catch(() => null)),
    ).then((ids) => {
      if (!cancelled) setAvailable(new Set(ids.filter((id): id is number => id != null)));
    });
    return () => { cancelled = true; ctl.abort(); };
  }, [sources]);

  return (
    <ol className="m-0 list-none p-0">
      {sources.map((src) => {
        const who = src.person_name ?? src.channel_name;
        const linked = available?.has(src.video_id) ?? false;
        const body = (
          <>
            <p className="m-0 text-[14px] font-semibold text-text">
              {who}
              {src.person_name && <span className="font-normal text-text-subtle"> · {src.channel_name}</span>}
              {src.weight_used >= 2 && (
                <span className="ml-2 rounded-[var(--r-chip)] bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">Ağırlıklı kaynak</span>
              )}
            </p>
            <p className={`mt-0.5 mb-0 font-serif text-[15px] leading-snug text-text ${linked ? 'headline-link' : ''}`}>{src.title}</p>
            <p className="mt-1 mb-0 text-[13px] leading-5 text-text-muted">{src.contribution_note}</p>
            {linked && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                Özeti oku <Icon name="arrow-right" size={13} />
              </span>
            )}
          </>
        );
        return (
          <li key={src.video_id} className="border-t border-border first:border-t-0">
            {linked ? (
              <Link to={`/haberler/${src.video_id}`} className="group block py-3 no-underline">{body}</Link>
            ) : (
              <div className="py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface Props {
  topic: InferenceTopic;
  highlighted?: boolean;
}

export default function TopicSection({ topic, highlighted = false }: Props) {
  const [open, setOpen] = useState(highlighted);
  const pct = Math.round(topic.confidence * 100);

  return (
    <section
      id={`konu-${topic.topic_key}`}
      aria-labelledby={`konu-baslik-${topic.topic_key}`}
      className={`scroll-mt-20 border-t border-border py-7 md:grid md:grid-cols-[230px_1fr] md:gap-8 ${
        highlighted ? 'border-l-2 border-l-accent pl-4 md:pl-5' : ''
      }`}
    >
      <div>
        <h2 id={`konu-baslik-${topic.topic_key}`} className="m-0 font-serif text-[23px] leading-tight font-semibold text-text">
          {topic.topic_label}
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <DirectionTag direction={topic.direction} variant="pill" />
          {topic.changed_from_prev && (
            <span className="rounded-[var(--r-chip)] bg-warn-bg px-2 py-0.5 text-[12px] font-semibold text-warn">Görüş değişti</span>
          )}
        </div>
        <p className="mt-2.5 mb-0 flex items-center gap-2 text-[13px] text-text-muted">
          <ConfidenceDots confidence={topic.confidence} />
          Güven {confidenceBand(topic.confidence)} · %{pct}
        </p>
      </div>

      <div className="mt-4 min-w-0 md:mt-0">
        <p className="m-0 max-w-[68ch] text-[17px] leading-[1.7] text-text">{topic.summary}</p>

        {topic.change_reason && (
          <p className="mt-3 mb-0 max-w-[68ch] border-l-2 border-border pl-3 text-[14px] leading-6 text-text-muted">
            <span className="font-semibold text-text">Ne değişti: </span>{topic.change_reason}
          </p>
        )}

        {topic.tags.length > 0 && (
          <p className="mt-3 mb-0 text-[13px] leading-6 text-text-subtle">
            {topic.tags.map((tag) => `#${tag}`).join('  ')}
          </p>
        )}

        {topic.sources.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={`konu-kaynak-${topic.topic_key}`}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] font-semibold text-accent hover:underline underline-offset-4"
            >
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
              {open ? 'Kaynakları gizle' : `Bu görüşün dayandığı ${topic.sources.length} videoyu göster`}
            </button>
            {open && (
              <div id={`konu-kaynak-${topic.topic_key}`} className="mt-1 max-w-[68ch]">
                <SourceList sources={topic.sources} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function TopicSectionSkeleton() {
  return (
    <div className="border-t border-border py-7 md:grid md:grid-cols-[230px_1fr] md:gap-8" aria-hidden="true">
      <div className="space-y-3">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-5 w-24" />
      </div>
      <div className="mt-4 space-y-2.5 md:mt-0">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-4/5" />
      </div>
    </div>
  );
}
