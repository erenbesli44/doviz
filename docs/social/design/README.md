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
| Commentator card (**v3.1 mobile-first, from 2026-10-27**, owner decision) | 1200×675 | `card-commentator-v3.html` | left: commentator photo (280 px circle, the channel's own YouTube `channel_avatar_url`), name 58 px, "YouTube kanalı"; right: instrument 46 px, direction block 92 px ("↓ Düşüş" + "bekliyor · dd Eki"), and only for a view change one line "Önceki: ↑ Yükseliş · dd Eki" 46 px; navy bottom bar "dovizveri.com" + "Yatırım tavsiyesi değildir." 38 px. **No quote, video minute, summary or source line on the card** — they are in the post text, replies and alt text. Why: the card is shown ~295 px wide in the phone feed (~25 %), so text < ~34 px is unreadable. Comparison: `v3-trial/README.md` |
| Commentator card (v2, 2026-10-24 → 26) | 1200×675 | layout of `make_cards.py` `commentator` | superseded by v3: right "Görüşün tamamı" panel was unreadable at phone width. v2 showed the quote (`outlook_quote_clean`, else `outlook_quote` — same as the post) on the left and the summary panel on the right |
| Avatar | 400×400 | `avatar-a.html` (**live** since 2026-10-24; `avatar-b.html` = unused option) | navy "DV" monogram; must read at 48 px |
| Banner | 1500×500 | `banner-b.html` (**live** since 2026-10-24; `banner-a.html` = unused option) | "Kim ne bekliyor?" + dovizveri.com; keep x 0–420, y 300–500 clear (avatar overlap) |

## Fixed rules
- Header: `DÖVİZ VERİ · Kim ne bekliyor?` left, date (`24 Ekim 2026`) right.
- Footer: `dovizveri.com/<path> · kaynak: …` left, `Yatırım tavsiyesi değildir.` right — always.
  Exception, commentator card v3.1: no header; a navy bottom bar `dovizveri.com` + `Yatırım tavsiyesi değildir.`.
- Direction is shown by **arrow + word + colour**, never colour alone.
- **Phone first**: X shows a 1200 px card ~295 px wide in the phone feed. Commentator cards: every text ≥ 34 px,
  direction ≥ 88 px, ≤ ~20 words. Other formats: minimum 14 px, headline ≥ 40 px until they are redesigned.
  Check every card in a 375 px phone-feed mockup before handing it over. Contrast ≥ 4.5:1 for text.
- Numbers on the image must equal the post text and the live site that day.
- No stock photos, logos of third parties, or faces — **except** the commentator card v3 photo (owner
  decision 2026-10-27): only the channel's own YouTube profile image of the person quoted, small circle,
  credited with "YouTube kanalı" under the name and the full credit in the alt text. Never video thumbnails. If the
  channel avatar is a company logo or another person (multi-guest channels such as Integral Forextv,
  Kanal Finans, NCM Investment TR), use the initials circle (`.ini`). Remove a photo on any creator request.
- Photos are downloaded per card into the scratchpad; never commit commentator photos to the repo.
- Max 6 people per card; more → say "+N kişi daha" and link.

## Pipeline
1. Copy the closest template, fill the data, keep the structure.
2. `docs/social/design/render.sh <file.html> <out>` → `<out>.png` (2×, for review) and
   `<out>.webp` (1200×675, for upload; aim ≤ 45 KB, the browser upload path sends it as base64).
3. Look at the PNG yourself (text overflow, wrapping, alignment) before handing it over.
