import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import type { Asset } from '../data/types';
import PageHeader from '../components/layout/PageHeader';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

// Symbols shown in each section
const GOLD_SYMBOLS   = ['XAU/USD'];
const SILVER_SYMBOLS = ['GAGTRY', 'XAG/USD'];

export default function Gold() {
  const { goldAssets, commodityAssets, extendedOverviewAssets, status, lastUpdated } = useMarketData();
  // 'GAUTRY-derived' is the main-page derived price; use 'GAUTRY' for history lookup
  const [selectedId, setSelectedId] = useState<string>('GAUTRY-derived');
  const [historyHours, setHistoryHours] = useState(24);

  const goldMap      = new Map(goldAssets.map((a) => [a.id, a]));
  const commodityMap = new Map(commodityAssets.map((a) => [a.id, a]));

  // Build gold list: derived GAUTRY (spot-formula gram gold) first, then XAU/USD.
  // Override id to 'GAUTRY-derived' so selectedId matching works correctly —
  // the backend asset has id='GAUTRY' but we need a stable unique id for the list.
  const derivedGautry = extendedOverviewAssets.find((a) => a.id === 'GAUTRY');
  const goldItems: { key: string; asset: Asset }[] = [
    ...(derivedGautry ? [{ key: 'GAUTRY-derived', asset: { ...derivedGautry, id: 'GAUTRY-derived', name: 'Gram Altın' } }] : []),
    ...GOLD_SYMBOLS.flatMap((sym) => {
      const a = goldMap.get(sym);
      return a ? [{ key: sym, asset: a }] : [];
    }),
  ];
  const goldList = goldItems.map((i) => i.asset);

  const silverList: Asset[] = SILVER_SYMBOLS.flatMap((sym) => {
    const a = commodityMap.get(sym) ?? goldMap.get(sym);
    return a ? [a] : [];
  });

  const allAssets = [...goldList, ...silverList];
  const focusAsset = allAssets.find((a) => a.id === selectedId) ?? goldItems[0]?.asset ?? allAssets[0];
  // 'GAUTRY-derived' is a frontend-only id — map back to the real symbol for history fetch
  const historySymbol = focusAsset?.id === 'GAUTRY-derived' ? 'GAUTRY' : (focusAsset?.code ?? 'GAUTRY');
  const { points: focusHistory, loading: historyLoading } = useHistory(historySymbol, historyHours);

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
      <SeoHead
        path="/altin"
        title="Canlı Altın Fiyatları: Gram, Ons ve Gümüş | Döviz Veri"
        description="Canlı altın fiyatları: gram altın, ons altın ve gümüş fiyatlarını anlık değişim ve grafikle takip edin."
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Altın', path: '/altin' },
          ]),
          collectionPageSchema('Canlı Altın Fiyatları', 'Gram altın, ons altın ve gümüş fiyatları için canlı takip ekranı.', '/altin'),
        ]}
      />
      <PageHeader
        title="Altın ve Gümüş"
        subtitle="Değerli Metaller"
        lastUpdated={lastUpdated}
      />

      {/* Altın section */}
      <section className="mb-6">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65 ml-2 mb-3">
          ALTIN
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20">
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
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65 ml-2 mb-3">
          GÜMÜŞ
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20">
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

      <p className="text-sm text-[var(--color-on-surface-variant)]/85 mt-4 max-w-4xl">
        Gram altın, ons altın ve gümüş fiyatlarını tek ekranda izleyin.
        Kapalıçarşı odaklı görünüm için
        <Link className="ml-1 underline text-[var(--color-primary)]" to="/kapalicarsi">Kapalıçarşı</Link> sayfasına geçebilirsiniz.
      </p>
    </>
  );
}
