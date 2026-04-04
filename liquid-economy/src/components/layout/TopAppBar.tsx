export default function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-[var(--color-outline-variant)]/40 md:hidden">
      <div className="flex justify-between items-center w-full px-6 pt-10 pb-3.5">
        <a href="https://dovizveri.com/" className="flex items-center gap-2 select-none no-underline">
          <img src="/favicon.svg" alt="Döviz Veri" width="22" height="22" className="shrink-0" />
          <h1 className="text-sm font-semibold tracking-tight text-slate-700">Döviz Veri</h1>
        </a>
      </div>
    </header>
  );
}
