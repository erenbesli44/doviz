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
        <a href="https://dovizveri.com/" className="flex items-center gap-2 select-none no-underline">
          <img src="/favicon.svg" alt="Döviz Veri" width="22" height="22" className="shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-slate-700">Döviz Veri</span>
        </a>

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
