import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';

export default function Indexes() {
  const { indexAssets, status } = useMarketData();
  const [selectedId, setSelectedId] = useState<string>('XU100');
  const [historyHours, setHistoryHours] = useState(24);

  const focusAsset = indexAssets.find((a) => a.id === selectedId) ?? indexAssets[0];
  const { points: focusHistory, loading: historyLoading } = useHistory(focusAsset?.code ?? 'XU100', historyHours);

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[var(--color-surface-container)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: card grid */}
      <section className="hidden md:grid grid-cols-3 gap-4 mb-8">
        {indexAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => setSelectedId(asset.id)}
          />
        ))}
      </section>

      {/* Mobile: list */}
      <section className="md:hidden mb-8">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          TÜM ENDEKSLER
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
          {indexAssets.map((asset) => (
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
