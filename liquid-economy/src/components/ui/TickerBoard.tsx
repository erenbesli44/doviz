import type { TickerItem } from '../../data/types';

interface Props {
  items: TickerItem[];
}

/** Format price for ticker board:
 *  - BTC/USD: $70.636 (0 decimals, USD prefix)
 *  - USD other: $106,61 (2 decimals, USD prefix)
 *  - TRY FX (price < 100): 44,2866 (4 decimals)
 *  - TRY large: 6.664,48 (2 decimals, thousand sep)
 */
function formatTickerPrice(price: number, id: string, currency: string): string {
  const prefix = currency === 'USD' ? '$' : '';
  if (id === 'BTC/USD') {
    return prefix + price.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
  }
  if (currency === 'TRY' && price < 100) {
    return prefix + price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return prefix + price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format change for ticker board: %0,63(41,72) or %-0,01(-0,0044) */
function formatTickerChange(changePct: number, changeValue: number | null | undefined, price: number, id: string, currency: string): string {
  const computed = price * changePct / 100;
  const signedChange = changeValue ?? computed;
  const absChange = Math.abs(signedChange);
  const pctStr = changePct.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = currency === 'USD' ? '$' : '';
  const absSign = signedChange < 0 ? '-' : '';

  let absFormatted: string;
  if (id === 'BTC/USD') {
    absFormatted = absChange.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
  } else if (currency === 'TRY' && price < 100) {
    absFormatted = absChange.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else {
    absFormatted = absChange.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return `%${pctStr}(${absSign}${prefix}${absFormatted})`;
}

export default function TickerBoard({ items }: Props) {
  return (
    <div className="bg-[var(--color-surface-container-low)] rounded-[2rem] overflow-hidden">
      {items.map((item, idx) => {
        const isPositive = item.changePct >= 0;
        const changeColor = isPositive
          ? 'text-emerald-500'
          : 'text-rose-500';

        return (
          <div
            key={item.id}
            className={`flex items-center justify-between px-5 py-4 ${
              idx < items.length - 1
                ? 'border-b border-[var(--color-outline-variant)]/30'
                : ''
            }`}
          >
            {/* Label */}
            <span className="text-xs font-black tracking-wider uppercase w-28 flex-shrink-0 text-[var(--color-on-surface-variant)]">
              {item.label}
            </span>

            {/* Price */}
            <span className="font-bold tabular-nums text-[var(--color-on-surface)]">
              {formatTickerPrice(item.price, item.id, item.currency)}
            </span>

            {/* Change */}
            <span className={`text-xs font-bold tabular-nums text-right flex-shrink-0 ${changeColor}`}>
              {formatTickerChange(item.changePct, item.changeValue, item.price, item.id, item.currency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
