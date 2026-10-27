# Phase 0 — manual sample of broker research (İş Yatırım, Yapı Kredi Yatırım, Gedik Yatırım)

Date: 2026-10-26 · Author: Claude (Lead session) at the owner's request · Status: **measurement done, no decision**
Plan and background: `docs/research/2026-10-26-broker-reports-review.md` §7 (Phase 0). Sheet:
`docs/research/2026-10-26-broker-views-phase0.csv` (41 rows, one per candidate view or per evidence item).

## 0. What was done

- Window: **13–26 October 2026** (week 1 = 13–19 Oct, week 2 = 20–26 Oct). Earnings season (3Ç26) — a busy fortnight.
- Report types: strateji raporu / strateji notu, model portföy, şirket raporu. Daily and weekly bulletins were read
  only where they were the single public source of an index view, and are marked *out of scope type*.
- Sources, all public: İş Yatırım research-site RSS (9 category feeds, paged; 88 items in window), Yapı Kredi's
  report JSON (`isPublic=true` items only; PDFs downloaded with a page session cookie), Gedik's listing pages and
  CDN PDFs. Every number in the sheet was read from the document text by hand; fields in İş Yatırım's HTML were
  also parsed with a regex and cross-checked.
- Comparison: Fintables TAVHL and EREGL analyst pages (browser), hisse.net's August EREGL roundup (previous targets).

## 1. Result in one table

Explicit views found in the three report types, per site instrument and per week ("view" = direction stated as the
main scenario, attributable to the broker, with a date and a document):

| Instrument (site key) | Week 1 (13–19 Oct) | Week 2 (20–26 Oct) | Notes |
|---|---|---|---|
| BIST 100 (`bist`) | 0 | 0 | Only public BIST 100 view in the window: Yapı Kredi Günlük Bülten 26 Oct, short-term down below 11,400 (daily technical — out of scope type). İş Yatırım's strategy report cadence: Apr 2026, Oct 2025, Mar 2025, Jan 2025 — none in window. |
| Dolar/TL (`dolar-tl`) | 0 | 1 (interpretive) | Yapı Kredi 21 Oct: "radikal bir değişiklik beklemiyoruz … ılımlı bir reel değerlenme sağlama tercihinde bir değişiklik olduğunu düşünmüyoruz" — a regime statement that needs a rule to become a direction. |
| Altın | 0 | 0 | 1 conditional technical (YK weekly, 3,800–3,600 if below 4,250) and 1 non-explicit ("altın için bir fırsat penceresi yaratabilir") — both fail the explicit rule. |
| ABD borsaları | 0 | 0 | 3 non-explicit "temkinli / riskten kaçış" remarks (YK). |
| Bitcoin, Gümüş, Petrol | 0 | 0 | Nothing. |
| **Macro (not a site instrument)** | 0 | 2 | Policy rate: YK 21 Oct expects cut to %36 (correct next day); İş 22 Oct path %35 end-2026, %27 end-2027. |
| **Stocks (no site instrument)** | 10 (Gedik model-portfolio snapshot, 13 Oct) | 13 (İş 10: 2 model-portfolio changes, 3 report targets, 5 sector-table rows; Gedik 2; YK 0 public) | **Confirmed change events: 3** — İş: SAHOL added / AKBNK removed from the model portfolio (20 Oct); İş EREGL 42 TL AL (Apr) → 45 TL TUT (23 Oct, previous value from an August press roundup). Gedik TAVHL 464: the document does not say whether it changed. |

Counts by evidence kind (sheet column `kind`): change_event 3 (+1 outside window: YK VAKBN removal, 14 Sep) ·
report_view 5 · snapshot 15 · macro_forecast 2 · regime_view 1 · non_explicit 7 · conditional_technical 1 ·
daily_technical 1 · no_content 1 row standing for 45 items · gated 2 · earnings_preview 1 · company_guidance 1 ·
cadence 1.

## 2. What the fortnight actually looked like, per broker

**İş Yatırım (public research site).** 88 feed items in the window, of which **45 are "3Ç26 Kar Tahmini" posts whose
feed body contains only the legal disclaimer** (the preview content is not in the HTML) — earnings previews, not
views, and unusable anyway. Real content: three "Kar Analizi" company reports with structured header fields
(`İş Yatırım Tavsiyesi AL · Hedef Fiyat (TL) 403.09 · Kapanış (TL) 287.00 · 22/10/2026 · ↑ 40 % Yükselme Potansiyeli`),
one model-portfolio change note with a one-paragraph reason and a PDF, one insurance sector note with a five-row
target table, one PPK note with an explicit policy-rate path, one plant-visit note with no recommendation. Two items
were member-only (PGSUS preview; the full EREGL company report). No strategy report; no BIST 100 or USD/TRY view.
Extraction is near-deterministic: the fields are HTML, and "koruyoruz" marks an unchanged view.

**Yapı Kredi Yatırım (public types only).** Five "Strateji Notu" PDFs by Murat Berk in the window are global macro
essays (France and rates, capital scarcity, China, AI capex and bond yields, PPK preview). They contain exactly
two explicit forecasts for this site's purposes: the policy-rate cut and the TL regime sentence. One weekly global
technical note (8 pages) gives conditional levels for gold, DXY, EURUSD, US yields and Brent — scenario trading
notes, not main-scenario views. The one public Günlük Bülten (26 Oct) carries the fortnight's only BIST 100
directional statement. Company reports (35 in the list) and sector/macro reports are `isPublic=false`; the
public Model Portföy was last updated 14 Sep. Note: Fintables still lists Yapı Kredi's TAVHL 477 Al and EREGL
42.00 Tut dated 22–23 Eki — client-only research reaches aggregators through other channels.

**Gedik Yatırım.** The monthly "Strateji Raporu / Model Portföy" PDF (created 13 Oct, prices as of 9 Oct, 13 pages)
is a portfolio snapshot: 10 stocks, each "Endeks Üzeri Getiri" with a target and the date it entered; the latest
addition (ASTOR) was 22 Sep, so no change in the window and no index view. Two 2-page results notes (TAVHL 464,
EREGL 59.2) state recommendation and target in the header but **say nothing about whether the target changed**;
EREGL is unchanged since July (press roundup), TAVHL unknown. The listing page shows "Görüntülemek için bültene
abone olun" although the CDN PDF URLs are in the public HTML. The weekly bulletin's text extraction came back with a
font-encoding defect (ඈ in place of i) — a reminder that PDF pipelines need normalisation and checks.

## 3. Comparison with the free aggregators

- **Fintables** (browser, 26 Oct): TAVHL 25 recommendations, **12 brokers all dated "22 Eki 2026"** including İş
  403,09 Al, Gedik 464 Endeks üstü, Yapı Kr. 477 Al; EREGL 21 recommendations, 13 dated 23 Eki including İş 45,00 Tut,
  Gedik 59,20, Yapı Kr. 42,00 Tut. Columns: Kurum, Öneri, Güncellenme tarihi, Hedef fiyat, Son fiyat, Potansiyel getiri,
  Model portföy. **No previous value, no reason, and one shared date per results day** — a reader cannot see that İş
  went from 42 TL AL to 45 TL TUT, which is the one genuinely informative event of the fortnight.
- **hisse.net** (6 Aug 2026 EREGL roundup) is where the previous İş and Gedik values came from — history has to be
  assembled from press roundups or kept by us from day one.
- **Ekofin**: the table is rendered client-side; five pages fetched with curl returned only the page shell (the
  earlier research pass saw a table on one page — inconsistent, UNVERIFIED).

## 4. What this means for the plan

1. **"Index + macro only" (Phase 1 as proposed) would have shown almost nothing in these two weeks.** Public
   strategy documents from these three brokers produced zero explicit BIST 100 views and one interpretive TL
   sentence. Broker index views exist, but they live in (a) daily/weekly technical bulletins — Yapı Kredi's is
   public, İş Yatırım's is member-only — with 1-day to 1-week horizons and support/resistance levels, and (b)
   semi-annual strategy reports (January and spring). A broker block on `/piyasa/bist` fed from strategy reports
   would update twice a year; fed from daily technicals it becomes a different product (levels, not expectations).
2. **The explicit, reasoned, change-native material is stock-level**: model-portfolio changes with a paragraph of
   reasoning (İş, YK, Gedik — roughly one to three per broker per month, with a public RSS feed at İş), and
   recommendation/target changes in company reports during earnings season. That is exactly the per-stock scope
   the review flagged as a product expansion (stock pages, ticker instruments, stock prices).
3. **Differentiation vs Fintables is real but narrow**: the previous value, the reason sentence and the real report
   date. Fintables already has every target within the day, including brokers whose reports are client-only.
4. **Volume is bursty and mostly non-views.** 88 İş items → 10 explicit stock rows → 3 changes. Any pipeline must
   expect a 10:1 ratio of documents to views and a further 3:1 to change events, and must not count previews or
   coverage tables as "new views".
5. **Extraction difficulty differs by broker**: İş = HTML fields + "koruyoruz" (deterministic); Gedik = header fields
   but no change statement (needs our own history); YK = essays (LLM reading, interpretive mapping such as
   "ılımlı reel değerlenme" → USD/TRY). Legal/access: YK PDFs need a session cookie, Gedik's UI gates what its CDN
   serves openly, İş gates dailies behind a free membership — the "public pages, no logins" policy excludes exactly the
   daily index material.

## 5. Options for the owner (not a recommendation to build)

- **A. Park broker reports** until the per-stock scope is decided; revisit in January when strategy reports (BIST 100
  12-month targets, USD/TRY, CPI) are published by most houses — one collection pass per season would already give a
  broker-attributed index-target table that no free source maintains.
- **B. Narrow stock-level pilot — "model portföy değişiklikleri"**: İş Yatırım `toppick_deg` RSS + YK Model Portföy
  (public JSON type) + Gedik monthly PDF. Low volume (a few events a month), always explicit, always with a reason,
  change-native, public. Needs a place to live: a `/haberler`-style list is possible without stock pages, but the
  reader will expect a stock page behind each ticker.
- **C. Daily index technicals as a separate, clearly labelled block** ("Teknik görünüm: Yapı Kredi, 26 Eki: 11.400
  altında baskı sürer") — 1-day horizon, levels, expires at the close. Public at YK only; different from "kim ne
  bekliyor" and the review advised against daily bulletins.

What Phase 0 did not measure: the January strategy season (expected to be the richest index-target source), brokers
outside the three sampled, and extraction error rates at scale.

## Appendix — files used (scratchpad, not committed)

Feed dumps and item JSON for İş Yatırım, Yapı Kredi `list.json` and 8 PDFs with text, Gedik strategy + 3 company
PDFs + weekly with text, Fintables page texts, hisse.net roundup:
`/private/tmp/claude-1448497668/-Users-tcebesli-Documents-self-projects-doviz-v1/89ee580c-f84b-4918-9419-9b9b615328c1/scratchpad/p0/`.
