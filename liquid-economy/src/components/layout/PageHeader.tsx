import type { ReactNode } from 'react';

interface Props {
  title: string;
  /** Small uppercase label above the title. */
  subtitle?: string;
  /** One-sentence explanation of what this page is. */
  description?: string;
  /** Right-aligned slot (freshness note, live badge, …). */
  aside?: ReactNode;
}

export default function PageHeader({ title, subtitle, description, aside }: Props) {
  return (
    <header className="mb-6 md:mb-8">
      {subtitle && <p className="kicker mb-2">{subtitle}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="m-0 font-serif text-[30px] leading-[1.15] font-semibold tracking-tight text-text md:text-[38px]">
          {title}
        </h1>
        {aside && <div className="text-[13px] text-text-muted">{aside}</div>}
      </div>
      {description && (
        <p className="mt-2 mb-0 max-w-[62ch] text-[16px] leading-6 text-text-muted">{description}</p>
      )}
    </header>
  );
}
