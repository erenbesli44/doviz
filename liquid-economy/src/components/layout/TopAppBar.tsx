export default function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-3xl md:hidden">
      <div className="flex justify-between items-center w-full px-6 pt-12 pb-4">
        {/* Left: avatar + title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container-highest)] overflow-hidden flex-shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
              account_circle
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-blue-700">
            The Liquid Economy
          </h1>
        </div>
        {/* Right: search */}
        <button
          aria-label="Ara"
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100/50 transition-colors active:scale-95 duration-200"
        >
          <span className="material-symbols-outlined text-slate-900">search</span>
        </button>
      </div>
    </header>
  );
}
