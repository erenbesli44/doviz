export default function LiveDataBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[10px] font-medium tracking-wide text-emerald-600">canlı veri</span>
    </span>
  );
}
