import { Link } from 'react-router-dom';
import ContentPage from '../components/layout/ContentPage';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

const TERMS = [
  { id: 'spread', title: 'Spread', desc: 'Alış ve satış fiyatı arasındaki fark.' },
  { id: 'volatilite', title: 'Volatilite', desc: 'Fiyatın belirli dönemdeki oynaklığı.' },
  { id: 'ons-altin', title: 'Ons Altın', desc: 'Uluslararası altın fiyat standardı (troy ounce).' },
  { id: 'capraz-kur', title: 'Çapraz Kur', desc: 'USD dışındaki iki para birimi arasındaki kur.' },
  { id: 'piyasa-seansi', title: 'Piyasa Seansı', desc: 'İşlemlerin aktif olduğu zaman dilimi.' },
];

export default function Glossary() {
  const title = 'Finans Sözlüğü';
  const description =
    'Döviz, altın, endeks, emtia ve kripto piyasalarında geçen temel finans terimlerinin kısa açıklamaları.';

  return (
    <>
      <SeoHead
        path="/sozluk"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Finans Sözlüğü', path: '/sozluk' },
          ]),
          collectionPageSchema(title, description, '/sozluk'),
        ]}
      />
      <ContentPage title="Finans Sözlüğü" subtitle="Temel Kavramlar">
        {TERMS.map((term) => (
          <article key={term.id} id={term.id} className="border-b border-[var(--color-outline-variant)]/20 pb-4">
            <h3 className="text-lg font-semibold">{term.title}</h3>
            <p>{term.desc}</p>
          </article>
        ))}
        <p>
          Canlı veri sayfalarına geçmek için <Link className="text-[var(--color-primary)] underline" to="/doviz">Döviz</Link>,
          <Link className="text-[var(--color-primary)] underline ml-1" to="/altin">Altın</Link> ve
          <Link className="text-[var(--color-primary)] underline ml-1" to="/endeksler">Endeks</Link> kategorilerini inceleyin.
        </p>
      </ContentPage>
    </>
  );
}
