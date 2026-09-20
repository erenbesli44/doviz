/**
 * ConsensusBar
 *
 * 3-segment horizontal bar encoding bullish / neutral / bearish split.
 * Segments animate on data change via CSS transition.
 *
 * Props
 *   bullish  – share 0–100 (percentage of opinion count)
 *   neutral  – share 0–100
 *   bearish  – share 0–100
 *   size     – 'sm' | 'md' | 'lg'  (default 'md')
 *
 * Accessibility: role="img" + aria-label with full text description.
 * Values are normalised internally so they always sum to 100.
 */

import type { CSSProperties } from 'react';

export interface ConsensusBarProps {
  bullish: number;
  neutral: number;
  bearish: number;
  size?: 'sm' | 'md' | 'lg';
}

const heights: Record<NonNullable<ConsensusBarProps['size']>, string> = {
  sm: '4px',
  md: '8px',
  lg: '12px',
};

export function ConsensusBar({
  bullish,
  neutral,
  bearish,
  size = 'md',
}: ConsensusBarProps) {
  const total = bullish + neutral + bearish || 1; // guard div-by-zero
  const b = Math.round((bullish / total) * 100);
  const n = Math.round((neutral / total) * 100);
  const r = 100 - b - n; // remainder avoids rounding drift

  const h = heights[size];

  const label =
    `Yükseliş %${b}, nötr %${n}, düşüş %${r}`;

  const segStyle = (pct: number, color: string): CSSProperties => ({
    width: `${pct}%`,
    height: h,
    backgroundColor: color,
    transition: `width var(--t-bar, 240ms ease-out)`,
    flexShrink: 0,
  });

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        width: '100%',
        borderRadius: 'var(--r-chip, 4px)',
        overflow: 'hidden',
        gap: '1px',
        backgroundColor: 'var(--border)',
      }}
    >
      {b > 0 && (
        <div style={segStyle(b, 'var(--bull)')} />
      )}
      {n > 0 && (
        <div style={segStyle(n, 'var(--neutral)')} />
      )}
      {r > 0 && (
        <div style={segStyle(r, 'var(--bear)')} />
      )}
    </div>
  );
}
