import Icon from '../ui/Icon';
import { DIR_CONFIG } from '../../lib/directionConfig';
import type { Direction } from '../../data/inference-types';

interface Props {
  direction: Direction;
  /** 'pill' adds a tinted background; 'plain' is icon + word only. */
  variant?: 'pill' | 'plain';
}

export default function DirectionTag({ direction, variant = 'plain' }: Props) {
  const dir = DIR_CONFIG[direction];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold ${dir.text} ${
        variant === 'pill' ? `${dir.bg} rounded-[var(--r-chip)] px-2 py-0.5` : ''
      }`}
    >
      <Icon name={dir.icon} size={14} strokeWidth={2.4} />
      {dir.label}
    </span>
  );
}
