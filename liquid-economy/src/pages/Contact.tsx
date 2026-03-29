import ContentPage from '../components/layout/ContentPage';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';

export default function Contact() {
  const title = 'İletişim';
  const description =
    'Döviz Veri ile iletişime geçin. Geri bildirim, veri hatası bildirimi ve iş birliği talepleri için iletişim sayfası.';

  return (
    <>
      <SeoHead
        path="/iletisim"
        title={`${title} | Döviz Veri`}
        description={description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'İletişim', path: '/iletisim' },
          ]),
          collectionPageSchema(title, description, '/iletisim'),
        ]}
      />
      <ContentPage title="İletişim" subtitle="Geri Bildirim ve Destek">
        <p>
          Ürün geri bildirimi, veri uyuşmazlığı bildirimi veya iş birliği talepleri için bizimle iletişime geçebilirsiniz.
        </p>
        <p>
          E-posta: <a className="text-[var(--color-primary)] underline" href="mailto:iletisim@dovizveri.com">iletisim@dovizveri.com</a>
        </p>
      </ContentPage>
    </>
  );
}
