/**
 * ProAvatar
 *
 * Shows a pro's photo with a defined fallback chain:
 *   1. person.avatar_url  (future tracker field — not yet available)
 *   2. channel_metadata.avatar  (already in tracker response)
 *   3. Gradient circle with initials
 *
 * Props
 *   personAvatarUrl  – direct person avatar (optional, for future use)
 *   channelAvatarUrl – channel avatar from channel_metadata.avatar
 *   name             – used for alt text + initials fallback
 *   size             – 'sm' (24px) | 'md' (32px) | 'lg' (40px)
 */

import { useState } from 'react';

export interface ProAvatarProps {
  personAvatarUrl?: string;
  channelAvatarUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<ProAvatarProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

/** Deterministic hue from a name string — gives consistent gradient per person */
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProAvatar({
  personAvatarUrl,
  channelAvatarUrl,
  name,
  size = 'md',
}: ProAvatarProps) {
  const px = SIZES[size];

  // Try URLs in priority order; fall back to initials on any error
  const candidates = [personAvatarUrl, channelAvatarUrl].filter(Boolean) as string[];
  const [idx, setIdx] = useState(0);

  const hue = nameToHue(name);

  const commonStyle: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (idx < candidates.length) {
    return (
      <img
        src={candidates[idx]}
        alt={name}
        width={px}
        height={px}
        style={{ ...commonStyle, objectFit: 'cover' }}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }

  // Initials fallback
  return (
    <span
      aria-label={name}
      role="img"
      style={{
        ...commonStyle,
        background: `linear-gradient(135deg, hsl(${hue} 60% 55%), hsl(${(hue + 40) % 360} 70% 45%))`,
        color: '#fff',
        fontSize: px * 0.4,
        fontWeight: 600,
        userSelect: 'none',
      }}
    >
      {initials(name)}
    </span>
  );
}
