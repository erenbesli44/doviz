/**
 * Uzmanlar — /uzmanlar
 *
 * Channel directory. Each card shows avatar, name, bio, top topic, recent stance.
 */

import { Link } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import { ProAvatar } from '../components/consensus/ProAvatar';
import { SentimentChip } from '../components/consensus/SentimentChip';
import { EmptyState } from '../components/consensus/EmptyState';
import type { ChannelOverview } from '../data/consensus-types';

function ChannelCard({ ch }: { ch: ChannelOverview }) {
  return (
    <Link
      to={`/uzmanlar/${ch.slug}`}
      className="focus-ring"
      style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        padding: 16, border: '1px solid var(--border)',
        borderRadius: 'var(--r-card)', background: 'var(--surface)',
        textDecoration: 'none', transition: 'border-color var(--t-hover), box-shadow var(--t-hover)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(31,58,138,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ProAvatar channelAvatarUrl={ch.avatar_url ?? undefined} name={ch.name} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ch.name}
          </div>
          {ch.subscriber_count && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {ch.subscriber_count.toLocaleString('tr-TR')} abone
            </div>
          )}
        </div>
        {ch.recent_sentiment && <SentimentChip sentiment={ch.recent_sentiment} />}
      </div>

      {/* Bio */}
      {ch.bio && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: '20px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
          {ch.bio}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        {ch.top_topic_label && (
          <span>En çok: <strong style={{ color: 'var(--text)' }}>{ch.top_topic_label}</strong></span>
        )}
        <span>{ch.video_count} video</span>
      </div>
    </Link>
  );
}

export default function Uzmanlar() {
  const { status, channels } = useChannels();

  return (
    <div className="page-full-bleed" style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 16px' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--font-h1-size)', fontWeight: 600, color: 'var(--text)' }}>Uzmanlar</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Takip ettiğimiz YouTube analistleri
        </p>
      </div>

      {status === 'loading' && (
        <div style={{ padding: '0 16px', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 140, background: 'var(--surface-2)', borderRadius: 8 }} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '0 16px' }}>
          <EmptyState title="Uzmanlar yüklenemedi" body="Lütfen sayfayı yenileyin." />
        </div>
      )}

      {status === 'success' && channels.length === 0 && (
        <div style={{ padding: '0 16px' }}>
          <EmptyState title="Henüz uzman yok" body="Yakında eklenecek." />
        </div>
      )}

      {status === 'success' && channels.length > 0 && (
        <div style={{ padding: '0 16px', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {channels.map((ch) => <ChannelCard key={ch.id} ch={ch} />)}
        </div>
      )}
    </div>
  );
}
