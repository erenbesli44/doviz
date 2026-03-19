interface Props {
  value: number;       // percentage, e.g. 0.12
  className?: string;
}

export default function PriceChange({ value, className = '' }: Props) {
  const isPositive = value >= 0;
  const color = isPositive
    ? 'text-[var(--color-primary)]'
    : 'text-[var(--color-error)]';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`text-xs font-bold ${color} ${className}`}>
      {sign}{value.toFixed(2)}%
    </span>
  );
}
