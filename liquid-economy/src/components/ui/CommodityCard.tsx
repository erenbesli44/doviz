import type { CommodityItem } from '../../data/types';
import PriceChange from './PriceChange';

interface Props {
  item: CommodityItem;
}

/**
 * Small card for horizontal commodity scroll carousel (mobile).
 */
export default function CommodityCard({ item }: Props) {
  return (
    <div className="min-w-[160px] p-4 rounded-2xl border border-[var(--color-outline-variant)]/25 bg-[var(--color-surface-container-high)] flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-[var(--color-on-surface-variant)]/70 uppercase tracking-[0.08em]">
        {item.name}
      </span>
      <span className="text-lg font-bold tracking-tight tabular-nums">
        {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <PriceChange value={item.change} />
    </div>
  );
}
