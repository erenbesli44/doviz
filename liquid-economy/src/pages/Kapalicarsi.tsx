import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Kapalicarsi() {
  const { goldAssets, status, lastUpdated } = useMarketData();
  const kapaliAssets = goldAssets.filter((a) => a.id === 'HAREM1KG' || /harem|kapalı|kapali/i.test(a.name));
  const assets = kapaliAssets.length > 0 ? kapaliAssets : goldAssets;
  const [selectedId, setSelectedId] = useState<string>(assets[0]?.id ?? 'HAREM1KG');
  const [historyHours, setHistoryHours] = useState(24);
  const focusAsset = assets.find((a) => a.id === selectedId) ?? assets[0];
  const historySymbol = focusAsset?.code ?? 'HAREM1KG';
  const { points, loading } = useHistory(historySymbol, historyHours);

  return (
    <section>
      <SeoHead
        path="/kapalicarsi"
        title="Kapalıçarşı Altın Fiyatları: Gram Altın ve Yerel Piyasa | Döviz Veri"
        description="Kapalıçarşı odaklı altın göstergeleri, anlık fiyat, değişim ve grafik görünümü."
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Kapalıçarşı', path: '/kapalicarsi' },
          ]),
          collectionPageSchema('Kapalıçarşı Altın Fiyatları', 'Kapalıçarşı odaklı altın ve yerel fiyat göstergeleri.', '/kapalicarsi'),
        ]}
      />
      <PageHeader title="Kapalıçarşı" subtitle="Yerel Altın Göstergeleri" lastUpdated={lastUpdated} />
      {status === 'loading' ? (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">Veriler yükleniyor...</div>
      ) : (
        <>
          <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20 mb-6">
            {assets.map((asset) => (
              <AssetListRow
                key={asset.id}
                asset={asset}
                active={asset.id === selectedId}
                onClick={() => setSelectedId(asset.id)}
              />
            ))}
          </div>
          {focusAsset && (
            <FocusChart
              assetName={focusAsset.name}
              assetCode={focusAsset.code}
              price={focusAsset.price}
              change={focusAsset.change}
              history={points}
              historyLoading={loading}
              icon={focusAsset.icon}
              iconBg={focusAsset.iconBg}
              onRangeChange={setHistoryHours}
            />
          )}
        </>
      )}
    </section>
  );
}
