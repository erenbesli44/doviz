export default function TopAppBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-3xl md:hidden">
      <div className="flex justify-between items-center w-full px-6 pt-10 pb-3">
        <h1 className="text-sm font-semibold tracking-tight text-slate-500">
          The Liquid Economy
        </h1>
      </div>
    </header>
  );
}
