export default function FAB() {
  return (
    <button
      aria-label="Yeni ekle"
      className="fixed bottom-28 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white shadow-[0_4px_40px_rgba(0,79,219,0.3)] flex items-center justify-center z-40 active:scale-90 transition-transform md:hidden"
    >
      <span className="material-symbols-outlined">add</span>
    </button>
  );
}
