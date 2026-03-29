import { Link } from 'react-router-dom';
import ContentPage from '../components/layout/ContentPage';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function DataSources() {
  const title = 'Veri Kaynakları';
  const description =
    'Döviz, altın, endeks, emtia ve kripto verilerinde kullanılan sağlayıcılar, gecikme durumu ve güncelleme yaklaşımı.';

  return (
    <>
      <SeoHead
        path="/veri-kaynaklari"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Veri Kaynakları', path: '/veri-kaynaklari' },
          ]),
          collectionPageSchema(title, description, '/veri-kaynaklari'),
        ]}
      />
      <ContentPage title="Veri Kaynakları" subtitle="Kaynak ve Gecikme Bilgisi">
        <p>
          Platformda varlık türüne göre farklı sağlayıcılar kullanılabilir. Sağlayıcı kapsaması, plan limitleri ve
          piyasa türüne göre canlı veya gecikmeli veri sunulabilir.
        </p>
        <p>
          Finansal verilerde sağlayıcılar arasında küçük farklar oluşabilir. Bu nedenle her enstrümanda mümkün olan
          en tutarlı kaynak zinciri uygulanır ve gerektiğinde yedek sağlayıcı devreye girer.
        </p>
        <p>
          Piyasa kapalıyken yanıltıcı canlı değişim yerine son geçerli seans değerleri korunur.
          Kripto varlıklar 7/24 işlem gördüğü için ayrı akış mantığı ile ele alınır.
        </p>
        <p>
          Hesaplama ve gösterim kuralları için <Link className="text-[var(--color-primary)] underline" to="/metodoloji">Metodoloji</Link> sayfasını inceleyin.
        </p>
      </ContentPage>
    </>
  );
}
