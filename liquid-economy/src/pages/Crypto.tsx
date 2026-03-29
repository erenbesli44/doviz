import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Crypto() {
  const { cryptoAssets, status, lastUpdated } = useMarketData();
  const [selectedId, setSelectedId] = useState<string>('BTC/USD');
  const [historyHours, setHistoryHours] = useState(24);
  const focusAsset = cryptoAssets.find((a) => a.id === selectedId) ?? cryptoAssets[0];
  const { points, loading } = useHistory(focusAsset?.code ?? 'BTC/USD', historyHours);

  return (
    <section>
      <SeoHead
        path="/kripto"
        title="Canlı Kripto Fiyatları: Bitcoin ve Büyük Coinler | Döviz Veri"
        description="Türkiye odaklı canlı kripto fiyatları, anlık değişim oranları ve grafik görünümü."
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Kripto', path: '/kripto' },
          ]),
          collectionPageSchema('Canlı Kripto Fiyatları', 'Bitcoin ve büyük kripto varlıkların anlık verileri.', '/kripto'),
        ]}
      />
      <PageHeader title="Kripto" subtitle="Canlı Kripto Piyasası" lastUpdated={lastUpdated} />
      {status === 'loading' ? (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">Veriler yükleniyor...</div>
      ) : (
        <>
          <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20 mb-6">
            {cryptoAssets.map((asset) => (
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
