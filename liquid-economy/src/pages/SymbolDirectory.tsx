/**
 * SymbolDirectory — /piyasa
 *
 * Filterable directory of all tracked assets.
 * Each row: name + live price + ConsensusBar + opinion count.
 * Filter chips: Tümü / Döviz / Altın / Endeks / Emtia / Kripto
 * URL: /piyasa?kategori=kripto
 */

import { Link, useSearchParams } from 'react-router-dom';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { useMarketData } from '../hooks/useMarketData';
import { SYMBOL_TO_TOPIC_KEY, CATEGORY_LABELS } from '../data/assetMap';
import { ConsensusBar } from '../components/consensus/ConsensusBar';
import { DirectionBadge } from '../components/consensus/DirectionBadge';
import { formatPrice } from '../lib/adapters';
import type { InferenceTopic } from '../data/inference-types';
import type { Asset } from '../data/types';

const CATEGORIES = ['all', 'fx', 'gold', 'index', 'commodity', 'crypto'] as const;

function pctColor(v: number) {
  if (v > 0) return 'var(--bull)';
  if (v < 0) return 'var(--bear)';
  return 'var(--text-muted)';
}

interface AssetRowProps {
  asset: Asset;
  topic?: InferenceTopic;
}

function AssetRow({ asset, topic }: AssetRowProps) {
  const topicKey = SYMBOL_TO_TOPIC_KEY[asset.id];
  const bull    = topic ? Math.round(topic.confidence * 100) : 0;
  const bear    = topic ? (topic.direction === 'down' ? Math.round((1 - topic.confidence) * 80) : Math.round((1 - topic.confidence) * 20)) : 0;
  const neutral = 100 - bull - bear;

  return (
    <Link
      to={topicKey ? `/piyasa/${topicKey}` : `/piyasa/${asset.id.replace('/', '-')}`}
      className="focus-ring"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', textDecoration: 'none',
        borderBottom: '1px solid var(--border)',
        transition: 'background var(--t-hover)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* Name */}
      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {asset.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{asset.id}</div>
      </div>

      {/* Live price */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {formatPrice(asset.price, asset.id, asset.id.includes('TRY') || asset.id === 'XU100' ? 'TRY' : 'USD')}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: pctColor(asset.change) }}>
          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
        </div>
      </div>

      {/* Consensus bar */}
      {topic ? (
        <div style={{ flex: '0 0 100px' }}>
          <ConsensusBar bullish={bull} neutral={neutral} bearish={bear} size="sm" />
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <DirectionBadge direction={topic.direction} />
          </div>
        </div>
      ) : (
        <div style={{ flex: '0 0 100px', fontSize: 12, color: 'var(--text-subtle)' }}>
          Görüş yok
        </div>
      )}

      {/* Source count */}
      <div style={{ flexShrink: 0, fontSize: 12, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
        {topic ? `${topic.sources.length} görüş` : ''}
      </div>

      {/* Arrow */}
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true">›</span>
    </Link>
  );
}

export default function SymbolDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = (searchParams.get('kategori') ?? 'all') as typeof CATEGORIES[number];

  const { topics } = useConsensusDashboard();
  const { fxAssets, goldAssets, indexAssets, commodityAssets, cryptoAssets } = useMarketData();

  const topicMap: Record<string, InferenceTopic> = {};
  for (const t of topics) topicMap[t.topic_key] = t;

  const allAssets: Asset[] = [...fxAssets, ...goldAssets, ...indexAssets, ...commodityAssets, ...cryptoAssets];

  const filtered = activeCategory === 'all'
    ? allAssets
    : allAssets.filter((a) => a.category === activeCategory || (activeCategory === 'index' && a.category === 'index'));

  return (
    <div className="page-full-bleed" style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--font-h1-size)', fontWeight: 600, color: 'var(--text)' }}>Piyasalar</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Canlı fiyatlar ve uzman görüşleri</p>
      </div>

      {/* Category filter chips */}
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSearchParams(cat === 'all' ? {} : { kategori: cat })}
            className="focus-ring"
            style={{
              padding: '6px 14px', borderRadius: 'var(--r-chip)',
              border: '1px solid',
              borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
              background: activeCategory === cat ? 'var(--accent)' : 'var(--surface)',
              color: activeCategory === cat ? '#fff' : 'var(--text)',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'all var(--t-hover)',
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 16px', borderBottom: '2px solid var(--border)' }}>
        <div style={{ flex: '1 1 140px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Varlık</div>
        <div style={{ flexShrink: 0, minWidth: 90, textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Fiyat</div>
        <div style={{ flex: '0 0 100px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Görüş</div>
        <div style={{ flexShrink: 0, minWidth: 60, textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Kaynak</div>
        <div style={{ width: 12 }} />
      </div>

      {/* Rows */}
      <div style={{ background: 'var(--surface)' }}>
        {filtered.map((asset) => {
          const topicKey = SYMBOL_TO_TOPIC_KEY[asset.id];
          const topic = topicKey ? topicMap[topicKey] : undefined;
          return <AssetRow key={asset.id} asset={asset} topic={topic} />;
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Bu kategoride varlık bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
