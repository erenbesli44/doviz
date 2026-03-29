import { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useHistory } from '../hooks/useHistory';
import AssetCard from '../components/ui/AssetCard';
import AssetListRow from '../components/ui/AssetListRow';
import FocusChart from '../components/ui/FocusChart';
import CommodityCard from '../components/ui/CommodityCard';

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
  const { status, extendedOverviewAssets, fxAssets, commodityCards } = useMarketData();

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
      {/* ── PAGE HEADER ─────────────────────────────── */}
      <header className="mb-2 mt-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
        <p className="text-sm font-semibold text-[var(--color-on-surface-variant)]">
          Canlı Veri • <LiveClock />
        </p>
      </header>

      {/* ── GÜNCEL VARLIKLAR ─────────────────────────────────────── */}
      {/* Mobile: compact list rows — all assets fit on one screen */}
      <section className="md:hidden mb-4">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 mb-2 ml-1">
          GÜNCEL VARLIKLAR
        </h3>
        <div className="bg-[var(--color-surface-container-low)] rounded-xl p-1 space-y-0">
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
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 mb-2 ml-1">
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
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60 ml-2 mb-4">
          EMTİA &amp; METAL
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
          {commodityCards.map((item) => (
            <CommodityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

    </>
  );
}
