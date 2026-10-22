/**
 * "Kim ne bekliyor" helpers — shared by the home, instrument and person pages.
 *
 * Until the tracker ships the `explicit` flag (OI-017), a directional
 * sentiment (bullish / bearish) stands in for "explicitly stated view" and
 * neutral stands in for "no clear view". Swap `isDirectional` for the flag
 * when it lands; nothing else needs to change.
 */

import type { TopicOpinion, PersonTimelinePoint } from '../data/consensus-types';

export type Direction = 'bullish' | 'bearish';

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

export function isDirectional(s: string): s is Direction {
  return s === 'bullish' || s === 'bearish';
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

export interface PersonView {
  person: string;
  avatarUrl: string | null;
  channelName: string;
  current: TopicOpinion;
  previous: TopicOpinion | null;
  changed: boolean;
}

const byDateDesc = <T extends { published_at: string }>(a: T, b: T) =>
  (b.published_at || '').localeCompare(a.published_at || '');

/** One entry per person: their latest directional view and the one before it. */
export function personViews(opinions: TopicOpinion[]): PersonView[] {
  const sorted = opinions.filter((o) => isDirectional(o.sentiment)).sort(byDateDesc);
  const map = new Map<string, TopicOpinion[]>();
  for (const o of sorted) {
    const k = personOf(o);
    map.set(k, [...(map.get(k) ?? []), o]);
  }
  return Array.from(map.entries())
    .map(([person, list]) => {
      const [current, previous = null] = list;
      return {
        person,
        avatarUrl: current.channel_avatar_url,
        channelName: current.channel_name,
        current,
        previous,
        changed: previous !== null && previous.sentiment !== current.sentiment,
      };
    })
    .sort((a, b) => byDateDesc(a.current, b.current));
}

export function tally(views: PersonView[]): { up: number; down: number } {
  return views.reduce(
    (acc, v) => (v.current.sentiment === 'bullish' ? { ...acc, up: acc.up + 1 } : { ...acc, down: acc.down + 1 }),
    { up: 0, down: 0 },
  );
}

// ── Person page: per-instrument history from timeline points ────────────────

export interface InstrumentHistory {
  current: PersonTimelinePoint | null;
  previous: PersonTimelinePoint | null;
  changed: boolean;
  points: PersonTimelinePoint[]; // directional only, newest first
}

export function instrumentHistory(points: PersonTimelinePoint[]): InstrumentHistory {
  const dir = points
    .filter((p) => isDirectional(p.sentiment))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const [current = null, previous = null] = dir;
  return { current, previous, changed: previous !== null && current !== null && previous.sentiment !== current.sentiment, points: dir };
}
