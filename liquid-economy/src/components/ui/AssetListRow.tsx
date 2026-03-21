import type { Asset } from '../../data/types';
import PriceChange from './PriceChange';

interface Props {
  asset: Asset;
  active?: boolean;
  onClick?: () => void;
}

/**
 * Mobile asset list row — used in vertical asset lists.
 */
export default function AssetListRow({ asset, active = false, onClick }: Props) {
  const formattedPrice = asset.price.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all active:scale-[0.98] duration-200 ${
        active
          ? 'bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container-high)] ring-2 ring-[var(--color-primary)]/10'
          : 'hover:bg-[var(--color-surface-container-high)]'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Icon circle */}
        <div className={`w-8 h-8 rounded-full ${asset.iconBg} flex items-center justify-center flex-shrink-0`}>
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[16px]">
            {asset.icon}
          </span>
        </div>
        {/* Name + code */}
        <div className="text-left">
          <span className="block text-sm font-bold tracking-tight">{asset.name}</span>
          <span className="block text-[9px] font-bold text-[var(--color-on-surface-variant)]/60 uppercase">
            {asset.code}
          </span>
        </div>
      </div>
      {/* Price + change */}
      <div className="text-right">
        <span className="block text-sm font-extrabold tracking-tight">{formattedPrice}</span>
        <PriceChange value={asset.change} />
      </div>
    </button>
  );
}
