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
    <div className="min-w-[140px] p-4 rounded-3xl bg-[var(--color-surface-container-high)] flex flex-col gap-2">
      <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)]/60 uppercase">
        {item.name}
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <PriceChange value={item.change} />
    </div>
  );
}
