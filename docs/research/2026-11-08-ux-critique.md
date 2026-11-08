# dovizveri.com — UX critique from the reader's side (2026-11-08)

Scope: the live site on 2026-11-08 (home, `/piyasa/:slug`, `/uzmanlar`, `/uzmanlar/:slug`, `/konular`, `/piyasa`, `/haberler`, story page), desktop 800px and phone 375px, dark theme, plus the page sources in `liquid-economy/src/pages` and `components/views`. Owner request: critique how the "kim ne bekliyor" content should be presented, from a human-interaction standpoint, and what the best achievable experience is.

Open items opened from this note: OI-032 … OI-037 in `docs/agent-runs/open-items.md`.

## 1. Verdict

The honest parts are right: every view is a named person with a verbatim quote, a date and a link to the video moment; direction is always icon + word; stale views go grey and past tense. What fails is the shape of the answer. The pages present "kim ne bekliyor" as a tally headline followed by a date-sorted list, while the reader's question is structured as camps, changes and time. The result looks like a poll result and reads like a transcript dump.

## 2. How this content should reach a reader

1. **The reader's question has three parts, in order.** Who is in which camp. Who moved recently, and from what. Since when, and at what price. Every screen should answer those three in that order. Today the first is answered by a bar, the second by a strip on the home only, the third not at all.
2. **Camps, not a feed.** A date-sorted list of 11 rows forces the reader to bucket people in their head. Grouping the instrument page into "Yükseliş bekleyenler (9)", "Düşüş bekleyenler (2)", "Yatay bekleyenler (n)" sections, movers first inside each camp, matches the mental model and roughly halves the scanning.
3. **Change is the news; the held view is context.** A person who kept the same view for 40 days is not news; a person who flipped on Tuesday is. Movers belong at the top with the previous quote one tap away. The home strip gets this right; the instrument and person pages lose it.
4. **Time and price are the evidence a reader uses to judge, and they are missing.** "Önceki görüş: ↑ Yükseliş · 31 Eki · Aynı görüşte" is a pair of states, not a trajectory. Two neutral facts carry more meaning without any scoring: how long the current view has been held ("31 Eki'den beri") and the price when it was said next to the price now. Both are in the planned `Call` schema (product.md §3, Phase 1). A per-person mini timeline on the person page (dots on a 90-day strip coloured by direction) shows consistency visually and stays clear of Phase 3 scoring.
5. **The tally is a weaker hero than it looks.** "11 yorumcudan 9'u yükseliş bekliyor" at 22–26px serif is read as a probability. Eleven self-selected YouTubers are not a sample, and product.md §8 lists an aggregate consensus hero as a non-goal. Keep the count as a one-line fact under the people, not above them. This revises the owner-approved OI-022 layout, so it is an owner decision; the argument is about how readers interpret numbers, not taste.
6. **Progressive disclosure is inverted on mobile.** A row shows the full quote by default and hides the useful metadata behind "Görüşün tamamı". On a phone the Altın page is roughly 4,000px of serif quotes. Default to name, direction, since-date, horizon and a two-line clamped quote; expand to the full quote, levels and summary.
7. **Raw platform data breaks the editorial voice.** Uppercase channel names ("ATİLLA YEŞİLADA"), YouTube bios that are legal disclaimers, titles like "ABD Borsaları'nda Balon Pa…!🎈💣💥" and shouting thumbnails sit inside a calm paper-and-ink design. Trust comes from the site visibly editing its sources: title-case names, a one-line neutral bio, the standfirst as the headline, thumbnails demoted.
8. **Loading is a UX fact.** The promise is an answer in a minute; the first paint is seven skeleton tiles for 3–5 s, driven by seven parallel `opinions?days=365` calls and a 429 on the first quotes-stream request (seen again 2026-11-08). A single cached aggregate for the home, rendered tile by tile, does more for perceived quality than any styling change.

## 3. Findings by surface

| Where | Finding | Severity |
|---|---|---|
| Home | Seven equal tiles, each with its own hero sentence and bar; against the "one lead, few secondary" principle (product.md §4). | moderate |
| Home | Tally + bar are the primary element; people and movers secondary (see §2.5). | moderate |
| Instrument page | List sorted by date, camps mixed; movers not promoted; no grouping or filter. | critical |
| Instrument page | No price at statement, no held-since duration; horizon is free text ("çok uzun olmayan vade", "yıl sonu", "bu yıl", "ocak sonuna kadar"). | critical |
| Instrument page | `DirectionChip` is 12px on a muted background while the quote is 16px serif; the primary fact is visually the weakest element of the row. | moderate |
| Instrument page | "Videoda izle 5:36" is a 13px inline link, below a comfortable tap target, for the single most valuable action. | moderate |
| Person page | Name uppercase from YouTube; bio is the channel's legal text; history is a text list with no time axis. | moderate |
| `/uzmanlar` | Still shows retired sentiment chips ("Nötr", "Yükseliş"), subscriber and video counts; inline styles diverge from the rest of the app. | moderate |
| `/piyasa` table | "Uzman görüşü: Yükseliş · 1 kaynak" for Dolar/TL while the home says 11 people. Two numbers for one fact on one site is a trust leak (related: OI-026). | critical |
| `/konular` | Repeats the home tiles and three rows per instrument; the only new content is the agenda section (OI-026 in progress). | moderate |
| Navigation | Beklentiler, Konular and Piyasa overlap in meaning; five tabs for three destinations plus prices. | moderate |
| Haberler / story | Clickbait titles and emoji as headlines; large dark video embed above the fold; the standfirst, the best text on the page, sits below the title. | moderate |
| Prices | Weekend quotes show "→ %0,00 · gecikmeli", which reads as broken rather than closed (OI-022 low item). | minor |
| Perf | 3–5 s of full-page skeleton; 429 on the SSE quote stream at first load (OI-022 live defect, OI-023). | critical |
| Engagement | No follow, no "since your last visit", no per-view share or correction affordance; correction is a footer link only. | moderate |

What works: provenance next to every claim; icon + word for direction; past-tense grey chips for out-of-window views; native `<details>` for disclosure; sticky verdict panel on wide screens; the movers strip; disclaimer placement; a dark theme that holds contrast.

## 4. Priority recommendations

1. **Restructure the instrument page around camps and change** (OI-032). Sections by direction, movers first inside each, compact rows by default with two-line quotes, "Videoda izle" as a real button. Highest leverage, no new data.
2. **Add time and price anchors to every view** (OI-033). "31 Eki'den beri", price at statement vs now, normalised horizon buckets with the verbatim phrase in details; 90-day dot timeline on the person page. Depends on Phase 1 `Call` fields (OI-017).
3. **One number per fact across the site** (OI-034). Remove sentiment chips and counts from the directory; make `/piyasa`'s "uzman görüşü" read the same view data as the home; fold `/konular` into Haberler or make it the macro-agenda page only (with OI-026).
4. **Editorial normalisation of source data** (OI-035). Names, bios, headlines, thumbnails. Small code, large effect on perceived trust.
5. **Demote the tally, pick a lead instrument** (OI-036, owner decision). Lead with the instrument with the most movers in the window; other tiles compact.
6. **Treat first paint as a feature** (OI-037, with OI-023). One aggregated, cached home endpoint and per-tile rendering.

## 5. How to measure

Three GA4 events, read weekly with the Friday GA4 routine: clicks on the video moment per row (`view_video_click` with person and instrument), instrument-page scroll depth (25/50/75/100), and return visits to person pages (7-day returning users on `/uzmanlar/*`). Baseline before any change; success is a rise in video-moment clicks per instrument-page session and in person-page returns, with bounce unchanged or lower.
