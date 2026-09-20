/**
 * SymbolDetail — /piyasa/:slug
 *
 * slug = topic_key (e.g. "bitcoin", "usd-try", "altin")
 *
 * Layout
 *   mobile:  stacked — consensus card → key levels → opinion list → history chart → live price
 *   desktop: left column (consensus + opinions + history) + right rail (live price + 24h range + sources)
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAssetConsensus } from '../hooks/useAssetConsensus';
import { useTopicHistory } from '../hooks/useTopicHistory';
import { useTopicOpinions } from '../hooks/useTopicOpinions';
import { useSSEQuotes } from '../hooks/useSSEQuotes';
import { assetFromSlug } from '../data/assetMap';
import { ConsensusBar } from '../components/consensus/ConsensusBar';
import { ConsensusLabel, FreshSignalLabel } from '../components/consensus/ConsensusLabel';
import { ConfidenceDots } from '../components/consensus/ConfidenceDots';
import { KeyLevelChip } from '../components/consensus/KeyLevelChip';
import { OpinionCard } from '../components/consensus/OpinionCard';
import { SentimentChip } from '../components/consensus/SentimentChip';
import { EmptyState } from '../components/consensus/EmptyState';
import { formatPrice } from '../lib/adapters';
import type { TopicHistoryEntry } from '../data/inference-types';

// ── History chart ───────────────────────────────────────────────────────────
function HistoryChart({ entries }: { entries: TopicHistoryEntry[] }) {
  const data = entries.map((e) => ({
    date: e.run_date.slice(5),
    confidence: Math.round(e.confidence * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v) => [`${v}%`, 'Güven']}
          contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 6 }}
        />
        <Line type="monotone" dataKey="confidence" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Live price tile ─────────────────────────────────────────────────────────
function LivePriceTile({ symbol }: { symbol: string }) {
  const symbols = useMemo(() => [symbol], [symbol]);
  const { quotes, sseAvailable } = useSSEQuotes(symbols);
  const q = quotes[symbol];

  if (!q) return (
    <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--surface)' }}>
      <div style={{ height: 12, width: '60%', background: 'var(--surface-2)', borderRadius: 6 }} />
    </div>
  );

  const up = q.data.change_pct >= 0;
  return (
    <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
        Canlı Fiyat {!sseAvailable && <span style={{ color: 'var(--bear)' }}>(gecikmeli)</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: '32px' }}>
        {formatPrice(q.data.price, q.data.symbol, q.data.currency)}
        <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{q.data.currency}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 14 }}>
        <span style={{ color: up ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>
          {up ? '+' : ''}{q.data.change_pct.toFixed(2)}%
        </span>
        {q.data.change_value != null && (
          <span style={{ color: 'var(--text-muted)' }}>({up ? '+' : ''}{q.data.change_value.toFixed(2)})</span>
        )}
      </div>
      {q.data.high != null && q.data.low != null && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
          24s Aralık: {formatPrice(q.data.low, q.data.symbol, q.data.currency)} – {formatPrice(q.data.high, q.data.symbol, q.data.currency)}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
        Kaynak: {q.meta.provider}{!q.meta.is_live && ` · ${q.meta.delay_minutes ?? '?'} dk gecikmeli`}
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 style={{ margin: '0 0 12px', fontSize: 'var(--font-h2-size)', fontWeight: 600, color: 'var(--text)', lineHeight: 'var(--font-h2-lh)', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
      {title}
    </h2>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function SymbolDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const meta = assetFromSlug(slug);

  const { status: consensusStatus, consensus } = useAssetConsensus(slug);
  const { entries: historyEntries } = useTopicHistory(slug);
  const { opinions, status: opinionsStatus } = useTopicOpinions(slug);

  // 0..100 % values for the segment bar.
  const bull = consensus ? Math.round(consensus.main_consensus.bullish_score * 100) : 0;
  const bear = consensus ? Math.round(consensus.main_consensus.bearish_score * 100) : 0;
  const neutral = Math.max(0, 100 - bull - bear);

  const keyLevels = useMemo(() => {
    const map = new Map<string, number>();
    for (const op of opinions) for (const lvl of op.key_levels) map.set(lvl, (map.get(lvl) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [opinions]);

  if (consensusStatus === 'loading') {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[200, 120, 80].map((h) => (
          <div key={h} style={{ height: h, background: 'var(--surface-2)', borderRadius: 8 }} />
        ))}
      </div>
    );
  }

  if (!consensus) {
    return (
      <div style={{ padding: 24 }}>
        <Link to="/piyasa" style={{ color: 'var(--accent)', fontSize: 14 }}>← Tüm varlıklar</Link>
        <EmptyState
          title="Bu varlık için görüş verisi yok"
          body="Bu varlık için henüz analiz yok. İlk analiz yayınlandığında burada görünecek."
          cta={{ label: 'Haberlere git', href: '/haberler' }}
        />
      </div>
    );
  }

  const main = consensus.main_consensus;
  const fresh = consensus.fresh_signal;

  return (
    <div className="page-full-bleed" style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px' }}>
        <Link to="/piyasa" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>← Tüm varlıklar</Link>
        <h1 style={{ margin: '6px 0 0', fontSize: 'var(--font-h1-size)', fontWeight: 600, color: 'var(--text)' }}>
          {consensus.display_name}
        </h1>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <span style={{ padding: '2px 8px', background: 'var(--neutral-bg)', color: 'var(--neutral)', borderRadius: 'var(--r-chip)', fontSize: 12 }}>
            {consensus.asset_code}
          </span>
          <span style={{ padding: '2px 8px', background: 'var(--neutral-bg)', color: 'var(--neutral)', borderRadius: 'var(--r-chip)', fontSize: 12 }}>
            {consensus.group}
          </span>
        </div>
      </div>

      <div className="detail-layout" style={{ padding: '12px 16px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

          {/* Mobile: live price at top */}
          <div className="detail-mobile-price">
            {meta && <LivePriceTile symbol={meta.symbol} />}
          </div>

          {/* Consensus card */}
          <section aria-label="Uzman konsensüsü">
            <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 'var(--r-hero)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ConsensusLabel direction={main.direction} />
                  <ConfidenceDots confidence={main.confidence} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%{Math.round(main.confidence * 100)} güven</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {consensus.stats.opinion_count} görüş · {consensus.stats.expert_count} uzman · son 5 gün
                </span>
              </div>
              <ConsensusBar bullish={bull} neutral={neutral} bearish={bear} size="lg" />
              <p style={{ margin: 0, fontSize: 15, color: 'var(--text)', lineHeight: '24px' }}>{main.summary}</p>

              {/* Fresh 24h signal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-card)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>24 saat</span>
                <FreshSignalLabel direction={fresh.direction} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fresh.summary}</span>
              </div>
            </div>
          </section>

          {/* High-weight expert view */}
          {consensus.high_weight_expert_view && (
            <section aria-label="Ağırlığı yüksek uzmanlar">
              <SectionHeading title="Ağırlığı Yüksek Uzmanlar" />
              <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ConsensusLabel direction={consensus.high_weight_expert_view.direction} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {consensus.high_weight_expert_view.expert_count} uzman
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: '22px' }}>
                  {consensus.high_weight_expert_view.summary}
                </p>
              </div>
            </section>
          )}

          {/* Top reasons */}
          {consensus.top_reasons.length > 0 && (
            <section aria-label="Ana gerekçeler">
              <SectionHeading title="Ana Gerekçeler" />
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {consensus.top_reasons.map((reason, i) => (
                  <li key={i} style={{
                    fontSize: 14, color: 'var(--text)', lineHeight: '22px',
                    padding: '10px 14px', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-card)', background: 'var(--surface)',
                    borderLeft: '3px solid var(--accent)',
                  }}>
                    {reason}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contrarian view */}
          {consensus.contrarian_view && (
            <section aria-label="Aykırı görüş">
              <SectionHeading title="Aykırı Görüş" />
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SentimentChip sentiment={consensus.contrarian_view.direction} />
                  {consensus.contrarian_view.expert_name && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {consensus.contrarian_view.expert_name}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: '22px' }}>
                  {consensus.contrarian_view.summary}
                </p>
              </div>
            </section>
          )}

          {/* Key levels (derived from opinions) */}
          {keyLevels.length > 0 && (
            <section aria-label="Anahtar seviyeler">
              <SectionHeading title="Anahtar Seviyeler" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keyLevels.map(([lvl, cnt]) => <KeyLevelChip key={lvl} price={lvl} count={cnt} />)}
              </div>
            </section>
          )}

          {/* Opinion list */}
          <section aria-label="Uzman görüşleri">
            <SectionHeading title="Tüm Uzman Görüşleri" />
            {opinionsStatus === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map((i) => <div key={i} style={{ height: 100, background: 'var(--surface-2)', borderRadius: 8 }} />)}
              </div>
            )}
            {opinionsStatus === 'success' && opinions.length === 0 && (
              <EmptyState title="Henüz görüş yok" body="Bu varlık için uzman analizi yok." cta={{ label: 'Haberlere git', href: '/haberler' }} />
            )}
            {opinionsStatus === 'success' && opinions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {opinions.map((op) => <OpinionCard key={op.video_id} opinion={op} />)}
              </div>
            )}
          </section>

          {/* History chart */}
          {historyEntries.length > 0 && (
            <section aria-label="Görüş geçmişi">
              <SectionHeading title="30 Günlük Güven Geçmişi" />
              <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--surface)' }}>
                <HistoryChart entries={historyEntries} />
              </div>
            </section>
          )}
        </div>

        {/* Right rail (desktop) */}
        <aside className="detail-right-rail" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {meta && <LivePriceTile symbol={meta.symbol} />}
          {consensus.important_experts.length > 0 && (
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--r-card)', background: 'var(--surface)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Önemli Uzmanlar
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {consensus.important_experts.map((exp) => (
                  <div key={exp.expert_name + (exp.video_url ?? '')} style={{ fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{exp.expert_name}</span>
                      <SentimentChip sentiment={exp.direction} />
                      {exp.weight !== 1 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>×{exp.weight.toFixed(1)}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: '18px' }}>{exp.main_claim}</p>
                    {exp.video_url && (
                      <a href={exp.video_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
                        Videoyu izle →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .detail-layout { display: block; }
        .detail-right-rail { display: none !important; }
        .detail-mobile-price { display: block; margin-bottom: 16px; }
        @media (min-width: 1024px) {
          .detail-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
          .detail-right-rail { display: flex !important; }
          .detail-mobile-price { display: none; }
        }
      `}</style>
    </div>
  );
}
