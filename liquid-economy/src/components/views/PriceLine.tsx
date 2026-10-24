/**
 * PriceLine — "49,69 TRY ↑ %0,12 · gecikmeli", shared by the home tiles and
 * the instrument page. Turkish decimal comma; a zero change is neutral.
 */

import { formatPrice } from '../../lib/adapters';
import type { QuoteResponse } from '../../data/api-types';

const pct = (n: number) => Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PriceLine({ quote, size = 'md' }: { quote?: QuoteResponse; size?: 'sm' | 'md' }) {
  if (!quote) return null;
  const { price, symbol, currency, change_pct } = quote.data;
  const shown = Math.round(change_pct * 100) / 100; // arrow follows what is printed: 0.004 → "→ %0,00"
  const dir = shown > 0 ? 'up' : shown < 0 ? 'down' : 'flat';
  const tone = dir === 'up' ? 'text-bull' : dir === 'down' ? 'text-bear' : 'text-text-muted';
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
  return (
    <span className={`${size === 'sm' ? 'text-[13px]' : 'text-[15px]'} text-text-muted`}>
      <span className="font-semibold text-text">{formatPrice(price, symbol, currency)}</span>
      {' '}{currency}{' '}
      <span className={tone}>{arrow} %{pct(change_pct)}</span>
      {!quote.meta.is_live && <span className="text-text-subtle"> · gecikmeli</span>}
    </span>
  );
}
