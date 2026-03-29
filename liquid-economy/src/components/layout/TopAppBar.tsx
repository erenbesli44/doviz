export default function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-[var(--color-outline-variant)]/40 md:hidden">
      <div className="flex justify-between items-center w-full px-6 pt-10 pb-3.5">
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
          <h1 className="text-sm font-semibold tracking-tight text-slate-700">Döviz Veri</h1>
        </div>
      </div>
    </header>
  );
}
