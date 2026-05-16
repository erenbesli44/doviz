import { useInference } from '../hooks/useInference';
import { InferenceTopicCard, InferenceTopicCardSkeleton } from '../components/ui/InferenceTopicCard';
import SeoHead from '../components/seo/SeoHead';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Insights() {
  const { status, data } = useInference();

  return (
    <>
      <SeoHead
        path="/analiz"
        title="Günlük Piyasa Analizi — AI Destekli Sinyaller | Döviz Veri"
        description="Analist videolarından yapay zeka ile çıkarılan günlük piyasa sinyalleri: dolar, BIST, altın, kripto ve daha fazlası."
      />

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]/50">
            Günlük
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2.5 py-0.5 rounded-full tracking-wide">
            <span className="material-symbols-outlined text-[12px] leading-none">auto_awesome</span>
            AI Destekli
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)]">
          Piyasa Sinyalleri
        </h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1.5 leading-relaxed max-w-xl">
          Finans analistlerinin YouTube içeriklerinden yapay zeka ile çıkarılan günlük
          piyasa değerlendirmeleri.
        </p>

        {data?.generated_at && (
          <p className="text-xs text-[var(--color-on-surface-variant)]/50 mt-2 font-medium">
            Son güncelleme:{' '}
            <span className="tabular-nums">{formatDateTime(data.generated_at)}</span>
          </p>
        )}
      </div>

      {/* Loading */}
      {status === 'loading' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <InferenceTopicCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-8 text-sm text-[var(--color-on-surface-variant)] text-center">
          <span className="material-symbols-outlined text-[32px] block mb-2 opacity-40">
            error_outline
          </span>
          Analiz verileri şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      )}

      {/* Success */}
      {status === 'success' && data && (
        <>
          {data.topics.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-8 text-sm text-[var(--color-on-surface-variant)] text-center">
              Bugün için henüz analiz verisi bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.topics.map((topic) => (
                <InferenceTopicCard key={topic.topic_key} topic={topic} />
              ))}
            </div>
          )}

          {/* Footer note */}
          <p className="text-[11px] text-[var(--color-on-surface-variant)]/40 mt-8 text-center leading-relaxed max-w-md mx-auto">
            Bu sinyaller yatırım tavsiyesi değildir. Analist görüşlerinden otomatik
            olarak çıkarılmıştır. Her gün 19:10'dan sonra güncellenir.
          </p>
        </>
      )}
    </>
  );
}
