/**
 * KeyLevelChip
 *
 * Price level chip aggregated from key_levels[] across recent opinions.
 * Optional count shows how many pros mentioned this level.
 *
 * e.g.  67,000  ×3
 */

export interface KeyLevelChipProps {
  price: string | number;
  count?: number;
}

export function KeyLevelChip({ price, count }: KeyLevelChipProps) {
  const formatted =
    typeof price === 'number'
      ? price.toLocaleString('tr-TR')
      : price;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: 'var(--r-chip, 4px)',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        color: 'var(--text)',
        fontSize: 'var(--font-small-size, 14px)',
        lineHeight: 'var(--font-small-lh, 20px)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {formatted}
      {count !== undefined && count > 1 && (
        <span
          style={{ color: 'var(--text-muted)', fontSize: '12px' }}
          aria-label={`${count} uzman bahsetti`}
        >
          ×{count}
        </span>
      )}
    </span>
  );
}
