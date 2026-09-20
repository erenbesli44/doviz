import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  body: string;
  cta?: { label: string; href?: string; onClick?: () => void };
}

const CTA_CLASS =
  'mt-1 inline-flex h-10 cursor-pointer items-center rounded-[var(--r-chip)] border-0 bg-accent px-4 text-[14px] font-semibold text-on-accent no-underline hover:opacity-90';

/** Says why a list is empty and what the reader can do next. */
export function EmptyState({ title, body, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 border-y border-border py-8">
      <p className="m-0 font-serif text-[20px] font-semibold text-text">{title}</p>
      <p className="m-0 max-w-[52ch] text-[15px] leading-6 text-text-muted">{body}</p>
      {cta && (cta.href
        ? <Link to={cta.href} className={CTA_CLASS}>{cta.label}</Link>
        : <button onClick={cta.onClick} className={CTA_CLASS}>{cta.label}</button>)}
    </div>
  );
}
