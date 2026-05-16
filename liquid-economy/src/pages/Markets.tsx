import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import AssetListRow from '../components/ui/AssetListRow';
import NewsStrip from '../components/ui/NewsStrip';
import InsightStrip from '../components/ui/InsightStrip';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Markets() {
  const { status, extendedOverviewAssets } = useMarketData();
  const [selectedId, setSelectedId] = useState<string>('USD/TRY');

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

      {/* ── PIYASA ANALİZİ — AI insight teaser ───────── */}
      <InsightStrip />

      {/* ── PİYASA GÜNDEMİ — news is the hero ─────────── */}
      <NewsStrip />

      {/* ── GÜNCEL VARLIKLAR — compact strip ──────────── */}
      <section className="mb-8">
        <div className="mb-2 ml-1">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-on-surface-variant)]/65">
            Güncel Varlıklar
          </h3>
        </div>
        {/* Two-column grid on desktop, single col on mobile */}
        <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-1 grid grid-cols-1 md:grid-cols-2 gap-0">
          {extendedOverviewAssets.map((asset) => (
            <AssetListRow
              key={asset.id}
              asset={asset}
              active={asset.id === selectedId}
              showChangeValue
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
