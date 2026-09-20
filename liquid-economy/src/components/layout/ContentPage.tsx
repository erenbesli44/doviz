import type { ReactNode } from 'react';
import PageHeader from './PageHeader';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Static text pages (about, methodology, …): a single readable column. */
export default function ContentPage({ title, subtitle, children }: Props) {
  return (
    <section className="measure mx-auto">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="prose-page">{children}</div>
    </section>
  );
}
