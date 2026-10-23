/**
 * LatestVideoInsights — the home page lead.
 *
 * The 3 most recently added videos that contain at least one clear,
 * forward-looking view (tracker outlook_explicit), each with up to 3 of its
 * views: instrument, expected direction, the speaker's own sentence, horizon.
 */

import { Link } from 'react-router-dom';
import { ProAvatar } from '../consensus/ProAvatar';
import { DirectionChip } from './DirectionChip';
import { formatClock, formatDate, instrumentLabel, quoteOf, videoMomentUrl } from '../../lib/views';
import { VIDEOS, type VideoInsights } from '../../lib/latestInsights';

export function LatestVideoInsights({ items, loading }: { items: VideoInsights[]; loading: boolean }) {
  if (!loading && items.length === 0) return null;

  return (
    <section aria-labelledby="son-videolar" className="mb-12">
      <div className="section-head">
        <h2 id="son-videolar">Son videolarda ne dediler?</h2>
      </div>
      <p className="mt-1 mb-4 text-[13px] text-text-muted">
        En son eklenen {VIDEOS} videoda açıkça söylenen beklentiler.
      </p>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3" aria-hidden="true">
          {Array.from({ length: VIDEOS }).map((_, i) => <div key={i} className="skeleton h-48" />)}
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-8 md:grid-cols-3">
          {items.map(({ story, person, avatarUrl, insights }) => (
            <article key={story.video.id} className="min-w-0 border-t border-border pt-4">
              <div className="flex items-center gap-2.5">
                <ProAvatar channelAvatarUrl={avatarUrl ?? undefined} name={person} size="md" />
                <div className="min-w-0">
                  <p className="m-0 truncate text-[15px] font-semibold text-text">{person}</p>
                  <p className="m-0 text-[12px] text-text-muted">
                    {formatDate(story.video.published_at ?? story.video.created_at)}
                  </p>
                </div>
              </div>
              <Link
                to={`/haberler/${story.video.id}`}
                className="headline-link mt-2 block text-[14px] leading-5 text-text-muted line-clamp-2"
              >
                {story.video.title}
              </Link>

              <ul className="mt-3 mb-0 list-none space-y-3 p-0">
                {insights.map(({ instrument, direction, opinion }) => {
                  const clock = formatClock(opinion.start_time_seconds);
                  return (
                    <li key={instrument}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link to={`/piyasa/${instrument}`} className="headline-link text-[14px] font-semibold text-text">
                          {instrumentLabel(instrument)}
                        </Link>
                        <DirectionChip direction={direction} />
                        {opinion.outlook_horizon && (
                          <span className="text-[12px] text-text-muted">· {opinion.outlook_horizon}</span>
                        )}
                      </div>
                      <p className="mt-1 mb-0 font-serif text-[15px] leading-6 text-text line-clamp-3">
                        “{quoteOf(opinion)}”
                      </p>
                      {opinion.video_url && (
                        <a
                          href={videoMomentUrl(opinion.video_url, opinion.start_time_seconds)}
                          data-person={person}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link text-[12px] no-underline hover:underline"
                        >
                          Videoda izle{clock ? ` ${clock}` : ''}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
