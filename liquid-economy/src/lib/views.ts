/**
 * "Kim ne bekliyor" helpers — shared by the home, instrument and person pages.
 *
 * A view is the speaker's forward-looking price direction for the instrument
 * (tracker `outlook`), shown only when it is their stated main scenario
 * (`outlook_explicit`). Mentions the tracker has not classified yet fall back
 * to the old sentiment label until the backfill covers them (OI-017).
 */

import type { TopicOpinion, PersonTimelinePoint } from '../data/consensus-types';

export type Direction = 'up' | 'down' | 'flat';

export interface Instrument {
  key: string;   // topic_key used by /inference and /channels endpoints
  label: string;
}

export const INSTRUMENTS: Instrument[] = [
  { key: 'dolar-tl',      label: 'Dolar/TL' },
  { key: 'bist',          label: 'BIST 100' },
  { key: 'altin',         label: 'Altın' },
  { key: 'bitcoin',       label: 'Bitcoin' },
  { key: 'us-markets',    label: 'ABD Borsaları' },
  { key: 'gumus',         label: 'Gümüş' },
  { key: 'petrol-enerji', label: 'Petrol' },
];

export const INSTRUMENT_KEYS = INSTRUMENTS.map((i) => i.key);

export function instrumentLabel(key: string): string {
  return INSTRUMENTS.find((i) => i.key === key)?.label ?? key;
}

const LEGACY: Record<string, Direction> = { bullish: 'up', bearish: 'down' };

type Classified = Pick<TopicOpinion, 'sentiment' | 'outlook' | 'outlook_explicit'>;

/** The direction to show, or null when the speaker gave no clear forward-looking view. */
export function directionOf(o: Classified): Direction | null {
  if (o.outlook != null) {
    return o.outlook_explicit && o.outlook !== 'none' ? o.outlook : null;
  }
  return LEGACY[o.sentiment] ?? null;
}

/** Speaker's own words when the tracker extracted them, else a summary excerpt. */
export function quoteOf(o: { outlook_quote?: string | null; summary: string }): string {
  return o.outlook_quote?.trim() || excerpt(o.summary);
}

export function personOf(o: TopicOpinion): string {
  return o.person_name || o.channel_name;
}

/** Drop the "Topic: " prefix ingestion adds to every summary. */
export function cleanSummary(s: string): string {
  const i = s.indexOf(':');
  return (i > 0 && i < 40 ? s.slice(i + 1) : s).trim();
}

/** First one or two sentences, capped — a quote-length excerpt, not the whole summary. */
export function excerpt(s: string, max = 200): string {
  const text = cleanSummary(s);
  const parts = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let out = '';
  for (const p of parts) {
    if ((out + p).length > max) break;
    out += p;
  }
  out = out.trim() || text.slice(0, max);
  return out.length < text.length && !/[.!?]$/.test(out) ? `${out}…` : out;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('tr-TR', sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

export function videoMomentUrl(url: string, startSec: number | null): string {
  if (!startSec || startSec <= 0) return url;
  return `${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(startSec)}s`;
}

export function formatClock(sec: number | null): string | null {
  if (sec == null || sec <= 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Per-person current vs previous view ─────────────────────────────────────

export interface DatedView<T> { item: T; direction: Direction }

export interface PersonView {
  person: string;
  avatarUrl: string | null;
  channelName: string;
  current: DatedView<TopicOpinion>;
  previous: DatedView<TopicOpinion> | null;
  changed: boolean;
}

const byDateDesc = <T extends { published_at: string }>(a: T, b: T) =>
  (b.published_at || '').localeCompare(a.published_at || '');

/** One entry per person: their latest clear view and the one before it. */
export function personViews(opinions: TopicOpinion[]): PersonView[] {
  const map = new Map<string, DatedView<TopicOpinion>[]>();
  for (const o of [...opinions].sort(byDateDesc)) {
    const direction = directionOf(o);
    if (!direction) continue;
    const k = personOf(o);
    map.set(k, [...(map.get(k) ?? []), { item: o, direction }]);
  }
  return Array.from(map.entries())
    .map(([person, list]) => {
      const [current, previous = null] = list;
      return {
        person,
        avatarUrl: current.item.channel_avatar_url,
        channelName: current.item.channel_name,
        current,
        previous,
        changed: previous !== null && previous.direction !== current.direction,
      };
    })
    .sort((a, b) => byDateDesc(a.current.item, b.current.item));
}

export function tally(views: PersonView[]): Record<Direction, number> {
  const t: Record<Direction, number> = { up: 0, down: 0, flat: 0 };
  for (const v of views) t[v.current.direction] += 1;
  return t;
}

// ── Person page: per-instrument history from timeline points ────────────────

export interface InstrumentHistory {
  current: DatedView<PersonTimelinePoint> | null;
  previous: DatedView<PersonTimelinePoint> | null;
  changed: boolean;
  points: DatedView<PersonTimelinePoint>[]; // clear views only, newest first
}

export function instrumentHistory(points: PersonTimelinePoint[]): InstrumentHistory {
  const dir: DatedView<PersonTimelinePoint>[] = [];
  for (const p of [...points].sort((a, b) => (b.date || '').localeCompare(a.date || ''))) {
    const direction = directionOf(p);
    if (direction) dir.push({ item: p, direction });
  }
  const [current = null, previous = null] = dir;
  return {
    current,
    previous,
    changed: previous !== null && current !== null && previous.direction !== current.direction,
    points: dir,
  };
}
