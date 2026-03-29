import { Link } from 'react-router-dom';
import ContentPage from '../components/layout/ContentPage';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Methodology() {
  const title = 'Metodoloji ve Hesaplama Yaklaşımı';
  const description =
    'Döviz Veri platformunda canlı, gecikmeli ve kapalı piyasa verilerinin nasıl işlendiğini, değişim oranlarının hangi baz ile hesaplandığını öğrenin.';

  return (
    <>
      <SeoHead
        path="/metodoloji"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Metodoloji', path: '/metodoloji' },
          ]),
          collectionPageSchema(title, description, '/metodoloji'),
        ]}
      />
      <ContentPage title="Metodoloji" subtitle="Veri ve Hesaplama Şeffaflığı">
        <p>
          Döviz Veri, piyasa verisini farklı sağlayıcılardan toplayıp tek bir formatta sunar.
          Amaç, Türkiye kullanıcıları için canlı fiyat, değişim ve oturum bilgilerini açık biçimde göstermektir.
        </p>
        <p>
          Değişim yüzdesi her enstrümanda doğru bazdan hesaplanır: piyasa açıkken aktif oturum baz alınır,
          piyasa kapalıyken son tamamlanan seans değeri korunur. Kripto varlıklarda 7/24 akış dikkate alınır.
        </p>
        <p>
          Sayfalardaki “canlı”, “gecikmeli” ve “son güncelleme” etiketleri veri akış türünü açıklamak için kullanılır.
          Böylece kullanıcılar fiyatın gerçek zamanlı mı yoksa gecikmeli mi olduğunu açıkça görebilir.
        </p>
        <p>
          Detaylar için <Link className="text-[var(--color-primary)] underline" to="/veri-kaynaklari">Veri Kaynakları</Link> sayfasına,
          piyasa terimleri için <Link className="text-[var(--color-primary)] underline" to="/sozluk">Finans Sözlüğü</Link> sayfasına bakabilirsiniz.
        </p>
      </ContentPage>
    </>
  );
}
