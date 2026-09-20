/**
 * ConsensusLabel
 *
 * 5-band consensus pill (strong_bullish … strong_bearish) for the
 * `/v1/consensus` direction field. Sibling to DirectionBadge — that one
 * uses the legacy 4-band {up/down/sideways/mixed} on `/inference/latest`.
 *
 * Tone is conveyed with icon + Turkish text + color (never color alone).
 */

import type { ConsensusDirection, FreshSignalDirection } from '../../data/consensus-types';
import { CONSENSUS_LABEL_TR, FRESH_SIGNAL_LABEL_TR } from '../../lib/consensusLabels';

interface BandStyle {
  icon: string;
  bg: string;
  fg: string;
}

const CONSENSUS_STYLES: Record<ConsensusDirection, BandStyle> = {
  strong_bullish: { icon: '⇈', bg: 'var(--bull-bg)', fg: 'var(--bull)' },
  mild_bullish: { icon: '↑', bg: 'var(--bull-bg)', fg: 'var(--bull)' },
  neutral: { icon: '→', bg: 'var(--neutral-bg)', fg: 'var(--neutral)' },
  mild_bearish: { icon: '↓', bg: 'var(--bear-bg)', fg: 'var(--bear)' },
  strong_bearish: { icon: '⇊', bg: 'var(--bear-bg)', fg: 'var(--bear)' },
  uncertain: { icon: '?', bg: 'var(--neutral-bg)', fg: 'var(--text-muted)' },
};

const FRESH_STYLES: Record<FreshSignalDirection, BandStyle> = {
  bullish_shift: { icon: '↗', bg: 'var(--bull-bg)', fg: 'var(--bull)' },
  bearish_shift: { icon: '↘', bg: 'var(--bear-bg)', fg: 'var(--bear)' },
  stable: { icon: '·', bg: 'var(--neutral-bg)', fg: 'var(--neutral)' },
  mixed: { icon: '↕', bg: 'var(--neutral-bg)', fg: 'var(--text-muted)' },
  high_volatility: { icon: '⚡', bg: 'var(--bear-bg)', fg: 'var(--bear)' },
  no_fresh_data: { icon: '·', bg: 'var(--neutral-bg)', fg: 'var(--text-subtle)' },
};

const BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: 'var(--r-chip, 4px)',
  fontSize: 'var(--font-small-size, 14px)',
  lineHeight: 'var(--font-small-lh, 20px)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  userSelect: 'none',
};


export function ConsensusLabel({ direction }: { direction: ConsensusDirection }) {
  const s = CONSENSUS_STYLES[direction];
  const text = CONSENSUS_LABEL_TR[direction];
  return (
    <span style={{ ...BASE, background: s.bg, color: s.fg }} aria-label={`Konsensüs: ${text}`}>
      <span aria-hidden="true">{s.icon}</span>
      {text}
    </span>
  );
}


export function FreshSignalLabel({ direction }: { direction: FreshSignalDirection }) {
  const s = FRESH_STYLES[direction];
  const text = FRESH_SIGNAL_LABEL_TR[direction];
  return (
    <span style={{ ...BASE, background: s.bg, color: s.fg }} aria-label={`24s sinyal: ${text}`}>
      <span aria-hidden="true">{s.icon}</span>
      {text}
    </span>
  );
}
