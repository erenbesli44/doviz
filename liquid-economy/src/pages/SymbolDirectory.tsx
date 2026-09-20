/**
 * SymbolDirectory — /piyasa
 *
 * Live prices as supporting context, with the expert view per instrument where
 * one exists. Rows with coverage link to the topic page; rows without stay plain
 * (no dead ends). URL: /piyasa?kategori=kripto
 */

import { Link, useSearchParams } from 'react-router-dom';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { useMarketData } from '../hooks/useMarketData';
import { SYMBOL_TO_TOPIC_KEY, CATEGORY_LABELS } from '../data/assetMap';
import DirectionTag from '../components/topics/DirectionTag';
import LiveDataBadge from '../components/layout/LiveDataBadge';
import PageHeader from '../components/layout/PageHeader';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import { formatPrice } from '../lib/adapters';
import type { InferenceTopic } from '../data/inference-types';
import type { Asset } from '../data/types';

const CATEGORIES = ['all', 'fx', 'gold', 'index', 'commodity', 'crypto'] as const;
const ROW = 'grid grid-cols-[1fr_auto] items-center gap-x-4 px-1 py-3.5 sm:grid-cols-[1fr_120px_150px_20px]';

function Change({ value }: { value: number }) {
  const tone = value > 0 ? 'text-bull' : value < 0 ? 'text-bear' : 'text-text-muted';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return <span className={`text-[13px] font-semibold tabular-nums ${tone}`}>{sign}%{Math.abs(value).toFixed(2)}</span>;
}

function AssetRow({ asset, topic }: { asset: Asset; topic?: InferenceTopic }) {
  const currency = asset.id.includes('TRY') || asset.id === 'XU100' ? 'TRY' : 'USD';
  const cells = (
    <>
      <div className="min-w-0">
        <div className={`truncate text-[15px] font-semibold text-text ${topic ? 'headline-link' : ''}`}>{asset.name}</div>
        <div className="text-[12px] text-text-subtle">{asset.id}</div>
      </div>
      <div className="text-right">
        <div className="text-[15px] font-semibold tabular-nums text-text">{formatPrice(asset.price, asset.id, currency)}</div>
        <Change value={asset.change} />
      </div>
      <div className="col-span-2 mt-1.5 text-[13px] sm:col-span-1 sm:mt-0">
        {topic
          ? <span className="inline-flex items-center gap-2"><DirectionTag direction={topic.direction} /><span className="text-text-subtle">{topic.sources.length} kaynak</span></span>
          : <span className="text-text-subtle">Uzman görüşü yok</span>}
      </div>
      <span className="hidden justify-self-end text-text-subtle sm:block">{topic && <Icon name="arrow-right" size={15} />}</span>
    </>
  );

  return (
    <li className="border-b border-border">
      {topic
        ? <Link to={`/piyasa/${topic.topic_key}`} className={`group ${ROW} no-underline transition-colors hover:bg-surface-2`}>{cells}</Link>
        : <div className={ROW}>{cells}</div>}
    </li>
  );
}

export default function SymbolDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = (searchParams.get('kategori') ?? 'all') as typeof CATEGORIES[number];

  const { topics } = useConsensusDashboard();
  const { status, fxAssets, goldAssets, indexAssets, commodityAssets, cryptoAssets } = useMarketData();

  const topicByKey = new Map(topics.map((t) => [t.topic_key, t]));
  const allAssets: Asset[] = [...fxAssets, ...goldAssets, ...indexAssets, ...commodityAssets, ...cryptoAssets];
  const filtered = activeCategory === 'all' ? allAssets : allAssets.filter((a) => a.category === activeCategory);

  return (
    <section className="mx-auto max-w-[920px]">
      <SeoHead
        path="/piyasa"
        title="Piyasa: Canlı Fiyatlar ve Uzman Görüşleri | Döviz Veri"
        description="Döviz, altın, endeks, emtia ve kripto için canlı fiyatlar; varsa ilgili konudaki uzman görüşüyle birlikte."
      />

      <PageHeader
        title="Piyasa"
        description="Canlı fiyatlar ve, takip ettiğimiz uzmanların o konudaki ortak görüşü."
        aside={<LiveDataBadge />}
      />

      <div role="group" aria-label="Kategori" className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSearchParams(cat === 'all' ? {} : { kategori: cat })}
              aria-pressed={active}
              className={`h-9 shrink-0 cursor-pointer rounded-[var(--r-chip)] border px-3.5 text-[14px] font-semibold transition-colors ${
                active ? 'border-text bg-text text-bg' : 'border-border bg-transparent text-text hover:border-text'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div className={`${ROW} kicker border-t-2 border-rule !py-2.5`} aria-hidden="true">
        <span>Varlık</span>
        <span className="text-right">Fiyat</span>
        <span className="hidden sm:block">Uzman görüşü</span>
        <span className="hidden sm:block" />
      </div>

      <ul className="m-0 list-none border-t border-border p-0">
        {status === 'loading' && allAssets.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="border-b border-border py-4" aria-hidden="true"><div className="skeleton h-9" /></li>
            ))
          : filtered.map((asset) => (
              <AssetRow key={asset.id} asset={asset} topic={topicByKey.get(SYMBOL_TO_TOPIC_KEY[asset.id] ?? '')} />
            ))}
      </ul>

      {status !== 'loading' && filtered.length === 0 && (
        <p className="py-8 text-[15px] text-text-muted">Bu kategoride varlık bulunamadı.</p>
      )}
    </section>
  );
}
