# Broker model-portfolio changes — pilot plan (2026-10-26, OI-027)

Status: **plan only — owner chose option B of `2026-10-26-broker-reports-phase0.md` §5; build not started.**
Background: `2026-10-26-broker-reports-review.md` (sources, legal), `2026-10-26-broker-reports-phase0.md` (two-week sample).

## Problem

Phase 0 showed that the only broker material that is explicit, dated, reasoned and change-native is the
model-portfolio change note: "X'i çıkarıyor, Y'yi ekliyoruz" plus a paragraph of why. Free aggregators show the
resulting target tables but not the event, the reason or the previous move. dovizveri.com has no place for broker
views today, no stock pages and no broker entity in the tracker. The pilot adds exactly one thing: a public list of
model-portfolio additions, removals and weight changes from three brokers, each with the broker's own reason and a
link to the report, and the data path behind it.

## Scope

In: three sources (below), three event kinds (added / removed / weight changed), current composition per broker,
one web page `/kurumlar` with the SPK EK/3 notice, tracker job + API + finance-api proxy, backfill of 2026, a 4-week
shadow audit before public launch.

Out: stock pages, target-price tracking and history, other report types (strateji, şirket raporu, günlük), other
brokers, accuracy or performance scores, X posts, index or macro views, any content behind login or membership.

## Sources and parsers (verified 2026-10-26)

| Broker | Discovery | Document | Parse rule | Cadence · quirks |
|---|---|---|---|---|
| **İş Yatırım** | RSS `https://arastirma.isyatirim.com.tr/category/son-haberler/toppick_deg/feed/` (10 items/page, `?paged=N`); robots open | PDF linked in the post, `/wp-content/uploads/YYYY/MM/DD_MM_YYYY.pdf`, ~5 pages, public. p.1 = change note ("Model Portföy Değişiklikler", "Eklenen Şirket SAHOL.IS", "Çıkartılan Şirket AKBNK.IS", or a weight paragraph); p.2+ = coverage table (not used) | Regex on p.1: `Eklenen Şirket (\w+)\.IS`, `Çıkartılan Şirket (\w+)\.IS`; weight changes: `ağırlığını .* (indir|artır)` with tickers in the sentence; reason = first paragraph; event date = PDF filename | ~12/yr (2025–26 feed dates: 20 Oct, 2 Oct, 1 Sep, 22 Jul, 3 Jul, 14 Apr, 9 Apr, 12 Mar, 5 Feb, 21 Jan, 15 Jan 2026 …). **The post HTML body is a shared "latest change" block** — the 2 Oct post shows the 20 Oct text and PDF, and `02_10_2026.pdf` does not exist. The PDF is the record; dedupe by sha256; never trust the post body |
| **Yapı Kredi Yatırım** | `POST https://www.ykyatirim.com.tr/DetailPage/GetResearchReports` (JSON body, type ignored → latest 137 items); keep `reportTypeName == "Model Portföy" and isPublic` | PDF via `GET /DetailPage/GetFilePath?url=<filePath>` **with the cookies from a prior GET of `/hizmetler/arastirma` and that Referer** (200, 447 kB; 400 "Dosya alınamadı." without). 3 pages: p.1 change note ("Model portföyümüzden Vakıfbank'ı çıkartıyoruz. Vakıfbank (VAKBN TI, 38.08TL) Öneri: AL, (Hedef Fiyat: 41.00TL) …"); p.2 composition table | Regex on p.1: `Model portföyümüz(e|den) (.+?)['’](ı|i|u|ü|yi|yı)? (ekliyoruz|çıkartıyoruz)` and `\((\w{4,5}) TI` for the ticker; reason = the paragraph after the header; composition from p.2 (Kod, Giriş Tarihi) | Last public update 14 Sep 2026; history beyond the 137-item window is not retrievable → accumulate from launch. robots disallows `/media/*.pdf`; this endpoint is not under `/media` |
| **Gedik Yatırım** | Page `https://gedik.com/analiz/model-portfoy/hisse-model-portfoy` (public HTML table: Şirket Adı, Hisse Kodu, Hedef Fiyat, Potansiyel Getiri, Ağırlık) and its "marketReleases" list (`?categoryName=Model-Portföy&scrollTo=marketReleases`) with `ModelPortfoyGuncellemesi_<date>_<hash>.pdf` / `modelportfoyguncellemesi_<DDMMYYYY>.pdf` and the monthly strateji/model-portföy PDF; robots open | Update PDF, 4 pages, public CDN. p.1 title "Tüpraş'ı çıkarıyor, Astor Enerji'yi ekliyoruz · 22 Eylül 2026 · Model Portföy Güncellemesi"; body "Tüpraş'ı (TUPRS) çıkarıyoruz: …reason" / "Astor Enerji'yi (ASTOR) ekliyoruz: …reason" | Regex: `\((\w{4,5})\) (çıkarıyoruz|ekliyoruz):` → action; reason = text up to the next header; date from the title; composition = HTML table (names + codes; targets only if the owner allows, §7) | ~10/yr (2026: 16 Apr, 5 May, 7 May, 2 Jul, 27 Jul, 6 Aug ×2, 17 Aug, 22 Sep, Oct monthly). Company-report listing says "Görüntülemek için bültene abone olun" while CDN links are public — the model-portfolio page itself carries no such wording |

Parser policy: deterministic regex first; the existing tracker LLM call (`src/llm/service.py::_call_llm_json`,
Gemini) is used only when the regex finds an action but no clean reason paragraph, and then only to *select* a
verbatim sentence (≤ 300 chars) that must be found in the document text, never to rewrite it. Ticker must match
`config/bist_tickers.txt` (static list, refreshed by hand). Anything that fails lands in `needs_review` and is
excluded from the API until a human clears it.

## Data model (tracker, SQLModel, same migration path as OI-016's `is_active` column)

- `broker` — id, slug, name, site_url, adapter (`isy_rss` | `yk_json` | `gedik_page`), enabled, notice_text, created_at.
  Config: `config/watched_brokers.yaml` next to `watched_channels.yaml`.
- `broker_document` — id, broker_id, kind (`change_note` | `composition` | `monthly`), source_url, file_url, sha256
  (unique), published_at, fetched_at, text, parse_status (`parsed` | `needs_review` | `failed`), parse_error.
- `model_portfolio_event` — id, broker_id, document_id, ticker, action (`added` | `removed` | `weight_up` |
  `weight_down`), event_date, reason_quote (≤ 300 chars, verbatim), quote_page, target_price (nullable),
  recommendation (nullable, verbatim), review_status (`auto` | `reviewed` | `rejected`), created_at;
  unique (broker_id, ticker, action, event_date).
- `model_portfolio_snapshot` — id, broker_id, document_id, as_of, items_json (`[{ticker, entry_date?, target?}]`).
- Job run tables as in `youtube_watch` (run, per-source result) so `/jobs/broker-watch/health` can mirror
  `pipeline_health`.

Nothing stores PDF bytes beyond the parse step; `text` is kept for audit, never served.

## Steps

0. **Owner gate** — answers to §7; optional courtesy/permission note to the three brokers (template in the
   appendix). The page can be built behind a flag before the answers arrive; public launch waits for them.
1. **Tracker: config, models, job skeleton** (`src/jobs/broker_watch/` with `runner.py` CLI like `youtube_watch`,
   idempotent; User-Agent `dovizveri-bot/0.1 (+https://dovizveri.com/iletisim)`; robots.txt fetched and honoured
   per URL; ≤ 2 runs/day, weekdays 07:30 and 13:30 UTC via the same Coolify scheduled-task mechanism as
   `youtube_watch`).
2. **Adapters + parsers + fixture tests** — fixtures are trimmed text excerpts (≤ 2 sentences each, attributed),
   not the PDFs (copyright). Snapshot diffing: an `added`/`removed` event must be consistent with the broker's next
   composition snapshot, otherwise `needs_review`.
   **Step 2 must also cover the review findings on step 1 (critic, 2026-10-26):** Yapı Kredi's page-2 table is
   titled "Model Portföy Performansı (değişiklikler öncesi)", i.e. the *pre-change* composition — store a `basis`
   (`pre_change` | `current`) on `model_portfolio_snapshot` (or date it `published_at − 1 day`) before the
   consistency check (D) is written, otherwise every YK event would be flagged; restrict YK holding parsing to
   page 2+ and validate tickers; `pdf_to_text` must emit `\f` between pages (parsers scope page 1 on it — add a
   test); `httpx.MockTransport` tests for all three adapters against saved XML/HTML before any live run; anchor the
   Gedik filename-date regex and reject years outside 2000–2100; İş feed paging (`?paged=N`) and a logged skip for
   posts without a PDF; URL-encode the YK `filePath`; close the `httpx.Client`; enforce or drop
   `max_runs_per_day`; move the company→ticker map out of code into config; rename the health verdict for
   `partial_fail` runs; flag a weight clause that contains more genitive company forms than tickers found (unmapped
   names are still skipped silently when another ticker in the clause matched); rename `parse_error` to `parse_notes`
   (it now also holds informational warnings); decide the PDF library (owner: `pymupdf` is AGPL/commercial, `pypdf` is BSD — the sample
   PDFs are born-digital text, so `pypdf` should suffice; verify on the five criterion-A documents).
   **Deferred from step 2 to step 3 (recorded 2026-10-26):** company→ticker map still lives in `parsers.py`
   (move to config before the backfill, the İş 5 Feb note needs Garanti Bankası, Emlak GYO, Aksa Enerji);
   `parse_error` → `parse_notes` rename; a review-queue clearing tool (flags are never un-flagged automatically);
   robots.txt policy adopted in step 2: wildcard-aware matcher, every request incl. redirects checked, 5xx or
   unreachable robots = disallow for that run (owner may relax); before any live run, save the real robots.txt of
   `arastirma.isyatirim.com.tr`, `www.ykyatirim.com.tr`, `gedik.com`, `cdn.gedik.com` as fixtures and assert the
   allow/deny outcome for the exact URLs the adapters request.
   **Added after the step-2 review (critic, 2026-10-26, pre-existing step-1 logic):** in `_isy_weight_changes` a weight
   clause whose verb is not recognised (unlisted verb, or a verb pypdf split such as "i ndirirken") is merged into the
   next clause's scope and inherits its direction — the real 1 Sep sentence with the first verb split yields TUPRS
   `weight_up` unflagged. Guard before relying on `auto` events: when a scope holds more than one weight noun, warn and
   set `needs_review`; add the two-clause split-verb test; correct the `_loose()` docstring claim. Also: pypdf's plain
   mode splits glyph-positioned words ("h edef", "ağ ırlığını") and stored quotes stay verbatim (criterion C), so
   step 5 needs a display-side cleanup of such splits in served quotes; storage must not be altered.
3. **Backfill 2026** — İş feed pages back to Jan 2026 (≈ 11 PDFs), Gedik release list (≈ 10 PDFs), Yapı Kredi
   (14 Sep only). Must reproduce the known events (criterion A). Expect the İş 5 Feb 2026 note (weights given by
   company names, verb "çekiyoruz") to land in `needs_review`.
4. **Tracker API** (protected like the other routers): `GET /brokers/`, `GET /brokers/model-portfolio/events?days=90&broker=`,
   `GET /brokers/{slug}/model-portfolio` (composition + last 10 events), `GET /jobs/broker-watch/health`.
   **finance-api**: `GET /v1/brokers/model-portfolio/events`, `GET /v1/brokers/{slug}` proxies through `MemoryCache`
   (TTL 300 s), hermetic tests with fixture JSON.
5. **Web `/kurumlar`** — EK/3 notice as the first content block; "Son değişiklikler" list of event cards:
   broker · ticker + company name · chip (*Portföye eklendi* / *Portföyden çıkarıldı* / *Ağırlık değişti*) ·
   event date · reason quote in quotation marks · "Rapor ↗" (broker domain) · "Kurumun önceki hareketi: …" when
   known; below, per-broker "Güncel liste" (names + entry dates; targets per §7). Links: "Kurumlar →" on
   `/uzmanlar`, optional 3-event strip on home (§7). Existing "Yanlış mı aktardık?" correction link. No bottom-nav
   change. Copy in Turkish, no al/sat wording from dovizveri: actions are always "İş Yatırım … ekledi".
6. **QA + review + shadow period** — qa-verifier on criteria A–I, critic-reviewer Mode B, then the job runs for
   4 weeks with the page behind a flag; manual audit of 100 % of events (criterion J); launch decision by the owner.

## Acceptance criteria

- **A. Backfill reproduces known events**, each with the verbatim reason quote and page: İş 20 Oct 2026 SAHOL
  added + AKBNK removed; İş 1 Sep 2026 TUPRS weight down + AKBNK, GARAN, ENJSA weight up; Gedik 22 Sep 2026 TUPRS
  removed + ASTOR added; Gedik 6 Aug 2026 ANHYT removed + RGYAS added; Yapı Kredi 14 Sep 2026 VAKBN removed
  (AL 41.00 kept).
- **B. Idempotent**: running the job twice in a row creates zero new documents and events; the İş 2 Oct / 20 Oct
  shared-body case yields exactly one event set.
- **C. Every served event** has broker, validated ticker, action, event_date, reason_quote ≤ 300 chars that occurs
  verbatim in `broker_document.text`, and a document URL on the broker's own domain. dovizveri serves no PDF bytes
  and reproduces no price or valuation table.
- **D. Consistency**: after an `added` event the broker's next composition snapshot contains the ticker, after
  `removed` it does not; mismatches are `needs_review` and absent from the API.
- **E. Freshness**: `/jobs/broker-watch/health` reports per-source last success; a source without a successful
  fetch for 7 days is flagged; the daily reliability check reads it.
- **F. Access policy**: no login, membership or mailing list; bot User-Agent with contact URL; robots.txt honoured
  for every fetched URL; ≤ 2 runs per day; Yapı Kredi's cookie comes only from the public research page.
- **G. API and tests**: finance-api `GET /v1/brokers/model-portfolio/events?days=90` returns events newest first
  with the fields in C, p95 < 500 ms warm; finance-api tests hermetic and green except the pre-existing OI-002
  failure; tracker suite unchanged at its baseline (re-measure at build time; `2026-10-25-konular-rebuild-plan.md`
  recorded 88 passed / 5 pre-existing failures) plus parser tests for all three adapters.
- **H. Web**: `/kurumlar` shows the EK/3 text before any event; each card shows the fields in step 5 and its report
  link opens the broker's domain; loading, empty and error states; 375 px and 1280 px, light and dark; no layout
  shift on load; `npm run lint` no new errors (baseline 5/1); `npm run build` OK; main bundle ≤ +30 kB.
- **I. Legal copy**: EK/3 wording verified against Tebliğ III-37.1 EK/3 before launch; event date and report date
  shown; broker named on every card; correction link present; no imperative wording.
- **J. Shadow audit**: during the 4-week flag period, 100 % of events checked by hand against the documents, at most
  one error, else launch is blocked and the parser fixed first.

## Measurement (after launch; nothing is claimed before it is measured)

- Events per broker per month (expect 1–3; alert if any broker shows 0 for 60 days while its site has updates).
- `/kurumlar` page views and clicks on "Rapor ↗" via GA4 (`scripts/ga_report.py`, OI-019), weekly for 8 weeks.
- Corrections received through "Yanlış mı aktardık?" (target 0; any one triggers a parser review).
- Time from document publication to event visible (median < 6 h on weekdays).
- Decision point at week 8: extend to the next brokers (Ziraat Hisse Öneri Portföyü, Vakıf Model Portföy, Ahlatcı
  12-aylık Model Portföy, Tacirler, ICBC, Ak Yatırım `ModelPortfoyView` JSON) or stop.

## Effort and risk

Effort: tracker ≈ 3 days (models, 3 adapters, parsers, job, tests, backfill), finance-api ≈ 0.5 day, web ≈ 1.5 days,
QA + review ≈ 1 day → about 6 working days over 3–4 one-item cycles; LLM cost negligible (≈ 30 short documents a
month). Audit effort ≈ 1 hour a week during the shadow period.

| Risk | Mitigation |
|---|---|
| Yapı Kredi cookie/token flow or Gedik page structure changes | per-source health flag (E), manual-upload fallback for a document, adapter tests on fixtures |
| İş posts edited in place / shared body | PDF is the record; sha256 + filename date; never parse the HTML body |
| Wrong ticker or action under a broker's name | static ticker list, snapshot consistency (D), review queue, 4-week audit (J), correction link |
| Low volume makes the page look dead | show each broker's current list and "son güncelleme" date; expected 3–9 events a month across three brokers |
| Legal: quoting and composition tables | quotes ≤ 300 chars with attribution and link (FSEK md. 35); composition without targets unless the owner decides otherwise; EK/3 notice; permission note to brokers |
| Gedik UI wording vs open CDN links | use only the public model-portfolio page and the PDFs it links; raise in the permission note |

## 7. Decisions for the owner

1. **Go / no-go on the build** (steps 1–6) and whether to send the permission note before or after building.
2. **Composition display**: names + entry dates only (recommended for the pilot) or with target prices (richer,
   but reproduces the broker's table and raises the FSEK question).
3. **Placement**: `/kurumlar` + "Kurumlar →" link on `/uzmanlar` + 3-event home strip (recommended), or a
   bottom-nav item (changes the 4-item nav, needs a design pass).
4. **Legal read** of the page copy and quote length before public launch (the page can ship behind a flag).

## Appendix — permission/courtesy note (Turkish, for the owner to send)

> Sayın … Araştırma Bölümü, dovizveri.com olarak kamuya açık model portföy değişiklik notlarınızı (eklenen/çıkarılan
> hisse, tarih ve gerekçenizden kısa bir alıntı) kurumunuzun adı ve raporunuza bağlantıyla birlikte yayımlamayı
> planlıyoruz. Raporun kendisini barındırmıyor, tablolarınızı çoğaltmıyoruz; SPK genel yatırım tavsiyesi uyarısı her
> sayfada yer alacak. Bu kullanım için bir itirazınız veya tercih ettiğiniz bir atıf biçimi varsa bize bildirmenizi
> rica ederiz. Dilerseniz yayınımızı durdurabiliriz.

Known events used as fixtures (text excerpts only): İş 20 Oct 2026 and 1 Sep 2026; Gedik 22 Sep 2026 and
6 Aug 2026; Yapı Kredi 14 Sep 2026. Source files from the sample are in the session scratchpad
(`…/scratchpad/p0/dl/`), not committed.
