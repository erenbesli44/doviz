/**
 * NewsDetail — /haberler/:videoId
 *
 * The reading page. One column at ~68 characters per line, inverted pyramid:
 *   standfirst (what happened) → key points → full summary → source → keep reading.
 * Provenance sits next to the claim: source channel in the byline, source video
 * directly under the text — not buried in a footer.
 */

import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useNewsStory } from '../hooks/useNewsStory';
import { useLatestNews } from '../hooks/useLatestNews';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import { StoryRow } from '../components/news/Story';
import StoryThumb from '../components/news/StoryThumb';
import { ProAvatar } from '../components/consensus/ProAvatar';
import PageHeader from '../components/layout/PageHeader';
import Icon from '../components/ui/Icon';
import SeoHead from '../components/seo/SeoHead';
import { articleSchema, breadcrumbSchema } from '../seo/schema';
import { formatFull, parseTs, readingMinutes, toParagraphs } from '../lib/newsFormat';

function BackLink() {
  return (
    <Link to="/haberler" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-muted no-underline hover:text-text">
      <Icon name="arrow-left" size={14} />
      Haberler
    </Link>
  );
}

function Problem({ videoId, title, body }: { videoId?: string; title: string; body: string }) {
  return (
    <section className="measure mx-auto">
      <SeoHead path={`/haberler/${videoId ?? ''}`} title={`${title} | Döviz Veri`} description={body} robots="noindex,follow" />
      <div className="mb-6"><BackLink /></div>
      <PageHeader title={title} />
      <p className="text-[17px] leading-7 text-text-muted">{body}</p>
      <Link to="/" className="link text-[16px]">Gündeme dön</Link>
    </section>
  );
}

export default function NewsDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const parsed = videoId ? Number(videoId) : null;
  const { status, story } = useNewsStory(parsed);
  const { topics: allTopics } = useConsensusDashboard();
  const { stories: latest } = useLatestNews(14);

  const jsonLd = useMemo(() => {
    if (!story) return [];
    const { video, summary, channel } = story;
    return [
      breadcrumbSchema([
        { name: 'Gündem', path: '/' },
        { name: 'Haberler', path: '/haberler' },
        { name: video.title, path: `/haberler/${video.id}` },
      ]),
      articleSchema({
        path: `/haberler/${video.id}`,
        headline: video.title,
        description: summary.short_summary,
        image: video.platform === 'youtube' ? `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg` : undefined,
        datePublished: parseTs(video.published_at ?? video.created_at)?.toISOString(),
        dateModified: parseTs(summary.updated_at)?.toISOString(),
        sourceName: channel?.name,
        sourceUrl: video.video_url,
      }),
    ];
  }, [story]);

  if (status === 'loading') {
    return (
      <section className="measure mx-auto" aria-busy="true" aria-label="Haber yükleniyor">
        <div className="skeleton mb-8 h-4 w-24" />
        <div className="skeleton mb-3 h-3 w-40" />
        <div className="skeleton mb-2 h-10 w-full" />
        <div className="skeleton mb-6 h-10 w-3/4" />
        <div className="skeleton mb-8 aspect-video w-full" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-5 w-full" />)}
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return <Problem videoId={videoId} title="Haber yüklenemedi" body="Haber yüklenirken bir sorun oluştu. Lütfen biraz sonra tekrar deneyin." />;
  }

  if (status === 'not_found' || !story) {
    return <Problem videoId={videoId} title="Haber bulunamadı" body="Bu video için henüz bir özet yayınlanmamış ya da özet kaldırılmış olabilir." />;
  }

  const { video, summary, channel } = story;
  const publishedIso = video.published_at ?? video.created_at;
  const published = formatFull(publishedIso);
  const updated = formatFull(summary.updated_at);
  const showUpdated = Boolean(updated) && updated !== published;
  const paragraphs = toParagraphs(summary.long_summary);
  const minutes = readingMinutes(summary.short_summary, summary.long_summary, summary.highlights.join(' '));
  const relatedTopics = allTopics.filter((t) => t.sources.some((s) => s.video_id === video.id));
  const moreStories = latest.filter((s) => s.video.id !== video.id).slice(0, 4);
  const sourceName = channel?.name ?? 'YouTube';

  return (
    <>
      <SeoHead
        path={`/haberler/${video.id}`}
        title={`${video.title} | Döviz Veri`}
        description={summary.short_summary.slice(0, 180)}
        jsonLd={jsonLd}
      />

      <article className="measure mx-auto">
        <div className="mb-6"><BackLink /></div>

        <header>
          <p className="kicker m-0 flex flex-wrap items-center gap-x-2">
            <span>Video özeti</span>
            <span aria-hidden="true">·</span>
            {channel?.slug ? (
              <Link to={`/uzmanlar/${channel.slug}`} className="text-accent no-underline hover:underline underline-offset-4">{sourceName}</Link>
            ) : (
              <span className="text-accent">{sourceName}</span>
            )}
          </p>

          <h1 className="mt-3 mb-0 font-serif text-[32px] leading-[1.15] font-semibold tracking-tight text-text md:text-[42px]">
            {video.title}
          </h1>

          <p className="mt-4 mb-0 text-[19px] leading-[1.6] text-text md:text-[20px]">
            {summary.short_summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-border py-3 text-[13px] text-text-muted">
            <span className="flex items-center gap-2 font-semibold text-text">
              <ProAvatar channelAvatarUrl={channel?.avatar_url ?? undefined} name={sourceName} size="sm" />
              {sourceName}
            </span>
            {published && <time dateTime={publishedIso}>Yayınlandı: {published}</time>}
            {showUpdated && <span>Güncellendi: {updated}</span>}
            <span className="inline-flex items-center gap-1"><Icon name="clock" size={13} />{minutes} dk okuma</span>
          </div>
        </header>

        <figure className="mx-0 mt-6 mb-0">
          <a href={video.video_url} target="_blank" rel="noopener noreferrer" aria-label="Kaynak videoyu YouTube'da izle" className="group relative block">
            <StoryThumb story={story} variant="lead" priority />
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-[var(--r-chip)] bg-black/75 px-2.5 py-1.5 text-[13px] font-semibold text-white transition-colors group-hover:bg-black">
              <Icon name="play" size={15} />
              Videoyu izle
            </span>
          </a>
          <figcaption className="mt-2 text-[13px] leading-5 text-text-subtle">
            Kaynak video: {sourceName}, YouTube.
          </figcaption>
        </figure>

        {summary.highlights.length > 0 && (
          <section aria-labelledby="one-cikanlar" className="mt-8 border-l-2 border-accent bg-surface-2 py-5 pr-5 pl-5">
            <h2 id="one-cikanlar" className="kicker m-0 !text-text">Öne çıkanlar</h2>
            <ul className="mt-3 mb-0 list-none space-y-2.5 p-0">
              {summary.highlights.map((h, i) => (
                <li key={i} className="relative pl-5 text-[16px] leading-[1.55] text-text">
                  <span aria-hidden="true" className="absolute left-0 top-[0.62em] h-1.5 w-1.5 rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {paragraphs.length > 0 && (
          <section aria-labelledby="tam-ozet" className="mt-9">
            <h2 id="tam-ozet" className="kicker mt-0 mb-4">Tam özet</h2>
            <div className="prose-article">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        )}

        {relatedTopics.length > 0 && (
          <section aria-labelledby="ilgili-konular" className="mt-10">
            <h2 id="ilgili-konular" className="kicker mt-0 mb-3">Bu haberde geçen konular</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((t) => (
                <Link
                  key={t.topic_key}
                  to={`/konular?highlight=${encodeURIComponent(t.topic_key)}`}
                  className="rounded-[var(--r-chip)] border border-border px-3 py-1.5 text-[14px] font-semibold text-text no-underline transition-colors hover:border-text"
                >
                  {t.topic_label}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="kaynak" className="mt-10 border-t-2 border-rule pt-4">
          <h2 id="kaynak" className="kicker mt-0 mb-3 !text-text">Kaynak</h2>
          <p className="m-0 text-[15px] leading-6 text-text-muted">
            Bu metin, <strong className="font-semibold text-text">{sourceName}</strong> kanalının
            “{video.title}” başlıklı YouTube videosundan otomatik olarak özetlenmiştir. Görüşler
            kaynağa aittir; yatırım tavsiyesi değildir.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <a href={video.video_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-[var(--r-chip)] bg-accent px-5 text-[15px] font-semibold text-on-accent no-underline transition-opacity hover:opacity-90">
              <Icon name="play" size={17} />
              Videonun tamamını izle
            </a>
            {channel?.slug && (
              <Link to={`/uzmanlar/${channel.slug}`} className="inline-flex h-11 items-center gap-1.5 text-[15px] font-semibold text-accent no-underline hover:underline underline-offset-4">
                {sourceName} profili
                <Icon name="arrow-right" size={15} />
              </Link>
            )}
          </div>
        </section>
      </article>

      {moreStories.length > 0 && (
        <section aria-labelledby="diger-haberler" className="mx-auto mt-14 max-w-[760px]">
          <div className="section-head">
            <h2 id="diger-haberler">Okumaya devam et</h2>
          </div>
          {moreStories.map((s) => <StoryRow key={s.video.id} story={s} />)}
        </section>
      )}
    </>
  );
}
