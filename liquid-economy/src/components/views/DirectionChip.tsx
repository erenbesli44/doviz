/**
 * DirectionChip — what the speaker expects the price to do next.
 * Always icon + word, never color alone.
 */

import type { Direction } from '../../lib/views';

const MAP: Record<Direction, { icon: string; label: string; short: string; cls: string }> = {
  up:   { icon: '↑', label: 'Yükseliş bekliyor', short: 'Yükseliş', cls: 'bg-bull-bg text-bull' },
  down: { icon: '↓', label: 'Düşüş bekliyor',    short: 'Düşüş',    cls: 'bg-bear-bg text-bear' },
  flat: { icon: '→', label: 'Yatay bekliyor',    short: 'Yatay',    cls: 'bg-neutral-bg text-neutral-sent' },
};

export function DirectionChip({ direction, short = false }: { direction: Direction; short?: boolean }) {
  const m = MAP[direction];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--r-chip)] px-1.5 py-px text-[12px] font-medium leading-4 ${m.cls}`}>
      <span aria-hidden="true">{m.icon}</span>
      {short ? m.short : m.label}
    </span>
  );
}
