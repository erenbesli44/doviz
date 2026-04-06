interface LogoProps {
  height?: number;
}

/**
 * Inline SVG logo — renders as a geometric mark + wordmark.
 * Using geometric paths instead of <text> so no font-loading issues.
 */
export default function Logo({ height = 28 }: LogoProps) {
  // All coords are in a 156×36 viewBox
  return (
    <svg
      viewBox="0 0 156 36"
      height={height}
      fill="none"
      aria-label="Döviz Veri"
      role="img"
      style={{ display: 'block' }}
    >
      {/* ── Badge ──────────────────────────────── */}
      {/* Navy background */}
      <rect width="36" height="36" rx="5" fill="#0A1628" />
      {/* Blue left accent stripe */}
      <rect x="0" y="0" width="5" height="36" rx="0" fill="#004fdb" />

      {/*
        "DV" rendered as geometric paths (vectorised, 14px Inter 800 at 36px height)
        D: starts at x=9, V: ends at x=31, baseline y=25
      */}
      {/* D */}
      <path
        d="M9 10h5.2c3.8 0 6.8 2.7 6.8 8s-3 8-6.8 8H9V10z
           M11.6 12.4v11.2h2.4c2.4 0 4.2-1.8 4.2-5.6s-1.8-5.6-4.2-5.6h-2.4z"
        fill="white"
      />
      {/* V */}
      <path
        d="M22.5 10h2.8l3.2 11.2L31.7 10H34.5L30 26h-3L22.5 10z"
        fill="white"
      />

      {/* ── Separator ──────────────────────────── */}
      <line x1="46" y1="7" x2="46" y2="29" stroke="#CBD5E1" strokeWidth="0.75" />

      {/* ── Wordmark: DÖVİZ ─────────────────────
          Using system-font text here inside an inline SVG is safe —
          fonts are available because this is rendered in the DOM, not via <img>
      */}
      <text
        x="55" y="16"
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontSize="12"
        fontWeight="700"
        fill="#0A1628"
        letterSpacing="1"
      >
        DÖVİZ
      </text>
      <text
        x="56" y="29"
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontSize="8.5"
        fontWeight="500"
        fill="#64748B"
        letterSpacing="3.5"
      >
        VERİ
      </text>
    </svg>
  );
}
