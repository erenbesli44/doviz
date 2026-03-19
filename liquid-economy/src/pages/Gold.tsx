import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';

export default function Gold() {
  const { goldAssets, status } = useMarketData();
  const [selectedId, setSelectedId] = useState<string>('GAUTRY');
  const [historyHours, setHistoryHours] = useState(24);

  const focusAsset = goldAssets.find((a) => a.id === selectedId) ?? goldAssets[0];
  const focusHistory = useHistory(focusAsset?.code ?? 'GAUTRY', historyHours);

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
        <h2 className="text-[2.75rem] font-extrabold tracking-tight leading-none">Altın</h2>
        <p className="text-[var(--color-on-surface-variant)] font-medium mt-2">Fiyatlar &amp; Kıymetli Metaller</p>
      </header>

      {/* Focus chart for selected gold type */}
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

      {/* Gold types list */}
      <section>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          ALTIN TÜRLERİ
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
          {goldAssets.map((asset) => (
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
