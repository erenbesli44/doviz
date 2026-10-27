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
| Commentator card (**v3, from 2026-10-27**, owner decision) | 1200×675 | `card-commentator-v3.html` | left: commentator photo (200 px circle, the channel's own YouTube `channel_avatar_url`) + name + "YouTube · dd Eki"; right: topic, big direction pill, one line "önceki görüş: ↑ … (dd Eki)" when the view changed, verbatim quote ≤ ~100 chars (cut at a word end with "…"; full quote stays in the post text), "▶ Videoda m:ss · vade: …". **No summary panel** (the full view is in the "Görüşün tamamı" replies). Footer credits the photo. Rationale and phone-size comparison: `v3-trial/README.md` |
| Commentator card (v2, 2026-10-24 → 26) | 1200×675 | layout of `make_cards.py` `commentator` | superseded by v3: right "Görüşün tamamı" panel was unreadable at phone width |
| Avatar | 400×400 | `avatar-a.html` (**live** since 2026-10-24; `avatar-b.html` = unused option) | navy "DV" monogram; must read at 48 px |
| Banner | 1500×500 | `banner-b.html` (**live** since 2026-10-24; `banner-a.html` = unused option) | "Kim ne bekliyor?" + dovizveri.com; keep x 0–420, y 300–500 clear (avatar overlap) |

## Fixed rules
- Header: `DÖVİZ VERİ · Kim ne bekliyor?` left, date (`24 Ekim 2026`) right.
- Footer: `dovizveri.com/<path> · kaynak: …` left, `Yatırım tavsiyesi değildir.` right — always.
- Direction is shown by **arrow + word + colour**, never colour alone.
- Minimum text size 14 px at 1200 px width; headline ≥ 40 px. Contrast ≥ 4.5:1 for text.
- Numbers on the image must equal the post text and the live site that day.
- No stock photos, logos of third parties, or faces — **except** the commentator card v3 photo (owner
  decision 2026-10-27): only the channel's own YouTube profile image of the person quoted, small circle,
  credited in the footer ("profil fotoğrafı: <Name> YouTube kanalı"). Never video thumbnails. If the
  channel avatar is a company logo or another person (multi-guest channels such as Integral Forextv,
  Kanal Finans, NCM Investment TR), use the initials circle (`.ini`). Remove a photo on any creator request.
- Photos are downloaded per card into the scratchpad; never commit commentator photos to the repo.
- Max 6 people per card; more → say "+N kişi daha" and link.

## Pipeline
1. Copy the closest template, fill the data, keep the structure.
2. `docs/social/design/render.sh <file.html> <out>` → `<out>.png` (2×, for review) and
   `<out>.webp` (1200×675, for upload; aim ≤ 45 KB, the browser upload path sends it as base64).
3. Look at the PNG yourself (text overflow, wrapping, alignment) before handing it over.
