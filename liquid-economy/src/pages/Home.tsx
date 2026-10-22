/**
 * Home — / (Kim ne bekliyor?)
 *
 * One block per instrument: the latest clearly stated view of each
 * commentator (yükseliş / düşüş), newest first. Commentators with no clear
 * view on an instrument are not listed. News sits below as the evidence layer.
 */

import { Link } from 'react-router-dom';
import { useInstrumentViews } from '../hooks/useInstrumentViews';
import { useLatestNews } from '../hooks/useLatestNews';
import { useChannels } from '../hooks/useChannels';
import { ViewRow } from '../components/views/ViewRow';
import { StoryRow, StoryRowSkeleton } from '../components/news/Story';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import { INSTRUMENTS, INSTRUMENT_KEYS, personViews, profileHref, tally } from '../lib/views';

const DAYS = 60;
const ROWS = 5;
const NEWS_ROWS = 6;

export default function Home() {
  const views = useInstrumentViews(INSTRUMENT_KEYS, DAYS);
  const { status: newsStatus, stories } = useLatestNews(NEWS_ROWS);
  const { channels } = useChannels();

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
        Finans yorumcularının son {DAYS} günde açıkça söylediği beklenti: fiyat bundan sonra yükselir mi, düşer mi, yatay mı gider? Net bir yön söylemeyenler listelenmez.
      </p>

      <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
        {INSTRUMENTS.map((inst) => {
          const { status, opinions } = views[inst.key];
          const list = personViews(opinions);
          const t = tally(list);
          return (
            <section key={inst.key} aria-labelledby={`h-${inst.key}`}>
              <div className="section-head">
                <h2 id={`h-${inst.key}`}>
                  <Link to={`/piyasa/${inst.key}`} className="no-underline text-text hover:underline underline-offset-4">{inst.label}</Link>
                </h2>
                {status === 'success' && list.length > 0 && (
                  <span className="text-[12px] text-text-muted">
                    <span className="text-bull">↑ {t.up}</span> · <span className="text-bear">↓ {t.down}</span>
                    {t.flat > 0 && <> · <span className="text-neutral-sent">→ {t.flat}</span></>}
                  </span>
                )}
              </div>

              {status === 'loading' && (
                <div className="space-y-3 pt-3" aria-hidden="true">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-8" />)}
                </div>
              )}
              {status === 'error' && <p className="py-3 text-[14px] text-text-muted">Görüşler yüklenemedi.</p>}
              {status === 'success' && list.length === 0 && (
                <p className="py-3 text-[14px] text-text-muted">Son {DAYS} günde net görüş belirten olmadı.</p>
              )}
              {status === 'success' && list.length > 0 && (
                <>
                  <ul className="m-0 list-none p-0">
                    {list.slice(0, ROWS).map((v) => (
                      <ViewRow
                        key={v.person}
                        compact
                        person={v.person}
                        avatarUrl={v.avatarUrl}
                        personHref={profileHref(channels, v)}
                        direction={v.current.direction}
                        date={v.current.item.published_at}
                      />
                    ))}
                  </ul>
                  <Link to={`/piyasa/${inst.key}`} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-accent no-underline hover:underline underline-offset-4">
                    {list.length > ROWS ? `${list.length} kişinin görüşü` : 'Ne dediler'}
                    <Icon name="arrow-right" size={14} />
                  </Link>
                </>
              )}
            </section>
          );
        })}
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
