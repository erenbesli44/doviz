import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import LiveDataBadge from './LiveDataBadge';

const NAV_LINKS = [
  { to: '/',          label: 'Gündem',   end: true  },
  { to: '/konular',   label: 'Konular',  end: false },
  { to: '/piyasa',    label: 'Piyasa',   end: false },
  { to: '/uzmanlar',  label: 'Uzmanlar', end: false },
  { to: '/haberler',  label: 'Haberler', end: false },
];

export default function TopNavBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/ara?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setSearchOpen(false);
    }
  }

  return (
    <nav
      className="fixed top-0 w-full z-50 liquid-glass"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', maxWidth: 1280, margin: '0 auto', gap: 24 }}>
        {/* Logo */}
        <a href="https://dovizveri.com/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Logo height={32} />
        </a>

        {/* Nav links — visible on md+ */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                padding: '6px 12px',
                borderRadius: 'var(--r-chip)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'rgba(31,58,138,0.07)' : 'transparent',
                transition: 'all var(--t-hover)',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {searchOpen ? (
            <form onSubmit={submitSearch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Varlık ara…"
                className="focus-ring"
                style={{
                  padding: '5px 12px', borderRadius: 'var(--r-chip)',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  fontSize: 14, color: 'var(--text)', outline: 'none', width: 180,
                }}
              />
              <button type="button" onClick={() => setSearchOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}>
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Ara"
              className="focus-ring"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}
            >
              🔍
            </button>
          )}
          <LiveDataBadge />
        </div>
      </div>
    </nav>
  );
}
