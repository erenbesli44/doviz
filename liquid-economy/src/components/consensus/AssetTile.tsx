/**
 * AssetTile
 *
 * Reusable tile used in the Home grid and the asset directory list.
 *
 * Variants
 *   hero     – large card, full summary text, no price pill (used in hero slot)
 *   standard – normal grid tile
 *   compact  – single row (used in QuickConsensusList left rail)
 *
 * All consensus data comes from InferenceTopic.
 * Live price comes from an optional QuoteResponse (SSE-updated by the parent).
 */

import { useNavigate } from 'react-router-dom';
import type { InferenceTopic } from '../../data/inference-types';
import type { QuoteResponse } from '../../data/api-types';
import { ConsensusBar } from './ConsensusBar';
import { DirectionBadge } from './DirectionBadge';
import { ConfidenceDots } from './ConfidenceDots';
import { formatPrice } from '../../lib/adapters';

export interface AssetTileProps {
  topic: InferenceTopic;
  quote?: QuoteResponse;
  variant?: 'hero' | 'standard' | 'compact';
}

function pctColor(v: number) {
  if (v > 0) return 'var(--bull)';
  if (v < 0) return 'var(--bear)';
  return 'var(--text-muted)';
}

function formatPct(v: number) {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

// ── Compact variant (left rail quick list) ─────────────────────────────────
function CompactTile({ topic, onClick }: AssetTileProps & { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 12px',
        background: 'none',
        border: 'none',
        borderRadius: 'var(--r-card)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background var(--t-hover)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <DirectionBadge direction={topic.direction} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {topic.topic_label}
      </span>
      <ConfidenceDots confidence={topic.confidence} />
    </button>
  );
}

// ── Standard grid tile ─────────────────────────────────────────────────────
function StandardTile({ topic, quote, onClick }: AssetTileProps & { onClick: () => void }) {
  const bull = Math.round(topic.confidence * 100);
  const bear = topic.direction === 'down' ? Math.round((1 - topic.confidence) * 100) : 0;
  const neutral = 100 - bull - bear;

  return (
    <button
      onClick={onClick}
      className="focus-ring"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        padding: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)',
        cursor: 'pointer',
        textAlign: 'left',
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
      {/* Header: label + direction + change badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: '20px' }}>
            {topic.topic_label}
          </div>
          {quote && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 1 }}>
              {formatPrice(quote.data.price, quote.data.symbol, quote.data.currency)}
              <span style={{ marginLeft: 5, color: pctColor(quote.data.change_pct), fontWeight: 600 }}>
                {formatPct(quote.data.change_pct)}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <DirectionBadge direction={topic.direction} />
          <ConfidenceDots confidence={topic.confidence} />
        </div>
      </div>

      {/* Consensus bar */}
      <ConsensusBar bullish={bull} neutral={neutral} bearish={bear} size="sm" />

      {/* Footer: opinion count + changed badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {topic.sources.length} uzman görüşü
        </span>
        {topic.changed_from_prev && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: '#92400e', background: '#fef3c7',
            padding: '1px 6px', borderRadius: 4,
          }}>
            Değişti
          </span>
        )}
      </div>
    </button>
  );
}

// ── Hero tile ──────────────────────────────────────────────────────────────
function HeroTile({ topic, quote, onClick }: AssetTileProps & { onClick: () => void }) {
  const bull = Math.round(topic.confidence * 100);
  const bear = topic.direction === 'down' ? Math.round((1 - topic.confidence) * 100) : Math.round((1 - topic.confidence) * 30);
  const neutral = 100 - bull - bear;

  return (
    <button
      onClick={onClick}
      className="focus-ring"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-hero)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color var(--t-hover)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: '28px' }}>
            {topic.topic_label}
          </div>
          {quote && (
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 3 }}>
              {formatPrice(quote.data.price, quote.data.symbol, quote.data.currency)}
              <span style={{ marginLeft: 6, color: pctColor(quote.data.change_pct), fontWeight: 700 }}>
                {formatPct(quote.data.change_pct)}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <DirectionBadge direction={topic.direction} />
          <ConfidenceDots confidence={topic.confidence} />
        </div>
      </div>

      <ConsensusBar bullish={bull} neutral={neutral} bearish={bear} size="lg" />

      <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: '22px', margin: 0 }}>
        {topic.summary}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {topic.sources.length} uzman görüşü · Detaylar →
        </span>
        {topic.changed_from_prev && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: '#92400e', background: '#fef3c7',
            padding: '2px 8px', borderRadius: 4,
          }}>
            Görüş değişti
          </span>
        )}
      </div>
    </button>
  );
}

// ── Public component ───────────────────────────────────────────────────────
export function AssetTile({ topic, quote, variant = 'standard' }: AssetTileProps) {
  const navigate = useNavigate();
  const onClick = () => navigate(`/piyasa/${topic.topic_key}`);

  if (variant === 'compact') return <CompactTile topic={topic} quote={quote} onClick={onClick} />;
  if (variant === 'hero')    return <HeroTile    topic={topic} quote={quote} onClick={onClick} />;
  return                            <StandardTile topic={topic} quote={quote} onClick={onClick} />;
}
