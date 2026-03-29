import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import FocusChart from '../components/ui/FocusChart';
import SeoHead from '../components/seo/SeoHead';
import { breadcrumbSchema, collectionPageSchema } from '../seo/schema';
import { SEO_SYMBOL_MAP, absoluteUrl } from '../seo/site';
import { api } from '../lib/apiClient';
import { quoteToAsset } from '../lib/adapters';
import { useHistory } from '../hooks/useHistory';
import type { Asset } from '../data/types';

export default function SymbolDetail() {
  const { slug = '' } = useParams();
  const seoSymbol = SEO_SYMBOL_MAP.get(slug);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyHours, setHistoryHours] = useState(24);

  const symbol = seoSymbol?.symbol ?? '';
  const { points, loading: historyLoading } = useHistory(symbol, historyHours);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    api.getQuote(symbol)
      .then((res) => {
        if (cancelled) return;
        setAsset(quoteToAsset(res));
      })
      .catch(() => {
        if (cancelled) return;
        setAsset(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const related = useMemo(() => {
    if (!seoSymbol) return [];
    return seoSymbol.related.map((rel) => SEO_SYMBOL_MAP.get(rel)).filter(Boolean);
  }, [seoSymbol]);

  if (!seoSymbol) {
    return (
      <section className="max-w-4xl">
        <SeoHead
          path="/"
          title="Sayfa Bulunamadı | Döviz Veri"
          description="İlgili enstrüman sayfası bulunamadı."
          robots="noindex,follow"
        />
        <PageHeader title="Enstrüman Bulunamadı" subtitle="404" />
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">
          <p>Aradığınız varlık sayfası mevcut değil.</p>
          <Link className="text-[var(--color-primary)] underline" to="/">Anasayfaya dön</Link>
        </div>
      </section>
    );
  }

  const pagePath = `/piyasa/${seoSymbol.slug}`;
  const title = `${seoSymbol.name} Canlı Fiyatı ve Grafik | Döviz Veri`;

  return (
    <section className="space-y-5">
      <SeoHead
        path={pagePath}
        title={title}
        description={seoSymbol.description}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Anasayfa', path: '/' },
            { name: 'Piyasa', path: '/piyasa' },
            { name: seoSymbol.name, path: pagePath },
          ]),
          collectionPageSchema(seoSymbol.name, seoSymbol.description, pagePath),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoSymbol.name,
            description: seoSymbol.description,
            url: absoluteUrl(pagePath),
          },
        ]}
      />

      <PageHeader title={seoSymbol.name} subtitle="Canlı Varlık Detayı" />

      {loading || !asset ? (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">
          <p>Veri yükleniyor...</p>
        </div>
      ) : (
        <FocusChart
          assetName={asset.name}
          assetCode={asset.code}
          price={asset.price}
          change={asset.change}
          history={points}
          historyLoading={historyLoading}
          icon={asset.icon}
          iconBg={asset.iconBg}
          onRangeChange={setHistoryHours}
        />
      )}

      <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-5 space-y-4 max-w-4xl">
        <h3 className="text-lg font-semibold">Sayfa Özeti</h3>
        <p>{seoSymbol.description}</p>
        <p>
          Bu sayfada fiyat, yüzde değişim, grafik ve son güncelleme bilgileri birlikte sunulur.
          Veri türüne göre canlı veya gecikmeli akış etiketi dikkate alınmalıdır.
        </p>
        {related.length > 0 && (
          <div>
            <h4 className="text-sm uppercase tracking-[0.1em] text-[var(--color-on-surface-variant)]/70 mb-2">İlgili Varlıklar</h4>
            <div className="flex flex-wrap gap-3">
              {related.map((item) => (
                <Link
                  key={item!.slug}
                  to={`/piyasa/${item!.slug}`}
                  className="rounded-full border border-[var(--color-outline-variant)]/30 px-3 py-1.5 text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {item!.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
