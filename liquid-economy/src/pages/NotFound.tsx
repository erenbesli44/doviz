import { Link } from 'react-router-dom';
import SeoHead from '../components/seo/SeoHead';
import PageHeader from '../components/layout/PageHeader';

export default function NotFound() {
  return (
    <section className="max-w-4xl">
      <SeoHead
        path="/404"
        title="Sayfa Bulunamadı | Döviz Veri"
        description="Aradığınız sayfa bulunamadı."
        robots="noindex,follow"
      />
      <PageHeader title="Sayfa Bulunamadı" subtitle="404" />
      <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">
        <p className="mb-3">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <Link className="text-[var(--color-primary)] underline" to="/">Anasayfaya dön</Link>
      </div>
    </section>
  );
}
