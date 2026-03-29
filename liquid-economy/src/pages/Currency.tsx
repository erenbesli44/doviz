import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import PageHeader from '../components/layout/PageHeader';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Currency() {
  const { fxAssets, status, lastUpdated } = useMarketData();
  const [selectedId, setSelectedId] = useState<string>('USD/TRY');
  const [historyHours, setHistoryHours] = useState(24);

  const focusAsset = fxAssets.find((a) => a.id === selectedId) ?? fxAssets[0];
  const { points: focusHistory, loading: historyLoading } = useHistory(focusAsset?.code ?? 'USD/TRY', historyHours);

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
        path="/doviz"
        title="Canlı Döviz Kurları: Dolar, Euro, Sterlin | Döviz Veri"
        description="Canlı döviz kurları ekranı: dolar kuru, euro kuru, sterlin ve majör pariteleri anlık takip edin."
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Döviz', path: '/doviz' },
          ]),
          collectionPageSchema('Canlı Döviz Kurları', 'Dolar, euro, sterlin ve çapraz kurlarda canlı fiyat takibi.', '/doviz'),
        ]}
      />
      <PageHeader
        title="Döviz"
        subtitle="Majör ve Çapraz Pariteler"
        lastUpdated={lastUpdated}
      />
      <p className="text-sm text-[var(--color-on-surface-variant)]/85 mb-4 max-w-4xl">
        “Dolar kuru kaç TL?” ve “euro kuru canlı” aramalarına odaklı güncel döviz tablosu.
        Popüler detay sayfaları:
        <Link className="ml-1 underline text-[var(--color-primary)]" to="/piyasa/dolar-kuru-usd-try">USD/TRY</Link>,
        <Link className="ml-1 underline text-[var(--color-primary)]" to="/piyasa/euro-kuru-eur-try">EUR/TRY</Link>.
      </p>

      {/* Asset list */}
      <section className="mb-8">
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-2 space-y-1 border border-[var(--color-outline-variant)]/20">
          {fxAssets.map((asset) => (
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
