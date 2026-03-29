import ContentPage from '../components/layout/ContentPage';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function About() {
  const title = 'Hakkımızda';
  const description =
    'Döviz Veri: Türkiye kullanıcıları için döviz, altın, endeks, emtia ve kripto piyasalarında sade ve güvenilir veri deneyimi.';

  return (
    <>
      <SeoHead
        path="/hakkimizda"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Hakkımızda', path: '/hakkimizda' },
          ]),
          collectionPageSchema(title, description, '/hakkimizda'),
        ]}
      />
      <ContentPage title="Hakkımızda" subtitle="Ürün ve Vizyon">
        <p>
          Döviz Veri, Türkiye odaklı finansal piyasa takibini sade ve anlaşılır hale getirmek için geliştirilmiş bir web uygulamasıdır.
          Odak nokta; doğru veri, net sunum ve kullanıcı güvenidir.
        </p>
        <p>
          Üründe döviz, altın, kapalıçarşı göstergeleri, endeks, emtia ve kripto varlıkları
          tek bir deneyimde birleştiriyoruz. Gereksiz görsel karmaşa yerine okunabilirlik ve hız önceliğini koruyoruz.
        </p>
      </ContentPage>
    </>
  );
}
