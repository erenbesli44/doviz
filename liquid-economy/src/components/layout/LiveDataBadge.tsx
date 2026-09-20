export default function LiveDataBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-bull" />
      </span>
      <span className="text-[13px] font-semibold text-bull">Canlı veri</span>
    </span>
  );
}
