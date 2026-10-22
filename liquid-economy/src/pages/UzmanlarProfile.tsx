/**
 * UzmanlarProfile — /uzmanlar/:slug
 *
 * One commentator: for each instrument, their current clearly stated view,
 * the view before it, and whether it changed. "Geçmiş" opens the full list.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import { usePersonOverview } from '../hooks/usePersonOverview';
import { usePersonTimeline } from '../hooks/usePersonTimeline';
import { ProAvatar } from '../components/consensus/ProAvatar';
import { SentimentChip } from '../components/consensus/SentimentChip';
import { EmptyState } from '../components/consensus/EmptyState';
import { ChangeTag } from '../components/views/ViewRow';
import SeoHead from '../components/seo/SeoHead';
import { INSTRUMENT_KEYS, excerpt, formatDate, instrumentHistory, instrumentLabel } from '../lib/views';

function InstrumentRow({ channelSlug, topicKey }: { channelSlug: string; topicKey: string }) {
  const { status, points } = usePersonTimeline(channelSlug, topicKey);
  const [open, setOpen] = useState(false);
  const h = instrumentHistory(points);
  const label = instrumentLabel(topicKey);

  if (status === 'loading') return <li className="border-b border-border py-4"><div className="skeleton h-6 w-2/3" /></li>;
  if (!h.current) return null;

  return (
    <li className="border-b border-border py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link to={`/piyasa/${topicKey}`} className="headline-link w-28 text-[15px] font-semibold text-text">{label}</Link>
        <SentimentChip sentiment={h.current.sentiment} />
        <span className="text-[13px] text-text-muted">{formatDate(h.current.date)}</span>
        {h.previous ? (
          <span className="inline-flex items-center gap-2 text-[13px] text-text-muted">
            · önce <SentimentChip sentiment={h.previous.sentiment} /> {formatDate(h.previous.date)} · <ChangeTag changed={h.changed} />
          </span>
        ) : (
          <span className="text-[13px] text-text-subtle">· ilk görüşü</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-accent hover:underline underline-offset-4"
          aria-expanded={open}
        >
          {open ? 'Gizle' : `Geçmiş (${h.points.length})`}
        </button>
      </div>
      <p className="mt-1.5 mb-0 font-serif text-[16px] leading-6 text-text">“{excerpt(h.current.summary)}”</p>
      {open && (
        <ol className="mt-3 mb-0 list-none border-l-2 border-border p-0 pl-4">
          {h.points.map((pt) => (
            <li key={pt.video_id} className="py-2">
              <div className="flex flex-wrap items-center gap-x-3 text-[13px]">
                <SentimentChip sentiment={pt.sentiment} />
                <span className="text-text-muted">{formatDate(pt.date)}</span>
                <Link to={`/haberler/${pt.video_id}`} className="link no-underline hover:underline">Özeti oku</Link>
              </div>
              <p className="mt-1 mb-0 text-[14px] leading-5 text-text-muted">{excerpt(pt.summary, 160)}</p>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

export default function UzmanlarProfile() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { channels } = useChannels();
  const { stances, status } = usePersonOverview(slug);
  const channel = channels.find((c) => c.slug === slug);
  const name = channel?.name ?? slug;

  const covered = INSTRUMENT_KEYS.filter((k) => stances.some((s) => s.topic_key === k));
  const silent = INSTRUMENT_KEYS.filter((k) => !covered.includes(k)).map(instrumentLabel);

  return (
    <div className="lg:max-w-[760px]">
      <SeoHead path={`/uzmanlar/${slug}`} title={`${name}: ne bekliyor? | Döviz Veri`} description={`${name} dolar, BIST 100, altın ve diğer araçlar için ne bekliyor; önceki görüşleriyle karşılaştırma.`} />
      <Link to="/uzmanlar" className="text-[13px] font-semibold text-text-muted no-underline hover:underline underline-offset-4">← Uzmanlar</Link>

      <header className="mt-3 mb-6 flex items-start gap-4 border-b border-border pb-5">
        <ProAvatar channelAvatarUrl={channel?.avatar_url ?? undefined} name={name} size="lg" />
        <div className="min-w-0">
          <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight text-text md:text-[36px]">{name}</h1>
          {channel?.bio && <p className="mt-2 mb-0 max-w-[62ch] text-[14px] leading-5 text-text-muted line-clamp-2">{channel.bio}</p>}
          {channel?.channel_url && (
            <a href={channel.channel_url} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-block text-[13px] no-underline hover:underline">YouTube kanalı →</a>
          )}
        </div>
      </header>

      <div className="section-head"><h2>Araçlara göre görüşü</h2></div>

      {status === 'loading' && (
        <div className="space-y-4 pt-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12" />)}
        </div>
      )}
      {status === 'error' && <p role="alert" className="py-6 text-[15px] text-text-muted">Görüşler şu anda yüklenemedi.</p>}
      {status === 'success' && covered.length === 0 && (
        <EmptyState title="Net görüş yok" body="Bu yorumcu takip edilen araçlar için henüz açık bir yön belirtmedi." />
      )}
      {status === 'success' && covered.length > 0 && (
        <ul className="m-0 list-none p-0">
          {covered.map((k) => <InstrumentRow key={k} channelSlug={slug} topicKey={k} />)}
        </ul>
      )}

      {status === 'success' && silent.length > 0 && (
        <p className="mt-6 text-[13px] text-text-muted">Net görüş belirtmedi: {silent.join(', ')}.</p>
      )}

      <p className="mt-10 text-[12px] leading-5 text-text-subtle">
        Görüşler konuşmacının kendi videolarından derlenmiştir. Yatırım danışmanlığı kapsamında değildir.
        Yanlış mı aktardık? <Link to="/iletisim" className="link">Bildirin</Link>.
      </p>
    </div>
  );
}
