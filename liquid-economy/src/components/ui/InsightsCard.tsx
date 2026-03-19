import type { NewsItem } from '../../data/types';

interface Props {
  news: NewsItem[];
}

/**
 * Insights sidebar — featured article + brief news list.
 * Shown on desktop alongside the market summary list.
 */
export default function InsightsCard({ news }: Props) {
  const featured = news.find((n) => n.featured);
  const briefs   = news.filter((n) => !n.featured);

  return (
    <div className="bg-[var(--color-surface-container)] rounded-[2rem] p-8">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-on-surface-variant)] mb-8 opacity-60">
        Liquid Insights
      </h3>

      <div className="space-y-10">
        {/* Featured article */}
        {featured && (
          <article className="group cursor-pointer">
            {featured.image && (
              <div className="overflow-hidden rounded-2xl mb-4 aspect-video bg-[var(--color-surface-container-high)]">
                <img
                  src={featured.image}
                  alt={featured.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            )}
            <span className="text-[10px] font-bold uppercase text-[var(--color-primary)] mb-2 block">
              {featured.category}
            </span>
            <h4 className="text-lg font-bold leading-tight group-hover:text-[var(--color-primary)] transition-colors">
              {featured.headline}
            </h4>
            {featured.excerpt && (
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-2 line-clamp-2">
                {featured.excerpt}
              </p>
            )}
          </article>
        )}

        {/* Brief news list */}
        <div className="space-y-6">
          {briefs.map((item) => (
            <div key={item.id} className="border-t border-[var(--color-outline-variant)]/30 pt-6">
              <h5 className="text-sm font-bold leading-snug hover:underline cursor-pointer">
                {item.headline}
              </h5>
              <span className="text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-2 block">
                {item.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
