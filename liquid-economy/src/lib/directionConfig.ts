import type { Direction } from '../data/inference-types';

export const DIR_CONFIG: Record<Direction, {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  barBg: string;
  topAccent: string;
}> = {
  up: {
    icon: 'trending_up',
    label: 'Yükseliş',
    iconBg: 'bg-bull-bg',
    iconColor: 'text-bull',
    textColor: 'text-bull',
    barBg: 'bg-bull',
    topAccent: 'bg-bull',
  },
  down: {
    icon: 'trending_down',
    label: 'Düşüş',
    iconBg: 'bg-bear-bg',
    iconColor: 'text-bear',
    textColor: 'text-bear',
    barBg: 'bg-bear',
    topAccent: 'bg-bear',
  },
  sideways: {
    icon: 'trending_flat',
    label: 'Yatay',
    iconBg: 'bg-neutral-bg',
    iconColor: 'text-neutral-sent',
    textColor: 'text-neutral-sent',
    barBg: 'bg-neutral-sent',
    topAccent: 'bg-neutral-sent',
  },
  mixed: {
    icon: 'swap_vert',
    label: 'Karma',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-600',
    barBg: 'bg-amber-500',
    topAccent: 'bg-amber-500',
  },
};
