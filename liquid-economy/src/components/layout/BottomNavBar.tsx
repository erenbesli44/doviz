import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',          label: 'Piyasalar', icon: 'equalizer'  },
  { to: '/doviz',     label: 'Döviz',     icon: 'payments'   },
  { to: '/altin',     label: 'Altın',     icon: 'savings'    },
  { to: '/endeksler', label: 'Endeksler', icon: 'show_chart' },
  { to: '/emtialar',  label: 'Emtialar',  icon: 'toll'       },
];

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-4 pb-8 pt-3 bg-white/70 backdrop-blur-3xl shadow-[0_-4px_40px_rgba(0,0,0,0.06)]">
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            isActive
              ? 'flex flex-col items-center justify-center text-blue-700 font-bold scale-110 transition-transform duration-300'
              : 'flex flex-col items-center justify-center text-slate-400 opacity-60 hover:opacity-100 transition-opacity duration-300'
          }
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span className="font-['Inter'] text-[10px] font-medium leading-none mt-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
