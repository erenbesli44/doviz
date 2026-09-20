/**
 * UzmanlarProfile — /uzmanlar/:slug
 *
 * One channel's current stances (table on desktop / card list on mobile)
 * + per-topic timeline.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import { usePersonOverview } from '../hooks/usePersonOverview';
import { usePersonTimeline } from '../hooks/usePersonTimeline';
import { ProAvatar } from '../components/consensus/ProAvatar';
import { SentimentChip } from '../components/consensus/SentimentChip';
import { ConfidenceDots } from '../components/consensus/ConfidenceDots';
import { EmptyState } from '../components/consensus/EmptyState';
import type { PersonTopicStance } from '../data/consensus-types';

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Timeline expand panel ───────────────────────────────────────────────────
function TimelinePanel({ channelSlug, topicKey }: { channelSlug: string; topicKey: string }) {
  const { points } = usePersonTimeline(channelSlug, topicKey);

  if (points.length === 0) return (
    <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--text-muted)' }}>Bu konu için geçmiş veri yok.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
      {[...points].reverse().map((pt, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <SentimentChip sentiment={pt.sentiment} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(pt.date)}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: '20px' }}>{pt.summary}</div>
          </div>
          <ConfidenceDots confidence={pt.confidence} />
        </div>
      ))}
    </div>
  );
}

// ── Stance row/card ─────────────────────────────────────────────────────────
function StanceRow({ stance, channelSlug }: { stance: PersonTopicStance; channelSlug: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', flexWrap: 'wrap' }}>
        <Link
          to={`/piyasa/${stance.topic_key}`}
          style={{ flex: '1 1 120px', fontSize: 14, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', minWidth: 0 }}
        >
          {stance.topic_label}
        </Link>
        <SentimentChip sentiment={stance.sentiment} />
        <ConfidenceDots confidence={stance.confidence} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>
          {formatDate(stance.last_updated)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 60 }}>
          {stance.video_count} video
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="focus-ring"
          style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {open ? 'Gizle ▲' : 'Geçmiş ▼'}
        </button>
      </div>
      {open && (
        <TimelinePanel channelSlug={channelSlug} topicKey={stance.topic_key} />
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function UzmanlarProfile() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { channels } = useChannels();
  const { stances, status } = usePersonOverview(slug);

  const channel = channels.find((c) => c.slug === slug);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <Link to="/uzmanlar" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none' }}>← Uzmanlar</Link>
      </div>

      {channel ? (
        <div style={{ padding: '16px 0 0', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <ProAvatar channelAvatarUrl={channel.avatar_url ?? undefined} name={channel.name} size="lg" />
          <div>
            <h1 className="font-serif" style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 36px)', lineHeight: 1.15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>
              {channel.name}
            </h1>
            {channel.bio && (
              <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--text-muted)', lineHeight: '24px', maxWidth: '62ch' }}>{channel.bio}</p>
            )}
            {channel.channel_url && (
              <a href={channel.channel_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--accent)', display: 'inline-block', marginTop: 4 }}>
                YouTube kanalı →
              </a>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 0 0' }}>
          <h1 className="font-serif" style={{ margin: 0, fontSize: 32, fontWeight: 600, color: 'var(--text)' }}>{slug}</h1>
        </div>
      )}

      {/* Stances */}
      <div style={{ padding: '32px 0 0' }}>
        <div className="section-head">
          <h2>Konulara göre güncel duruşu</h2>
        </div>

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {[1, 2, 3].map((i) => <div key={i} style={{ height: 48, background: 'var(--surface-2)', borderRadius: 8 }} />)}
          </div>
        )}

        {status === 'success' && stances.length === 0 && (
          <EmptyState title="Görüş verisi yok" body="Bu uzman için henüz görüş kaydedilmedi." />
        )}

        {status === 'success' && stances.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {stances.map((s) => <StanceRow key={s.topic_key} stance={s} channelSlug={slug} />)}
          </div>
        )}
      </div>
    </div>
  );
}
