/**
 * ViewDetails — "Görüşün tamamı" under a one-line view.
 *
 * The card shows one sentence for a fast scan; this expand gives the reader
 * everything we have on that person's view of that instrument: the topic
 * summary, key levels, horizon, the video moment and the full video summary.
 * Native <details> keeps it keyboard- and screen-reader-friendly with no state.
 */

import { Link } from 'react-router-dom';
import { cleanSummary, formatClock, videoMomentUrl } from '../../lib/views';

export interface ViewDetailsProps {
  summary: string;
  keyLevels?: string[] | null;
  horizon?: string | null;
  videoUrl?: string | null;
  startSec?: number | null;
  storyHref?: string | null;
  compact?: boolean;
  /** the row above already links to the video moment */
  hideVideoLink?: boolean;
}

const MAX_LEVELS = 6;

export function ViewDetails({ summary, keyLevels, horizon, videoUrl, startSec, storyHref, compact, hideVideoLink }: ViewDetailsProps) {
  const text = cleanSummary(summary);
  const levels = (keyLevels ?? []).filter(Boolean).slice(0, MAX_LEVELS);
  const clock = formatClock(startSec ?? null);
  if (!text && levels.length === 0 && !horizon && !storyHref) return null;

  return (
    <details className="group/details mt-1.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-accent select-none hover:underline underline-offset-4 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block transition-transform group-open/details:rotate-90">›</span>
        Görüşün tamamı
      </summary>

      <div className={`mt-2 border-l-2 border-border pl-3 ${compact ? 'text-[13px] leading-5' : 'text-[14px] leading-6'} text-text`}>
        {text && <p className="m-0">{text}</p>}

        {(levels.length > 0 || horizon) && (
          <dl className="mt-2 mb-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
            {horizon && (
              <>
                <dt className="text-text-muted">Vade</dt>
                <dd className="m-0">{horizon}</dd>
              </>
            )}
            {levels.length > 0 && (
              <>
                <dt className="text-text-muted">Bahsi geçen rakamlar</dt>
                <dd className="m-0 flex flex-wrap gap-1.5">
                  {levels.map((l) => (
                    <span key={l} className="rounded-[var(--r-chip)] bg-surface-2 px-1.5 py-px text-[12px] tabular-nums">{l}</span>
                  ))}
                </dd>
              </>
            )}
          </dl>
        )}

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {videoUrl && !hideVideoLink && (
            <a href={videoMomentUrl(videoUrl, startSec ?? null)} target="_blank" rel="noopener noreferrer" className="link no-underline hover:underline">
              Videoda bu bölümü izle{clock ? ` (${clock})` : ''}
            </a>
          )}
          {storyHref && <Link to={storyHref} className="link no-underline hover:underline">Videonun tüm özeti</Link>}
        </div>
      </div>
    </details>
  );
}
