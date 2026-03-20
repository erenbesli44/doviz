import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import type { Asset } from '../data/types';

// Symbols shown in each section (HAREM1KG excluded — duplicate physical source)
const GOLD_SYMBOLS   = ['GAUTRY', 'XAU/USD'];
const SILVER_SYMBOLS = ['GAGTRY', 'XAG/USD'];

export default function Gold() {
  const { goldAssets, commodityAssets, status } = useMarketData();
  const [selectedId, setSelectedId] = useState<string>('GAUTRY');
  const [historyHours, setHistoryHours] = useState(24);

  const goldMap      = new Map(goldAssets.map((a) => [a.id, a]));
  const commodityMap = new Map(commodityAssets.map((a) => [a.id, a]));

  // GAUTRY labelled as "Fiziksel Gram Altın" to distinguish from the derived price on the main page
  const goldList: Asset[] = GOLD_SYMBOLS.flatMap((sym) => {
    const a = goldMap.get(sym);
    if (!a) return [];
    return [sym === 'GAUTRY' ? { ...a, name: 'Fiziksel Gram Altın' } : a];
  });

  const silverList: Asset[] = SILVER_SYMBOLS.flatMap((sym) => {
    const a = commodityMap.get(sym) ?? goldMap.get(sym);
    return a ? [a] : [];
  });

  const allAssets = [...goldList, ...silverList];
  const focusAsset = allAssets.find((a) => a.id === selectedId) ?? allAssets[0];
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
        <h2 className="text-[2.75rem] font-extrabold tracking-tight leading-none">Altın &amp; Gümüş</h2>
        <p className="text-[var(--color-on-surface-variant)] font-medium mt-2">Kıymetli Metaller</p>
      </header>

      {/* Altın section */}
      <section className="mb-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          ALTIN
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
          {goldList.map((asset) => (
            <AssetListRow
              key={asset.id}
              asset={asset}
              active={asset.id === selectedId}
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </div>
      </section>

      {/* Gümüş section */}
      <section className="mb-8">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          GÜMÜŞ
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
          {silverList.map((asset) => (
            <AssetListRow
              key={asset.id}
              asset={asset}
              active={asset.id === selectedId}
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </div>
      </section>

      {/* Focus chart for selected asset */}
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

