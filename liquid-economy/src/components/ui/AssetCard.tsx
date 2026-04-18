import type { Asset } from '../../data/types';
import PriceChange from './PriceChange';

const categoryBadge: Record<string, { label: string; classes: string }> = {
  fx:        { label: 'FX',     classes: 'bg-[var(--color-secondary-fixed)] text-[var(--color-on-secondary-fixed)]' },
  gold:      { label: 'ALTIN', classes: 'bg-[var(--color-tertiary-fixed)] text-[var(--color-on-tertiary-fixed-variant)]' },
  index:     { label: 'INDEX', classes: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]' },
  commodity: { label: 'EMTİA', classes: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]' },
  crypto:    { label: 'KRIPTO',classes: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)]' },
};

const trendIcon: Record<string, string> = {
  fx:        'trending_up',
  gold:      'trending_up',
  index:     'show_chart',
  commodity: 'show_chart',
  crypto:    'trending_up',
};

interface Props {
  asset: Asset;
  onClick?: () => void;
  showChangeValue?: boolean;
}

/**
 * Desktop asset summary card — used in the 5-col top grid.
 */
export default function AssetCard({ asset, onClick, showChangeValue = false }: Props) {
  const badge = categoryBadge[asset.category] ?? categoryBadge.fx;
  const icon  = trendIcon[asset.category] ?? 'trending_up';

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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 hover:shadow-sm transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.classes}`}>
          {badge.label}
        </span>
        <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
      </div>
      <h3 className="text-[var(--color-on-surface-variant)] text-[11px] font-semibold uppercase tracking-[0.1em] mb-1">
        {asset.name}
      </h3>
      <div className="flex flex-col">
        {showChangeValue ? (
          <>
            <PriceChange value={asset.change} className="text-sm! font-black! leading-none" />
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight tabular-nums">{formattedPrice}</span>
              <span className={`text-[11px] font-medium tabular-nums ${changeColor}`}>
                {changeSign}{formattedChangeValue}
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="text-base font-bold tracking-tight">{formattedPrice}</span>
            <PriceChange value={asset.change} className="text-xs! font-medium!" />
          </>
        )}
      </div>
    </div>
  );
}
