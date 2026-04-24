import { NavLink } from 'react-router-dom';
import Logo from '../ui/Logo';
import LiveDataBadge from './LiveDataBadge';

const navLinks = [
  { to: '/',           label: 'Piyasalar' },
  { to: '/doviz',      label: 'Döviz'     },
  { to: '/altin',      label: 'Altın'     },
  { to: '/kapalicarsi',label: 'Kapalıçarşı' },
  { to: '/endeksler',  label: 'Endeksler' },
  { to: '/emtialar',   label: 'Emtialar'  },
  { to: '/kripto',     label: 'Kripto'    },
  { to: '/haberler',   label: 'Haberler'  },
];

export default function TopNavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-[var(--color-outline-variant)]/40">
      <div className="flex justify-between items-center h-16 px-8 max-w-[1440px] mx-auto text-sm font-medium tracking-tight antialiased">
        {/* Logo */}
        <a href="https://dovizveri.com/" className="flex items-center select-none no-underline">
          <Logo height={36} />
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

        {/* Right side */}
        <div className="flex items-center gap-4">
          <LiveDataBadge />
        </div>
      </div>
    </nav>
  );
}
