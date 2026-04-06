import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',          label: 'Piyasalar', icon: 'equalizer'  },
  { to: '/doviz',     label: 'Döviz',     icon: 'payments'   },
  { to: '/altin',     label: 'Altın',     icon: 'diamond'    },
  { to: '/endeksler', label: 'Endeksler', icon: 'show_chart' },
  { to: '/emtialar',  label: 'Emtialar',  icon: 'toll'       },
];

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-4 pb-7 pt-3 bg-white border-t border-[var(--color-outline-variant)]/40">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            isActive
              ? 'flex flex-col items-center justify-center text-[var(--color-primary)] font-semibold'
              : 'flex flex-col items-center justify-center text-slate-500 opacity-80'
          }
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span className="font-['Inter'] text-[11px] font-medium leading-none mt-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
