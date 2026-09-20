/**
 * EmptyState
 *
 * Used when a list or page has no data yet.
 * Per spec §8 — always explains why it's empty and what comes next.
 */

interface EmptyStateProps {
  title: string;
  body: string;
  cta?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ title, body, cta }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '40px 24px', gap: 12,
    }}>
      <div style={{ fontSize: 32, lineHeight: 1 }} aria-hidden="true">📊</div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', maxWidth: 320, lineHeight: '22px' }}>{body}</p>
      {cta && (
        cta.href ? (
          <a
            href={cta.href}
            className="focus-ring"
            style={{
              marginTop: 4, padding: '8px 18px', borderRadius: 'var(--r-chip)',
              background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {cta.label}
          </a>
        ) : (
          <button
            onClick={cta.onClick}
            className="focus-ring"
            style={{
              marginTop: 4, padding: '8px 18px', borderRadius: 'var(--r-chip)',
              background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer',
            }}
          >
            {cta.label}
          </button>
        )
      )}
    </div>
  );
}
