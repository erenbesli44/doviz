/**
 * Verdict pieces shared by the home tiles and the instrument page.
 *
 *   VerdictText  "7 yorumcudan ↑ 5'i yükseliş bekliyor" / "Görüşler bölünmüş"
 *   PersonBar    one segment per person (up, flat, down), so a small n stays honest
 *   TallyLine    "↑ 5 yükseliş · → 2 yatay" — non-zero directions only
 */

import {
  DIRECTION_ARROW, EXPECTATION_WORD, VIEW_WINDOW_DAYS, numeralSuffix, tally, verdictOf,
  type Direction, type PersonView,
} from '../../lib/views';

const TONE: Record<Direction, string> = { up: 'text-bull', down: 'text-bear', flat: 'text-neutral-sent' };

const SEGMENT: Record<Direction, string> = { up: 'bg-bull', down: 'bg-bear', flat: 'bg-neutral-sent' };
const ORDER: Direction[] = ['up', 'flat', 'down'];
const COUNT_WORD: Record<Direction, string> = { up: 'yükseliş', down: 'düşüş', flat: 'yatay' };

export function VerdictText({ views }: { views: PersonView[] }) {
  const v = verdictOf(views);
  if (!v) return null;
  if (v.kind === 'split') return <>Görüşler <span className="text-neutral-sent">bölünmüş</span></>;
  if (v.kind === 'few') return <>Son {VIEW_WINDOW_DAYS} günde yalnızca {v.total} yorumcu net görüş bildirdi</>;
  return (
    <>{v.total} yorumcudan <span className={TONE[v.direction]}>{DIRECTION_ARROW[v.direction]} {v.count}{numeralSuffix(v.count)} {EXPECTATION_WORD[v.direction]}</span> bekliyor</>
  );
}

export function PersonBar({ views }: { views: PersonView[] }) {
  const t = tally(views);
  if (views.length === 0) return null;
  const label = ORDER.filter((d) => t[d] > 0).map((d) => `${t[d]} ${COUNT_WORD[d]}`).join(', ');
  return (
    <div role="img" aria-label={label} className="flex h-2.5 gap-[3px]">
      {ORDER.flatMap((d) => Array.from({ length: t[d] }, (_, i) => (
        <span key={`${d}${i}`} className={`flex-1 rounded-[2px] ${SEGMENT[d]}`} />
      )))}
    </div>
  );
}

/** "↓ düşüş → ↑ yükseliş" — a change of view, arrow + word on both sides. */
export function ChangeText({ from, to }: { from: Direction; to: Direction }) {
  return (
    <span className="whitespace-nowrap">
      <span className={TONE[from]}>{DIRECTION_ARROW[from]} {COUNT_WORD[from]}</span>
      <span className="text-text-muted"> → </span>
      <span className={TONE[to]}>{DIRECTION_ARROW[to]} {COUNT_WORD[to]}</span>
    </span>
  );
}

export function TallyLine({ views }: { views: PersonView[] }) {
  const t = tally(views);
  return (
    <p className="mt-2 mb-0 flex flex-wrap gap-x-4 text-[14px] font-semibold" aria-hidden="true">
      {ORDER.filter((d) => t[d] > 0).map((d) => (
        <span key={d} className={TONE[d]}>{DIRECTION_ARROW[d]} {t[d]} {COUNT_WORD[d]}</span>
      ))}
    </p>
  );
}
