/**
 * /_/design-system  — dev-only visual preview of new consensus atoms
 *
 * Not linked from production nav. Open manually during development.
 * Import path: src/pages/DesignSystem.tsx
 */

import { ConsensusBar } from '../components/consensus/ConsensusBar';
import { DirectionBadge } from '../components/consensus/DirectionBadge';
import { ConfidenceDots } from '../components/consensus/ConfidenceDots';
import { SentimentChip } from '../components/consensus/SentimentChip';
import { KeyLevelChip } from '../components/consensus/KeyLevelChip';
import { ProAvatar } from '../components/consensus/ProAvatar';

// ──────────────────────────────────────────────────────────────
// Small layout helpers (no Tailwind dependency — pure tokens)
// ──────────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 40 }}>
    <h2
      style={{
        fontSize: 'var(--font-h2-size)',
        lineHeight: 'var(--font-h2-lh)',
        fontWeight: 600,
        color: 'var(--text)',
        margin: '0 0 16px',
        paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {title}
    </h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      {children}
    </div>
  </section>
);

const Card = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    style={{
      padding: '16px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-card)',
      backgroundColor: 'var(--surface)',
      minWidth: 180,
    }}
  >
    <p
      style={{
        margin: '0 0 8px',
        fontSize: 'var(--font-micro-size)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </p>
    {children}
  </div>
);

// ──────────────────────────────────────────────────────────────
export default function DesignSystem() {
  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        minHeight: '100dvh',
        padding: '32px 24px',
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-h1-size)',
          lineHeight: 'var(--font-h1-lh)',
          fontWeight: 600,
          marginTop: 0,
          marginBottom: 32,
        }}
      >
        Design System Preview
        <span
          style={{
            display: 'inline-block',
            marginLeft: 12,
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: 'var(--neutral-bg)',
            color: 'var(--neutral)',
            borderRadius: 4,
            verticalAlign: 'middle',
          }}
        >
          dev only
        </span>
      </h1>

      {/* ── ConsensusBar ─────────────────────────────── */}
      <Section title="ConsensusBar">
        <Card label="strong bull (72/18/10)">
          <ConsensusBar bullish={72} neutral={18} bearish={10} size="md" />
          <div style={{ marginTop: 8 }}>
            <ConsensusBar bullish={72} neutral={18} bearish={10} size="sm" />
          </div>
          <div style={{ marginTop: 8 }}>
            <ConsensusBar bullish={72} neutral={18} bearish={10} size="lg" />
          </div>
        </Card>
        <Card label="balanced (35/30/35)">
          <ConsensusBar bullish={35} neutral={30} bearish={35} size="md" />
        </Card>
        <Card label="strong bear (10/15/75)">
          <ConsensusBar bullish={10} neutral={15} bearish={75} size="md" />
        </Card>
        <Card label="all neutral (0/100/0)">
          <ConsensusBar bullish={0} neutral={100} bearish={0} size="md" />
        </Card>
      </Section>

      {/* ── DirectionBadge ───────────────────────────── */}
      <Section title="DirectionBadge">
        {(['up', 'down', 'sideways', 'mixed'] as const).map((d) => (
          <DirectionBadge key={d} direction={d} />
        ))}
      </Section>

      {/* ── ConfidenceDots ───────────────────────────── */}
      <Section title="ConfidenceDots">
        <Card label="high (0.78)">
          <ConfidenceDots confidence={0.78} />
        </Card>
        <Card label="medium (0.62)">
          <ConfidenceDots confidence={0.62} />
        </Card>
        <Card label="low (0.34)">
          <ConfidenceDots confidence={0.34} />
        </Card>
        <Card label="paired with badge">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DirectionBadge direction="up" />
            <ConfidenceDots confidence={0.78} />
          </div>
        </Card>
      </Section>

      {/* ── SentimentChip ────────────────────────────── */}
      <Section title="SentimentChip">
        {(['bullish', 'bearish', 'neutral'] as const).map((s) => (
          <SentimentChip key={s} sentiment={s} />
        ))}
      </Section>

      {/* ── KeyLevelChip ─────────────────────────────── */}
      <Section title="KeyLevelChip">
        <KeyLevelChip price={67000} count={5} />
        <KeyLevelChip price={70000} count={3} />
        <KeyLevelChip price="65,500" />
        <KeyLevelChip price="3.45 USD" count={2} />
      </Section>

      {/* ── ProAvatar ────────────────────────────────── */}
      <Section title="ProAvatar">
        <Card label="with channel avatar">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ProAvatar
              channelAvatarUrl="https://yt3.googleusercontent.com/ytc/AIdro_lhWPEBSAIbEcCCNxMMRJcD9iN-dP4D6MbJZfLOlg=s88-c-k-c0x00ffffff-no-rj"
              name="Mert Doğan"
              size="sm"
            />
            <ProAvatar
              channelAvatarUrl="https://yt3.googleusercontent.com/ytc/AIdro_lhWPEBSAIbEcCCNxMMRJcD9iN-dP4D6MbJZfLOlg=s88-c-k-c0x00ffffff-no-rj"
              name="Mert Doğan"
              size="md"
            />
            <ProAvatar
              channelAvatarUrl="https://yt3.googleusercontent.com/ytc/AIdro_lhWPEBSAIbEcCCNxMMRJcD9iN-dP4D6MbJZfLOlg=s88-c-k-c0x00ffffff-no-rj"
              name="Mert Doğan"
              size="lg"
            />
          </div>
        </Card>
        <Card label="broken URL → initials fallback">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ProAvatar channelAvatarUrl="https://invalid.url/404.jpg" name="Ahmet Yılmaz" size="sm" />
            <ProAvatar channelAvatarUrl="https://invalid.url/404.jpg" name="Ahmet Yılmaz" size="md" />
            <ProAvatar channelAvatarUrl="https://invalid.url/404.jpg" name="Ahmet Yılmaz" size="lg" />
          </div>
        </Card>
        <Card label="no URL → initials">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Zeynep Kaya', 'Ali Veli', 'S', 'Oğuz B'].map((n) => (
              <ProAvatar key={n} name={n} size="md" />
            ))}
          </div>
        </Card>
      </Section>

      {/* ── Token color swatches ─────────────────────── */}
      <Section title="Color tokens">
        {[
          ['--bg',         'bg'],
          ['--surface',    'surface'],
          ['--surface-2',  'surface-2'],
          ['--bull',       'bull'],
          ['--bull-bg',    'bull-bg'],
          ['--bear',       'bear'],
          ['--bear-bg',    'bear-bg'],
          ['--neutral',    'neutral'],
          ['--neutral-bg', 'neutral-bg'],
          ['--accent',     'accent'],
          ['--border',     'border'],
          ['--text',       'text'],
          ['--text-muted', 'text-muted'],
        ].map(([v, label]) => (
          <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: `var(${v})`,
                border: '1px solid var(--border)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
