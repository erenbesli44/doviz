import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import FocusChart from '../components/ui/FocusChart';
import CommodityCard from '../components/ui/CommodityCard';
import MarketSummaryRow from '../components/ui/MarketSummaryRow';

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function Markets() {
  const { status, extendedOverviewAssets, fxAssets, commodityCards, marketSummary } = useMarketData();

  // Selected asset for the focus chart; id === symbol code, e.g. "USD/TRY"
  const [selectedId, setSelectedId] = useState<string>('USD/TRY');
  const [historyHours, setHistoryHours] = useState(24);
  const focusHistory = useHistory(selectedId, historyHours);

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
      {/* ── PAGE HEADER (compact) ───────────────────── */}
      <header className="mb-3 mt-3 flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60">
          GÜNCEL VARLIKLAR
        </span>
        <span className="text-xs text-[var(--color-on-surface-variant)]/50 font-medium">
          Canlı Veri • <LiveClock />
        </span>
      </header>

      {/* ── HORIZONTAL SCROLL ASSET ROW (all breakpoints) ─────────────── */}
      <section className="mb-8 -mx-4 px-4 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3">
          {extendedOverviewAssets.map((asset) => (
            <div key={asset.id} className="min-w-[152px] flex-shrink-0">
              <AssetCard
                asset={asset}
                onClick={() => setSelectedId(asset.id)}
              />
            </div>
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
            icon={focusAsset.icon}
            iconBg={focusAsset.iconBg}
            onRangeChange={setHistoryHours}
          />
        </div>
      </section>

      {/* ── MOBILE: BIST 100 summary card ───────────── */}
      <section className="md:hidden mb-10">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          PİYASA ÖZETİ
        </h3>
        <div className="bg-[var(--color-surface-container)] rounded-3xl p-6 flex items-center justify-between">
          {(() => { const bist = marketSummary.find(m => m.id === 'XU100') ?? marketSummary[0]; return (
          <div>
            <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)]/60 uppercase">
              BİST 100
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tighter">
                {bist?.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
              </span>
              <span className="text-xs font-bold text-[var(--color-primary)]">
                +{bist?.change.toFixed(2) ?? '0.00'}%
              </span>
            </div>
          </div>
          ); })()}
          <div className="flex items-center gap-1 bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">
              trending_up
            </span>
            <span className="text-xs font-bold text-[var(--color-primary)] uppercase">
              BOĞA PİYASASI
            </span>
          </div>
        </div>
      </section>

      {/* ── MOBILE: commodity horizontal scroll ─────── */}
      <section className="md:hidden mt-10 mb-8 overflow-hidden">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          EMTİA &amp; METAL
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
          {commodityCards.map((item) => (
            <CommodityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* ── DESKTOP: market summary ──────────────── */}
      <section className="hidden md:block mt-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Piyasa Özeti</h2>
          <a
            href="#"
            className="text-[var(--color-primary)] text-sm font-bold flex items-center gap-1 group"
          >
            Tümünü Gör
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a>
        </div>
        <div className="space-y-4">
          {marketSummary.map((item) => (
            <MarketSummaryRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </>
  );
}
