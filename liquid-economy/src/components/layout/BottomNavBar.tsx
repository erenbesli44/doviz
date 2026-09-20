import { NavLink } from 'react-router-dom';
import Icon, { type IconName } from '../ui/Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/',         label: 'Gündem',   icon: 'home'   },
  { to: '/haberler', label: 'Haberler', icon: 'news'   },
  { to: '/konular',  label: 'Konular',  icon: 'topics' },
  { to: '/uzmanlar', label: 'Uzmanlar', icon: 'users'  },
  { to: '/piyasa',   label: 'Piyasa',   icon: 'chart'  },
];

export default function BottomNavBar() {
  return (
    <nav
      aria-label="Alt menü"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-bg border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-14 items-stretch">
        {TABS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 no-underline transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            <Icon name={icon} size={20} />
            <span className="text-[11px] font-semibold leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
