/**
 * Konular — /konular
 *
 * Two parts under one jump index (recognition over recall):
 *   Araçlar  the 7 instruments with explicit views: the verdict, person bar
 *            and count from the same helpers as the home tiles and
 *            /piyasa/<key>, the latest named views and changes of view.
 *   Gündem   faiz, enflasyon, jeopolitik, iç siyaset: the tracker's dated
 *            context summary. These have no explicit-view data, so no
 *            direction or confidence is shown.
 * Each part loads, fails and empties on its own. `?highlight=<key>` (news and
 * search links) scrolls to and marks the section for any of the 11 keys.
 *
 * Data: useInstrumentViews (opinions per instrument) and useConsensusDashboard
 * (GET /v1/inference/latest, gündem keys only).
 */

import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInstrumentViews } from '../hooks/useInstrumentViews';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { useChannels } from '../hooks/useChannels';
import { ViewRow } from '../components/views/ViewRow';
import { ChangeText, PersonBar, TallyLine, VerdictText } from '../components/views/Verdict';
import AgendaSection from '../components/topics/AgendaSection';
import PageHeader from '../components/layout/PageHeader';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import type { TopicOpinion } from '../data/consensus-types';
import {
  INSTRUMENTS, INSTRUMENT_KEYS, VIEW_WINDOW_DAYS as DAYS, inWindow, personViews, profileHref, quoteOf,
  type DatedView, type PersonView,
} from '../lib/views';

// Same history as home and /piyasa/<key>: a change of view needs the view before it.
const HISTORY_DAYS = 365;
const LATEST_VIEWS = 3;
const SECTION_CHANGES = 3;

const AGENDA = [
  { key: 'faiz',       label: 'Faiz' },
  { key: 'enflasyon',  label: 'Enflasyon' },
  { key: 'jeopolitik', label: 'Jeopolitik' },
  { key: 'ic-siyaset', label: 'İç Siyaset' },
];

type Channel = { name: string; slug: string };
type Changed = PersonView & { previous: DatedView<TopicOpinion> };
const isChange = (v: PersonView): v is Changed => v.changed && v.previous !== null;

function jumpTo(topicKey: string) {
  document.getElementById(`konu-${topicKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function InstrumentSection({ instKey, label, status, views, channels, highlighted }: {
  instKey: string;
  label: string;
  status: 'loading' | 'success' | 'error';
  views: PersonView[];
  channels: Channel[];
  highlighted: boolean;
}) {
  const changes = views.filter(isChange).slice(0, SECTION_CHANGES);
  return (
    <section
      id={`konu-${instKey}`}
      aria-labelledby={`konu-baslik-${instKey}`}
      className={`scroll-mt-20 border-t border-border py-7 md:grid md:grid-cols-[230px_1fr] md:gap-8 ${
        highlighted ? 'border-l-2 border-l-accent pl-4 md:pl-5' : ''
      }`}
    >
      <div>
        <h3 id={`konu-baslik-${instKey}`} className="m-0 font-serif text-[23px] leading-tight font-semibold text-text">
          <Link to={`/piyasa/${instKey}`} className="headline-link text-text">{label}</Link>
        </h3>
        {status === 'loading' && (
          <div className="mt-3 space-y-3" aria-hidden="true">
            <div className="skeleton h-6 w-4/5" />
            <div className="skeleton h-2.5" />
          </div>
        )}
        {status === 'success' && views.length > 0 && (
          <>
            <p className="mt-2.5 mb-0 font-serif text-[19px] leading-snug font-semibold tracking-tight text-text">
              <VerdictText views={views} />
            </p>
            <div className="mt-3">
              <PersonBar views={views} />
              <TallyLine views={views} />
            </div>
            <p className="mt-2 mb-0 text-[13px] leading-5 text-text-muted">
              {views.length} kişi · son {DAYS} gün · kişi başına en son görüş.
            </p>
          </>
        )}
      </div>

      <div className="mt-4 min-w-0 md:mt-0">
        {status === 'loading' && (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
          </div>
        )}
        {status === 'error' && <p className="m-0 text-[15px] text-text-muted">Görüşler şu anda yüklenemedi.</p>}
        {status === 'success' && views.length === 0 && (
          <p className="m-0 text-[15px] text-text-muted">Son {DAYS} günde net görüş belirten olmadı.</p>
        )}
        {status === 'success' && views.length > 0 && (
          <>
            <ul className="m-0 list-none p-0">
              {views.slice(0, LATEST_VIEWS).map((v) => (
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
                />
              ))}
            </ul>
            {changes.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="m-0 text-[13px] font-semibold text-text-muted">Fikrini değiştirenler</p>
                <ul className="m-0 mt-1.5 grid list-none gap-1.5 p-0 text-[14px]">
                  {changes.map((v) => {
                    const href = profileHref(channels, v);
                    return (
                      <li key={v.person} className="flex flex-wrap items-baseline gap-x-3">
                        {href
                          ? <Link to={href} className="headline-link text-text">{v.person}</Link>
                          : <span className="text-text">{v.person}</span>}
                        <ChangeText from={v.previous.direction} to={v.current.direction} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <Link to={`/piyasa/${instKey}`} className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-accent no-underline hover:underline underline-offset-4">
              Tüm görüşler
              <Icon name="arrow-right" size={14} />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

function JumpGroup({ label, items }: { label: string; items: { key: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-[13px] font-semibold text-text-muted">{label}</span>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {items.map((t) => (
          <li key={t.key}>
            <button
              onClick={() => jumpTo(t.key)}
              className="inline-flex h-9 cursor-pointer items-center rounded-[var(--r-chip)] border border-border bg-transparent px-3 text-[14px] font-semibold text-text transition-colors hover:border-text"
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Konular() {
  const views = useInstrumentViews(INSTRUMENT_KEYS, HISTORY_DAYS);
  const { status: agendaStatus, generatedAt, getTopic } = useConsensusDashboard();
  const { channels } = useChannels();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');
  const scrolledRef = useRef(false);

  // Scroll once both parts have settled, so nothing above the target still changes height.
  const viewsLoading = INSTRUMENT_KEYS.some((k) => views[k].status === 'loading');
  const settled = !viewsLoading && agendaStatus !== 'loading';

  useEffect(() => {
    if (!highlight || !settled || scrolledRef.current) return;
    scrolledRef.current = true;
    requestAnimationFrame(() => jumpTo(highlight));
  }, [highlight, settled]);

  return (
    <section className="mx-auto max-w-[920px]">
      <SeoHead
        path="/konular"
        title="Konular | Döviz Veri"
        description="Dolar/TL, BIST 100, Altın, Bitcoin ve diğer araçlar için finans yorumcularının açıkça söylediği beklentiler; faiz, enflasyon, jeopolitik ve iç siyaset için tarihli gündem özeti."
      />

      <PageHeader
        title="Konular"
        description={`Her araç için yorumcuların son ${DAYS} günde açıkça söylediği beklenti: kim ne bekliyor, kim fikrini değiştirdi. Altta faiz, enflasyon, jeopolitik ve iç siyaset için videolardan derlenen gündem özeti; bu özetler bir yön beklentisi değildir.`}
      />

      <nav aria-label="Konu dizini" className="mb-2 space-y-2 border-t-2 border-rule pt-4">
        <JumpGroup label="Araçlar" items={INSTRUMENTS} />
        <JumpGroup label="Gündem" items={AGENDA} />
      </nav>

      <section aria-labelledby="konular-araclar" className="mt-8">
        <div className="section-head"><h2 id="konular-araclar">Araçlar: kim ne bekliyor?</h2></div>
        <div className="mt-2">
          {INSTRUMENTS.map((inst) => (
            <InstrumentSection
              key={inst.key}
              instKey={inst.key}
              label={inst.label}
              status={views[inst.key].status}
              views={personViews(views[inst.key].opinions).filter((v) => inWindow(v))}
              channels={channels}
              highlighted={inst.key === highlight}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="konular-gundem" className="mt-12">
        <div className="section-head"><h2 id="konular-gundem">Gündem özeti</h2></div>
        <p className="mt-2 mb-0 max-w-[62ch] text-[14px] leading-6 text-text-muted">
          Videolarda bu konularda konuşulanların derlemesi. Kişilerin açık yön beklentisi bu konular için henüz ayrıştırılmıyor.
        </p>
        <div className="mt-2">
          {AGENDA.map((a) => (
            <AgendaSection
              key={a.key}
              topicKey={a.key}
              label={a.label}
              status={agendaStatus}
              topic={getTopic(a.key)}
              generatedAt={generatedAt}
              highlighted={a.key === highlight}
            />
          ))}
        </div>
      </section>

      <p className="mt-10 text-[12px] leading-5 text-text-subtle">
        Görüşler konuşmacılara aittir ve videolarından derlenmiştir. Yatırım danışmanlığı kapsamında değildir.
        Yanlış mı aktardık? <Link to="/iletisim" className="link">Bildirin</Link>.
      </p>
    </section>
  );
}
