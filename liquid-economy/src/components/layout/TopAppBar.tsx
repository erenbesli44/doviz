import Logo from '../ui/Logo';
import LiveDataBadge from './LiveDataBadge';

export default function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-[var(--color-outline-variant)]/40 md:hidden">
      <div className="flex justify-between items-center w-full px-6 pt-10 pb-3.5">
        <a href="https://dovizveri.com/" className="flex items-center select-none no-underline">
          <Logo height={34} />
        </a>
        <LiveDataBadge />
      </div>
    </header>
  );
}
