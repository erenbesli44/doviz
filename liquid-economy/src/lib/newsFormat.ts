// Presentation helpers for news stories: dates, reading time, paragraphs.

/** Upstream timestamps carry no timezone suffix — they are UTC. */
export function parseTs(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRelative(iso: string | null | undefined): string {
  const d = parseTs(iso);
  if (!d) return '';
  const diffMin = Math.round((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 1) return 'şimdi';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} sa önce`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay} gün önce`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function formatFull(iso: string | null | undefined): string {
  const d = parseTs(iso);
  if (!d) return '';
  return d.toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string | null | undefined): string {
  const d = parseTs(iso);
  if (!d) return '';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Local calendar-day key, for grouping a feed by day. */
export function dayKey(iso: string | null | undefined): string {
  const d = parseTs(iso);
  if (!d) return 'unknown';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(iso: string | null | undefined): string {
  const d = parseTs(iso);
  if (!d) return 'Tarihsiz';
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function readingMinutes(...texts: Array<string | null | undefined>): number {
  const words = texts.filter(Boolean).join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const ABBREVIATIONS = new Set(['dr', 'prof', 'doç', 'sn', 'vb', 'vs', 'bkz', 'no', 'av', 'yrd', 'org', 'alb']);

function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  // Sentence end: punctuation, optional closing quote, whitespace, then an uppercase/digit/quote opener.
  const re = /[.!?…]["”')]?\s+(?=[A-ZÇĞİÖŞÜ0-9"“(])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(start, m.index);
    const lastWord = (before.split(/\s+/).pop() ?? '').toLocaleLowerCase('tr-TR');
    // "Dr. Ahmet", "15. toplantı", single initials — not sentence ends.
    if (text[m.index] === '.' && (ABBREVIATIONS.has(lastWord) || /^\d+$/.test(lastWord) || lastWord.length <= 1)) continue;
    out.push(text.slice(start, m.index + m[0].length).trim());
    start = m.index + m[0].length;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

/**
 * Summaries arrive as one unbroken block. Honour real line breaks when present;
 * otherwise group sentences into short paragraphs so the text is scannable.
 */
export function toParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  const explicit = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;

  const sentences = splitSentences(explicit[0] ?? '');
  if (sentences.length <= 3) return explicit;

  const paragraphs: string[] = [];
  let current: string[] = [];
  let length = 0;
  for (const s of sentences) {
    current.push(s);
    length += s.length;
    if (current.length >= 2 && length >= 300) {
      paragraphs.push(current.join(' '));
      current = [];
      length = 0;
    }
  }
  if (current.length) {
    const rest = current.join(' ');
    if (rest.length < 140 && paragraphs.length) paragraphs[paragraphs.length - 1] += ` ${rest}`;
    else paragraphs.push(rest);
  }
  return paragraphs;
}

/** Turkish-aware lowercase for search matching (İ/I ↔ i/ı). */
export function fold(text: string | null | undefined): string {
  return (text ?? '').toLocaleLowerCase('tr-TR');
}
