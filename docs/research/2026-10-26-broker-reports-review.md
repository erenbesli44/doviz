# Review: tracking Turkish brokerage research ("aracı kurum raporları") on dovizveri.com

Date: 2026-10-26 · Author: Claude (Lead session) at the owner's request · Status: **research + critique only — no decision, no code**
Phase 0 (manual two-week sample on İş Yatırım, Yapı Kredi, Gedik) was run the same day: results and options in
`docs/research/2026-10-26-broker-reports-phase0.md`, rows in `docs/research/2026-10-26-broker-views-phase0.csv`.

## 0. The request (owner, 2026-10-26)

Collect Turkish brokerage firms' research reports and their comments on the index and on stocks, the way the
tracker already collects YouTube commentators' views: follow them regularly, extract the insight, and show it to
the reader in the plainest informative form. Before building anything: research where the reports can be
reliably obtained, how insight can be extracted on a schedule, how it would fit dovizveri.com — and critique it.

Method: three parallel research passes (primary broker sources, aggregators, legal + technical) plus direct
verification by the Lead of the key endpoints. "Verified" below means the URL or endpoint returned the claimed
content on 2026-10-26. Anything not fetched is marked **UNVERIFIED**. Nothing here is legal advice.

## 1. Verdict in short

- **The raw material is public and more machine-friendly than YouTube.** Of 37 brokers checked, roughly 30 publish at
  least their daily bulletins without login, and about a dozen publish strategy, model-portfolio or company
  reports openly. The two largest houses expose structured access: İş Yatırım's research site has
  per-category RSS feeds whose items carry the full report body in HTML, including `İş Yatırım Tavsiyesi` and
  `Hedef Fiyat` fields (verified); Yapı Kredi Yatırım's report list is a JSON endpoint with `isPublic`,
  `reportPostTime`, `title`, `topicTag` (verified). A dozen others publish PDFs under date-based URLs.
- **Daily bulletins are the wrong unit.** They are mostly yesterday's recap plus an intraday expectation
  ("güne hafif yükselişle başlamasını bekliyoruz" — Ziraat, 26 Oct). Under the site's own rule (explicit views
  only, `docs/product.md` §3), almost none of that survives. The explicit, dated, attributable views live in four
  report types: **strateji raporu / strateji notu** (BIST 100 year-end target, USD/TRY and inflation
  forecasts), **model portföy** (monthly additions and removals), **şirket raporu** (hedef fiyat + AL/TUT/SAT)
  and **tavsiye / hedef fiyat listesi**. Build on those; treat daily bulletins as optional colour at most.
- **The free aggregators already show per-broker target prices** (see §4). The space dovizveri can own is the
  one it already owns for YouTubers: *change events in plain language with the evidence* — "İş Yatırım THYAO
  hedefini 420'den 380'e indirdi (23 Eki, rapor)", "Gedik BIST 100 yıl sonu hedefini 13.500'e yükseltti" — and
  brokers shown **next to** the YouTube commentators on the same instrument page, with their earlier view.
- **It is a source extension of the decided direction, not a new direction** — as long as it stays on the
  existing instruments (BIST 100, Dolar/TL, Altın …). Per-stock coverage ("hisseler") is a product expansion:
  the site has no stock pages, no ticker instrument keys and no per-stock market data. That part needs an
  owner decision and a separate plan.
- **Legal exposure is manageable but specific.** SPK's Tebliğ III-37.1 reaches "medya ve elektronik ortam"
  publishers of general investment advice (Md. 73/3) and requires the EK/3 notice, the report date and the
  price date (Md. 78–79); the 2026 SPK guide explicitly allows media to publish general advice without a
  licence, provided recommendations are relayed "raporlarda yer aldığı şekliyle aynen". Copyright (FSEK Md. 35)
  permits short attributed quotation of facts; it does not permit hosting the PDFs or reproducing tables, and
  several brokers say so in their notices. Some sites disallow `*.pdf` in robots.txt; some research is for
  clients only. The safe policy: public pages only, respect robots, facts + one short quote + link, never the file.
- **Cost is engineering time, not tokens.** Roughly 20 reports/day across 10 brokers is under $1–16/month in
  LLM cost depending on model; the real cost is one adapter per broker and the QA of extracted numbers.

Recommendation: do **not** build the crawler first. Run a one-week manual sample (§7, Phase 0) on three
brokers to measure how many explicit, dated views per week the four report types actually yield for the site's
instruments, and whether a reader gets anything the free aggregators do not. Decide per-stock scope separately.

## 2. What exists today and what it can carry

| Layer | Today (verified in code) | Fit for broker views |
|---|---|---|
| Tracker (`erenbesli44/tracker`) | `TopicMention.outlook` = up/down/flat/none, `outlook_explicit`, `outlook_horizon`, `outlook_quote` (`src/classification/models.py:33-39`); outlook prompt with explicit/non-explicit rules (`src/llm/prompts.py:503-562`); sources are YouTube videos (`Video`, `Transcript`, `VideoSummary`); `config/watched_channels.yaml`, `config/inference_weights.yaml` | The *view* shape (direction, explicit, horizon, quote, date, link) transfers one-to-one. The *source* shape does not: a report is a document with a URL and a PDF hash, not a video with a transcript and a person. A new source kind is needed; the existing LLM/outlook step can be reused with a report-specific prompt. |
| finance-api | `/v1/inference/topics/{topic_key}/opinions`, `/v1/channels/{slug}/overview|timeline`, `/v1/consensus`, `/v1/news/*` | Opinions are keyed by `topic_key` and grouped by channel/person. A broker would be a new "speaker" type; the API shape (person, direction, quote, date, link) holds. |
| Web (`liquid-economy`) | 7 instruments: `dolar-tl`, `bist`, `altin`, `bitcoin`, `us-markets`, `gumus`, `petrol-enerji` (`src/lib/views.ts:19-27`); pages `/piyasa/:slug`, `/uzmanlar/:slug`, `/konular`, home verdict tiles (OI-022), two-column instrument page (OI-025) | BIST 100, Dolar/TL, Altın, ABD borsaları, Petrol map directly to what strateji raporları forecast. **No stock pages, no ticker keys.** Per-stock views have nowhere to live without new routes and new market data. |
| Legal copy | "yatırım tavsiyesi değildir" on `/yasal-uyari` and in the market disclaimer | Not the SPK EK/3 wording; see §5. |

## 3. Primary sources — verified inventory

Full table (37 brokers, URLs, formats, robots.txt, notices) is in Appendix A. Summary by access tier:

### 3.1 Tier 1 — public and machine-readable (start here)

| Broker | Access (verified) | What it yields for "kim ne bekliyor" | Caveats |
|---|---|---|---|
| **İş Yatırım** (`arastirma.isyatirim.com.tr`) | WordPress. Per-category RSS: `/category/sirket-raporlari/feed/`, `/category/gunluk-raporlar/teknik-bulten/feed/`, `/category/yurtici-piyasalar/ceyreksel-kar-tahminleri/feed/`, `/category/son-haberler/hisse-onerileri/feed/` … Item `content:encoded` holds the full report HTML with `İş Yatırım Tavsiyesi AL · Hedef Fiyat (TL) 9.68 · Kapanış (TL) 4.70 · 23/10/2026 · ↑106 % Yükselme Potansiyeli` (AKGRT 3Ç26). PDF under `/wp-content/uploads/YYYY/MM/…pdf`, public (HTTP 200, 275 kB). robots.txt: no disallow; sitemap index present. Şirket raporları archive ≈ 97 pages × 10. | Company reports with recommendation + target in structured HTML (no PDF parsing). Earnings previews. Teknik Bülten covers VİOP, kur, BIST 100 and 18 stocks' support/resistance. | **Günlük bültenler (Teknik Bülten, Piyasalarda Bugün) are "Üye ve Müşterilere Özel İçerik"** — the feed shows only the lead paragraph; the rest needs a (free) membership. Do not scrape behind the membership wall. WP REST API returns 401 (JWT). The corporate site `isyatirim.com.tr` uses SharePoint JSON services under `/_layouts/`, which robots.txt disallows. |
| **Yapı Kredi Yatırım** | `POST /DetailPage/GetResearchReportTypes` and `POST /DetailPage/GetResearchReports {"reportType":521}` → JSON list (137 items) with `isPublic`, `reportPostTime`, `title`, `description`, `topicTag`, `filePath` token (verified). | Public: Strateji Notu (30 items, e.g. "Yapay Zeka, Büyüme ve Tahvil Faizleri", 23 Oct), Model Portföy, Günlük Bülten, Yurtdışı Haftalık. | **Şirket Raporu (35), Sektör Raporu, Makro Raporlar, Teknik Analiz are `isPublic=false`** — target-price research is client-only here. `GetFilePath?url=<token>` returned 400 "Dosya alınamadı." to the Lead's calls (the research pass reported one successful download) → download path UNVERIFIED by the Lead; robots.txt disallows `/media/*.pdf`. |
| **Ziraat Yatırım** | `POST /umbraco/api/ClockworkUploaderPublic/GetFilesByFilter` (CategoryId 39331 → "Total Files: 2700") returns HTML with PDF links; `GET /documents/category/SS-26-10-2026.pdf` → 200, 1 MB, 1 page, 8 952 chars, born-digital text (verified). Also `/hisse-oneri-portfoyu`, `/sirket-raporlari`, `/gunluk-teknik-bulten`. | Sabah Stratejisi daily (intraday expectation only, see §6-B), Hisse Öneri Portföyü, Şirket Raporları. | **robots.txt `Disallow: /*.pdf$`** — the owner must decide whether to fetch PDFs there (recommendation: ask Ziraat for permission or skip). |
| **Gedik Yatırım** | Server-rendered lists; dated CDN PDFs `cdn.gedik.com/cdn/bulletin/2026/10/23/Gunluk_Bulten_23_10_2026_<hash>.pdf`; model portföy + strateji PDF monthly. robots.txt open. | Günlük/haftalık/aylık bülten, Hisse Model Portföy + Strateji Raporu, Hisse Önerileri. | Hash suffix in filenames → crawl the listing, don't guess URLs. `www.` host once returned 522. |
| **Şeker Yatırım** | `/Arastirma/Raporlar` lists 943 PDFs; `/Arastirma/TavsiyeListesi` (hedef fiyat list); PDFs `/Arastirma/ArastirmaRaporDosya/<id>/tb-26.10.2026.pdf`. | Tavsiye Listesi (target prices for covered stocks), Aylık Strateji, Kar Beklentileri, teknik/VİOP/FX daily. | Logo notice "izinsiz kullanılamaz"; standard BIST data notice. |
| **Ahlatcı Yatırım** | `/arastirma/gunluk-bultenler/<id>/gunluk-bulten-2026-10-26.pdf` (ISO-dated); robots open. | Daily + weekly + 12-month model portföy, hisse analiz, makro. | — |
| **Vakıf Yatırım** (`vkyanaliz.com`) | Stable listing pages; PDFs `Files/docs/gunluk-strateji-bulteni-<unixtime>.pdf`. | Günlük/haftalık strateji, Aylık Yatırım Stratejisi, Model Portföy, Şirket Raporları. | Main domain robots disallows `*.pdf`; `vkyanaliz.com` robots UNVERIFIED. |
| **Tacirler Yatırım** | HTML article + PDF under dated path `/upload/files/arastirma/gunluk-bulten/2026/ekim/…pdf`. | Günlük bülten, Model Portföy (+methodology), tematik/strateji notları, şirket/sektör. | — |
| **ICBC Turkey Yatırım** | Dated PDFs `GB 26102026.pdf`, `ModelPortfoy-20260312-ICBC-TR.pdf`, `AKSEN-20261001-ICBC-TR.pdf`. | Günlük bülten, Model Portföy, Strategy, Şirket Raporları. | TLS chain not trusted by default `curl` → needs an explicit CA decision in production. |
| **Integral Yatırım** | Dated PDFs `/uploads/PDF/…/integralyatirimgunlukbulten_26102026.pdf`; `/modelPortfoy`; 2026 Strateji Raporu. | Günlük BİST bülten, Model Portföy, strateji. | — |
| **A1 Capital** | WordPress: RSS `/feed/` and WP REST `/wp-json/wp/v2/posts` (verified). | Günlük/haftalık/teknik bülten, Model Portföy, Strateji ve Beklentiler, hisse/sektör analiz. | Smaller house; useful mainly as an easy second source. |
| **Meksa Yatırım** | RSS `https://www.meksa.com.tr/rss.xml` (verified); HTML `/meksanaliz/bist100/05-10-2026`. | Daily BIST 100, VİOP, FX. | Daily-only; low explicit content expected. |

### 3.2 Tier 2 — public HTML articles or PDFs with irregular URLs

QNB Invest (daily blog posts, sample PDFs), İnfo Yatırım (dated article URLs), NCM Investment (dated PDFs, sitemaps),
Marbaş (daily WP post + dated PDF, `/wp-json/` disallowed), Bizim Menkul, Ünlü & Co (`comment-20261026.pdf`),
Phillip Capital (GUID PDFs, robots allows AI bots), Trive (name-based PDFs), Global Menkul (hash PDFs; TLS), Oyak
(`/ModelPortfoy/TR` returns a PDF directly; list behind a POST form), Yatırım Finansman (19 categories, Next.js,
file URLs not found), Ak Yatırım (public, but the list is a POST with an anti-forgery token — scriptable with a
session; `ModelPortfoyView` JSON endpoint exists).

### 3.3 Not usable as-is

| Broker | Why |
|---|---|
| Garanti BBVA Yatırım | Report list behind customer login ("Tüm raporları incelemek ve indirmek için giriş yapın!"); notice "yayınlanamaz, iktisab edilemez". |
| TEB Yatırım | Customers only; nothing downloadable. |
| Halk Yatırım | Daily bülten public; hedef fiyat / şirket / sektör / strateji pages redirect to login; notice "basın organlarında yayınlanamaz". |
| Deniz Yatırım | Strateji Raporu and Sabah Stratejisi locked to customers; F5 bot protection blocks scripted access. |
| Burgan Yatırım | SPA with membership; report API not discoverable (UNVERIFIED content). |
| Alnus Yatırım | Blocks non-browser user agents (403); robots disallows `*.pdf`; notice "kişiye özel ve münhasırdır". |
| Osmanlı Yatırım, Strateji Menkul | No public research section found. |
| Alan Yatırım | Host unreachable (UNVERIFIED). |

### 3.4 What each report type actually contains (and whether it is an "explicit view")

| Report type | Cadence | Explicit view? | Instrument fit |
|---|---|---|---|
| Strateji raporu / strateji notu (yıllık, çeyreklik, aylık) | monthly–quarterly | **Yes**: BIST 100 year-end target, USD/TRY, CPI, policy-rate forecasts, sector stance | `bist`, `dolar-tl`, sometimes `altin`, `us-markets` |
| Model portföy (+ güncelleme notu) | monthly, ad hoc | **Yes, implicitly**: additions/removals are a dated stock view; performance vs BIST 100 published | stocks only |
| Şirket raporu / kar analizi | per event (earnings, initiation) | **Yes**: hedef fiyat, AL/TUT/SAT, previous target when changed | stocks only |
| Tavsiye / hedef fiyat listesi | weekly–monthly | **Yes**: table of targets per covered stock | stocks only |
| Sabah stratejisi / günlük bülten | daily | **Mostly no**: recap of yesterday, data calendar, "güne hafif yükselişle başlamasını bekliyoruz" (Ziraat 26 Oct — one sentence of expectation in 8 952 chars) | `bist` (intraday horizon only) |
| Teknik bülten | daily | **Partly**: support/resistance levels, "… üzerinde kaldıkça" scenarios | `bist`, VİOP, stocks |

Evidence: Ziraat Sabah Stratejisi 26.10.2026 (1 page): BIST 100 weekly −5.2 %, close 11 117; the only forward
sentence is the intraday open expectation. İş Yatırım AKGRT 3Ç26 (23.10.2026): recommendation AL, target 9.68,
close 4.70, +106 % upside, four argument paragraphs — a complete, structured, explicit stock view.

## 4. Aggregators and consensus sources

| Source | What it shows (verified) | Freshness | Broker named? | Machine access | Reuse terms seen |
|---|---|---|---|---|---|
| **Fintables** `fintables.com/sirketler/THYAO/analist-tavsiyeleri`; per-broker pages `/araci-kurumlar/<CODE>/analist-tavsiyeleri` | Ortalama hedef fiyat 447,09; aralık 300–547,50; 31 tavsiye; "18 model portföyde". Table: Kurum, Öneri, Güncellenme tarihi, Hedef fiyat, Son fiyat, Potansiyel getiri, Model portföy (rows JS-rendered, not extracted) | per report | yes | plain HTTP fetch → 403; no API; paid tiers may gate rows (UNVERIFIED) | user agreement; BIST data "tekrar yayınlanamaz" |
| **Ekofin** `ekofin.net/sirket/detay/<TICKER>/firma-tahminleri` | "Aracı Kurum Tahminleri": Kurum, Tarih, Hedef fiyat, tarihsel fiyat, getiri potansiyeli, Tavsiye; counts Al/Tut/Sat; e.g. Oyak 23 Ekim 2026 34,44 Endeks Üstü | **last 3 months only** ("son 3 aylık anket") | yes, with logo | fetchable without login; no API | user agreement |
| **Halkarz** `halkarz.com/<company>/` | "Hedef Fiyat Analizi": Analist, Tarih, Öneri, Hedef (THYAO: 18 rows) | stale: "Son Güncelleme 03.02.2026", typo dates | yes | fetchable; no API | "izinsiz kopyalanamaz" |
| **Foreks / ForInvest** "Borsa İstanbul Şirket/Banka Tavsiye Raporları" (`foreks.com/haber/detay/…`) | rolling intraday item: broker, ticker, old → new target, rating, with links to the PDFs on `news-files.foreks.com`; "gün içinde gelen raporlarla güncellenmektedir" | intraday, business days | yes | page free; the feed itself is the paid FXPlus terminal; no RSS | © ForInvest; no reuse licence |
| **Bigpara** "Aracı Kurum Görüşleri" | narrative articles sourced from ForInvest Haber (e.g. Garanti BBVA 12-m BIST 100 target 19.500, 25.06.2026) | daily | yes | no RSS visible | © Hürriyet |
| **hisse.net**, **Paratic** "Hedef Fiyat Haberleri" (3 400 items, ~1/day, bursty) | event roundups after results ("EREGL: 19 kurum", range 34,40–59,21); headlines name the broker only sometimes | event-driven | partly | none | "tüm hakları saklıdır" |
| **Türkiye Gazetesi** (21.01.2026) | 13 brokers' BIST 100 targets in one table, all "12 aylık" (Tacirler 15.200 … Ünlü & Co 16.680) | once per strategy season | yes | — | — |
| **TradingView** `/symbols/BIST-THYAO/forecast/`, **Investing.com TR** consensus pages | analyst count, 1-year min/max/avg; **no broker names**, estimates vendor unnamed | rolling | no | none | ToU |
| Matriks Haber strategy compilation (17 institutions, median ≈ 16 100) | PDF download returned empty | — | — | — | UNVERIFIED |
| doviz.com, Bloomberg HT, Mynet, Borsagundem, KAP, TSPB directory, Telegram/X | no structured broker-attributed page found; KAP carries issuer disclosures, not research; no official broker Telegram channel verified | — | — | — | UNVERIFIED |
| Global vendors (LSEG I/B/E/S, FMP, EODHD, Benzinga, Finnhub) | I/B/E/S lists "regional and local brokers" among 950+ contributors, enterprise pricing; EODHD "WallStreetTargetPrice" from $19.99/mo, Istanbul not named; Benzinga US-only; no vendor names the contributing broker in a retail-priced API | — | no | paid | — |

**What this means**

1. *Reliability order:* primary broker publications (date, horizon, wording, analyst name) › terminal-fed news
   (Foreks/ForInvest, Bigpara) › structured retail aggregators (Fintables richest, Ekofin clean but 3-month
   window, Halkarz stale) › event roundups › consensus-only pages (no names) › social reposts (nothing official
   verified).
2. *Per-stock target tables are a solved, free problem* (Fintables, Ekofin). None of them keeps a broker-attributed
   **history** you can read back, Ekofin discards after 3 months, and none shows the *reason* in plain language.
3. *BIST 100 targets by broker live nowhere maintained.* They appear in each broker's January and mid-year strategy
   report, get compiled once by a newspaper or Matriks, and are then revised piecemeal through ForInvest news.
   Most are **"12 aylık"**, not "yıl sonu" — the horizon must be stored, not assumed.
4. *Foreks' rolling "Tavsiye Raporları" item is the cheapest discovery signal* for change events (old → new
   target per broker, same day, PDF links) — useful to know *that* a report exists; the view itself should
   still be taken from the broker's own document and attributed to the broker, not to Foreks.

## 5. Legal and policy constraints (background, not legal advice)

**SPK — Tebliğ III-37.1 (Yatırım Hizmetleri …) and the 2026 guide (i-SPK.37.9, İlke Kararı 17.06.2026)**

- Md. 45: *yatırım danışmanlığı* is personalised advice and needs a licence. Md. 73: *genel yatırım tavsiyesi* is
  non-personalised. Md. 73/3 binds "medya ve elektronik ortamda yer alanlar dahil her türlü genel yatırım
  tavsiyesi" to Md. 78–79: reliable sources, the date the recommendation was first prepared, the date/time of any
  price, the preparer's identity on request, and the EK/3 warning text, which on websites must appear before or
  at the top of the page carrying the recommendation (Md. 79/1-b).
- The 2026 guide states that media service providers and periodicals may publish general investment advice
  without a licence and without a suitability test, and that relayed recommendations must be passed on
  "raporlarda yer aldığı şekliyle aynen aktarılmalı, müşteriye özel hale getirilmemelidir".
- Enforcement pattern (SPK bulletins 2026/14 and 2026/37, fetched): fines and bans target self-dealing after
  social-media tips and manipulation — not neutral re-reporting of licensed brokers' published research. The
  risk for dovizveri is a **misstated** recommendation, not the act of reporting.
- Implication: an "Aracı kurumlar ne bekliyor" block must carry the EK/3 notice (the current "yatırım tavsiyesi
  değildir" line is not it), show the report date and the price date, name the broker (and analyst if the
  report does), relay the recommendation verbatim, and never add its own al/sat wording or a "sizin için".

**Copyright — FSEK 5846**

- Md. 1/B: a report is a protected work as *expression*; the bare facts (broker, ticker, target, date) are not.
- Md. 35 (iktibas): sentences and passages may be quoted "maksadın haklı göstereceği bir nispet dahilinde" with
  the work, author and place clearly identified. Md. 71/3 and 71/5 make unattributed or misleading attribution a
  criminal matter. Md. 36 (daily news) is for press on press; brokers are not newspapers — rely on 35 + facts.
- Broker notices seen (quoted under 15 words): İş Yatırım "açık iznimiz olmaksızın … kısmen veya tamamen
  çoğaltılamaz"; Garanti BBVA "yayınlanamaz, iktisab edilemez"; Halk "basın organlarında yayınlanamaz";
  Ziraat "izinsiz kullanılamaz, iktibas edilemez"; Alnus "kişiye özel ve münhasırdır". Every report also carries
  the Borsa İstanbul data notice ("bu veriler tekrar yayınlanamaz") — do not republish the report's price
  tables; show the target and the report date, and take the live price from the site's own providers.
- Implication: summary + facts + ≤ 1–2 short quotes with broker, date and link is defensible; hosting PDFs,
  reproducing tables/charts or long passages is not, and conflicts with the notices above. Add a takedown /
  correction contact. Consider asking the first three brokers for written permission — attributed distribution is
  in their interest, and it removes the question.

**Access policy**

- robots.txt disallows PDFs at Ziraat, Vakıf (main domain), Alnus and Yapı Kredi `/media`; İş Yatırım disallows
  the corporate-site JSON services (`/_layouts/`), not the research site. Decide once, explicitly: *public
  pages only, respect robots, no membership or client logins, no mailing-list scraping.* Email research
  distribution is client distribution ("müşterilere e-posta yoluyla", SPK guide); feeding a public site from a
  client mailbox collides with the notices.
- TSPB's Araştırma ve Analist Raporları İlkeleri Yönergesi (Genelge 44, 2021) obliges members to publish public
  reports on their websites with equal access — which is why so much is public — but periodic bulletins and
  technical analysis are outside its scope, and it says nothing about redistribution.

## 6. Critique — problems, ranked

**A. Duplication of free aggregators.** Per-broker target-price tables already exist for free (Fintables: 31
recommendations and a model-portfolio flag for THYAO; Ekofin; Halkarz — §4). A dovizveri feature that shows
"İş Yatırım: THYAO hedef 400" is a worse copy. The non-duplicated part is the one the site already does for
YouTubers: dated **change events** with the evidence quote and the previous view, in plain Turkish, on the
instrument page next to the commentators — plus **index and macro targets** (BIST 100 12-month / year-end,
USD/TRY), which no aggregator maintains per broker (§4, point 3), and a **readable history**, which Ekofin
discards after three months and Fintables does not expose.

**B. Daily bulletins are noise under the explicit-only rule.** Most of the daily volume (the thing that makes
this look like the YouTube tracker) yields no explicit, horizon-bearing view (§3.4). If the pipeline ingests
bulletins, it will either show intraday "bugün hafif pozitif açılış" items that are stale by noon, or drop
nearly everything. Explicit views arrive in bursts: monthly model-portfolio updates, quarterly strategy reports,
earnings-season company reports (now — 3Ç26 season). Plan around that cadence, not a daily feed.

**C. Instrument mismatch and the per-stock question.** The site's seven instruments cover what strategy and
macro reports forecast; they do not cover stocks. "Hisseler ile ilgili yorumlar" means new instrument keys
(tickers), stock pages, stock market data and a stock directory — a product expansion with its own design,
data-provider and cost questions. Do not let the broker-report feature smuggle it in; decide it on its own.

**D. Fragility.** 37 brokers = 37 adapters: SharePoint, Umbraco, WordPress, Next.js, Framer, F5 challenges,
anti-forgery tokens, hash-named files, three TLS chains the default trust store rejects. The research pass hit 404s, 403s, 522s and
timeouts in one afternoon. Mitigation: start with the four sources that have feeds or JSON (İş Yatırım RSS,
Yapı Kredi JSON, A1 Capital RSS, Meksa RSS) plus two with clean dated URLs (Gedik, Ahlatcı), add a "no new
report in N days" alert per source, and budget ~1 day per further broker plus ongoing breakage.

**E. Extraction errors are the reputational risk.** A wrong target under a broker's name is worse than a wrong
YouTube paraphrase: it is a checkable number. Known failure modes: previous vs new target, TL vs USD targets,
12-month vs year-end horizon, "AL" in a table header vs in the recommendation line, model-portfolio diffs that
need the previous list, PDF tables that extract column-wise. Mitigations: schema-validated LLM output with a
verbatim evidence span and page number, ticker validation against the BIST list, a human review queue for the
first weeks, and a correction channel on the page. İş Yatırım's HTML body makes its extraction nearly
deterministic — one reason to start there.

**F. Legal duties are real but cheap** (§5): EK/3 notice, dates, verbatim relay, no hosting, attribution. The
expensive version — ignoring robots, scraping memberships, mirroring PDFs — is the one to avoid.

**G. Attribution unit.** Brokers are institutions, not persons; some reports name the analyst, most bulletins
do not. The tracker's `Person` model and the site's `/uzmanlar` pages assume a person. A broker needs its own
source type (`broker`) and its own page or section, and the home tally should not mix institutional 12-month
targets with YouTubers' "bu hafta" calls in one bar — different horizons, different nature.

**H. Scoring.** Broker targets are more resolvable than YouTube calls (a number, a 12-month horizon), so an
accuracy score is tempting. The same Phase 3 gate applies (written resolution rules, minimum sample, baseline,
legal read). Stance-change events are safe to show; "isabet oranı" is not, at launch.

**I. Volume and cost.** ~10 brokers × 1–3 PDFs/day ≈ 20 documents/day, 2–15 pages each. LLM cost at current
Claude pricing (platform.claude.com, fetched): Haiku 5.5 < $1/month, Sonnet 5.5 ≈ $16/month, Opus 5.5 ≈
$31/month for 600 reports; Batch API halves it. The tracker already uses Gemini; either is fine. Effort: 1–2
weeks for three sources end-to-end, then ≈ 1 day per source. Cost is not the constraint; owner attention and QA
are, and the YouTube pipeline itself is still unscheduled (OI-005).

**J. What the reader gets.** Honest minimum card: kurum · araç · yön (↑ ↓ →) · hedef (varsa) · ufuk · kısa
alıntı · rapor tarihi · [rapor]. Below it: "Önceki görüş: 12.500 (Tem 2026)". That is the same card the site
already renders for persons, which is the strongest argument that the feature is a source extension — if the
instrument set stays as it is.

## 7. How it could fit dovizveri.com (proposal for the owner, not a decision)

**Data model (tracker)** — reuse the view shape, add a document source:
- `BrokerSource` (slug, name, site, adapter kind: `rss | json | listing`, robots-ok flag, notice text, enabled) —
  config `config/watched_brokers.yaml` next to `watched_channels.yaml`.
- `BrokerReport` (broker_id, report_type: `strateji | model_portfoy | sirket | tavsiye_listesi | gunluk | teknik`,
  title, url, pdf_url, sha256, published_at, page_count, text, extracted_at, status).
- `BrokerView` — same fields as the outlook: `instrument` (`bist`, `dolar-tl`, … or a ticker later), `outlook`
  up/down/flat/none, `explicit`, `horizon` ("yıl sonu", "12 ay"), `target` + `currency`, `previous_target`,
  `recommendation` (AL/TUT/SAT, verbatim), `quote`, `page`, `report_id`; change detection against the previous
  view of the same broker + instrument, as the site does per person.

**Pipeline** — fetch (RSS / JSON / listing; optionally poll Foreks' rolling "Tavsiye Raporları" item as a
discovery signal for same-day target changes, then fetch the broker's own document) → dedupe by sha256 and
(broker, type, date) → text (İş Yatırım HTML
directly; PDFs via PyMuPDF, OCR only for pages with no text) → LLM structured extraction with evidence span and
schema validation → ticker / currency / horizon checks → store → review queue for low-confidence rows → publish.
Schedule: hourly on weekdays 07–19 UTC for feeds, daily for listings; nothing on weekends except model-portfolio
pages.

**UI** — on `/piyasa/bist` and `/piyasa/dolar-tl`, a second block under the commentators: "Aracı kurumlar ne
bekliyor" — one row per broker (latest explicit view, target, horizon, date, change arrow, previous view, link
to the report), EK/3 notice above the block. Home: a separate "kurumlar" line under the tile, not merged into the
person bar. `/konular`: broker views as additional evidence rows with the firm as speaker. Per-stock pages: not
in this proposal.

**Phases**
0. *Manual sample (1 week, no code).* For İş Yatırım, Yapı Kredi (public types) and Gedik, hand-collect two
   weeks of strateji notu, model portföy and şirket raporu; fill a sheet with the `BrokerView` fields; count
   explicit views per instrument per week and how many are changes. Compare with what the free aggregators show.
   Decide go / no-go and the per-stock question on that evidence.
1. *Index + macro only.* Three adapters (İş Yatırım RSS, Yapı Kredi JSON, Gedik listing), strateji + model
   portföy types, views for `bist` and `dolar-tl`, block on the two instrument pages, review queue, EK/3 notice.
2. *Stock views* — only if the owner opens per-stock scope: şirket raporu + tavsiye listesi extraction, ticker
   instrument keys, stock pages. Separate plan.
3. *Scoring* — gated as for persons (product.md §3.2).

**Measurement (Phase 1)** — views/week per instrument and per broker; share of views that are change events;
extraction error rate from a weekly manual audit of 20 rows (target < 5 %); GA engagement on the new block
(clicks on report links, time on `/piyasa/bist`) vs the four weeks before.

## 8. Open questions for the owner

1. **Scope:** index + macro targets on the existing instruments (source extension), or per-stock coverage too
   (product expansion with stock pages)?
2. **Access policy:** confirm *public only, respect robots.txt, no memberships, no mailing lists* — this excludes
   Ziraat/Vakıf/Alnus PDFs and İş Yatırım's daily bulletins unless they grant permission. Ask the first three
   brokers for written permission?
3. **Where it runs:** inside the tracker (shared LLM, DB, jobs) or a separate small service? The tracker is the
   natural home; it is also the service whose YouTube ingestion is still unscheduled (OI-005).
4. **Legal read** before launch (EK/3 placement, quotation length, correction channel) — same as for the
   person features.
5. **Daily bulletins:** skip entirely (recommended), or show as a 1-day-horizon "bugün" line that expires at the
   close?

## 9. Sources (fetched 2026-10-26)

Primary: İş Yatırım research site feeds and sample report
(`https://arastirma.isyatirim.com.tr/category/sirket-raporlari/feed/`,
`https://arastirma.isyatirim.com.tr/2026/10/23/akgrt-is-aksigorta-3c-2026-kar-analizi/`, robots.txt, sitemap
index); Yapı Kredi Yatırım `POST /DetailPage/GetResearchReportTypes`, `POST /DetailPage/GetResearchReports`;
Ziraat Yatırım `POST /umbraco/api/ClockworkUploaderPublic/GetFilesByFilter`,
`https://www.ziraatyatirim.com.tr/documents/category/SS-26-10-2026.pdf`; the broker pages listed in Appendix A.

Regulatory and legal: Tebliğ III-37.1 (consolidated text, alomaliye mirror); SPK guide i-SPK.37.9
(`https://spk.gov.tr/data/61e496a11b41c60d1404d6b2/…Rehber (Versiyon, i-SPK.37.9).pdf`); SPK bulletins 2026/14 and
2026/37 (`https://spk.gov.tr/data/69b075698f95db28e03cdb98/2026-14.pdf`,
`https://spk.gov.tr/data/6a2c18018f95db18b4eeb55d/2026-37.pdf`); FSEK 5846
(`https://www.mevzuat.gov.tr/mevzuatmetin/1.3.5846.pdf`); TSPB Genelge 44 and announcement
(`https://tspb.org.tr/genelgeler/tspb-arastirma-ve-analist-raporlari-ilkeleri-yonergesi-hk/`).

Aggregators: Fintables (`https://fintables.com/sirketler/THYAO/analist-tavsiyeleri`, browser-rendered); Ekofin
(`https://ekofin.net/sirket/detay/DOHOL/firma-tahminleri`); Halkarz (`https://halkarz.com/turk-hava-yollari-a-o/`);
Foreks "Tavsiye Raporları" (`https://www.foreks.com/haber/detay/66c84b7319e2f24173814e9a/PICNEWS/tr/borsa-istanbul-sirket-banka-tavsiye-raporlari/`);
Bigpara "Aracı Kurum Görüşleri" category; hisse.net EREGL roundup (06.08.2026); Paratic `/haberleri/hedef-fiyat/`;
Türkiye Gazetesi "Borsa için 13 farklı hedef" (21.01.2026); TradingView `/symbols/BIST-THYAO/forecast/`;
EODHD fundamentals page; LSEG I/B/E/S catalogue page.

Technical: TipRanks FAQ (`https://www.tipranks.com/glossary/f/faq`); table-extraction benchmark arXiv 2511.16134;
Claude pricing (`https://platform.claude.com/docs/en/about-claude/pricing`).

UNVERIFIED (search snippets only): Benzinga/MarketBeat methodology, Docling vs PyMuPDF benchmarks, TBB Dergisi
article on media and general investment advice (HTTP 402), 2025 SPK enforcement totals.

## Appendix A — broker inventory (research pass, 2026-10-26)

| # | Broker | Research URL (verified unless noted) · login? | Report types seen | Format / cadence / URL pattern | Machine access | Notice / robots |
|---|---|---|---|---|---|---|
| 1 | İş Yatırım | `arastirma.isyatirim.com.tr` (research site) and `isyatirim.com.tr/tr-tr/analiz/arastirma-raporlari/…` (corporate) · no login; daily bulletins member-only | Şirket raporları, kar analizi/tahmini, teknik bülten, piyasalarda bugün, hisse önerileri, ELÜS, USP, yurtdışı | HTML + PDF; daily/per event; `/wp-content/uploads/YYYY/MM/<name>.pdf` | RSS per category (verified); WP REST 401; corporate SharePoint JSON (`/_layouts/…GetReportMainCategories`) | "açık iznimiz olmaksızın … çoğaltılamaz"; research site robots open; corporate robots disallows `/_layouts/` |
| 2 | Garanti BBVA Yatırım | `garantibbvayatirim.com.tr/arastirma-raporlari` · list behind login | Günlük Piyasa Özeti, Model Portföy, Hisse Stratejileri, Şirket/Sektör, Strateji | `.vsf` → PDF, id-based | none public | "yayınlanamaz, iktisab edilemez" |
| 3 | Yapı Kredi Yatırım | `ykyatirim.com.tr/hizmetler/arastirma` · no login | Strateji Notu, Şirket Raporu, Teknik Hisse Önerisi, Karlar, Model Portföy, Makro | PDF via token endpoint; `reportPostTime` in JSON | JSON list verified; `isPublic` flags; download UNVERIFIED by Lead | robots disallows `/media/*.pdf` |
| 4 | Ak Yatırım | `akyatirim.com.tr/tr/raporlarimiz/arastirma-raporlari`, `/model-portfoy`, `/ak-yatirim-onerileri` · no login | Şirket, Strateji, Model Portföy ("Güncelleme Notu – 2 Ekim 2026"), kısa vadeli öneriler | PDF list via POST with anti-forgery token | `ModelPortfoyView`, `PortfoyNews` JSON | robots open |
| 5 | QNB Invest | `qnbinvest.com.tr/arastirma`, `/blog` · no login | Örnek raporlar, daily "Dünya Borsaları Bülteni", makro | HTML daily; static sample PDFs | no RSS | robots disallows `/download/` |
| 6 | Gedik Yatırım | `gedik.com/analiz/rapor-ve-analizler`, `/analiz/model-portfoy/hisse-model-portfoy`, `/analiz/hisse-onerileri` · no login | Günlük/FX/VİOP/Eurobond/uluslararası daily, haftalık, aylık, Model Portföy + Strateji, Hisse Önerileri | PDF daily, `cdn.gedik.com/cdn/bulletin/YYYY/MM/DD/<name>_<hash>.pdf` | server-rendered lists | "Tüm Hakları Saklıdır"; robots open |
| 7 | Ziraat Yatırım | `ziraatyatirim.com.tr/arastirma`, `/sabah-stratejisi`, `/hisse-oneri-portfoyu`, `/sirket-raporlari` · no login | Sabah Stratejisi, Günlük Teknik/FX, Hisse Öneri Portföyü, Şirket Raporları, Özel Raporlar | PDF daily, `/documents/category/SS-DD-MM-YYYY.pdf` (verified) | POST listing API (verified) | "izinsiz kullanılamaz, iktibas edilemez"; robots `Disallow: /*.pdf$` |
| 8 | Halk Yatırım | `analizim.halkyatirim.com.tr` · home public, hedef fiyat/şirket/sektör behind login | Günlük Bülten (public), Şirket/Sektör, Görünüm, hedef fiyat list (login) | PDF daily `/pdf/YYYY/MM/<n>_Günlük Bülten - DDMMYYYY.pdf` | none | "basın organlarında yayınlanamaz"; robots 404 |
| 9 | Vakıf Yatırım | `vkyanaliz.com` · no login | Günlük/Haftalık/Teknik Strateji, Aylık Strateji, Model Portföy, Kısa Vadeli Teknik Öneri, Şirket Raporları | PDF `Files/docs/<slug>-<unixtime>.pdf` | none; e-posta bülteni kayıt form | main domain robots `Disallow: /*.pdf$` |
| 10 | Deniz Yatırım | `denizyatirim.com/ArastirmaRaporlari` · strateji + sabah stratejisi customer-only | Günlük, Strateji, Yıllık Strateji, Şirket, Model Portföy, BIST analizleri | PDF URLs UNVERIFIED (`javascript:void(0)`) | F5/TSPD bot challenge | BIST notice; robots empty |
| 11 | Tacirler Yatırım | `tacirler.com.tr/arastirma`, `/arastirma/gunluk-bulten`, `/arastirma/model-portfoy` · no login | Günlük, Model Portföy, Şirket/Sektör, Ekonomi, Tematik/Strateji, FX, Bilanço özetleri | HTML + PDF `/upload/files/arastirma/gunluk-bulten/YYYY/<ay>/<name>.pdf` | none; bülten aboneliği form | bot-specific blocks only |
| 12 | Şeker Yatırım | `sekeryatirim.com.tr/Arastirma/Raporlar` (943 PDFs), `/Bultenler`, `/TavsiyeListesi` · no login | Günlük, Teknik, VİOP, FX, Aylık Strateji, Tavsiye Listesi, Kar Beklentileri, şirket | PDF `/Arastirma/ArastirmaRaporDosya/<id>/tb-DD.MM.YYYY.pdf` | POST filter forms | logo "izinsiz kullanılamaz"; robots `/images/` only |
| 13 | Oyak Yatırım | `oyakyatirim.com.tr/arastirma-raporlari` (213 items) · no login | Teknik Bülten, Değerleme Tablosu, VİOP, Günlük, Hazineden Güne Bakış | PDF pattern UNVERIFIED; `/ModelPortfoy/TR` → PDF | POST `/Reports/SearchReports`; bülten üyeliği | © notice |
| 14 | İnfo Yatırım | `infoyatirim.com/arastirma`, `/arastirma/gunluk-bulten` · no login | Günlük, Teknik, Forex, Uluslararası, Varant, Hisse Önerileri, Fon | HTML `/arastirma/gunluk-bulten/gunluk-bulten-DDMMYYYY/<id>` | none | © notice |
| 15 | ICBC Turkey Yatırım | `icbcyatirim.com.tr/tr/hizmetlerimiz/bulten/Gunluk-Bulten/122/0/0`, `/Model-Portfoy/156/0/0`, `/Sirket-Raporlari/68/0/0` · no login | Günlük, Model Portföy, Strategy, Şirket, haftalık dış piyasa/eurobond | PDF `/tr/images/pdf/GB DDMMYYYY.pdf`, `ModelPortfoy-YYYYMMDD-ICBC-TR.pdf`, `<TICKER>-YYYYMMDD-ICBC-TR.pdf` | paging `?LPN=n` | TLS chain untrusted by default |
| 16 | Yatırım Finansman | `yf.com.tr/analizler/raporlar` · no login | 19 categories incl. Günlük, Şirket/Sektör, Strateji, Model Portföy, Makro, Kar Tahmini | Next.js; file URLs UNVERIFIED | none found | robots `/private/` |
| 17 | TEB Yatırım | `tebyatirim.com.tr/hizmetlerimiz/arastirma/arastirma-hizmetleri` · customers only | described only | none | newsletter widget | — |
| 18 | A1 Capital | `a1capital.com.tr/gunluk-bulten/`, `/model-portfoy/`, `/strateji-ve-beklentiler/` · no login | Günlük/Haftalık/Teknik/Analitik, Model Portföy, Strateji, hisse/sektör | WP posts daily; PDFs on `a1capital.b-cdn.net/wp-content/uploads/…` | RSS `/feed/` + WP REST (verified) | robots empty |
| 19 | Ahlatcı Yatırım | `ahlatciyatirim.com.tr/arastirma`, `/arastirma/gunluk-bultenler` · no login | Günlük, günlük/haftalık/12 aylık Model Portföy, Hisse Analiz, Makro, Destek-Direnç | PDF `/arastirma/gunluk-bultenler/<id>/gunluk-bulten-YYYY-MM-DD.pdf` | none | "izinsiz kullanılması…"; robots open |
| 20 | Alnus Yatırım | `alnusyatirim.com/arastirma`, `/arastirma/sirket-raporlari` · no login, but 403 to non-browser UAs | Günlük Hazine/BİST, Şirket, Sektör, Makro, Model Portföy, Teknik Öneri, Strateji | HTML articles | none | "kişiye özel ve münhasırdır"; robots `Disallow: /*.pdf$` |
| 21 | Global Menkul | `global.com.tr/tr/sayfa/arastirma-raporlari`, `/kisa-vadeli-model-portfoy` · no login | Günlük, Hisse haberleri, KVMP AL-SAT, VİOP, model portföy | PDF `/docs/research/<hash>.pdf` | HTML paging | TLS chain issue |
| 22 | Integral Yatırım | `integralyatirim.com.tr/arastirma-bultenleri`, `/modelPortfoy` · no login | Günlük BİST, Forex/VİOP, Model Portföy, 2026 Strateji, Şirket/Sektör, Teknik | PDF `/uploads/PDF/<slug>/integralyatirimgunlukbulten_DDMMYYYY.pdf` | none | "izinsiz kullanılması…" |
| 23 | Phillip Capital | `phillipcapital.com.tr/arastirma-urunleri` · no login | Şirket, Sektör, Strateji + Model Portföy, Günlük, Teknik, COMEX | PDF `/Files/CompanyReport/<guid>.pdf`, `/Files/BIST100Bulletin/<guid>.pdf` | newsletter form | robots allows all incl. AI bots |
| 24 | Trive Yatırım | `trive.com.tr/arastirma-raporlari`, `/modelportfoy` · no login | Günlük, Piyasa Notları, Bilanço Analizleri, ABD bülteni, Model Portföy | PDF `docs.trive.com.tr/prod/files/arastirma-raporlari/<TICKER>.pdf`; daily pages dated | Framer search index | — |
| 25 | Marbaş Menkul | `marbas.com.tr/arastirma/`, `/arastirma/analizler/gunluk-bultenler/` · no login | Günlük/Haftalık/Aylık, Hisse Analiz, Bilanço, Model Portföy, Halka Arz | WP post per day → `/assets/GUNLUK-BULTEN-D.M.YYYY.pdf` | RSS `/feed/` (mostly duyuru) | robots `Disallow: /wp-json/` |
| 26 | Anadolu Yatırım | `anadoluyatirim.com.tr/gunluk-bulten`, `/haftalik-bulten`, `/teknik-bulten` · no login | Günlük, Haftalık, Teknik + archive | loader not identified; UNVERIFIED | prices API only | "tekrarı yayınlanamaz" |
| 27 | Ünlü & Co | `unluco.com/arastirma/arastirma-raporlari/` · no login | daily comment, aylık Yatırım Sepetleri | PDF `/media/<hash>/comment-YYYYMMDD.pdf` | E-Bülten form | © notice |
| 28 | Burgan Yatırım | `burganyatirim.com.tr/arastirma` · SPA, membership route | UNVERIFIED | public API base `api-public.burganyatirim.com.tr/web` (announcements only) | — | — |
| 29 | Dinamik Menkul | `dinamikmenkul.com.tr/arastirmalar` · no login | Günlük teknik analizler | HTML; freshness UNVERIFIED (items dated 2024) | bülten aboneliği | © notice |
| 30 | Piramit Menkul | `piramitmenkul.com.tr/Analiz/SirketHaber`, `/TeknikAnaliz`, `/SirketAnaliz` · loads (TLS `-k`) | BIST50 pivot, bilanço analizi | no file URLs; UNVERIFIED | embedded JSON | — |
| 31 | Bizim Menkul | `bmd.com.tr/arastirma`, `/arastirma/gunluk-bultenler-1`, `/arastirma/model-portfoy` · no login | Günlük "Piyasalara Analitik Bakış", Haftalık, Analist Raporları, Makro, Model Portföy | PDF `/application/files/<dirs>/Piyasalara_Analitik_Bakis_DD.MM.YYYY.pdf` | none | logo "izinsiz kullanılamaz" + BIST notice |
| 32 | Osmanlı Yatırım | no research section found (`/arastirma` 404; request forms only) | — | — | — | — |
| 33 | İkon Menkul | `ikonmenkul.com.tr/arastirma`, `/yurtdisi-arastirma` · no login | Günlük, Haftalık, Teknik, Şirket, Sektör, Strateji, Makro | list via JSON (anon returns `[]`); UNVERIFIED | RSS `/rss/blog.rss` (blog); Telegram `t.me/ikonnewsanaliz` | — |
| 34 | Strateji Menkul | `strateji.com.tr` · research paths redirect home | — | — | WP feed empty | — |
| 35 | Meksa Yatırım | `meksa.com.tr/meksanaliz/all` · no login | Günlük, Gün Ortası, Forex, VİOP, haftalık international | HTML `/meksanaliz/bist100/DD-MM-YYYY` | RSS `/rss.xml` (verified) | — |
| 36 | NCM Investment (ex-Noor CM) | `ncminvest.com.tr/piyasa-analizleri`, `/piyasa-analizleri/gunluk-bulten` (418 PDFs) · no login | Günlük, Forex, VİOP, Hisse, Global, haftalık takvim | PDF `/Resimler/14/WebSiteHaber/OzellikDosya/gunluk-bulten-DD-MM-YYYY.pdf` | sitemaps `/sitemap/haber/index.xml`, `/sitemap/blog/index.xml` | © notice |
| 37 | Alan Yatırım | `alanyatirim.com.tr` · unreachable | — | — | — | UNVERIFIED |
