/**
 * ConfidenceDots
 *
 * 1–3 dot scale encoding the consensus confidence band.
 *
 *   ● ● ●   High     confidence >= 0.75
 *   ● ● ○   Medium   confidence >= 0.50
 *   ● ○ ○   Low      confidence  < 0.50
 *
 * Rules per spec §10.1:
 *  - aria-label: words + X/3 ratio (screen-reader)
 *  - title: precise % on hover (numeric transparency)
 *  - Dot color = --text (filled) / --border outline (empty)
 *  - Never shown alone — always paired with a direction or sentiment indicator
 */

export interface ConfidenceDotsProps {
  /** Confidence as a fraction: 0–1 */
  confidence: number;
}

function band(c: number): { filled: number; label: string } {
  if (c >= 0.75) return { filled: 3, label: 'yüksek' };
  if (c >= 0.5)  return { filled: 2, label: 'orta' };
  return           { filled: 1, label: 'düşük' };
}

export function ConfidenceDots({ confidence }: ConfidenceDotsProps) {
  const { filled, label } = band(confidence);
  const pct = Math.round(confidence * 100);

  return (
    <span
      className="conf-dots"
      role="img"
      aria-label={`Güven: ${label} (3 üzerinden ${filled})`}
      title={`Güven %${pct}`}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`conf-dot${i <= filled ? ' conf-dot--on' : ''}`}
        />
      ))}
    </span>
  );
}
