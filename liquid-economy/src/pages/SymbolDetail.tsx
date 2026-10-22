/**
 * SymbolDetail — /piyasa/:slug  (slug = topic_key: dolar-tl, bist, altin, …)
 *
 * "Dolar/TL: kim ne bekliyor?" — one row per commentator with their latest
 * clearly stated view, what they said, a link to the video moment, and the
 * view they held before it. No aggregate score, no chart.
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInstrumentViews } from '../hooks/useInstrumentViews';
import { useSSEQuotes } from '../hooks/useSSEQuotes';
import { useChannels } from '../hooks/useChannels';
import { ViewRow } from '../components/views/ViewRow';
import { EmptyState } from '../components/consensus/EmptyState';
import SeoHead from '../components/seo/SeoHead';
import { assetFromSlug } from '../data/assetMap';
import { formatPrice } from '../lib/adapters';
import { INSTRUMENTS, excerpt, instrumentLabel, personViews, tally } from '../lib/views';

const DAYS = 365;

function LivePrice({ symbol }: { symbol: string }) {
  const symbols = useMemo(() => [symbol], [symbol]);
  const { quotes } = useSSEQuotes(symbols);
  const q = quotes[symbol];
  if (!q) return null;
  const up = q.data.change_pct >= 0;
  return (
    <p className="m-0 text-[15px] text-text-muted">
      <span className="font-semibold text-text">{formatPrice(q.data.price, q.data.symbol, q.data.currency)}</span>
      {' '}{q.data.currency}{' '}
      <span className={up ? 'text-bull' : 'text-bear'}>{up ? '↑' : '↓'} %{Math.abs(q.data.change_pct).toFixed(2)}</span>
      {!q.meta.is_live && <span className="text-text-subtle"> · gecikmeli</span>}
    </p>
  );
}

export default function SymbolDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const meta = assetFromSlug(slug);
  const label = instrumentLabel(slug);
  const keys = useMemo(() => [slug], [slug]);
  const { status, opinions } = useInstrumentViews(keys, DAYS)[slug];
  const { channels } = useChannels();
  const slugOf = (channelName: string) => channels.find((c) => c.name === channelName)?.slug;

  const list = personViews(opinions);
  const t = tally(list);
  const known = INSTRUMENTS.some((i) => i.key === slug);

  return (
    <div className="lg:max-w-[760px]">
      <SeoHead
        path={`/piyasa/${slug}`}
        title={`${label}: Kim Ne Bekliyor? | Döviz Veri`}
        description={`${label} için finans yorumcularının açıkça belirttiği beklentiler, ne dedikleri ve önceki görüşleri.`}
      />
      <Link to="/" className="text-[13px] font-semibold text-text-muted no-underline hover:underline underline-offset-4">← Kim ne bekliyor</Link>

      <header className="mt-3 mb-6 border-b border-border pb-5">
        <h1 className="m-0 font-serif text-[30px] leading-tight font-semibold tracking-tight text-text md:text-[38px]">
          {label}: kim ne bekliyor?
        </h1>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {meta && <LivePrice symbol={meta.symbol} />}
          {status === 'success' && list.length > 0 && (
            <p className="m-0 text-[14px] text-text-muted">
              {list.length} kişi · <span className="text-bull">↑ {t.up} yükseliş</span> · <span className="text-bear">↓ {t.down} düşüş</span> · son 12 ay
            </p>
          )}
        </div>
      </header>

      {!known && status !== 'loading' && (
        <EmptyState title="Bu sayfa yok" body="Takip edilen araçlar ana sayfada listelenir." cta={{ label: 'Ana sayfaya dön', href: '/' }} />
      )}

      {status === 'loading' && (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      )}
      {status === 'error' && <p role="alert" className="py-6 text-[15px] text-text-muted">Görüşler şu anda yüklenemedi.</p>}
      {status === 'success' && known && list.length === 0 && (
        <EmptyState title="Net görüş yok" body={`Son 12 ayda ${label} için açıkça yön belirten bir yorumcu bulunmuyor.`} cta={{ label: 'Haberlere git', href: '/haberler' }} />
      )}

      {status === 'success' && list.length > 0 && (
        <ul className="m-0 list-none p-0">
          {list.map((v) => (
            <ViewRow
              key={v.person}
              person={v.person}
              avatarUrl={v.avatarUrl}
              personHref={slugOf(v.channelName) ? `/uzmanlar/${slugOf(v.channelName)}` : undefined}
              sentiment={v.current.sentiment}
              date={v.current.published_at}
              quote={excerpt(v.current.summary)}
              videoUrl={v.current.video_url}
              startSec={v.current.start_time_seconds}
              storyHref={`/haberler/${v.current.video_id}`}
              previous={v.previous ? { sentiment: v.previous.sentiment, date: v.previous.published_at } : null}
              changed={v.changed}
            />
          ))}
        </ul>
      )}

      <p className="mt-10 text-[12px] leading-5 text-text-subtle">
        Her satır konuşmacının kendi videosundaki ifadesine dayanır; net yön belirtmeyenler listelenmez. Yatırım danışmanlığı kapsamında değildir.
        Yanlış mı aktardık? <Link to="/iletisim" className="link">Bildirin</Link>.
      </p>
    </div>
  );
}
