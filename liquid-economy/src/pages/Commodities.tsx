import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import type { Asset } from '../data/types';
import PageHeader from '../components/layout/PageHeader';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

const categoryFilters = ['Tümü', 'Enerji', 'Metaller', 'Tarım'] as const;
type CatFilter = typeof categoryFilters[number];

const energyCodes  = ['BRENT', 'WTI', 'NATGAS'];
const metalCodes   = ['XAG/USD', 'HG'];
const agriCodes    = ['ZW'];

function filterByCategory(assets: Asset[], f: CatFilter): Asset[] {
  if (f === 'Enerji')   return assets.filter((a) => energyCodes.includes(a.code));
  if (f === 'Metaller') return assets.filter((a) => metalCodes.includes(a.code));
  if (f === 'Tarım')    return assets.filter((a) => agriCodes.includes(a.code));
  return assets;
}

export default function Commodities() {
  const { commodityAssets, status, lastUpdated } = useMarketData();
  const [activeFilter, setActiveFilter] = useState<CatFilter>('Tümü');
  const [selectedId, setSelectedId] = useState<string>('BRENT');
  const [historyHours, setHistoryHours] = useState(24);

  const filtered = filterByCategory(commodityAssets, activeFilter);
  const focusAsset = commodityAssets.find((a) => a.id === selectedId) ?? commodityAssets[0];
  const { points: focusHistory, loading: historyLoading } = useHistory(focusAsset?.code ?? 'BRENT', historyHours);

  if (status === 'loading') {
    return (
      <div className="space-y-4 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--color-surface-container)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <SeoHead
        path="/emtialar"
        title="Canlı Emtia Fiyatları: Brent, WTI, Gümüş, Doğal Gaz | Döviz Veri"
        description="Brent petrol, WTI, gümüş ve diğer emtialar için canlı fiyat, değişim ve grafik takibi."
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Emtialar', path: '/emtialar' },
          ]),
          collectionPageSchema('Canlı Emtia Fiyatları', 'Brent, WTI, gümüş ve tarım emtialarında anlık fiyat takibi.', '/emtialar'),
        ]}
      />
      <PageHeader
        title="Emtialar"
        subtitle="Enerji, Metaller ve Tarım"
        lastUpdated={lastUpdated}
      />
      <p className="text-sm text-[var(--color-on-surface-variant)]/85 mb-4 max-w-4xl">
        Brent petrol, WTI, doğal gaz ve metal emtiaları canlı izleyin.
        Kripto varlıklar için
        <Link className="ml-1 underline text-[var(--color-primary)]" to="/kripto">Kripto</Link> sayfasına geçebilirsiniz.
      </p>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        {categoryFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === f
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Desktop: card grid */}
      <section className="hidden md:grid grid-cols-3 gap-4 mb-8">
        {filtered.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => setSelectedId(asset.id)}
          />
        ))}
      </section>

      {/* Mobile: list */}
      <section className="md:hidden mb-8">
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20">
          {filtered.map((asset) => (
            <AssetListRow
              key={asset.id}
              asset={asset}
              active={asset.id === selectedId}
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </div>
      </section>

      {/* Focus chart */}
      <section className="mb-8">
        <div className="md:hidden">
          <FocusChart
            assetName={focusAsset.name}
            assetCode={focusAsset.code}
            price={focusAsset.price}
            change={focusAsset.change}
            history={focusHistory}
            historyLoading={historyLoading}
            icon={focusAsset.icon}
            iconBg={focusAsset.iconBg}
            onRangeChange={setHistoryHours}
            compact
          />
        </div>
        <div className="hidden md:block">
          <FocusChart
            assetName={focusAsset.name}
            assetCode={focusAsset.code}
            price={focusAsset.price}
            change={focusAsset.change}
            history={focusHistory}
            historyLoading={historyLoading}
            icon={focusAsset.icon}
            iconBg={focusAsset.iconBg}
            onRangeChange={setHistoryHours}
          />
        </div>
      </section>
    </>
  );
}
