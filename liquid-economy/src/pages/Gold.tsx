import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import type { Asset } from '../data/types';

// Symbols shown in each section
const GOLD_SYMBOLS   = ['GAUTRY', 'XAU/USD'];
const SILVER_SYMBOLS = ['GAGTRY', 'XAG/USD'];

export default function Gold() {
  const { goldAssets, commodityAssets, extendedOverviewAssets, status } = useMarketData();
  // 'GAUTRY-derived' is the main-page derived price; use 'GAUTRY' for history lookup
  const [selectedId, setSelectedId] = useState<string>('GAUTRY-derived');
  const [historyHours, setHistoryHours] = useState(24);

  const goldMap      = new Map(goldAssets.map((a) => [a.id, a]));
  const commodityMap = new Map(commodityAssets.map((a) => [a.id, a]));

  // Build gold list: derived GAUTRY (main-page formula) first, then physical + XAU/USD
  const derivedGautry = extendedOverviewAssets.find((a) => a.id === 'GAUTRY');
  const goldItems: { key: string; asset: Asset }[] = [
    ...(derivedGautry ? [{ key: 'GAUTRY-derived', asset: { ...derivedGautry, name: 'Gram Altın' } }] : []),
    ...GOLD_SYMBOLS.flatMap((sym) => {
      const a = goldMap.get(sym);
      if (!a) return [];
      return [{ key: sym + '-physical', asset: sym === 'GAUTRY' ? { ...a, name: 'Fiziksel Gram Altın' } : a }];
    }),
  ];
  const goldList = goldItems.map((i) => i.asset);

  const silverList: Asset[] = SILVER_SYMBOLS.flatMap((sym) => {
    const a = commodityMap.get(sym) ?? goldMap.get(sym);
    return a ? [a] : [];
  });

  const allAssets = [...goldList, ...silverList];
  // For history, both GAUTRY variants share the same symbol code
  const focusAsset = allAssets.find((a) => a.id === selectedId) ?? goldItems[0]?.asset ?? allAssets[0];
  const historySymbol = focusAsset?.id === 'GAUTRY-derived' ? 'GAUTRY' : (focusAsset?.code ?? 'GAUTRY');
  const focusHistory = useHistory(historySymbol, historyHours);

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
      {/* Altın section */}
      <section className="mb-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          ALTIN
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
          {goldItems.map(({ key, asset }) => (
            <AssetListRow
              key={key}
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

