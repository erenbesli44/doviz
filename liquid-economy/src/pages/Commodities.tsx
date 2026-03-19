import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import type { Asset } from '../data/types';

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
  const { commodityAssets, status } = useMarketData();
  const [activeFilter, setActiveFilter] = useState<CatFilter>('Tümü');
  const [selectedId, setSelectedId] = useState<string>('BRENT');
  const [historyHours, setHistoryHours] = useState(24);

  const filtered = filterByCategory(commodityAssets, activeFilter);
  const focusAsset = commodityAssets.find((a) => a.id === selectedId) ?? commodityAssets[0];
  const focusHistory = useHistory(focusAsset?.code ?? 'BRENT', historyHours);

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
      <header className="mb-8 mt-4">
        <h2 className="text-[2.75rem] font-extrabold tracking-tight leading-none">Emtialar</h2>
        <p className="text-[var(--color-on-surface-variant)] font-medium mt-2">Enerji, Metaller &amp; Tarım</p>
      </header>

      {/* Focus chart */}
      <section className="mb-8">
        <FocusChart
          assetName={focusAsset.name}
          assetCode={focusAsset.code}
          price={focusAsset.price}
          change={focusAsset.change}
          history={focusHistory}
          icon={focusAsset.icon}
          iconBg={focusAsset.iconBg}
          onRangeChange={setHistoryHours}
          compact
        />
      </section>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        {categoryFilters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
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
      <section className="md:hidden">
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
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
    </>
  );
}
