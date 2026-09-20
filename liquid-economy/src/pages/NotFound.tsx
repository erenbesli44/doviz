import { Link } from 'react-router-dom';
import SeoHead from '../components/seo/SeoHead';
import PageHeader from '../components/layout/PageHeader';

export default function NotFound() {
  return (
    <section className="measure mx-auto">
      <SeoHead
        path="/404"
        title="Sayfa Bulunamadı | Döviz Veri"
        description="Aradığınız sayfa bulunamadı."
        robots="noindex,follow"
      />
      <PageHeader title="Sayfa bulunamadı" subtitle="404" />
      <p className="text-[17px] leading-7 text-text-muted">
        Aradığınız sayfa mevcut değil ya da taşınmış olabilir.
      </p>
      <p className="flex flex-wrap gap-x-5 gap-y-2 text-[16px]">
        <Link className="link" to="/">Gündeme dön</Link>
        <Link className="link" to="/haberler">Tüm haberler</Link>
        <Link className="link" to="/ara">Sitede ara</Link>
      </p>
    </section>
  );
}
