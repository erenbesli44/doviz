/**
 * DirectionChip — what the speaker expects the price to do next.
 * Always icon + word, never color alone.
 */

import type { Direction } from '../../lib/views';

const MAP: Record<Direction, { icon: string; label: string; past: string; short: string; cls: string }> = {
  up:   { icon: '↑', label: 'Yükseliş bekliyor', past: 'Yükseliş bekliyordu', short: 'Yükseliş', cls: 'bg-bull-bg text-bull' },
  down: { icon: '↓', label: 'Düşüş bekliyor',    past: 'Düşüş bekliyordu',    short: 'Düşüş',    cls: 'bg-bear-bg text-bear' },
  flat: { icon: '→', label: 'Yatay bekliyor',    past: 'Yatay bekliyordu',    short: 'Yatay',    cls: 'bg-neutral-bg text-neutral-sent' },
};

/** `past`: a view outside the counting window — past tense and grey, so it never reads as current. */
export function DirectionChip({ direction, short = false, past = false }: { direction: Direction; short?: boolean; past?: boolean }) {
  const m = MAP[direction];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--r-chip)] px-1.5 py-px text-[12px] font-medium leading-4 ${past ? 'bg-surface-2 text-text-muted' : m.cls}`}>
      <span aria-hidden="true">{m.icon}</span>
      {short ? m.short : past ? m.past : m.label}
    </span>
  );
}
