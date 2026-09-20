interface LogoProps {
  height?: number;
}

/** Inline SVG logo. Colors come from theme tokens so it holds up in light and dark. */
export default function Logo({ height = 28 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 156 36"
      height={height}
      fill="none"
      aria-label="Döviz Veri"
      role="img"
      style={{ display: 'block' }}
    >
      <rect width="36" height="36" rx="3" fill="var(--text)" />
      {/* accent stripe, left corners rounded to match the badge */}
      <path d="M3 0h2v36H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z" fill="var(--accent)" />
      {/* D */}
      <path
        d="M9 10h5.2c3.8 0 6.8 2.7 6.8 8s-3 8-6.8 8H9V10z
           M11.6 12.4v11.2h2.4c2.4 0 4.2-1.8 4.2-5.6s-1.8-5.6-4.2-5.6h-2.4z"
        fill="var(--bg)"
        fillRule="evenodd"
      />
      {/* V */}
      <path d="M22.5 10h2.8l3.2 11.2L31.7 10H34.5L30 26h-3L22.5 10z" fill="var(--bg)" />

      <line x1="46" y1="7" x2="46" y2="29" stroke="var(--border)" strokeWidth="1" />

      <text
        x="55" y="16"
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontSize="12" fontWeight="700" letterSpacing="1"
        fill="var(--text)"
      >
        DÖVİZ
      </text>
      <text
        x="56" y="29"
        fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
        fontSize="8.5" fontWeight="500" letterSpacing="3.5"
        fill="var(--text-muted)"
      >
        VERİ
      </text>
    </svg>
  );
}
