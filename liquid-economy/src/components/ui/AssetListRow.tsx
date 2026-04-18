import type { Asset } from '../../data/types';
import PriceChange from './PriceChange';

interface Props {
  asset: Asset;
  active?: boolean;
  onClick?: () => void;
  showChangeValue?: boolean;
}

/**
 * Mobile asset list row — used in vertical asset lists.
 */
export default function AssetListRow({ asset, active = false, onClick, showChangeValue = false }: Props) {
  const formattedPrice = asset.price.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const signedChangeValue = asset.changeValue ?? (asset.price * asset.change) / 100;
  const formattedChangeValue = Math.abs(signedChangeValue).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const changeSign = signedChangeValue >= 0 ? '+' : '-';
  const changeColor = signedChangeValue >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.99] duration-200 ${
        active
          ? 'bg-[var(--color-surface-container-lowest)] ring-1 ring-[var(--color-primary)]/20'
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
          <span className="block text-sm font-semibold tracking-tight">{asset.name}</span>
          <span className="block text-[11px] font-medium text-[var(--color-on-surface-variant)]/70 uppercase tracking-[0.08em]">
            {asset.code}
          </span>
        </div>
      </div>
      {/* Price + change */}
      <div className="text-right">
        {showChangeValue ? (
          <div className="flex flex-col items-end">
            <PriceChange value={asset.change} className="text-sm! font-black! leading-none" />
            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <span className="text-sm font-bold tracking-tight tabular-nums">{formattedPrice}</span>
              <span className={`text-[11px] font-medium tabular-nums ${changeColor}`}>
                {changeSign}{formattedChangeValue}
              </span>
            </div>
          </div>
        ) : (
          <>
            <span className="block text-sm font-bold tracking-tight tabular-nums">{formattedPrice}</span>
            <PriceChange value={asset.change} />
          </>
        )}
      </div>
    </button>
  );
}
