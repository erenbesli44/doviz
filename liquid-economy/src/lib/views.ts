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

/** Turkish-aware key so "ATİLLA YEŞİLADA" (his channel) and "Atilla Yeşilada" (a guest spot) match. */
export function personKey(name: string): string {
  return name.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

/**
 * Profile link for a view: the expert page whose name matches the speaker,
 * else the speaker's channel. Guest spots on multi-guest channels (OI-018)
 * resolve to the guest's own page this way.
 */
export function profileHref(
  channels: { name: string; slug: string }[],
  view: { person: string; channelName: string },
): string | undefined {
  const match =
    channels.find((c) => personKey(c.name) === personKey(view.person)) ??
    channels.find((c) => c.name === view.channelName);
  return match ? `/uzmanlar/${match.slug}` : undefined;
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

/** "bugün" / "12 gün önce" / "3 ay önce" / "1 yıl önce"; empty for an unparseable date. */
export function ageLabel(iso: string): string {
  const t = localTime(iso);
  if (Number.isNaN(t)) return '';
  const days = Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
  if (days === 0) return 'bugün';
  if (days < 60) return `${days} gün önce`;
  if (days < 365) return `${Math.floor(days / 30)} ay önce`;
  return `${Math.floor(days / 365)} yıl önce`;
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
    const k = personKey(personOf(o));
    map.set(k, [...(map.get(k) ?? []), { item: o, direction }]);
  }
  return Array.from(map.values())
    .map((list) => {
      const [current, previous = null] = list;
      return {
        person: personOf(current.item),
        avatarUrl: current.item.channel_avatar_url,
        channelName: current.item.channel_name,
        current,
        previous,
        changed: previous !== null && previous.direction !== current.direction,
      };
    })
    .sort((a, b) => byDateDesc(a.current.item, b.current.item));
}

/** A person whose latest view differs from the one before it. */
export type Changed = PersonView & { previous: DatedView<TopicOpinion> };

export const isChange = (v: PersonView): v is Changed => v.changed && v.previous !== null;

export function tally(views: PersonView[]): Record<Direction, number> {
  const t: Record<Direction, number> = { up: 0, down: 0, flat: 0 };
  for (const v of views) t[v.current.direction] += 1;
  return t;
}

// ── Counting window ─────────────────────────────────────────────────────────

/**
 * One window for every surface (home, instrument page, X cards): a person is
 * counted when their latest clear view was published in the last N days.
 * Filtered here on `published_at` because the API's `days` parameter is not a
 * publish-date window (days=30 also returns views from August).
 */
export const VIEW_WINDOW_DAYS = 30;

const DAY_MS = 86_400_000;

/**
 * Timestamps have no zone and JS reads them as local time; a date-only string
 * ("2026-09-19", person timelines) would be read as UTC midnight, so read it
 * as local midnight too and both pages agree at the window edge.
 */
function localTime(iso: string): number {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso).getTime();
}

export function isRecent(iso: string): boolean {
  const t = localTime(iso);
  return !Number.isNaN(t) && Date.now() - t < VIEW_WINDOW_DAYS * DAY_MS;
}

export function inWindow(view: PersonView): boolean {
  return isRecent(view.current.item.published_at);
}

// ── Verdict headline ("7 yorumcudan 5'i yükseliş bekliyor") ─────────────────

/** Noun after "bekliyor": "yatay bekliyor" is not Turkish, "yatay seyir bekliyor" is. */
export const EXPECTATION_WORD: Record<Direction, string> = { up: 'yükseliş', down: 'düşüş', flat: 'yatay seyir' };
export const DIRECTION_ARROW: Record<Direction, string> = { up: '↑', down: '↓', flat: '→' };

// Suffix after a numeral follows its last spoken word: 5'i (beş), 6'sı (altı), 40'ı (kırk).
const UNIT_SUFFIX = ['', "'i", "'si", "'ü", "'ü", "'i", "'sı", "'si", "'i", "'u"];
const TENS_SUFFIX = ['', "'u", "'si", "'u", "'ı", "'si", "'ı", "'i", "'i", "'ı"];

export function numeralSuffix(n: number): string {
  if (n % 10) return UNIT_SUFFIX[n % 10];
  if (n % 100) return TENS_SUFFIX[(n % 100) / 10];
  return n % 1000 ? "'ü" : "'i"; // yüz, bin
}

export type Verdict =
  | { kind: 'majority'; total: number; count: number; direction: Direction }
  | { kind: 'split'; total: number }
  | { kind: 'few'; total: number };

/** A majority claim needs at least 3 people and more than half of them on one side. */
export function verdictOf(views: PersonView[]): Verdict | null {
  const total = views.length;
  if (total === 0) return null;
  if (total < 3) return { kind: 'few', total };
  const [direction, count] = (Object.entries(tally(views)) as [Direction, number][])
    .sort((a, b) => b[1] - a[1])[0];
  return count * 2 > total ? { kind: 'majority', total, count, direction } : { kind: 'split', total };
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
