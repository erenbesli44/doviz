import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/',           label: 'Piyasalar' },
  { to: '/doviz',      label: 'Döviz'     },
  { to: '/altin',      label: 'Altın'     },
  { to: '/endeksler',  label: 'Endeksler' },
  { to: '/emtialar',   label: 'Emtialar'  },
];

export default function TopNavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm shadow-blue-900/5">
      <div className="flex justify-between items-center h-16 px-8 max-w-[1440px] mx-auto text-sm font-medium tracking-tight antialiased">
        {/* Logo */}
        <span className="text-xl font-bold tracking-tighter text-slate-900 select-none">
          The Liquid Economy
        </span>

        {/* Nav links — hidden below lg */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'text-blue-700 border-b-2 border-blue-600 pb-1'
                  : 'text-slate-500 hover:text-slate-900 transition-colors'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          <button
            aria-label="Bildirimler"
            className="p-2 hover:bg-slate-50 rounded-lg active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
              notifications
            </span>
          </button>
          <button
            aria-label="Hesap"
            className="p-2 hover:bg-slate-50 rounded-lg active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
              account_circle
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
