/**
 * One gündem topic on /konular (faiz, enflasyon, …): the tracker's context
 * summary and the source videos one click away (the analysis date sits in
 * the part's header).
 * Not an expectation — these topics have no explicit-view data, so no
 * direction and no confidence are shown.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi } from '../../lib/newsClient';
import { formatDate } from '../../lib/views';
import Icon from '../ui/Icon';
import type { InferenceSource, InferenceTopic } from '../../data/inference-types';

const FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

/** Case- and diacritic-insensitive, so "Emrah Lafçı" matches the channel "EMRAH LAFCI". */
function foldName(name: string): string {
  return name.toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, (c) => FOLD[c]).replace(/\s+/g, ' ').trim();
}

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
              <span className="font-normal text-text-subtle">
                {src.person_name && foldName(src.person_name) !== foldName(src.channel_name) && ` · ${src.channel_name}`}
                {src.published_at && ` · ${formatDate(src.published_at)}`}
              </span>
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
  topicKey: string;
  label: string;
  status: 'loading' | 'success' | 'error';
  topic?: InferenceTopic;
  highlighted?: boolean;
}

export default function AgendaSection({ topicKey, label, status, topic, highlighted = false }: Props) {
  const [open, setOpen] = useState(highlighted);

  return (
    <section
      id={`konu-${topicKey}`}
      aria-labelledby={`konu-baslik-${topicKey}`}
      className={`scroll-mt-20 border-t border-border py-7 md:grid md:grid-cols-[230px_1fr] md:gap-8 ${
        highlighted ? 'border-l-2 border-l-accent pl-4 md:pl-5' : ''
      }`}
    >
      <div>
        <h3 id={`konu-baslik-${topicKey}`} className="m-0 font-serif text-[23px] leading-tight font-semibold text-text">
          {label}
        </h3>
      </div>

      <div className="mt-4 min-w-0 md:mt-0">
        {status === 'loading' && (
          <div className="space-y-2.5" aria-hidden="true">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        )}
        {status === 'error' && <p role="status" className="m-0 text-[15px] text-text-muted">Gündem özeti şu anda yüklenemedi.</p>}
        {status === 'success' && !topic && <p className="m-0 text-[15px] text-text-muted">Bu konu için yayınlanmış özet yok.</p>}

        {status === 'success' && topic && (
          <>
            <p className="m-0 max-w-[68ch] text-[17px] leading-[1.7] text-text">{topic.summary}</p>

            {topic.sources.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-controls={`konu-kaynak-${topicKey}`}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] font-semibold text-accent hover:underline underline-offset-4"
                >
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
                  {open ? 'Kaynakları gizle' : `Özetin dayandığı ${topic.sources.length} videoyu göster`}
                </button>
                {open && (
                  <div id={`konu-kaynak-${topicKey}`} className="mt-1 max-w-[68ch]">
                    <SourceList sources={topic.sources} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
