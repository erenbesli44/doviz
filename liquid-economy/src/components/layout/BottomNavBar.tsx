import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/',         label: 'Gündem',   icon: 'today'      },
  { to: '/konular',  label: 'Konular',  icon: 'topic'      },
  { to: '/piyasa',   label: 'Piyasa',   icon: 'show_chart' },
  { to: '/haberler', label: 'Haberler', icon: 'newspaper'  },
];

export default function BottomNavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 md:hidden liquid-glass"
      style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        paddingTop: 10, paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        height: 56,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {TABS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            textDecoration: 'none', minWidth: 44, padding: '0 4px',
            transition: 'color var(--t-hover)',
          })}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, lineHeight: 1 }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
