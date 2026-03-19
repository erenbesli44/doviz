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
}

/**
 * Desktop asset summary card — used in the 5-col top grid.
 */
export default function AssetCard({ asset, onClick }: Props) {
  const badge = categoryBadge[asset.category] ?? categoryBadge.fx;
  const icon  = trendIcon[asset.category] ?? 'trending_up';

  const formattedPrice = asset.price.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className="bg-[var(--color-surface-container-lowest)] rounded-xl p-5 border border-[var(--color-outline-variant)]/15 hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs font-bold px-2 py-1 rounded ${badge.classes}`}>
          {badge.label}
        </span>
        <span className="material-symbols-outlined text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
      </div>
      <h3 className="text-[var(--color-on-surface-variant)] text-xs font-semibold uppercase tracking-widest mb-1">
        {asset.name}
      </h3>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight">{formattedPrice}</span>
        <PriceChange value={asset.change} className="text-sm! font-medium!" />
      </div>
    </div>
  );
}
