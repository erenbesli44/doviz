import type { ReactNode } from 'react';
import PageHeader from './PageHeader';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function ContentPage({ title, subtitle, children }: Props) {
  return (
    <section className="max-w-4xl">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-5 md:p-7 space-y-5 text-[15px] leading-7 text-[var(--color-on-surface)]">
        {children}
      </div>
    </section>
  );
}
