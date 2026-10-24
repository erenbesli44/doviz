/**
 * SymbolDetail — /piyasa/:slug  (slug = topic_key: dolar-tl, bist, altin, …)
 *
 * "Dolar/TL: kim ne bekliyor?" — a one-line verdict over the shared counting
 * window, then one row per commentator with their latest clearly stated view,
 * what they said, a link to the video moment, and the view they held before
 * it. Views older than the window are listed below and not counted.
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
import {
  DIRECTION_ARROW, EXPECTATION_WORD, INSTRUMENTS, VIEW_WINDOW_DAYS, instrumentLabel, inWindow, numeralSuffix,
  personViews, profileHref, quoteOf, tally, verdictOf, type Direction, type PersonView,
} from '../lib/views';

const DAYS = 365; // history, so the previous view and older views can be shown

const TONE: Record<Direction, string> = { up: 'text-bull', down: 'text-bear', flat: 'text-neutral-sent' };

function VerdictLine({ views }: { views: PersonView[] }) {
  const v = verdictOf(views);
  if (!v) return null;
  const changed = views.filter((x) => x.changed).length;
  return (
    <>
      <p className="mt-4 mb-0 font-serif text-[22px] leading-snug font-semibold tracking-tight text-text md:text-[26px]">
        {v.kind === 'majority' && (
          <>{v.total} yorumcudan <span className={TONE[v.direction]}>{DIRECTION_ARROW[v.direction]} {v.count}{numeralSuffix(v.count)} {EXPECTATION_WORD[v.direction]}</span> bekliyor</>
        )}
        {v.kind === 'split' && <>Görüşler <span className="text-neutral-sent">bölünmüş</span></>}
        {v.kind === 'few' && <>Son {VIEW_WINDOW_DAYS} günde yalnızca {v.total} yorumcu net görüş bildirdi</>}
      </p>
      {changed > 0 && <p className="mt-1 mb-0 text-[14px] text-text-muted">{changed} yorumcu görüşünü değiştirdi.</p>}
    </>
  );
}

function ViewList({ views, channels }: { views: PersonView[]; channels: { name: string; slug: string }[] }) {
  if (views.length === 0) return null;
  return (
    <ul className="m-0 list-none p-0">
      {views.map((v) => (
        <ViewRow
          key={v.person}
          person={v.person}
          avatarUrl={v.avatarUrl}
          personHref={profileHref(channels, v)}
          direction={v.current.direction}
          date={v.current.item.published_at}
          horizon={v.current.item.outlook_horizon}
          quote={quoteOf(v.current.item)}
          videoUrl={v.current.item.video_url}
          startSec={v.current.item.start_time_seconds}
          storyHref={`/haberler/${v.current.item.video_id}`}
          previous={v.previous ? { direction: v.previous.direction, date: v.previous.item.published_at } : null}
          details={{
            summary: v.current.item.summary,
            keyLevels: v.current.item.key_levels,
            horizon: v.current.item.outlook_horizon,
            videoUrl: v.current.item.video_url,
            startSec: v.current.item.start_time_seconds,
            storyHref: `/haberler/${v.current.item.video_id}`,
          }}
          changed={v.changed}
        />
      ))}
    </ul>
  );
}

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

  const all = personViews(opinions);
  const list = all.filter((v) => inWindow(v));
  const older = all.filter((v) => !inWindow(v));
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
        {status === 'success' && <VerdictLine views={list} />}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {meta && <LivePrice symbol={meta.symbol} />}
          {status === 'success' && list.length > 0 && (
            <p className="m-0 text-[14px] text-text-muted">
              {list.length} kişi · <span className="text-bull">↑ {t.up} yükseliş</span> · <span className="text-bear">↓ {t.down} düşüş</span>
              {t.flat > 0 && <> · <span className="text-neutral-sent">→ {t.flat} yatay</span></>} · son {VIEW_WINDOW_DAYS} gün
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
      {status === 'success' && known && all.length === 0 && (
        <EmptyState title="Net görüş yok" body={`Son 12 ayda ${label} için açıkça yön belirten bir yorumcu bulunmuyor.`} cta={{ label: 'Haberlere git', href: '/haberler' }} />
      )}
      {status === 'success' && list.length === 0 && older.length > 0 && (
        <p className="py-3 text-[15px] text-text-muted">Son {VIEW_WINDOW_DAYS} günde {label} için net yön belirten olmadı.</p>
      )}

      {status === 'success' && <ViewList views={list} channels={channels} />}

      {status === 'success' && older.length > 0 && (
        <section aria-labelledby="eski-gorusler" className="mt-10">
          <div className="section-head">
            <h2 id="eski-gorusler">Daha eski görüşler</h2>
          </div>
          <p className="mt-2 mb-0 text-[13px] text-text-muted">
            Son {VIEW_WINDOW_DAYS} günde yeni görüş bildirmeyenler; yukarıdaki sayıya katılmaz.
          </p>
          <ViewList views={older} channels={channels} />
        </section>
      )}

      <p className="mt-10 text-[12px] leading-5 text-text-subtle">
        Her satır konuşmacının videoda söylediği ileriye dönük beklentiye dayanır; geçmiş fiyat hareketini aktaranlar ve net yön söylemeyenler listelenmez. Yatırım danışmanlığı kapsamında değildir.
        Yanlış mı aktardık? <Link to="/iletisim" className="link">Bildirin</Link>.
      </p>
    </div>
  );
}
