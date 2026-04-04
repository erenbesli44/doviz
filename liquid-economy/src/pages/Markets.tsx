import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import CommodityCard from '../components/ui/CommodityCard';
import PageHeader from '../components/layout/PageHeader';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Markets() {
  const { status, extendedOverviewAssets, fxAssets, commodityCards, lastUpdated } = useMarketData();

  // Selected asset for the focus chart; id === symbol code, e.g. "USD/TRY"
  const [selectedId, setSelectedId] = useState<string>('USD/TRY');
  const [historyHours, setHistoryHours] = useState(24);
  const { points: focusHistory, loading: historyLoading } = useHistory(selectedId, historyHours);

  const focusAsset =
    extendedOverviewAssets.find((a) => a.id === selectedId) ??
    fxAssets[0];

  if (status === 'loading') {
    return (
      <div className="space-y-4 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-[var(--color-surface-container)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <SeoHead
        path="/"
        title="Canlı Döviz, Altın, Endeks, Emtia ve Kripto Verileri | Döviz Veri"
        description="Türkiye odaklı canlı piyasa ekranı: döviz, altın, endeks, emtia ve kripto fiyatlarını anlık takip edin."
        jsonLd={[
          breadcrumbSchema([{ name: 'Anasayfa', path: '/' }]),
          collectionPageSchema('Canlı Piyasalar', 'Döviz, altın, endeks, emtia ve kripto için canlı piyasa verileri.', '/'),
        ]}
      />
      {/* ── GÜNCEL VARLIKLAR ─────────────────────────────────────── */}
      {/* Mobile: compact list rows — all assets fit on one screen */}
      <section className="md:hidden mb-4">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65 mb-2 ml-1">
          GÜNCEL VARLIKLAR
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-1 space-y-0">
          {extendedOverviewAssets.map((asset) => (
            <AssetListRow
              key={asset.id}
              asset={asset}
              active={asset.id === selectedId}
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </div>
      </section>

      {/* Desktop: 5-col × 2-row grid — all assets visible at once */}
      <section className="hidden md:block mb-4">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65 mb-2 ml-1">
          GÜNCEL VARLIKLAR
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {extendedOverviewAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </div>
      </section>

      {/* ── FOCUS CHART (both breakpoints) ──────────── */}
      <section className="mb-10">
        {/* Mobile: compact */}
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
        {/* Desktop: full height */}
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

      {/* ── MOBILE: commodity horizontal scroll ─────── */}
      <section className="md:hidden mt-10 mb-8 overflow-hidden">
        <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65 ml-2 mb-4">
          EMTİA &amp; METAL
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
          {commodityCards.map((item) => (
            <CommodityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <PageHeader
        title="Piyasalar"
        subtitle="Genel Görünüm"
        lastUpdated={lastUpdated}
      />

      <p className="text-sm text-[var(--color-on-surface-variant)]/85 mt-4 max-w-4xl">
        Canlı piyasa takibinde en çok aranan varlıkları tek ekranda sunuyoruz.
        Detay için <Link to="/doviz" className="underline text-[var(--color-primary)]">döviz</Link>,
        <Link to="/altin" className="underline text-[var(--color-primary)] ml-1">altın</Link>,
        <Link to="/kapalicarsi" className="underline text-[var(--color-primary)] ml-1">kapalıçarşı</Link> ve
        <Link to="/amerika-borsasi" className="underline text-[var(--color-primary)] ml-1">ABD endeksleri</Link> sayfalarına geçebilirsiniz.
      </p>

    </>
  );
}
