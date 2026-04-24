import { Link, useParams } from 'react-router-dom';
import { useNewsStory } from '../hooks/useNewsStory';
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

  if (status === 'loading') {
    return (
      <section className="max-w-3xl mx-auto">
        <div className="h-6 w-32 rounded bg-[var(--color-surface-container)] animate-pulse mb-4" />
        <div className="h-10 w-full rounded bg-[var(--color-surface-container)] animate-pulse mb-3" />
        <div className="h-10 w-2/3 rounded bg-[var(--color-surface-container)] animate-pulse mb-8" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-4 w-full rounded bg-[var(--color-surface-container)] animate-pulse"
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
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">
          <p className="mb-3">Bu video için henüz bir özet yayınlanmamış olabilir.</p>
          <Link className="text-[var(--color-primary)] underline" to="/">
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
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/25 bg-white p-6">
          <p className="mb-3">Haber yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.</p>
          <Link className="text-[var(--color-primary)] underline" to="/">
            Anasayfaya dön
          </Link>
        </div>
      </section>
    );
  }

  const { video, summary, channel } = story;
  const published = formatPublished(video.published_at ?? video.created_at);

  return (
    <article className="max-w-3xl mx-auto">
      <SeoHead
        path={`/haberler/${video.id}`}
        title={`${video.title} | Döviz Veri`}
        description={summary.short_summary.slice(0, 180)}
      />

      <nav className="mb-4 text-xs text-[var(--color-on-surface-variant)]/70">
        <Link to="/" className="hover:text-[var(--color-primary)]">
          Anasayfa
        </Link>
        <span className="mx-1.5">/</span>
        <span>Haberler</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-[0.12em]">
          <span className="text-[var(--color-primary)]">{channel?.name ?? 'YouTube'}</span>
          {published && (
            <>
              <span className="text-[var(--color-on-surface-variant)]/40">•</span>
              <span className="text-[var(--color-on-surface-variant)]/70">{published}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-[var(--color-on-surface)]">
          {video.title}
        </h1>
      </header>

      <section className="rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/25 p-6 mb-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]/70 mb-3">
          Kısa Özet
        </h2>
        <p className="text-base leading-relaxed text-[var(--color-on-surface)]">
          {summary.short_summary}
        </p>
      </section>

      {summary.highlights.length > 0 && (
        <section className="rounded-2xl bg-white border border-[var(--color-outline-variant)]/25 p-6 mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]/70 mb-4">
            Öne Çıkanlar
          </h2>
          <ul className="space-y-3">
            {summary.highlights.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--color-on-surface)]">
                <span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <a
        href={video.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] text-white px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px] leading-none">play_circle</span>
        Kaynak videoyu izle
      </a>

      <p className="mt-6 text-[11px] text-[var(--color-on-surface-variant)]/60">
        Bu özet {channel?.name ?? 'kaynak kanalın'} YouTube yayınından otomatik olarak derlenmiştir. Yatırım tavsiyesi değildir.
      </p>
    </article>
  );
}
