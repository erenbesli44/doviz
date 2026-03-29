import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import SeoHead from '../components/seo/SeoHead';
import { SEO_SYMBOLS } from '../seo/site';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function SymbolDirectory() {
  const title = 'Piyasa Enstrümanları';
  const description = 'Döviz, altın, kapalıçarşı, endeks, emtia ve kripto için çekirdek enstrüman sayfaları.';

  return (
    <section className="max-w-5xl">
      <SeoHead
        path="/piyasa"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Piyasa', path: '/piyasa' },
          ]),
          collectionPageSchema(title, description, '/piyasa'),
        ]}
      />
      <PageHeader title={title} subtitle="Kategori Bazlı Liste" />
      <div className="grid md:grid-cols-2 gap-3">
        {SEO_SYMBOLS.map((item) => (
          <Link
            key={item.slug}
            to={`/piyasa/${item.slug}`}
            className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white px-4 py-3 hover:border-[var(--color-primary)]"
          >
            <p className="text-sm font-semibold">{item.name}</p>
            <p className="text-xs text-[var(--color-on-surface-variant)]/75">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
