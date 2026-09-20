/**
 * DirectionBadge
 *
 * Pill combining icon + Turkish label for a consensus direction.
 * Sentiment is communicated via icon AND label AND color — never color alone.
 *
 * Props
 *   direction – 'up' | 'down' | 'sideways' | 'mixed'
 *   label     – override the default Turkish label if needed
 */

export interface DirectionBadgeProps {
  direction: 'up' | 'down' | 'sideways' | 'mixed';
  label?: string;
}

const MAP: Record<
  DirectionBadgeProps['direction'],
  { defaultLabel: string; icon: string; bg: string; fg: string }
> = {
  up: {
    defaultLabel: 'Yukarı',
    icon: '↑',
    bg: 'var(--bull-bg)',
    fg: 'var(--bull)',
  },
  down: {
    defaultLabel: 'Aşağı',
    icon: '↓',
    bg: 'var(--bear-bg)',
    fg: 'var(--bear)',
  },
  sideways: {
    defaultLabel: 'Yatay',
    icon: '→',
    bg: 'var(--neutral-bg)',
    fg: 'var(--neutral)',
  },
  mixed: {
    defaultLabel: 'Karışık',
    icon: '↕',
    bg: 'var(--neutral-bg)',
    fg: 'var(--text-muted)',
  },
};

export function DirectionBadge({ direction, label }: DirectionBadgeProps) {
  const { defaultLabel, icon, bg, fg } = MAP[direction];
  const text = label ?? defaultLabel;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: 'var(--r-chip, 4px)',
        backgroundColor: bg,
        color: fg,
        fontSize: 'var(--font-small-size, 14px)',
        lineHeight: 'var(--font-small-lh, 20px)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      aria-label={`Yön: ${text}`}
    >
      <span aria-hidden="true">{icon}</span>
      {text}
    </span>
  );
}
