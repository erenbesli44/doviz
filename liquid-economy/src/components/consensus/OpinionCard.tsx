/**
 * OpinionCard
 *
 * One pro's opinion on one asset.
 * Used in the opinion list on /piyasa/:slug.
 *
 * When real data exists (useTopicOpinions returns real endpoint):
 *   - Renders sentiment chip + confidence dots + key levels + summary + video link
 * When falling back to enriched sources (useTopicSources):
 *   - Renders channel name + contribution_note + video title
 */

import { ProAvatar } from './ProAvatar';
import { SentimentChip } from './SentimentChip';
import { ConfidenceDots } from './ConfidenceDots';
import { KeyLevelChip } from './KeyLevelChip';
import type { TopicOpinion } from '../../data/consensus-types';

interface OpinionCardProps {
  opinion: TopicOpinion;
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export function OpinionCard({ opinion }: OpinionCardProps) {
  const videoLink = opinion.start_time_seconds
    ? `${opinion.video_url}&t=${opinion.start_time_seconds}`
    : opinion.video_url;

  return (
    <div style={{
      padding: '14px 16px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-card)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header: avatar + name + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ProAvatar
          channelAvatarUrl={opinion.channel_avatar_url ?? undefined}
          name={opinion.person_name ?? opinion.channel_name}
          size="md"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: '20px' }}>
            {opinion.person_name ?? opinion.channel_name}
          </div>
          {opinion.person_name && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opinion.channel_name}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <SentimentChip sentiment={opinion.sentiment} />
          <ConfidenceDots confidence={opinion.confidence} />
        </div>
      </div>

      {/* Summary */}
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: '22px' }}>
        {opinion.summary}
      </p>

      {/* Key levels */}
      {opinion.key_levels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {opinion.key_levels.map((lvl) => (
            <KeyLevelChip key={lvl} price={lvl} />
          ))}
        </div>
      )}

      {/* Footer: date + video link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDate(opinion.published_at)}
        </span>
        <a
          href={videoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring"
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          Videoda görüntüle
          {opinion.start_time_seconds && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
              {' '}({Math.floor(opinion.start_time_seconds / 60)}:{String(opinion.start_time_seconds % 60).padStart(2, '0')})
            </span>
          )}
          →
        </a>
      </div>
    </div>
  );
}
