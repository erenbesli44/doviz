import ContentPage from '../components/layout/ContentPage';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function LegalNotice() {
  const title = 'Yasal Uyarı';
  const description =
    'Döviz Veri üzerinde yer alan finansal veriler yatırım tavsiyesi değildir. Veri gecikmeleri ve sağlayıcı farklılıkları olabilir.';

  return (
    <>
      <SeoHead
        path="/yasal-uyari"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Yasal Uyarı', path: '/yasal-uyari' },
          ]),
          collectionPageSchema(title, description, '/yasal-uyari'),
        ]}
      />
      <ContentPage title="Yasal Uyarı" subtitle="Sorumluluk ve Kullanım">
        <p>
          Bu platformda sunulan içerikler yalnızca bilgilendirme amaçlıdır. Yatırım tavsiyesi niteliği taşımaz.
        </p>
        <p>
          Finansal veri akışlarında sağlayıcı kaynaklı gecikmeler, farklı fiyat metodolojileri ve teknik kesintiler yaşanabilir.
          Karar almadan önce resmi kurumlar ve lisanslı aracı kuruluşlardan doğrulama yapılması önerilir.
        </p>
      </ContentPage>
    </>
  );
}
