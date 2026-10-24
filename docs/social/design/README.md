# @dovizveri visual system

Owned by the `social-designer` agent. Goal: every image reads as "Döviz Veri" at a glance and
stays legible on a phone timeline (rendered ~500 px wide).

## Tokens (same as the site, `liquid-economy/src/styles/tokens.css`)
| Token | Value | Use |
|---|---|---|
| bg | `#FAFAF7` | card background |
| surface | `#FFFFFF` | list panels |
| border | `#E3E1DA` | rules, panel border |
| text / muted | `#16181B` / `#555A62` | body / secondary |
| accent | `#1F3A8A` | brand word "DÖVİZ VERİ", links |
| bull / bull-bg | `#15703D` / `#E4F4EA` | ↑ Yükseliş |
| bear / bear-bg | `#B83227` / `#FBE6E2` | ↓ Düşüş |
| neutral / neutral-bg | `#4B5563` / `#ECEDEE` | → Yatay (bar segment `#9AA1AB`) |
| warn | `#8A5A00` | "Değişti: …" notes |

Fonts: **Source Serif 4** 600 for the headline, **Inter** 400–700 for everything else.
Light theme only for images (X shows them on both themes; the light card has a clear edge).

## Formats
| Asset | Size | File | Notes |
|---|---|---|---|
| Outlook card | 1200×675 | `card-outlook.html` | headline left, people list right, max 6 rows |
| Weekly card | 1200×675 | (to design) | one row per instrument: bar + counts |
| View-change card | 1200×675 | (to design) | one person, old → new, quote ≤ 140 chars |
| Commentator card (v2, from 2026-10-24) | 1200×675 | layout of `make_cards.py` `commentator` | left: topic, name, source, direction pill, verbatim quote, "dd Ekim videosu, dakika m:ss"; **right panel = "Görüşün tamamı"**: label `GÖRÜŞÜN TAMAMI · ÖZET`, the first sentences of `cleanSummary(summary)` (no quote marks, ≥ 16 px, cut only at a sentence end, ≤ ~420 chars), then `Vade: …` if present, then "Devamı gönderinin altında · dovizveri.com/haberler/<video_id>" in accent. No peer counts while OI-020 is not live |
| Avatar | 400×400 | `avatar-a.html` (**live** since 2026-10-24; `avatar-b.html` = unused option) | navy "DV" monogram; must read at 48 px |
| Banner | 1500×500 | `banner-b.html` (**live** since 2026-10-24; `banner-a.html` = unused option) | "Kim ne bekliyor?" + dovizveri.com; keep x 0–420, y 300–500 clear (avatar overlap) |

## Fixed rules
- Header: `DÖVİZ VERİ · Kim ne bekliyor?` left, date (`24 Ekim 2026`) right.
- Footer: `dovizveri.com/<path> · kaynak: …` left, `Yatırım tavsiyesi değildir.` right — always.
- Direction is shown by **arrow + word + colour**, never colour alone.
- Minimum text size 14 px at 1200 px width; headline ≥ 40 px. Contrast ≥ 4.5:1 for text.
- Numbers on the image must equal the post text and the live site that day.
- No stock photos, logos of third parties, faces, or commentator photos.
- Max 6 people per card; more → say "+N kişi daha" and link.

## Pipeline
1. Copy the closest template, fill the data, keep the structure.
2. `docs/social/design/render.sh <file.html> <out>` → `<out>.png` (2×, for review) and
   `<out>.webp` (1200×675, for upload; aim ≤ 45 KB, the browser upload path sends it as base64).
3. Look at the PNG yourself (text overflow, wrapping, alignment) before handing it over.
