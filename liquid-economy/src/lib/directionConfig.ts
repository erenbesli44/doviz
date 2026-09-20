import type { Direction } from '../data/inference-types';
import type { IconName } from '../components/ui/Icon';

/** Direction is always shown as icon + word + color — never color alone. */
export const DIR_CONFIG: Record<Direction, { icon: IconName; label: string; text: string; bg: string; bar: string }> = {
  up:       { icon: 'trending-up',   label: 'Yükseliş', text: 'text-bull',         bg: 'bg-bull-bg',    bar: 'bg-bull' },
  down:     { icon: 'trending-down', label: 'Düşüş',    text: 'text-bear',         bg: 'bg-bear-bg',    bar: 'bg-bear' },
  sideways: { icon: 'flat',          label: 'Yatay',    text: 'text-neutral-sent', bg: 'bg-neutral-bg', bar: 'bg-neutral-sent' },
  mixed:    { icon: 'mixed',         label: 'Karışık',  text: 'text-warn',         bg: 'bg-warn-bg',    bar: 'bg-warn' },
};

export function confidenceBand(confidence: number): 'düşük' | 'orta' | 'yüksek' {
  if (confidence >= 0.75) return 'yüksek';
  if (confidence >= 0.5) return 'orta';
  return 'düşük';
}
