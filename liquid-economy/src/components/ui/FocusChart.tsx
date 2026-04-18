import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  AreaSeries,
  ColorType,
  LineStyle,
  CrosshairMode,
  type Time,
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
  'TÜMÜ': 26280,  // 3 years — genuinely wider than 1Y
};

const RANGE_LABELS: Record<TimeRange, string> = {
  '1S':   '1 SAAT DEĞİŞİMİ',
  '1G':   'GÜNLÜK DEĞİŞİM',
  '1H':   '1 HAFTA DEĞİŞİMİ',
  '1A':   '1 AY DEĞİŞİMİ',
  '1Y':   '1 YIL DEĞİŞİMİ',
  'TÜMÜ': '3 YIL DEĞİŞİMİ',
};

interface Props {
  assetName: string;
  assetCode: string;
  price: number;
  change: number;
  history: ChartDataPoint[];
  historyLoading?: boolean;
  compact?: boolean;
  icon?: string;
  iconBg?: string;
  onRangeChange?: (hours: number) => void;
}

function labelForChartTime(time: Time, points: ChartDataPoint[]): string {
  if (typeof time !== 'number') return '';
  const idx = Math.round(time);
  if (idx < 0 || idx >= points.length) return '';
  return points[idx]?.time ?? '';
}

export default function FocusChart({
  assetName,
  assetCode,
  price,
  change,
  history,
  historyLoading = false,
  compact = false,
  icon = 'show_chart',
  iconBg = 'bg-secondary-fixed',
  onRangeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>('1G');
  const [unavailableRanges, setUnavailableRanges] = useState<Set<TimeRange>>(new Set());
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);

  const displayPrice  = hoverValue ?? price;
  const firstValue    = history[0]?.value ?? price;
  const lastValue     = history.length > 0 ? history[history.length - 1].value : price;

  // Chart-derived change: always computed from chart's first point (Istanbul midnight
  // for 1G) to the hover point or the last point. This keeps the displayed % change
  // visually consistent with the chart line direction.
  const periodChangePct =
    hoverValue != null
      ? ((hoverValue - firstValue) / firstValue) * 100
      : history.length >= 2
        ? ((lastValue - firstValue) / firstValue) * 100
        : change;

  // Chart color tracks the actual chart direction (first→current), not the backend
  // session change, so the green/red always matches the visible slope.
  const isPositive = periodChangePct >= 0;
  const chartColor = isPositive ? '#1a7f4b' : '#c0392b';

  const formattedPrice = displayPrice.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const chartHeight = compact ? 192 : 400;

  useEffect(() => {
    setUnavailableRanges(new Set());
    setActiveRange('1G');
    onRangeChange?.(RANGE_HOURS['1G']);
  }, [assetCode, onRangeChange]);

  useEffect(() => {
    if (historyLoading) return;
    if (history.length >= 2) return;
    // Current range returned insufficient data — mark it unavailable and try next
    setUnavailableRanges((prev) => {
      if (prev.has(activeRange)) return prev;
      const next = new Set(prev);
      next.add(activeRange);
      return next;
    });

    const fallbackOrder: TimeRange[] = ['1G', '1H', '1A', '1Y', 'TÜMÜ', '1S'];
    const nextRange = fallbackOrder.find((r) => r !== activeRange && !unavailableRanges.has(r));
    if (nextRange) {
      setActiveRange(nextRange);
      onRangeChange?.(RANGE_HOURS[nextRange]);
    }
  }, [history, historyLoading, activeRange, unavailableRanges, onRangeChange]);

  useEffect(() => {
    if (!containerRef.current || history.length < 2) return;

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
        visible: true,
        borderVisible: false,
        ticksVisible: false,
        allowBoldLabels: false,
        tickMarkFormatter: (time: Time) => labelForChartTime(time, history),
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

    // Map ChartDataPoint[] → { time: UTCTimestamp, value }.
    // We keep index-based time and render axis labels from `history.time`.
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
        const rawIdx = (param.logical as number | undefined) ?? (param.time as number);
        const idx = Math.max(0, Math.min(history.length - 1, Math.round(rawIdx)));
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
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 md:p-6 shadow-sm border border-[var(--color-outline-variant)]/25 overflow-hidden relative">
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
            <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[var(--color-on-surface-variant)]/65">
              {assetCode}
            </span>
          </div>

          {/* Price — updates live while hovering */}
          <div className="flex items-baseline gap-3">
            <span className={`font-bold tracking-tight tabular-nums ${compact ? 'text-3xl' : 'text-4xl'}`}>
              {formattedPrice}
            </span>
            <div className="flex flex-col">
              <PriceChange value={periodChangePct} className="text-sm!" />
              <span className="text-[11px] font-medium text-[var(--color-on-surface-variant)]/55 uppercase tracking-[0.08em]">
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

        {/* Time range buttons — always show all, dim unavailable ones */}
        <div className="flex gap-1 flex-wrap justify-end">
          {timeRanges.map((r) => (
            <button
              key={r}
              disabled={unavailableRanges.has(r)}
              onClick={() => {
                if (unavailableRanges.has(r)) return;
                // Clear unavailable flag if user explicitly re-selects this range
                setUnavailableRanges((prev) => { const next = new Set(prev); next.delete(r); return next; });
                setActiveRange(r);
                onRangeChange?.(RANGE_HOURS[r]);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase transition-all ${
                unavailableRanges.has(r)
                  ? 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]/30 cursor-not-allowed'
                  : activeRange === r
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
      {historyLoading ? (
        <div
          className="rounded-2xl bg-[var(--color-surface-container)]/60 border border-[var(--color-outline-variant)]/20 flex items-center justify-center text-sm text-[var(--color-on-surface-variant)]"
          style={{ height: chartHeight, width: '100%' }}
        >
          Grafik yükleniyor...
        </div>
      ) : history.length < 2 ? (
        <div
          className="rounded-2xl bg-[var(--color-surface-container)]/60 border border-[var(--color-outline-variant)]/20 flex items-center justify-center text-sm text-[var(--color-on-surface-variant)]"
          style={{ height: chartHeight, width: '100%' }}
        >
          Bu aralıkta yeterli veri yok.
        </div>
      ) : (
        <div ref={containerRef} style={{ height: chartHeight, width: '100%' }} />
      )}
    </div>
  );
}
