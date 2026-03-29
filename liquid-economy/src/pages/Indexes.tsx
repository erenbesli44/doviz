import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import PageHeader from '../components/layout/PageHeader';

export default function Indexes() {
  const { indexAssets, status, lastUpdated } = useMarketData();
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
      <PageHeader
        title="Endeksler"
        subtitle="Yurt İçi ve Küresel"
        lastUpdated={lastUpdated}
      />

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
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65 ml-2 mb-3">
          TÜM ENDEKSLER
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20">
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
