import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NewsStory } from '../../data/news-types';

interface Props {
  story: NewsStory;
  featured?: boolean;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  // Upstream timestamps have no timezone suffix; append Z to force UTC parsing
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  const t = new Date(normalized).getTime();
  if (Number.isNaN(t)) return '';
  const diffMin = Math.round((Date.now() - t) / 60_000);
  if (diffMin < 1) return 'şimdi';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} sa önce`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} g önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function ChannelAvatarBanner({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-[var(--color-surface-container)]">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-[var(--color-outline-variant)]/30"
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-[var(--color-primary)]">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-sm font-semibold text-[var(--color-on-surface)] truncate max-w-[55%]">
        {name}
      </span>
    </div>
  );
}

export default function NewsCard({ story, featured = false }: Props) {
  const { video, summary, channel } = story;
  const topHighlights = summary.highlights.slice(0, featured ? 4 : 2);

  const isYouTube = video.platform === 'youtube';
  const maxres = isYouTube
    ? `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`
    : null;
  const hqdefault = isYouTube
    ? `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`
    : null;

  const [imgSrc, setImgSrc] = useState(maxres);
  const [showChannelBanner, setShowChannelBanner] = useState(false);

  const handleImgError = () => {
    if (imgSrc === maxres) {
      setImgSrc(hqdefault);
    } else {
      setShowChannelBanner(true);
    }
  };

  if (featured) {
    return (
      <Link
        to={`/haberler/${video.id}`}
        className="group flex flex-row min-h-[240px] bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/25 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] overflow-hidden"
      >
        {isYouTube && (
          <div className="relative w-2/5 shrink-0 min-h-[240px]">
            {!showChannelBanner ? (
              <img
                src={imgSrc!}
                alt=""
                onError={handleImgError}
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <ChannelAvatarBanner avatarUrl={channel?.avatar_url} name={channel?.name ?? 'Haber'} />
            )}
          </div>
        )}
        <div className="flex flex-col flex-1 p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
              {channel?.name ?? 'Haber'}
            </span>
            <span className="text-[10px] text-[var(--color-on-surface-variant)]/70">
              {formatRelative(video.published_at ?? video.created_at)}
            </span>
          </div>
          <h2 className="text-xl font-bold leading-snug text-[var(--color-on-surface)] line-clamp-3 group-hover:text-[var(--color-primary)] transition-colors">
            {video.title}
          </h2>
          {topHighlights.length > 0 && (
            <ul className="mt-4 space-y-2 flex-1">
              {topHighlights.map((h, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed pl-4 relative line-clamp-2"
                >
                  <span className="absolute left-0 top-[0.5em] w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]/70" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <span className="mt-5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-primary)] opacity-80 group-hover:opacity-100">
            Özeti oku
            <span className="material-symbols-outlined text-[14px] leading-none">arrow_forward</span>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/haberler/${video.id}`}
      className="group flex flex-col h-full bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/25 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] overflow-hidden"
    >
      {isYouTube && (
        <div className="relative w-full h-24 shrink-0">
          {!showChannelBanner ? (
            <img
              src={imgSrc!}
              alt=""
              onError={handleImgError}
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <ChannelAvatarBanner
              avatarUrl={channel?.avatar_url}
              name={channel?.name ?? 'Haber'}
            />
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            {channel?.name ?? 'Haber'}
          </span>
          <span className="text-[10px] text-[var(--color-on-surface-variant)]/70">
            {formatRelative(video.published_at ?? video.created_at)}
          </span>
        </div>

        <h3 className="text-base font-bold leading-snug text-[var(--color-on-surface)] line-clamp-3 group-hover:text-[var(--color-primary)] transition-colors">
          {video.title}
        </h3>

        {topHighlights.length > 0 && (
          <ul className="mt-4 space-y-1.5 flex-1">
            {topHighlights.map((h, i) => (
              <li
                key={i}
                className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed pl-3 relative line-clamp-2"
              >
                <span className="absolute left-0 top-[0.45em] w-1 h-1 rounded-full bg-[var(--color-primary)]/70" />
                {h}
              </li>
            ))}
          </ul>
        )}

        <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] opacity-80 group-hover:opacity-100">
          Özeti oku
          <span className="material-symbols-outlined text-[14px] leading-none">arrow_forward</span>
        </span>
      </div>
    </Link>
  );
}
