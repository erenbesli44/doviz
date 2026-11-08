import { cleanSummary } from '../../lib/views';

/** Whether "Görüşün tamamı" has anything to open; shared so callers can't drift from ViewDetails. */
export function hasDetailsContent(d: { summary: string; keyLevels?: string[] | null; horizon?: string | null; storyHref?: string | null }): boolean {
  return !!cleanSummary(d.summary) || (d.keyLevels ?? []).some(Boolean) || !!d.horizon || !!d.storyHref;
}
