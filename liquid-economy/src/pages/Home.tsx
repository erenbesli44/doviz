/**
 * Home — / (Kim ne bekliyor?)
 *
 * One tile per instrument: the verdict over the shared counting window, one
 * bar segment per person, the live price and the latest changes of view.
 * Below it, everyone who changed their view in the window. The latest-video
 * views and the news sit underneath as the evidence layer.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInstrumentViews } from '../hooks/useInstrumentViews';
import { useLatestNews } from '../hooks/useLatestNews';
import { useChannels } from '../hooks/useChannels';
import { useSSEQuotes } from '../hooks/useSSEQuotes';
import { LatestVideoInsights } from '../components/views/LatestVideoInsights';
import { ChangeText, PersonBar, TallyLine, VerdictText } from '../components/views/Verdict';
import { latestVideoInsights } from '../lib/latestInsights';
import { StoryRow, StoryRowSkeleton } from '../components/news/Story';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import { assetFromSlug } from '../data/assetMap';
import { formatPrice } from '../lib/adapters';
import type { QuoteResponse } from '../data/api-types';
import {
  INSTRUMENTS, INSTRUMENT_KEYS, VIEW_WINDOW_DAYS as DAYS, formatDate, inWindow, personViews, profileHref,
  type PersonView,
} from '../lib/views';

// Full history, like the instrument page: a change of view needs the view before it.
const HISTORY_DAYS = 365;
const TILE_CHANGES = 3;
const STRIP_CHANGES = 8;
const NEWS_ROWS = 6;
const NEWS_SCAN = 20; // newest videos scanned for the lead section

const SYMBOLS = INSTRUMENT_KEYS.map((k) => assetFromSlug(k)?.symbol).filter((s): s is string => !!s);

function TilePrice({ quote }: { quote?: QuoteResponse }) {
  if (!quote) return null;
  const up = quote.data.change_pct >= 0;
  return (
    <span className="text-[13px] text-text-muted">
      <span className="font-semibold text-text">{formatPrice(quote.data.price, quote.data.symbol, quote.data.currency)}</span>
      {' '}{quote.data.currency}{' '}
      <span className={up ? 'text-bull' : 'text-bear'}>{up ? '↑' : '↓'} %{Math.abs(quote.data.change_pct).toFixed(2)}</span>
    </span>
  );
}

function InstrumentTile({ instKey, label, status, views, quote, channels }: {
  instKey: string;
  label: string;
  status: 'loading' | 'success' | 'error';
  views: PersonView[];
  quote?: QuoteResponse;
  channels: { name: string; slug: string }[];
}) {
  const changes = views.filter((v) => v.changed && v.previous).slice(0, TILE_CHANGES);
  return (
    <section aria-labelledby={`h-${instKey}`} className="flex flex-col gap-3 rounded-[var(--r-hero)] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`h-${instKey}`} className="m-0 text-[12px] font-semibold tracking-[0.08em] text-text-muted uppercase">
          <Link to={`/piyasa/${instKey}`} className="no-underline text-text-muted hover:underline underline-offset-4">{label}</Link>
        </h3>
        <TilePrice quote={quote} />
      </div>

      {status === 'loading' && (
        <div className="space-y-3" aria-hidden="true">
          <div className="skeleton h-7 w-4/5" />
          <div className="skeleton h-2.5" />
        </div>
      )}
      {status === 'error' && <p className="m-0 text-[14px] text-text-muted">Görüşler yüklenemedi.</p>}
      {status === 'success' && views.length === 0 && (
        <p className="m-0 text-[14px] text-text-muted">Son {DAYS} günde net görüş belirten olmadı.</p>
      )}
      {status === 'success' && views.length > 0 && (
        <>
          <p className="m-0 font-serif text-[21px] leading-snug font-semibold tracking-tight text-text">
            <VerdictText views={views} />
          </p>
          <div>
            <PersonBar views={views} />
            <TallyLine views={views} />
          </div>
          {changes.length > 0 && (
            <ul className="m-0 grid list-none gap-1.5 border-t border-border p-0 pt-3 text-[13px]">
              {changes.map((v) => {
                const href = profileHref(channels, v);
                return (
                  <li key={v.person} className="flex flex-wrap items-baseline justify-between gap-x-3">
                    {href
                      ? <Link to={href} className="headline-link text-text">{v.person}</Link>
                      : <span className="text-text">{v.person}</span>}
                    <ChangeText from={v.previous!.direction} to={v.current.direction} />
                  </li>
                );
              })}
            </ul>
          )}
          <Link to={`/piyasa/${instKey}`} className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold text-accent no-underline hover:underline underline-offset-4">
            {views.length} kişinin görüşü ve sözleri
            <Icon name="arrow-right" size={14} />
          </Link>
        </>
      )}
    </section>
  );
}

export default function Home() {
  const views = useInstrumentViews(INSTRUMENT_KEYS, HISTORY_DAYS);
  const { status: newsStatus, stories: scanned } = useLatestNews(NEWS_SCAN);
  const stories = scanned.slice(0, NEWS_ROWS);
  const { channels } = useChannels();
  const symbols = useMemo(() => SYMBOLS, []);
  const { quotes } = useSSEQuotes(symbols);

  const viewsLoading = INSTRUMENT_KEYS.some((k) => views[k].status === 'loading');
  const lead = latestVideoInsights(
    scanned,
    Object.fromEntries(INSTRUMENT_KEYS.map((k) => [k, views[k].opinions])),
  );

  const counted = Object.fromEntries(
    INSTRUMENTS.map((inst) => [inst.key, personViews(views[inst.key].opinions).filter((v) => inWindow(v))]),
  );
  const allChanges = INSTRUMENTS
    .flatMap((inst) => counted[inst.key].filter((v) => v.changed && v.previous).map((v) => ({ inst, v })))
    .sort((a, b) => (b.v.current.item.published_at || '').localeCompare(a.v.current.item.published_at || ''));

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

  return (
    <>
      <SeoHead
        path="/"
        title="Kim Ne Bekliyor? Dolar, BIST 100, Altın İçin Uzman Görüşleri | Döviz Veri"
        description="YouTube'daki finans yorumcuları dolar, BIST 100, altın, Bitcoin ve ABD borsaları için ne bekliyor? Kişi kişi güncel görüş, önceki görüşle karşılaştırma ve videoya bağlantı."
      />

      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="m-0 font-serif text-[30px] leading-tight font-semibold tracking-tight text-text md:text-[38px]">
          Kim ne bekliyor?
        </h1>
        <p className="m-0 text-[13px] text-text-muted first-letter:uppercase">{today}</p>
      </header>
      <p className="mt-0 mb-8 max-w-[62ch] text-[15px] leading-6 text-text-muted">
        Finans yorumcularının son {DAYS} günde açıkça söylediği beklenti: fiyat bundan sonra yükselir mi, düşer mi, yatay mı gider? Her sayı aynı pencereden: kişi başına en son görüş. Net bir yön söylemeyenler sayılmaz.
      </p>

      <section aria-labelledby="araclara-gore">
        <div className="section-head mb-4"><h2 id="araclara-gore">Araçlara göre</h2></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {INSTRUMENTS.map((inst) => (
            <InstrumentTile
              key={inst.key}
              instKey={inst.key}
              label={inst.label}
              status={views[inst.key].status}
              views={counted[inst.key]}
              quote={quotes[assetFromSlug(inst.key)?.symbol ?? '']}
              channels={channels}
            />
          ))}
        </div>
      </section>

      {!viewsLoading && allChanges.length > 0 && (
        <section aria-labelledby="fikrini-degistirenler" className="mt-12">
          <div className="section-head">
            <h2 id="fikrini-degistirenler">Son {DAYS} günde fikrini değiştirenler</h2>
            <span className="text-[13px] text-text-muted">{allChanges.length} değişiklik</span>
          </div>
          <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {allChanges.slice(0, STRIP_CHANGES).map(({ inst, v }) => {
              const href = profileHref(channels, v);
              return (
                <li key={`${inst.key}:${v.person}`} className="border-l-[3px] border-warn py-1 pl-3">
                  <p className="m-0 text-[15px] font-semibold text-text">
                    {href ? <Link to={href} className="headline-link text-text">{v.person}</Link> : v.person}
                    {' · '}
                    <Link to={`/piyasa/${inst.key}`} className="headline-link text-text">{inst.label}</Link>
                  </p>
                  <p className="m-0 text-[14px]">
                    <ChangeText from={v.previous!.direction} to={v.current.direction} />
                    <span className="text-text-muted"> · {formatDate(v.current.item.published_at)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-12">
        <LatestVideoInsights items={lead} loading={newsStatus === 'loading' || viewsLoading} />
      </div>

      <section aria-labelledby="son-haberler" className="mt-14 lg:max-w-[760px]">
        <div className="section-head">
          <h2 id="son-haberler">Kaynak: son videolar</h2>
          <Link to="/haberler" className="text-[13px] font-semibold text-accent no-underline hover:underline underline-offset-4">Tümü</Link>
        </div>
        {newsStatus === 'loading'
          ? Array.from({ length: 4 }).map((_, i) => <StoryRowSkeleton key={i} />)
          : stories.map((s) => <StoryRow key={s.video.id} story={s} />)}
        {newsStatus === 'error' && <p className="py-3 text-[14px] text-text-muted">Haberler yüklenemedi.</p>}
      </section>

      <p className="mt-10 text-[12px] leading-5 text-text-subtle">
        Görüşler konuşmacılara aittir ve videolarından derlenmiştir. Yatırım danışmanlığı kapsamında değildir.
      </p>
    </>
  );
}
