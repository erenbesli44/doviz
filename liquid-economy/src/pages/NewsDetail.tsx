import { Link, useParams } from 'react-router-dom';
import { useNewsStory } from '../hooks/useNewsStory';
import { useConsensusDashboard } from '../hooks/useConsensusDashboard';
import SeoHead from '../components/seo/SeoHead';
import PageHeader from '../components/layout/PageHeader';

function formatPublished(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NewsDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const parsed = videoId ? Number(videoId) : null;
  const { status, story } = useNewsStory(parsed);
  const { topics: allTopics } = useConsensusDashboard();

  if (status === 'loading') {
    return (
      <section className="max-w-3xl mx-auto">
        <div className="h-6 w-32 rounded bg-surface-2 animate-pulse mb-4" />
        <div className="h-10 w-full rounded bg-surface-2 animate-pulse mb-3" />
        <div className="h-10 w-2/3 rounded bg-surface-2 animate-pulse mb-8" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-full rounded bg-surface-2 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (status === 'not_found' || !story) {
    return (
      <section className="max-w-3xl mx-auto">
        <SeoHead
          path={`/haberler/${videoId ?? ''}`}
          title="Haber bulunamadı | Döviz Veri"
          description="Aradığınız haber özeti bulunamadı."
          robots="noindex,follow"
        />
        <PageHeader title="Haber bulunamadı" subtitle="Haberler" />
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-3">Bu video için henüz bir özet yayınlanmamış olabilir.</p>
          <Link className="text-accent underline" to="/">
            Anasayfaya dön
          </Link>
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="max-w-3xl mx-auto">
        <SeoHead
          path={`/haberler/${videoId ?? ''}`}
          title="Haber yüklenemedi | Döviz Veri"
          description="Haber özeti şu anda yüklenemedi."
          robots="noindex,follow"
        />
        <PageHeader title="Haber yüklenemedi" subtitle="Haberler" />
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-3">Haber yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <Link className="text-accent underline" to="/">
            Anasayfaya dön
          </Link>
        </div>
      </section>
    );
  }

  const { video, summary, channel } = story;
  const published = formatPublished(video.published_at ?? video.created_at);
  const updated = formatPublished(summary.updated_at);
  const showUpdated = updated && summary.updated_at !== (video.published_at ?? video.created_at);
  const relatedTopics = allTopics.filter((t) => t.sources.some((s) => s.video_id === video.id));
  const longParagraphs = summary.long_summary
    ? summary.long_summary.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <article className="max-w-3xl mx-auto">
      <SeoHead
        path={`/haberler/${video.id}`}
        title={`${video.title} | Döviz Veri`}
        description={summary.short_summary.slice(0, 180)}
      />

      <nav className="mb-4 text-xs text-text-muted">
        <Link to="/" className="hover:text-accent">
          Anasayfa
        </Link>
        <span className="mx-1.5">/</span>
        <Link to="/haberler" className="hover:text-accent">
          Haberler
        </Link>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap text-[11px] font-bold uppercase tracking-[0.12em]">
          <span className="text-text-muted bg-surface-2 px-1.5 py-0.5 rounded normal-case tracking-normal font-semibold">
            Video Özeti
          </span>
          <span className="text-accent">{channel?.name ?? 'YouTube'}</span>
          {published && (
            <>
              <span className="text-text-muted/60">•</span>
              <span className="text-text-muted normal-case tracking-normal font-medium">Yayınlandı: {published}</span>
            </>
          )}
          {showUpdated && (
            <>
              <span className="text-text-muted/60">•</span>
              <span className="text-text-muted normal-case tracking-normal font-medium">Güncellendi: {updated}</span>
            </>
          )}
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight leading-tight text-text">
          {video.title}
        </h1>
      </header>

      <section className="rounded-2xl bg-surface-2 border border-border p-6 mb-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">
          Kısa Özet
        </h2>
        <p className="text-[17px] leading-relaxed text-text">
          {summary.short_summary}
        </p>
      </section>

      {longParagraphs.length > 0 && (
        <section className="rounded-2xl bg-surface border border-border p-6 mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-4">
            Tam Özet
          </h2>
          <div className="space-y-4">
            {longParagraphs.map((p, i) => (
              <p key={i} className="text-[17px] leading-[1.7] text-text">
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      {summary.highlights.length > 0 && (
        <section className="rounded-2xl bg-surface border border-border p-6 mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-4">
            Öne Çıkanlar
          </h2>
          <ul className="space-y-3">
            {summary.highlights.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-text">
                <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedTopics.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">
            Bu Haberde Geçen Konular
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((t) => (
              <Link
                key={t.topic_key}
                to={`/konular?highlight=${encodeURIComponent(t.topic_key)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:border-accent hover:text-accent transition-colors focus-ring"
              >
                {t.topic_label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <a
        href={video.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-accent text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px] leading-none">play_circle</span>
        Kaynak videoyu izle
      </a>

      <p className="mt-6 text-[11px] text-text-muted/80">
        Bu özet {channel?.name ?? 'kaynak kanalın'} YouTube yayınından otomatik olarak derlenmiştir. Yatırım tavsiyesi değildir.
      </p>
    </article>
  );
}
