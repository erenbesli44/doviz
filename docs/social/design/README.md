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
| Explainer card (from 2026-10-29) | 1200×675 | `card-explainer.html` | how-it-works card, same font stack, tokens and navy bottom bar as commentator v3.1 (no header). Navy headline 72 px (one line, ≤ ~30 chars), max 3 rule lines 48 px with navy square bullets, optional row of direction pills 46 px (arrow + word + colour); text ≥ 34 px. No names, photos, prices or counts. Check it in the 375 px phone mockup |
| Commentator card (**v3.1 mobile-first, from 2026-10-27**, owner decision) | 1200×675 | `card-commentator-v3.html` | left: commentator photo (280 px circle, the channel's own YouTube `channel_avatar_url`), name 58 px, "YouTube kanalı"; right: instrument 46 px, direction block 92 px ("↓ Düşüş" + "bekliyor · dd Eki"), and only for a view change one line "Önceki: ↑ Yükseliş · dd Eki" 46 px; then "Vade: <outlook_horizon>" 46 px when the row has a horizon (omit the line otherwise); the direction word is the site's own wording (e.g. "→ Yatay seyir", not "→ Yatay"); navy bottom bar "dovizveri.com" + "Yatırım tavsiyesi değildir." 38 px. **No quote, video minute, summary or source line on the card** — they are in the post text, replies and alt text. Why: the card is shown ~295 px wide in the phone feed (~25 %), so text < ~34 px is unreadable. Comparison: `v3-trial/README.md` |
| Main-idea card (thesis channels, owner 2026-11-02) | 1200×675 | `card-commentator-v3.html` layout | left: channel photo or initials circle + name + "YouTube kanalı"; right: **the main idea itself**, 64 px 800 accent, balanced wrap, max ~660 px, + "dd Ay yayını" 38 px muted. No "Videonun ana fikri" label, no arrow/direction. Yatırım 101: card only, no clip. Clip posts never get a card |
| Commentator card (v2, 2026-10-24 → 26) | 1200×675 | layout of `make_cards.py` `commentator` | superseded by v3: right "Görüşün tamamı" panel was unreadable at phone width. v2 showed the quote (`outlook_quote_clean`, else `outlook_quote` — same as the post) on the left and the summary panel on the right |
| Level chart card (**from 2026-11-07**, playbook §3.5 item 6) | 1200×675 | `card-level-chart.html` + `make_level_chart.py` | the site's price series for the instrument with the speaker's named price level(s) as dashed navy lines and labelled pills; headline = the speaker's own sentence in quote marks (Charter 44 px, ≤ 95 chars; 38 px up to 130), attribution `Ad · Kanal · dd Ay` 34 px, legend with instrument, unit, granularity, period 30 px, navy bottom bar. No photo, no arrow, no direction colour: the only colours are navy (speaker's levels) and dark grey (price). Third media option, tested against the card only, never against the clip. Fill rules: § "Level chart card" below |
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

| Video clip (from 2026-11-01, playbook §3.4) | 1280×720 mp4, ≤ 60 s (owner 2026-11-06), ≤ 10 MB | `clip_bounds.py` → `make_clip.sh` | whole sentences only, both cuts in a pause (playbook §3.4 item 1a); the quoted moment with an 84 px caption bar: name · channel · date · minute, source URL, dovizveri.com, disclaimer. Replaces the card on that post; uploaded like a card (step 4) |

## Level chart card (playbook §3.5 item 6; built 2026-11-07)
What it says: *the speaker named this level; here is where the site's price series is.* It never says
where the price goes. One view per card.

**Use it only when all of these hold** (otherwise the post keeps its clip, or the v3.1 card):
1. The row is an explicit view (`outlook_explicit = true`, `outlook != none`) with a quote; the script
   refuses anything else. Main-idea/summary posts do not get a chart.
2. At least one `key_levels` entry is a **real price in the series' unit** (see the table): a number
   with "dolar/$" for USD series, "lira/TL" for Dolar/TL, "puan" or bare for BIST. Percentages,
   amounts ("150 milyar dolar"), durations ("3 ay"), moving averages ("200 günlük ortalama"), dates
   and years are skipped automatically; the script prints what it skipped and why.
3. **Every level drawn is in the speaker's own words**: in `outlook_quote_clean` or in the clip
   passage. `key_levels` is an AI extraction and can carry numbers from elsewhere in the video
   (e.g. video 810: key_levels "4.200-4.350" while the quote says "55 dolar"). The script warns when a
   level's digits are not in the quote; then either confirm it in the clip passage or pass
   `--levels` with only the confirmed ones. Max 3 levels (pills stack in the right gutter, a thin leader joins a moved pill to its line).
4. The level sits within the series' range (3-month window by default; the script widens to 1 year
   when a level is outside ±15 %, and stops when it is outside ±30 % of the 1-year range: a flat line
   with a far-away target is not a chart). The headline is one whole sentence from the quote, verbatim,
   ≤ 130 chars (`--headline` to pick another sentence of the same quote).

| topic key | series (`/api/v1/quotes/<SYMBOL>/history`) | label · unit · decimals | notes |
|---|---|---|---|
| `altin` | `XAU-USD` | Ons altın · USD · 0 | "lira/TL" levels are gram gold: `GAUTRY` history returns 0 points (checked 2026-11-07), so they are skipped and named in the script output |
| `gumus` | `XAG-USD` | Ons gümüş · USD · 2 | |
| `dolar-tl` | `USD-TRY` | Dolar/TL · TL · 2 | bare numbers accepted when in range |
| `bist` | `XU100` | BIST 100 · puan · 0 | BIST 30 levels are not BIST 100: drop them with `--levels` |
| `bitcoin` | `BTC-USD` | Bitcoin · USD · 0 | |
| `petrol-enerji` | `BRENT` | Brent petrol · USD · 2 | WTI levels are not Brent: drop them |
| `us-markets` | `SPX` | S&P 500 · puan · 0 | key_levels often belong to Nasdaq/Dow: the script requires `--levels`, pass only S&P 500 numbers the speaker said |

Period and granularity come from the response: `hours=2160` → daily closes ("günlük kapanış · son 3
ay", ~75–90 points), `hours=8760` → weekly closes ("haftalık kapanış · son 1 yıl", ~64 points).
The last point is the previous session's close (Yahoo, delayed), drawn as a dot with its value; the
legend names the source as the site. The numbers on the card must match the site's chart on
`/piyasa/<key>` the same day (editorial rule §2.1): check before handing over.

Render:
```
python3 -I docs/social/design/make_level_chart.py --topic altin --video 830 --out <scratchpad>/lc830
```
Writes `lc830.html` (filled from `card-level-chart.html`), `lc830.png/.webp` via `render.sh`
(WebP re-encoded down to `-q 70` to reach ≤ 45 KB), `lc830-phone.png` (375 px mockup: feed ~295 px
and post page ~343 px, for the legibility check) and prints the alt text. Self-check as for other
cards, plus: the level labels equal the post text, the levels are in the quote, no green/red anywhere,
the attribution name equals `person_name`, the legend's instrument and unit match the levels.

Alt text template (≤ 1000 chars, printed by the script):
`Grafik: <Enstrüman> fiyatı, <dönem> (<günlük|haftalık> kapanış, <birim>), kaynak dovizveri.com.
<Ad> (<Kanal> YouTube kanalı, <d Ay yyyy>) şu seviyeleri söyledi: <L1> ve <L2>. Son değer (<d Ay yyyy>
itibarıyla): <son>. Alıntı: “<outlook_quote_clean>” Yatırım tavsiyesi değildir.` — the quote is cut at
a word end with "…" only when the whole text would exceed 1000 chars.

## Pipeline
1. Copy the closest template, fill the data, keep the structure.
2. `docs/social/design/render.sh <file.html> <out>` → `<out>.png` (2×, for review) and
   `<out>.webp` (1200×675, for upload; aim ≤ 45 KB, the browser upload path sends it as base64).
3. Look at the PNG yourself (text overflow, wrapping, alignment) before handing it over.
4. **Upload (Lead, after owner approval; owner decision 2026-10-27)**: attach the `.webp` in the
   owner's Chrome with Claude in Chrome's `file_upload` tool (find the composer's file input
   `input[data-testid=fileInput]` with `find`/`read_page`, pass its ref and the absolute path; never
   click the input, it opens a native picker). The file must sit in a folder the session can read
   (session scratchpad or working dir, ≤ 10 MB) and is never committed. Then check the image
   preview and add the alt text before sending. The built-in browser pane cannot read local files,
   and the base64/local-server routes were denied on 2026-10-27. If it fails, post nothing and ask
   the owner, since posting without the card needs their OK.
   **Route that worked on 2026-11-01 (clip, 2.2 MB)**, when the extension is not connected: in Chrome,
   View → Developer → Allow JavaScript from Apple Events must be on. Write a JS file that holds the
   file as base64 and injects it: `new File([bytes], name, {type})` → `DataTransfer` →
   `input[data-testid=fileInput].files` + a bubbling `change` event. Run it with
   `osascript -e 'set js to read POSIX file "<path>" as «class utf8»' -e 'tell application "Google
   Chrome" to tell active tab of front window to execute javascript js'`, so the base64 never passes
   through the agent's context. Then poll `[data-testid=attachments]` for "Ready", insert the text
   with `execCommand("insertText")` **once**, re-read the text length, and click
   `[data-testid=tweetButton]` only if length and attachment match. Confirm with live search.
   Not possible this way: X's CSP blocks `fetch` to localhost; System Events keystrokes (paste) are
   not allowed; the video description dialog was not reachable by script.
