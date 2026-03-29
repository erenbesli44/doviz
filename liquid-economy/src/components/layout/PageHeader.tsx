interface Props {
  title: string;
  subtitle: string;
  lastUpdated?: Date | null;
}

function formatAsOf(value?: Date | null): string {
  if (!value) return 'Veri bekleniyor';
  return `Son güncelleme ${value.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function PageHeader({ title, subtitle, lastUpdated = null }: Props) {
  return (
    <header className="mb-5 md:mb-6 mt-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-on-surface-variant)]/70">
        {subtitle}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl md:text-[30px] font-bold tracking-tight text-[var(--color-on-surface)]">
          {title}
        </h2>
        <span className="text-xs font-medium text-[var(--color-on-surface-variant)]/80">
          {formatAsOf(lastUpdated)}
        </span>
      </div>
    </header>
  );
}
