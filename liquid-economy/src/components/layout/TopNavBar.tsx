import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import Icon from '../ui/Icon';

const NAV_LINKS = [
  { to: '/',         label: 'Gündem',   end: true  },
  { to: '/haberler', label: 'Haberler', end: false },
  { to: '/konular',  label: 'Konular',  end: false },
  { to: '/uzmanlar', label: 'Uzmanlar', end: false },
  { to: '/piyasa',   label: 'Piyasa',   end: false },
];

export default function TopNavBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/ara?q=${encodeURIComponent(q)}`);
    setQuery('');
    setSearchOpen(false);
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-bg border-b border-border">
      <a href="#icerik" className="skip-link">İçeriğe geç</a>

      <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-6 px-4 md:px-6">
        <Link to="/" aria-label="Döviz Veri — Ana sayfa" className="shrink-0">
          <Logo height={30} />
        </Link>

        <nav aria-label="Ana menü" className="hidden md:flex items-stretch h-full gap-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center px-3 text-[14px] font-semibold no-underline transition-colors ${
                  isActive
                    ? 'text-text after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-accent'
                    : 'text-text-muted hover:text-text'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {searchOpen ? (
          <form onSubmit={submitSearch} role="search" className="flex items-center gap-1">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              placeholder="Haber, konu veya uzman ara"
              aria-label="Sitede ara"
              className="h-9 w-[200px] sm:w-[260px] rounded-[var(--r-chip)] border border-border bg-surface px-3 text-[14px] text-text placeholder:text-text-subtle"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Aramayı kapat"
              className="flex h-9 w-9 items-center justify-center text-text-muted hover:text-text bg-transparent border-0 cursor-pointer"
            >
              <Icon name="close" size={18} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Ara"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--r-chip)] text-text-muted hover:text-text hover:bg-surface-2 bg-transparent border-0 cursor-pointer transition-colors"
          >
            <Icon name="search" size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
