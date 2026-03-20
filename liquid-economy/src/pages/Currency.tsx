import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import type { Asset } from '../data/types';

const filters = ['Tümü', 'Majors', 'TL Çaprazları'] as const;
type Filter = typeof filters[number];

function filterAssets(assets: Asset[], filter: Filter): Asset[] {
  if (filter === 'Majors') return assets.filter((a) => !a.code.includes('TRY'));
  if (filter === 'TL Çaprazları') return assets.filter((a) => a.code.includes('TRY'));
  return assets;
}

export default function Currency() {
  const { fxAssets, status } = useMarketData();
  const [activeFilter, setActiveFilter] = useState<Filter>('Tümü');
  const [selectedId, setSelectedId] = useState<string>('USD/TRY');
  const [historyHours, setHistoryHours] = useState(24);

  const filtered = filterAssets(fxAssets, activeFilter);
  const focusAsset = fxAssets.find((a) => a.id === selectedId) ?? fxAssets[0];
  const focusHistory = useHistory(focusAsset?.code ?? 'USD/TRY', historyHours);

  if (status === 'loading') {
    return (
      <div className="space-y-4 mt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--color-surface-container)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <header className="mb-8 mt-4">
        <h2 className="text-[2.75rem] font-extrabold tracking-tight leading-none">Döviz</h2>
        <p className="text-[var(--color-on-surface-variant)] font-medium mt-2">Kur Çiftleri</p>
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        {filters.map((f) => (
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

      {/* Asset list */}
      <section className="mb-8">
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

      {/* Focus chart */}
      <section className="mb-8">
        <div className="md:hidden">
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
        </div>
        <div className="hidden md:block">
          <FocusChart
            assetName={focusAsset.name}
            assetCode={focusAsset.code}
            price={focusAsset.price}
            change={focusAsset.change}
            history={focusHistory}
            icon={focusAsset.icon}
            iconBg={focusAsset.iconBg}
            onRangeChange={setHistoryHours}
          />
        </div>
      </section>
    </>
  );
}
