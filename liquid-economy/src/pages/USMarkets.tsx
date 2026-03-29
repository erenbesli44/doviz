import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

const US_CODES = ['SPX', 'NDX', 'DJI'];

export default function USMarkets() {
  const { indexAssets, status, lastUpdated } = useMarketData();
  const usAssets = indexAssets.filter((a) => US_CODES.includes(a.code));
  const [selectedId, setSelectedId] = useState<string>(usAssets[0]?.id ?? 'SPX');
  const [historyHours, setHistoryHours] = useState(24);
  const focusAsset = usAssets.find((a) => a.id === selectedId) ?? usAssets[0];
  const { points, loading } = useHistory(focusAsset?.code ?? 'SPX', historyHours);

  return (
    <section>
      <SeoHead
        path="/amerika-borsasi"
        title="Amerika Borsası Canlı: S&P 500, Nasdaq, Dow Jones | Döviz Veri"
        description="Amerika borsası ve ABD endeksleri için canlı fiyatlar, değişim ve grafik verileri."
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Amerika Borsası', path: '/amerika-borsasi' },
          ]),
          collectionPageSchema('Amerika Borsası Canlı Veriler', 'S&P 500, Nasdaq ve Dow Jones için canlı endeks verileri.', '/amerika-borsasi'),
        ]}
      />
      <PageHeader title="Amerika Borsası" subtitle="ABD Endeksleri" lastUpdated={lastUpdated} />
      {status === 'loading' ? (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">Veriler yükleniyor...</div>
      ) : (
        <>
          <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20 mb-6">
            {usAssets.map((asset) => (
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
