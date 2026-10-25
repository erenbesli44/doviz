# /konular rebuild from explicit views — plan (2026-10-25, OI-026)

## Problem

`/konular` renders the tracker's market inference (`GET /v1/inference/latest`): one LLM
summary per topic with a direction, an opaque "Güven %82", tags and up to 8 source videos.
That contradicts the product direction (`docs/product.md` §3, "kim ne bekliyor"):

- **Input is the old layer.** `tracker/src/market_inference/service.py:_collect_sources`
  feeds the model `TopicMention.sentiment` + `summary`, not the explicit outlook
  (`outlook`, `outlook_explicit`, `outlook_horizon`, `outlook_quote`).
- **Attribution is the video owner, not the speaker.** Sources join `Video.person_id`, so
  guest views on Mesele Ekonomi / Integral / NCM (OI-018) are credited to nobody or to the
  wrong person. The 7 instrument pages already use `TopicMention.person_id`.
- **No dates, no names in the claim.** Readers cannot see who expects what, or how old it is.
  Sources come back with `published_at = null` (OI-013).
- **Duplicates weaker data.** Home tiles (OI-022) and `/piyasa/<key>` (OI-020/025) already show
  the 30-day verdict per instrument from explicit views; `/konular` can disagree with them
  (2026-10-25: inference says Bitcoin "Karışık", while the instrument page counts people).
- **Staleness was invisible.** It served the 2026-05-16 run until tracker `ad81af5`
  (2026-10-25) fixed the cache and the new-video check.

## Scope split

The outlook classifier covers 7 instruments only (`tracker/src/classification/outlook.py`
`INSTRUMENTS`): Dolar/TL, BIST 100, Altın, Gümüş, Bitcoin, ABD borsaları, Petrol.
The other 4 inference topics (Faiz, Enflasyon, Jeopolitik, İç Siyaset) have no
explicit-direction data. So the page has two parts:

| Part | Topics | Source | What it shows |
|---|---|---|---|
| Instruments | the 7 above | explicit views (`/v1/inference/topics/{key}/opinions`) — same data as home and `/piyasa/*` | per instrument: verdict headline, person bar + tally, N people in `VIEW_WINDOW_DAYS`, latest 3 named views (person → profile, direction, quote, date), changes of view, link to `/piyasa/<key>` |
| Gündem | Faiz, Enflasyon, Jeopolitik, İç Siyaset | market inference, kept | summary labelled as a context summary (not an expectation), run date, sources with speaker + date; no direction pill and no "Güven %" |

`/konular?highlight=<topic_key>` (linked from `NewsDetail.tsx:193`, `Search.tsx:92`) must keep
working for all 11 keys.

## Steps

1. **Web (no backend change).** Rewrite `Konular.tsx` around the existing helpers in
   `liquid-economy/src/lib/views.ts` (`personViews`, `inWindow`, `verdictOf`, `tally`,
   `profileHref`) and the home tile's building blocks, so the three surfaces cannot disagree.
   Reuse the home data hook/cache so a home → konular visit makes no new requests.
   Gündem section keeps `useConsensusDashboard` for the 4 macro keys only.
2. **Tracker inference input (gündem + optional instrument summary).** In `_collect_sources`:
   join `Person` on `TopicMention.person_id` (fall back to `Video.person_id`), pass
   `outlook`/`outlook_quote` when present, date by `COALESCE(published_at, created_at)`,
   return the date in sources. Keep carried-over topics' sources (today a carried-over topic
   can show 0 sources, e.g. Gümüş in run 104).
3. **Optional, owner decision:** extend the outlook classifier to Faiz (policy-rate direction)
   and Enflasyon (inflation direction) so they move from Gündem to Instruments. Needs prompt
   wording and a backfill; not part of the first ship.

Payload note: step 1 reuses the 7 × `opinions?days=365` fetch the home page already makes
(~427 KB gzipped, OI-023). A cheaper "latest + previous view per person" endpoint (OI-023)
would help both pages; not a blocker.

## Acceptance criteria

- For each of the 7 instruments, the verdict text and N on `/konular` equal those on
  `/piyasa/<key>` and the home tile at the same moment (live check on all 7).
- Every named view on the page links to the person's profile and shows a date;
  multi-guest views show the speaker (e.g. Atilla Yeşilada on an Integral video).
- No "Güven %" and no direction pill on the 4 Gündem topics; each shows its run date.
- `?highlight=` scrolls to and marks the right section for all 11 keys.
- Loading, error and empty states for both parts; 375 px and 1280 px, light and dark.
- `npm run lint` no new errors; `npm run build` OK. Step 2: tracker tests unchanged
  (88 passed / 5 pre-existing failures) plus a test for the speaker join.

## Measurement

GA4 (once OI-019 credentials exist): `/konular` page views and `person_click` /
`video_click` events from `/konular`, 14 days before vs after. Today `/konular` traffic is
not measured separately from home.

## Effort and risk

Step 1: ~0.5–1 day, web only, low risk (helpers exist). Step 2: ~0.5 day, tracker + deploy +
a manual `POST /inference/runs:trigger`. Step 3: separate decision.
