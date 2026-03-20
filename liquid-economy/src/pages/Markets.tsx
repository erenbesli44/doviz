import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import CommodityCard from '../components/ui/CommodityCard';
import MarketSummaryRow from '../components/ui/MarketSummaryRow';
import InsightsCard from '../components/ui/InsightsCard';
import TickerBoard from '../components/ui/TickerBoard';

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
  const { status, overviewAssets, fxAssets, goldAssets, commodityCards, marketSummary, tickerItems, news } = useMarketData();

  // Selected asset for the focus chart; id === symbol code, e.g. "USD/TRY"
  const [selectedId, setSelectedId] = useState<string>('USD/TRY');
  const [historyHours, setHistoryHours] = useState(24);
  const focusHistory = useHistory(selectedId, historyHours);

  const allFeatured = [...fxAssets.slice(0, 3), ...goldAssets.slice(0, 1)];
  const focusAsset =
    allFeatured.find((a) => a.id === selectedId) ??
    overviewAssets.find((a) => a.id === selectedId) ??
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
      {/* ── PAGE HEADER ─────────────────────────────── */}
      <header className="mb-8 mt-4">
        <h2 className="text-[2.75rem] font-extrabold tracking-tight leading-none text-[var(--color-on-surface)]">
          Piyasalar
        </h2>
        <p className="text-[var(--color-on-surface-variant)] font-medium mt-2">
          Canlı Veri • <LiveClock />
        </p>
      </header>

      {/* ── TICKER BOARD (all breakpoints) ──────────── */}
      {tickerItems.length > 0 && (
        <section className="mb-10">
          <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
            PİYASALAR
          </h3>
          <TickerBoard items={tickerItems} />
        </section>
      )}

      {/* ── DESKTOP: 5-col asset overview grid ──────── */}
      <section className="hidden md:grid grid-cols-5 gap-4 mb-12">
        {overviewAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => setSelectedId(asset.id)}
          />
        ))}
      </section>

      {/* ── MOBILE: vertical asset list ─────────────── */}
      <section className="md:hidden space-y-6 mb-10">
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2">
          GÜNCEL VARLIKLAR
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] p-2 space-y-1">
          {allFeatured.map((asset) => (
            <AssetListRow
              key={asset.id}
              asset={asset}
              active={asset.id === selectedId}
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

      {/* ── DESKTOP: market summary + insights ──────── */}
      <section className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4">
        {/* Market summary list */}
        <div className="lg:col-span-2">
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
        </div>

        {/* News sidebar */}
        <InsightsCard news={news} />
      </section>
    </>
  );
}
