/**
 * SentimentChip
 *
 * Small colored chip for a single opinion's sentiment.
 * Used inside OpinionCard to label an individual pro's stance.
 */

export interface SentimentChipProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

const MAP: Record<
  SentimentChipProps['sentiment'],
  { label: string; bg: string; fg: string; icon: string }
> = {
  bullish: { label: 'Yükseliş', icon: '↑', bg: 'var(--bull-bg)',     fg: 'var(--bull)'    },
  bearish: { label: 'Düşüş',    icon: '↓', bg: 'var(--bear-bg)',     fg: 'var(--bear)'    },
  neutral: { label: 'Nötr',     icon: '→', bg: 'var(--neutral-bg)',  fg: 'var(--neutral)' },
};

export function SentimentChip({ sentiment }: SentimentChipProps) {
  const { label, icon, bg, fg } = MAP[sentiment];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '1px 6px',
        borderRadius: 'var(--r-chip, 4px)',
        backgroundColor: bg,
        color: fg,
        fontSize: 'var(--font-micro-size, 12px)',
        lineHeight: 'var(--font-micro-lh, 16px)',
        fontWeight: 'var(--font-micro-weight, 500)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
