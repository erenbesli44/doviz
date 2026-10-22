/**
 * ViewRow — one person's view on one instrument.
 *
 *   [avatar] Name                      ↓ Düşüş · 9 Eki
 *            "short excerpt of what they said"      Videoda izle 8:46
 *            Önceki görüş: ↑ Yükseliş · 22 Eyl  · Değişti
 */

import { Link } from 'react-router-dom';
import { ProAvatar } from '../consensus/ProAvatar';
import { SentimentChip } from '../consensus/SentimentChip';
import { formatClock, formatDate, videoMomentUrl } from '../../lib/views';
import type { Sentiment } from '../../data/consensus-types';

export interface ViewRowProps {
  person: string;
  avatarUrl?: string | null;
  personHref?: string;
  sentiment: Sentiment;
  date: string;
  quote?: string;
  videoUrl?: string;
  startSec?: number | null;
  storyHref?: string;
  previous?: { sentiment: Sentiment; date: string } | null;
  changed?: boolean;
  compact?: boolean;
}

export function ChangeTag({ changed }: { changed: boolean }) {
  return (
    <span className={`text-[12px] font-semibold ${changed ? 'text-warn' : 'text-text-subtle'}`}>
      {changed ? 'Görüşünü değiştirdi' : 'Aynı görüşte'}
    </span>
  );
}

export function ViewRow(p: ViewRowProps) {
  const name = p.personHref
    ? <Link to={p.personHref} className="headline-link font-semibold text-text">{p.person}</Link>
    : <span className="font-semibold text-text">{p.person}</span>;

  if (p.compact) {
    return (
      <li className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
        <ProAvatar channelAvatarUrl={p.avatarUrl ?? undefined} name={p.person} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[14px]">{name}</span>
        <SentimentChip sentiment={p.sentiment} />
        <span className="w-14 text-right text-[12px] text-text-muted">{formatDate(p.date)}</span>
      </li>
    );
  }

  const clock = formatClock(p.startSec ?? null);
  return (
    <li className="flex gap-3 border-b border-border py-4 last:border-b-0">
      <ProAvatar channelAvatarUrl={p.avatarUrl ?? undefined} name={p.person} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
          {name}
          <SentimentChip sentiment={p.sentiment} />
          <span className="text-[13px] text-text-muted">{formatDate(p.date)}</span>
        </div>
        {p.quote && (
          <p className="mt-1.5 mb-0 font-serif text-[16px] leading-6 text-text">“{p.quote}”</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {p.videoUrl && (
            <a href={videoMomentUrl(p.videoUrl, p.startSec ?? null)} target="_blank" rel="noopener noreferrer" className="link no-underline hover:underline">
              Videoda izle{clock ? ` ${clock}` : ''}
            </a>
          )}
          {p.storyHref && <Link to={p.storyHref} className="link no-underline hover:underline">Özeti oku</Link>}
          {p.previous !== undefined && (
            <span className="inline-flex flex-wrap items-center gap-2 text-text-muted">
              Önceki görüş:
              {p.previous ? (
                <>
                  <SentimentChip sentiment={p.previous.sentiment} />
                  <span>{formatDate(p.previous.date)}</span>
                  <ChangeTag changed={!!p.changed} />
                </>
              ) : (
                <span className="text-text-subtle">ilk görüşü</span>
              )}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
