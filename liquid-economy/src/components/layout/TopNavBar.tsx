import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/',           label: 'Piyasalar' },
  { to: '/doviz',      label: 'Döviz'     },
  { to: '/altin',      label: 'Altın'     },
  { to: '/kapalicarsi',label: 'Kapalıçarşı' },
  { to: '/endeksler',  label: 'Endeksler' },
  { to: '/emtialar',   label: 'Emtialar'  },
  { to: '/kripto',     label: 'Kripto'    },
];

export default function TopNavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-[var(--color-outline-variant)]/40">
      <div className="flex justify-between items-center h-16 px-8 max-w-[1440px] mx-auto text-sm font-medium tracking-tight antialiased">
        {/* Logo */}
        <div className="flex items-center gap-2 select-none">
          <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="text-[var(--color-primary)] shrink-0">
            <polyline
              points="0,13 5,8 9,11 14,3 19,6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="5.5" r="2" fill="currentColor" />
          </svg>
          <span className="text-sm font-semibold tracking-tight text-slate-700">Döviz Veri</span>
        </div>

        {/* Nav links — hidden below lg */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] pb-1'
                  : 'text-slate-600 hover:text-slate-900 transition-colors'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right side — intentionally empty */}
        <div className="flex items-center gap-4" />
      </div>
    </nav>
  );
}
