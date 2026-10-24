/**
 * PriceLine — "49,69 TRY ↑ %0,12 · gecikmeli", shared by the home tiles and
 * the instrument page. Turkish decimal comma; a zero change is neutral.
 */

import { formatPrice } from '../../lib/adapters';
import type { QuoteResponse } from '../../data/api-types';

const pct = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PriceLine({ quote, size = 'md' }: { quote?: QuoteResponse; size?: 'sm' | 'md' }) {
  if (!quote) return null;
  const { price, symbol, currency, change_pct } = quote.data;
  // Arrow follows what is printed: 0.004 → "→ %0,00", -0.005 → "↓ %0,01".
  const shown = Math.round(Math.abs(change_pct) * 100) / 100;
  const dir = shown === 0 ? 'flat' : change_pct > 0 ? 'up' : 'down';
  const tone = dir === 'up' ? 'text-bull' : dir === 'down' ? 'text-bear' : 'text-text-muted';
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
  return (
    <span className={`${size === 'sm' ? 'text-[13px]' : 'text-[15px]'} text-text-muted`}>
      <span className="font-semibold text-text">{formatPrice(price, symbol, currency)}</span>
      {' '}{currency}{' '}
      <span className={tone}>{arrow} %{pct(shown)}</span>
      {!quote.meta.is_live && <span className="text-text-subtle"> · gecikmeli</span>}
    </span>
  );
}
