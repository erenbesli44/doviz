import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  AreaSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
} from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import type { ChartDataPoint } from '../../data/types';
import PriceChange from './PriceChange';

const timeRanges = ['1S', '1G', '1H', '1A', '1Y', 'TÜMÜ'] as const;
type TimeRange = typeof timeRanges[number];

const RANGE_HOURS: Record<TimeRange, number> = {
  '1S':   1,
  '1G':   24,
  '1H':   168,
  '1A':   720,
  '1Y':   8760,
  'TÜMÜ': 8760,
};

const RANGE_LABELS: Record<TimeRange, string> = {
  '1S':   '1 SAAT DEĞİŞİMİ',
  '1G':   '24 SAAT DEĞİŞİMİ',
  '1H':   '1 HAFTA DEĞİŞİMİ',
  '1A':   '1 AY DEĞİŞİMİ',
  '1Y':   '1 YIL DEĞİŞİMİ',
  'TÜMÜ': 'TÜM DÖNEM DEĞİŞİMİ',
};

interface Props {
  assetName: string;
  assetCode: string;
  price: number;
  change: number;
  history: ChartDataPoint[];
  compact?: boolean;
  icon?: string;
  iconBg?: string;
  onRangeChange?: (hours: number) => void;
}

export default function FocusChart({
  assetName,
  assetCode,
  price,
  change,
  history,
  compact = false,
  icon = 'show_chart',
  iconBg = 'bg-secondary-fixed',
  onRangeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>('1G');
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);

  const isPositive = change >= 0;
  const chartColor = isPositive ? '#1a7f4b' : '#c0392b';

  const displayPrice  = hoverValue ?? price;
  const firstValue    = history[0]?.value ?? price;
  const periodChangePct =
    hoverValue != null
      ? ((hoverValue - firstValue) / firstValue) * 100
      : change;

  const formattedPrice = displayPrice.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const chartHeight = compact ? 192 : 400;

  useEffect(() => {
    if (!containerRef.current || history.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(100,116,139,0.6)',  // slate-400 ≈ on-surface-variant
        fontFamily: 'inherit',
        fontSize: 10,
      },
      grid: {
        horzLines: { color: 'rgba(0,0,0,0.045)', style: LineStyle.Solid },
        vertLines: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.08 },
        ticksVisible: false,
      },
      timeScale: {
        visible: false,          // we render time in the header on hover
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          width: 1,
          color: 'rgba(0,0,0,0.25)',
          style: LineStyle.Dashed,
          labelVisible: false,
        },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: false,
      handleScale: false,
      width: containerRef.current.clientWidth,
      height: chartHeight,
    });

    // Map ChartDataPoint[] → { time: UTCTimestamp, value }
    // Using array index as time avoids format-parsing the backend strings
    const series = chart.addSeries(AreaSeries, {
      lineColor: chartColor,
      topColor: `${chartColor}20`,
      bottomColor: `${chartColor}00`,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#fff',
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBackgroundColor: chartColor,
    });

    series.setData(
      history.map((pt, i) => ({
        time: i as UTCTimestamp,
        value: pt.value,
      })),
    );

    // Always zoom to fit all loaded data, regardless of range length
    chart.timeScale().fitContent();

    // Dotted reference line at period-open (Google Finance "prev close" equivalent)
    if (history.length > 1) {
      series.createPriceLine({
        price: history[0].value,
        color: 'rgba(0,0,0,0.18)',
        lineStyle: LineStyle.Dotted,
        lineWidth: 1,
        axisLabelVisible: false,
        title: '',
      });
    }

    // Hover → sync header price + time label
    const handler = (param: { time?: UTCTimestamp; logical?: number; seriesData?: Map<unknown, { value?: number }> } & Record<string, unknown>) => {
      if (!param.time && param.time !== 0) {
        setHoverValue(null);
        setHoverTime(null);
        return;
      }
      const d = param.seriesData?.get(series) as { value?: number } | undefined;
      if (d?.value != null) {
        const idx = (param.logical as number | undefined) ?? (param.time as number);
        setHoverValue(d.value);
        setHoverTime(history[idx]?.time ?? null);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart.subscribeCrosshairMove(handler as any);

    // Responsive resize
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
        chart.timeScale().fitContent();
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  // Recreate whenever data or colour changes (range switch / asset switch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, chartHeight, chartColor]);

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-6 shadow-[0_4px_40px_rgba(0,0,0,0.04)] border border-[var(--color-outline-variant)]/10 overflow-hidden relative">
      {/* ── HEADER ──────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Asset label */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
              <span className="material-symbols-outlined text-[14px] text-[var(--color-on-surface-variant)]">
                {icon}
              </span>
            </div>
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-on-surface-variant)]/60">
              {assetCode}
            </span>
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          </div>

          {/* Price — updates live while hovering */}
          <div className="flex items-baseline gap-3">
            <span className={`font-black tracking-tighter ${compact ? 'text-4xl' : 'text-5xl'}`}>
              {formattedPrice}
            </span>
            <div className="flex flex-col">
              <PriceChange value={periodChangePct} className="text-sm!" />
              <span className="text-[10px] font-medium text-[var(--color-on-surface-variant)]/40 uppercase">
                {hoverTime ?? RANGE_LABELS[activeRange]}
              </span>
            </div>
          </div>

          {!compact && (
            <p className="text-[var(--color-on-surface-variant)] font-medium text-sm mt-1">
              {assetName}
            </p>
          )}
        </div>

        {/* Time range buttons */}
        <div className="flex gap-1 flex-wrap justify-end">
          {timeRanges.map((r) => (
            <button
              key={r}
              onClick={() => { setActiveRange(r); onRangeChange?.(RANGE_HOURS[r]); }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                activeRange === r
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHART (lightweight-charts canvas) ───────────── */}
      <div ref={containerRef} style={{ height: chartHeight, width: '100%' }} />
    </div>
  );
}

