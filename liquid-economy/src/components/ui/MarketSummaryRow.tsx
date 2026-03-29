import type { MarketSummaryItem } from '../../data/types';
import SparklineChart from './SparklineChart';
import PriceChange from './PriceChange';

interface Props {
  item: MarketSummaryItem;
  onClick?: () => void;
}

/**
 * Market summary list row — used in "Piyasa Özeti" section.
 * Shows ticker box, name, description, sparkline (hidden on mobile), price and change.
 */
export default function MarketSummaryRow({ item, onClick }: Props) {
  const isPositive = item.change >= 0;
  const sparkColor = isPositive ? '#059669' : '#e11d48';

  const formattedPrice = item.price.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className="bg-[var(--color-surface-container-low)]/50 hover:bg-[var(--color-surface-container-highest)] rounded-2xl p-5 border border-[var(--color-outline-variant)]/20 flex items-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    >
      {/* Ticker box */}
      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-black text-sm shadow-sm mr-5 flex-shrink-0 text-[var(--color-on-surface)]">
        {item.ticker}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{item.name}</h4>
        <p className="text-xs text-[var(--color-on-surface-variant)]/80 font-medium truncate">
          {item.description}
        </p>
      </div>

      {/* Sparkline — hidden on mobile */}
      <div className="mr-8 hidden md:block">
        <SparklineChart data={item.history} color={sparkColor} />
      </div>

      {/* Price + change */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold">{formattedPrice}</p>
        <PriceChange value={item.change} />
      </div>
    </div>
  );
}
