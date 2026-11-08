/**
 * ViewRow — one person's view on one instrument.
 *
 *   [avatar] Name            ↑ Yükseliş bekliyor · 9 Eki · yıl sonuna kadar
 *            "what they said, clamped to two lines when details can expand it"
 *            Önceki görüş: ↓ Düşüş · 22 Eyl · Görüşünü değiştirdi   (in the expand when unchanged)
 *            [▶ Videoda izle 8:46]  › Devamı  (opening it un-clamps the quote above)
 */

import { Link } from 'react-router-dom';
import { ProAvatar } from '../consensus/ProAvatar';
import Icon from '../ui/Icon';
import { DirectionChip } from './DirectionChip';
import { ViewDetails, type ViewDetailsProps } from './ViewDetails';
import { hasDetailsContent } from './detailsContent';
import { ageLabel, formatClock, formatDate, videoMomentUrl, type Direction } from '../../lib/views';

export interface ViewRowProps {
  person: string;
  avatarUrl?: string | null;
  personHref?: string;
  direction: Direction;
  date: string;
  horizon?: string | null;
  quote?: string;
  videoUrl?: string;
  startSec?: number | null;
  storyHref?: string;
  previous?: { direction: Direction; date: string } | null;
  changed?: boolean;
  compact?: boolean;
  details?: ViewDetailsProps;
  /** Outside the counting window: grey past-tense chips, age, muted quote. */
  past?: boolean;
}

export function ChangeTag({ changed, past = false }: { changed: boolean; past?: boolean }) {
  return (
    <span className={`text-[12px] font-semibold ${changed && !past ? 'text-warn' : 'text-text-subtle'}`}>
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
        <DirectionChip direction={p.direction} short past={p.past} />
        <span className="w-14 text-right text-[12px] text-text-muted">{formatDate(p.date)}</span>
      </li>
    );
  }

  const clock = formatClock(p.startSec ?? null);
  const age = p.past ? ageLabel(p.date) : '';
  const previousLine = p.previous !== undefined && (
    <span className="inline-flex flex-wrap items-center gap-2 text-text-muted">
      Önceki görüş:
      {p.previous ? (
        <>
          <DirectionChip direction={p.previous.direction} short past={p.past} />
          <span>{formatDate(p.previous.date)}</span>
          <ChangeTag changed={!!p.changed} past={p.past} />
        </>
      ) : (
        <span className="text-text-subtle">ilk görüşü</span>
      )}
    </span>
  );
  // A change of view stays in the row; unchanged and first views move into the expand.
  const canOpen = !!p.details && hasDetailsContent(p.details);
  const showPrevious = !!p.changed || !canOpen;
  return (
    <li className="group/row flex gap-3 border-b border-border py-3 last:border-b-0">
      <ProAvatar channelAvatarUrl={p.avatarUrl ?? undefined} name={p.person} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
          {name}
          <DirectionChip direction={p.direction} past={p.past} size="md" />
          <span className="text-[13px] text-text-muted">
            {formatDate(p.date)}{age && ` · ${age}`}
          </span>
          {p.horizon && <span className="text-[13px] text-text-muted">· {p.horizon}</span>}
        </div>
        {/* Clamped only when the expand exists; opening it shows the full quote here. */}
        {p.quote && (
          <p className={`mt-1 mb-0 font-serif text-[16px] leading-6 ${canOpen ? 'line-clamp-2 group-has-[details[open]]/row:line-clamp-none' : ''} ${p.past ? 'text-text-muted' : 'text-text'}`}>“{p.quote}”</p>
        )}
        {showPrevious && previousLine && <div className="mt-1 text-[13px]">{previousLine}</div>}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {p.videoUrl && (
            <a href={videoMomentUrl(p.videoUrl, p.startSec ?? null)} data-person={p.person} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--r-chip)] border border-border px-3 font-semibold text-accent no-underline hover:bg-surface-2 md:min-h-8">
              <Icon name="play" size={14} />
              Videoda izle{clock ? ` ${clock}` : ''}
            </a>
          )}
          {p.storyHref && !p.details && <Link to={p.storyHref} className="link no-underline hover:underline">Özeti oku</Link>}
          {/* Beside the video button; once opened it takes the full row width below. */}
          {p.details && canOpen && (
            <ViewDetails {...p.details} hideVideoLink={!!p.videoUrl} touch label="Devamı" className="open:basis-full">
              {!showPrevious && previousLine}
            </ViewDetails>
          )}
        </div>
      </div>
    </li>
  );
}
