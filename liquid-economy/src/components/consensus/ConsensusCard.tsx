/**
 * ConsensusCard
 *
 * Home-page tile for one asset, driven by AssetConsensusSummary from
 * /v1/consensus. Shows consensus direction, fresh 24h signal, summary,
 * and optional live price.
 */

import { Link } from 'react-router-dom';
import type { AssetConsensusSummary } from '../../data/consensus-types';
import type { QuoteResponse } from '../../data/api-types';
import { ConsensusLabel, FreshSignalLabel } from './ConsensusLabel';
import { ConfidenceDots } from './ConfidenceDots';

interface Props {
  summary: AssetConsensusSummary;
  quote?: QuoteResponse;
  variant?: 'standard' | 'hero' | 'compact';
}

function formatPrice(value: number | null | undefined, currency: string | null | undefined) {
  if (value == null) return '—';
  const fractionDigits = value >= 100 ? 0 : value >= 1 ? 2 : 4;
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value) + (currency ? ` ${currency}` : '');
}

function pctColor(v: number) {
  if (v > 0) return 'var(--bull)';
  if (v < 0) return 'var(--bear)';
  return 'var(--text-muted)';
}

export function ConsensusCard({ summary, quote, variant = 'standard' }: Props) {
  if (variant === 'compact') {
    return (
      <Link
        to={`/piyasa/${summary.asset}`}
        className="focus-ring"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '8px 12px', margin: '2px 12px',
          borderRadius: 6, textDecoration: 'none',
          background: 'transparent', color: 'var(--text)',
          transition: 'background var(--t-hover)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summary.display_name}
        </span>
        <ConsensusLabel direction={summary.consensus_direction} />
      </Link>
    );
  }

  const isHero = variant === 'hero';
  const padding = isHero ? 20 : 16;

  return (
    <Link
      to={`/piyasa/${summary.asset}`}
      className="focus-ring"
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding, border: '1px solid var(--border)',
        borderRadius: isHero ? 'var(--r-hero)' : 'var(--r-card)',
        background: 'var(--surface)', textDecoration: 'none',
        color: 'var(--text)',
        transition: 'border-color var(--t-hover), box-shadow var(--t-hover)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(31,58,138,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header — name + price (if available) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: isHero ? 22 : 16, fontWeight: 700, lineHeight: 1.2 }}>
            {summary.display_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {summary.asset_code} · {summary.group}
          </div>
        </div>
        {quote && (
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div style={{ fontSize: isHero ? 18 : 14, fontWeight: 700 }}>
              {formatPrice(quote.data.price, quote.data.currency)}
            </div>
            <div style={{ fontSize: 12, color: pctColor(quote.data.change_pct), fontWeight: 600 }}>
              {quote.data.change_pct >= 0 ? '+' : ''}{quote.data.change_pct.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* Consensus row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <ConsensusLabel direction={summary.consensus_direction} />
        <ConfidenceDots confidence={summary.confidence} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          %{Math.round(summary.confidence * 100)} · {summary.opinion_count} görüş
        </span>
      </div>

      {/* Fresh signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
          24s
        </span>
        <FreshSignalLabel direction={summary.fresh_signal} />
      </div>

      {/* Short summary */}
      <p
        style={{
          margin: 0,
          fontSize: 13, color: 'var(--text-muted)', lineHeight: '20px',
          display: '-webkit-box', WebkitLineClamp: isHero ? 3 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } as React.CSSProperties}
      >
        {summary.short_summary}
      </p>
    </Link>
  );
}
