# Review: plain-language research digests ("TCMB blogu ne buldu?") for dovizveri.com and @dovizveri

Date: 2026-11-09 · Author: Claude (Lead session) at the owner's request · Status: **owner chose option A the same day; Phase 1 built on branches, not deployed (§9)**
Registered as **OI-041** (needs-owner). Companion precedent: the broker pilot (`2026-10-26-broker-reports-review.md`, OI-027), whose
`broker_watch` job in the tracker is the pattern this plan reuses.

## 0. The request (owner, 2026-11-09)

Add a new content type: summaries and plain-language explanations of technical posts from the TCMB blog
(`tcmbblog.org`, "Merkezin Güncesi") and later other finance blogs and research, written so that a non-economist
("halkın anlayabileceği kapsamda") gets the main idea and the most important findings in a short, simple piece.
Critique the idea; start with tcmbblog.org; research a format for such posts; plan the site side first (a scheduled job
that detects new posts, extracts them and writes the summary/explanation), then the X side. Constraint: **no Webshare
proxy** for this extraction.

Method: direct probing of tcmbblog.org and tcmb.gov.tr with plain `curl` from the Lead's laptop (residential IP) on
2026-11-09, reading of the tracker's `broker_watch` job and LLM service, the X playbook and the product doc, plus web
research on how central banks and science publishers write plain-language summaries. "Verified" means fetched and
inspected that day. Anything not fetched is marked **UNVERIFIED**. Nothing here is legal advice.

## 1. Verdict in short

- **Technically easy, editorially the hard part.** The blog is a static IBM WebSphere portal: no RSS, no sitemap, no
  robots.txt, no JavaScript rendering needed. One GET of the listing page (380 kB, all 189 posts) plus one GET per new
  article is enough; both worked with a plain identified User-Agent and no proxy. Article text is clean (8.4 k chars,
  `h3` sections, numbered footnotes). The extraction is a day of work on top of `broker_watch`.
- **Cadence is too low to be a "section" on its own.** 12 posts so far in 2026, 18 in 2025, with a three-month gap
  (April–June 2026). That is a format, not a stream. The site section only makes sense once 3–5 sources feed it;
  TCMB's own *Yayınlar* Atom feed (Aylık Fiyat Gelişmeleri, Ekonomi Notları etc.) is the obvious second source and is
  a real feed (verified). Start with the blog, design the schema for many sources.
- **Differentiation is thin unless we add the "so what".** Every blog post is already news within a day (BloombergHT,
  Ekonomist, BirGün ran stories on past posts) and TCMB runs its own plain-language series *Herkes İçin Ekonomi*. A
  bare summary adds nothing. What nobody does: a fixed, honest format ("ne bulmuşlar / ne anlama geliyor / ne
  demiyor") tied to the instrument pages and to what named commentators are saying about the same subject. That link
  is dovizveri's only edge and must be in the format from day one.
- **Accuracy is the main risk.** LLM summaries of technical texts invent causal claims and round numbers. The
  pipeline needs a mechanical "every number in the digest appears in the source" check, a one-sentence "what the
  post does not say" field to stop over-reading, and owner approval before anything reaches X (playbook §6 already).
- **Fits the product direction as evidence, not as a view.** product.md §3: news is evidence for "kim ne bekliyor".
  A TCMB staff analysis is institutional evidence with no forecast; it must never be shown as "TCMB bekliyor" (the
  blog's own disclaimer: the views are the authors', not the Bank's).
- **Recommendation:** build the pipeline and the X format first (cheap, measurable in two weeks), and open the site
  section only after four posts have 48 h analytics and the owner has read the digests against the sources. Details
  and the alternative order in §6.

## 2. What was verified on tcmbblog.org (2026-11-09)

| Fact | Evidence |
|---|---|
| Platform: IBM WebSphere Portal / WCM (`/wps/wcm/connect/...` URLs, UIkit theme) | homepage HTML |
| No RSS, no sitemap, no robots.txt: `/feed/`, `/rss`, `/sitemap.xml`, `/robots.txt` → 404 | curl |
| Listing page `/wps/wcm/connect/blog/tr/main+menu/analizler/` returns **all 189 posts** in one 380 kB page, each as `<article data-permalink="…">` with `<time datetime="YYYY-MM-DD">`, title, category link (`search_categories=…`) and teaser | parsed |
| Posts per year: 2016 20 · 2017 47 · 2018 36 · 2019 19 · 2020 6 · 2021 6 · 2022 3 · 2023 3 · 2024 19 · 2025 18 · 2026 12 (to 4 Nov). Last 12 months: 1–3 per month, none in Apr–Jun 2026 | parsed listing |
| Categories: Finansal Piyasalar 43 · Enflasyon 37 · Para Politikası 27 · Uluslararası Ticaret 24 · Finansal İstikrar 18 · Ödemeler Dengesi 13 · Büyüme 12 · İşsizlik-İstihdam 10 · Maliye Politikası 5 | parsed listing |
| Latest post: "Fon Tasfiyeleri ve Reel Sektör: Firma Verileri Ne Söylüyor?", **2026-11-04**, Ünal Seven & Kadir Gürci, Finansal Piyasalar | article `<time datetime>` |
| **Trap:** the homepage teaser shows "17 Eylül 2026" for that post — a date from the teaser text (the SPK decision), not the publish date. Only `<time datetime>` is reliable | homepage vs article |
| Article body lives in `div.content-text`: intro, `h3` sections, `p` paragraphs, footnotes `[1]…[4]`, a closing "Özetle" paragraph. Charts are PNGs referenced as "(Grafik N)" **with no captions or alt text** → the summary must rely on the text, which does describe every chart | article HTML |
| Author boxes repeat the author bios (duplicated for print); strip them | article HTML |
| Response headers: `ETag` present, no `Last-Modified`, a `TS01d2f09f` cookie (F5 BIG-IP style bot defence). Worked from a residential IP with UA `dovizveri-bot/0.1 (+https://dovizveri.com/iletisim)`; **UNVERIFIED from the Hetzner host** | curl -I |
| Same content is mirrored at `www.tcmb.gov.tr/wps/wcm/connect/blog/tr/…` (200, identical size); `tcmb.gov.tr/robots.txt` disallows only `*/search+results` | curl |
| English twin exists (`/blog/en/main+menu/analyses/`) — not needed | curl |
| Footer: "TCMB © 2026 Tüm hakları saklıdır."; sidebar: "Blogda yer verilen görüşler yazarlara aittir… resmi görüşlerini temsil etmeyebilir." Blog has an X account `@tcmbblog` and an e-mail subscription form | HTML |
| TCMB main-site RSS index (`/TR/TCMB+TR/Bottom+Menu/Diger/RSS`) lists 5 feeds: Basın Duyuruları, Başkanın Konuşmaları, PPK Kararları, Veriler, **Yayınlar**. *Yayınlar* is a working Atom feed (17 entries, newest "Aylık Fiyat Gelişmeleri (Ekim 2026)"); it does **not** carry blog posts | curl |

Webshare: the tracker uses Webshare only for YouTube transcript fetching (`src/config.py`, `youtube_watch`). Nothing
in this plan needs it; the blog fetch is ordinary HTTPS with the same `HttpFetcher` + robots + 1 s courtesy delay as
`broker_watch`. The one open question is whether the F5 front door treats the Hetzner datacenter IP differently from a
laptop; that is Phase 0 item 1 below, and the fallback is the `tcmb.gov.tr` mirror, never a proxy.

## 3. Critique

### 3.1 Why do it
- It adds a second evidence layer the site lacks today: institutional analysis with data, next to commentators'
  opinions. "Ekonomist X dolar için şunu bekliyor; TCMB araştırmacıları aynı konuda şunu ölçtü" is a real reading
  experience and matches product.md §3.3 (news as evidence) without touching the view-counting rules.
- The raw material is public, clean, Turkish, short (8–10 k chars), and cheap to summarise (≈ 3–4 k input tokens).
- It is reusable: the same schema serves TCMB *Yayınlar*, later BDDK/Hazine notes or foreign central-bank blogs.

### 3.2 Why it may not be worth much
- **Volume.** 1–3 posts a month from TCMB blog. Even with *Yayınlar* it stays under ~8 items a month. A "section" with
  three items a quarter looks dead; a recurring X format with 1–2 posts a month is fine.
- **Timeliness is not ours.** Media cover each post within hours; our post lands later and says the same unless the
  format itself is the value.
- **Audience fit is unproven.** Our X account is at a few dozen followers and the site at ~9 daily users (GA,
  2026-10-23). Nothing in the data says readers want research explainers; the owner's hypothesis must be tested
  before a UI is built. Measure with the 48 h rows (playbook §3.5 item 3) and GA UTM `research_digest`.
- **Over-interpretation risk.** Research posts are hedged on purpose ("bir sonuç sunmuyor", "olası"). A summary that
  drops the hedges turns a measurement into a prediction. This is also the legal edge: no forecast, no advice.
- **Charts are unreadable to the pipeline.** Findings that live only in a chart will be missed; the text usually states
  them, but not always. The format must say what it is based on (the text).

### 3.3 Legal and courtesy (not legal advice)
- Summaries in our own words with title, authors, date and link are ordinary reporting; quotation of one short
  sentence with attribution is within normal quoting practice. **Do not republish the charts** (TCMB images; link
  instead). **Never** present the post as TCMB's official view; carry the blog's own disclaimer in one line.
- Fetching: identified UA, ≤ 2 runs a day, 1 request per second, GET only; robots.txt absent → allowed under the same
  rule `broker_watch` already applies (RFC 9309, documented in the tracker jobs README).

## 4. Format research → the dovizveri digest format

What the references do (all read 2026-11-09, listing/summary level):
- Plain-language summary guides (AGU "creating a plain-language summary", Cochrane PLS template, UAMS, CASRAI) converge
  on three blocks — *what was studied, what was found, why it matters* — plus: active voice, defined jargon, only the
  method details that change the meaning.
- Liberty Street Economics (NY Fed) opens with one key-takeaway sentence; the ECB Blog uses headline + one-line
  standfirst; Bank of England KnowledgeBank titles are questions ("What are interest rates?"). TCMB blog itself ends
  every post with an "Özetle" paragraph — the authors' own conclusion, which is the safest anchor.
- Turkish readability: the Ateşman formula (1997, Flesch adapted) is the standard measure; "orta güçlükte" ≈ 50–59.
  Use it as a guard (target ≥ 55) not a goal; subject knowledge matters more than syllables.

**Digest schema (one record per source item; source-agnostic):**

| Field | Rule |
|---|---|
| `headline` | ≤ 90 chars, plain Turkish, may be a question. The finding, not the topic. |
| `why_now` | 1 sentence: what the authors looked at and why (the trigger event or data). |
| `findings` | 2–3 bullets, each ≤ 160 chars, each carrying **one number that appears verbatim in the source**. |
| `so_what` | 1–2 sentences for a saver/investor: what changes in how to read the news. No advice, no direction words. |
| `not_said` | 1 sentence: what the post explicitly does *not* claim (from its own hedges). Mandatory. |
| `terms` | ≤ 3 jargon terms with one-line meanings (feed `/sozluk`). |
| `quote` | one verbatim sentence ≤ 200 chars, preferably from the "Özetle" paragraph. |
| `basis` | 1 sentence: data/method ("firma bilançoları, firmalar arası ticaret verisi, haftalık kredi verisi"). |
| `topics` | 0–3 site instrument keys (`dolar-tl`, `altin`, `bist`, …) chosen from a closed list, or none. |
| `related_views` | filled by the API, not the LLM: explicit views on the same `topics` in the last 30 days. |
| meta | source slug, URL, title, authors, `published_at`, category, sha256 of the text, LLM purpose/version, `numbers_check` pass/fail, `review_status` (auto / needs_review / rejected). |

Hard rules: Turkish only; sentences ≤ ~18 words on average; no "TCMB bekliyor/öngörüyor"; the blog disclaimer line is
part of the rendering, not of the record. A digest whose `numbers_check` fails is stored but never served (same
`needs_review` idea as `broker_watch`).

**Sample digest** from the 2026-11-04 post (written by the Lead from the text, as the quality bar for the LLM; numbers
checked against the source):

> **Tasfiye edilen fonlardaki 116 milyar TL ekonomi için ne kadar büyük?**
> SPK 17 Eylül 2026'da bazı fonları tasfiyeye aldı; TCMB araştırmacıları bu fonlarda parası kalan reel sektör
> firmalarını firma verileriyle inceledi.
> - Yaklaşık 3 bin firmanın bu fonlarda 116 milyar TL'si var; 57 milyar TL'si para piyasası fonlarında.
> - Bu firmalar reel sektör aktiflerinin %1,2'sini, istihdamın %0,6'sını, cironun %0,9'unu oluşturuyor.
> - Fondaki parası dönen varlıklarının yarısını aşan "yüksek maruziyetli" firmalar istihdamın ve cironun on binde 3'ü.
> - Bu firmaların kısa vadeli TL kredi kullanımı artıyor: krediye erişimleri sürüyor.
> **Ne anlama geliyor:** Doğrudan etkilenen firmaların ekonomideki payı küçük; tedarikçileri eklenince istihdamın
> %1,2'sine çıkıyor. Yazı, bankaların bu firmalara kredi vermeye devam ettiğini gösteriyor.
> **Ne demiyor:** Yazarlar bunun fon krizinin toplam etkisini ölçmediğini, varlık fiyatları ve güven kanalının
> ayrıca etkili olabileceğini açıkça yazıyor.
> **Terimler:** *Maruziyet oranı* = fondaki para / firmanın dönen varlıkları. *Para piyasası fonu* = kısa vadeli,
> düşük riskli araçlara yatıran fon. *Dönen varlık* = bir yıl içinde nakde dönebilen varlıklar.
> **Alıntı:** "…fon maruziyeti yüksek firmaların ekonomideki ağırlığı görece düşük."
> Kaynak: Ünal Seven, Kadir Gürci — Merkezin Güncesi, 4 Kas 2026 · yazarların görüşüdür, TCMB'nin resmi görüşü
> değildir · [link]

## 5. Pipeline plan (site side first, as requested)

Where: the **tracker** repo (it already has the LLM service, the DB, the jobs pattern, the API-key public routers),
proxied by **finance-api** like `/v1/brokers`, rendered later by **liquid-economy**. The Coolify scheduled task that
drives `youtube_watch` is the trigger mechanism (there is no in-process scheduler); the blog check needs one call a
day, weekdays 10:00 TRT (all 2026 posts landed on weekdays).

### Phase 0 — two checks before any code (owner or Lead, ½ day)
1. **Reachability from production without a proxy.** One GET of the listing page from the tracker container (via the
   existing backfill-style admin route or a one-off `python -c` in the Coolify terminal, which is unreliable — see
   INFRASTRUCTURE.md). Pass = 200 and the `<article data-permalink` count > 150. Fail → try the `tcmb.gov.tr` mirror.
   If both fail from the datacenter IP, stop: the owner's no-proxy rule makes this source infeasible from the box.
2. **Owner reads the sample digest above against the post** and marks each sentence right / over-read / missing.
   This is the acceptance bar the LLM has to meet.

### Phase 1 — `research_watch` job in the tracker (one developer cycle)
Modelled on `src/jobs/broker_watch/` (config loader, `HttpFetcher` with robots + UA + delay, `runs` table,
`max_runs_per_day`, public router). Scope: **tcmbblog.org only**, adapter `tcmb_blog_listing`; a second adapter
`tcmb_atom` (Yayınlar feed) is designed for but not built.

Acceptance criteria:
- A. A run fetches the listing once, diffs `data-permalink` against stored items, fetches only new articles, stores
  `source, url, title, authors[], published_at (from <time datetime>), category, body_text, sha256`. Re-running
  stores nothing new. No request goes through a proxy; UA is the dovizveri bot string.
- B. Parser fixtures: saved listing + two articles (2026-11-04 and one 2025 post) under `tests/research_watch/`;
  tests assert 189 permalinks, the date, the authors, that author bios and sidebar are stripped, and that footnotes
  are kept. Hermetic (`httpx.MockTransport`).
- C. Digest generation through `src/llm/service.py` with a new prompt `RESEARCH_DIGEST_PROMPT_TEMPLATE` (purpose
  `research_digest`, `reasoning_effort=medium` per the 2026-11-01 token findings), returning the §4 schema as JSON.
  `numbers_check`: every number token in the digest (`116`, `%1,2`, `on binde 3`, dates) must occur in `body_text`
  after normalisation; a failure sets `needs_review` and the digest is not served. ≤ 2 LLM calls per item (one retry).
- D. Public GET `/research/digests?source=tcmb-blog&days=365&limit=20` (API key) → only `auto`/`reviewed` digests,
  newest first, with `related_views` joined from the outlook rows on the same topic keys (last 30 days). No body text.
- E. Backfill `--since 2026-01-01` (12 posts) under the document cap; one-off, logged like the broker backfill.
- F. Finance-api proxy `/v1/research/digests` with a 1 h cache (do not repeat the `/news/latest` fan-out pattern,
  product.md §7). Health of the job visible in `GET /jobs/research-watch/runs`.
- G. Evaluation before serving: owner reads the 12 digests against the sources; ≥ 10/12 with no wrong or over-read
  sentence, otherwise the prompt is revised and the 12 are regenerated. Record the result in the run record.

Effort: ~500–700 LOC with tests in the tracker (the broker job is 2.4 k LOC for three adapters), ~100 LOC in
finance-api. Risk: low (read-only, isolated job, no schema change to existing tables; one new table + one runs table,
which is a migration → owner decision per CLAUDE.md).

### Phase 2 — X format "Araştırma özeti" (social-manager + social-designer, no code)
Fits playbook §3.5; proposed as a new content-mix row next to "Evergreen explainer":
- Line 1: the `headline` (our plain sentence or question). **Deviation to decide:** §3.5 item 1 wants a verbatim
  speaker sentence; research has no speaker and the authors' sentences are technical. Alternative: line 1 = `quote`.
- Line 2 (bold): `Merkezin Güncesi · <Kategori> · Araştırma özeti`.
- Then `why_now`, `Ne bulmuşlar?` bullets, `Ne anlama geliyor?`, `Ne demiyor?`, source line (authors, date, blog link
  + `/analizler/<slug>` with `utm_campaign=research_digest` once the page exists), `Yazarların görüşüdür, TCMB'nin
  resmi görüşü değildir.`, `Yatırım tavsiyesi değildir.`, one mapped hashtag if `topics` has exactly one instrument
  (§3.5 item 7), otherwise none.
- Media: a card variant (v3.1 base; headline in large text, 3 numbers, "Merkezin Güncesi" badge, no direction colour,
  no chart image from TCMB). Social-designer builds and self-checks it. No clip (no video).
- Reach lever: quote-post `@tcmbblog`'s own announcement when it exists, instead of a cold post — same logic as
  replies under commentators (§4).
- Measurement: the 48 h row with `format = research_digest`, compared with main-idea posts' median after 4 posts.
  Keep if impressions and link clicks are not below that median.

### Phase 3 — site section (one developer cycle, only after Phase 2 evidence)
- `/analizler` list page + `/analizler/<slug>` digest page (schema.org `Article` with `isBasedOn` the source URL),
  one "Araştırma ne diyor" block on instrument pages whose `topics` match (digest headline + link), and an optional
  home block under "Son haberler". Light theme, no layout shift, "yatırım danışmanlığı kapsamında değildir" notice,
  the TCMB disclaimer, a "Yanlış mı aktardık?" link (product.md §3.3).
- Gate: ≥ 4 X posts measured, owner evaluation G passed, at least one second source planned (otherwise the page is
  three items a quarter).

### Measurement plan (post-release)
| Metric | Method | When | Who |
|---|---|---|---|
| Detection lag | `published_at` vs first-seen in the runs table | every post, reviewed monthly | reliability-analyst |
| Digest accuracy | owner read-through, wrong/over-read sentences per digest | first 12, then every post before X | owner |
| X performance | 48 h rows (`format = research_digest`) vs main-idea median | after 4 posts | social-manager |
| Site interest | GA4 pageviews `/analizler*`, sessions with `utm_campaign=research_digest` | weekly, Phase 3 | product-analyst |

## 6. Options and recommendation

| Option | What | Pro | Con |
|---|---|---|---|
| **A (recommended)** | Phase 0 → Phase 1 pipeline → Phase 2 X posts → Phase 3 UI gated on evidence | cheapest path to a measured answer; the UI is not built for a format nobody reads | the site shows nothing new for ~4–6 weeks |
| B | Phase 1 + Phase 3 together, X after | the owner's stated order (site first) | a page with ~1 item a month at launch; UI effort spent before any reader signal |
| C | X only, hand-written by the social-manager from the blog (no pipeline) | zero code, starts tomorrow | no detection (someone must notice new posts), no numbers check, nothing reusable for the site |

The Lead recommends **A**, with Phase 0 item 1 (datacenter reachability) run before anything else, because the
no-proxy constraint is the one thing that could stop the whole plan.

## 7. Decisions needed from the owner
1. Scope of Phase 1: TCMB blog only (recommended), or blog + TCMB *Yayınlar* Atom feed from the start? **Built: blog only** (no answer yet; the schema takes more sources).
2. Build order: option A, B or C. **Answered 2026-11-09: A ("pipeline + x first"), and the extraction runs as a new Coolify scheduled task.**
3. X line-1 rule for research posts: our plain `headline`, or the authors' verbatim `quote`?
4. Site placement for Phase 3: own `/analizler` page + instrument-page block (recommended), or instrument pages only?
5. Migration approval for the two new tracker tables (`research_items`, `research_watch_runs`) when Phase 1 starts.

## 8. Sources read for the format (2026-11-09)
- AGU, "Creating a plain-language summary" — https://sharingscience.agu.org/creating-plain-language-summary/
- Cochrane plain language summary template — https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/template-writing-cochrane-plain-language-summary.docx
- CASRAI, plain-language summaries for research papers — https://casrai.org/guides/plain-language-summaries-for-research-papers
- UAMS Center for Health Literacy, plain-language research summary — https://healthliteracy.uams.edu/health-literacy-services/plain-language-assessment-and-editing/plain-language-research-summary/
- Liberty Street Economics (NY Fed) — https://libertystreeteconomics.newyorkfed.org/
- The ECB Blog — https://www.ecb.europa.eu/press/blog/
- Bank Underground, About — https://bankunderground.co.uk/about/ ; Bank of England KnowledgeBank RSS — https://www.bankofengland.co.uk/rss/knowledgebank
- TCMB "Herkes İçin Ekonomi" (Capital, 2023) — https://www.capital.com.tr/haberler/tum-haberler/merkezden-herkes-icin-ekonomi-icerikleri
- TCMB RSS index — https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/RSS
- Ateşman readability formula (Dergipark papers, e.g.) — https://dergipark.org.tr/tr/download/article-file/2162286

## 9. Decision and build log (2026-11-09, same day)

Owner: "the blog post extraction is new schedule task in coolify" · "pipeline + x first" → option A.

**Built (local branches, nothing pushed or deployed):**

| Repo | Branch | What |
|---|---|---|
| tracker | `agent/research-watch` (commits `f575b81` + review fixes `b6babf7`, worktree `../tracker-wt-research-watch`) | `src/jobs/research_watch/`: config `config/watched_research.yaml`, tables `research_item` + `research_watch_run` (created by `create_all`, no column migration), listing/article parsers, direct-only HTTP fetcher (`trust_env=False`, UA, robots.txt, 1 s delay), digest prompt `research-digest-v1` (purpose `research_digest`, effort `MINIMAX_EFFORT_RESEARCH=medium`), mechanical checks, runner CLI for the Coolify task, operator API `/jobs/research-watch/*` (runs, review queue, review decision, background run/backfill, redigest), public API `/research/digests`. 45 hermetic tests. |
| doviz | `agent/research-digests` (worktree `../doviz-wt-research-digests`) | finance-api `GET /v1/research/digests[?days&topic&limit]` and `/v1/research/digests/{id}`: one fixed upstream query cached 1 h, local filters, topics served as public asset keys, invalid items dropped one by one. 6 tests. This doc, OI-041, playbook §3.6, INFRASTRUCTURE.md §5 task spec. |

**Evidence:**
- Tracker: `pytest -q` 347 passed / 5 failed; the 5 are the pre-existing ingestion/videos failures
  (origin/main baseline 302 / 5). `ruff check src/jobs/research_watch tests/research_watch` clean.
- finance-api: `pytest -q` 86 passed / 1 failed (the known OI-002 test). The new tests caught one
  bug before commit: pydantic's ValidationError subclasses ValueError, so a malformed upstream
  payload would have been answered 422 instead of 502.
- Live run from the laptop, direct HTTPS, no proxy, scratch SQLite: listing fetched, one post in
  the 21-day window (4 Nov) stored with the right date, authors and a 5.7k-char body.
- One real MiniMax digest of that post: 20 s, 3,406 prompt + 3,456 completion tokens (2,783
  reasoning), **all checks passed** (every number in the post, verbatim "Özetle…" quote). Content
  correct; wording drier than the §4 sample (headline states a fact rather than a question;
  `why_now` generic; `topics` empty). This is what the review gate is for; prompt tuning waits
  for the owner's read of the 12 backfilled digests (criterion G).
- Local quirk, not a code issue: Python on this laptop sees a self-signed certificate for
  `api.minimax.io` (TLS interception on the network; curl with the system keychain works). The
  smoke test used `SSL_CERT_FILE` built from the macOS keychains. Production is unaffected.

- Critic review (Mode B, same day): APPROVE, nothing blocking. Fixed in round 1 (`b6babf7` +
  finance-api): small integers in a digest must sit next to the same word as in the post and
  footnote markers are ignored (before, "yüzde 2" or "3 kat" passed by chance); the quote must be
  whole sentences; wider bank-forecast wording; unfetchable posts become `fetch_failed` stubs with
  3 tries; CLI `--max-items` 1–50; only a current digest can be approved; finance-api answers 502
  (not 404) when the tracker route is missing and drops an invalid item instead of the whole list.
  The real MiniMax digest still passes the stricter checks. Accepted as is: the run lock is per
  process (Coolify run + API run at the same second may race; the URL unique key keeps data
  consistent); un-approving shows on the site within the 1 h cache; per post at most 3 job
  attempts × 4 client retries = 12 model calls, plus manual redigests.

**Deviations from §5:**
- `related_views` is not joined in the tracker API. Each digest carries `topics`; the X drafts and
  the future UI read the existing opinions endpoints for the same topic. Simpler, and no coupling
  between the two jobs.
- Criterion C retry: a model or shape error is retried on later runs, up to 3 attempts per post
  (not 2 calls inside one run); after that, `POST …/items/{id}/redigest`.
- A digest that passes the checks still waits for review while `auto_publish: false` (config);
  flip it only after criterion G.

**Rollout (owner actions, in order):**
1. Push and merge the tracker branch; deploy the tracker (API start creates the two tables).
2. Backfill 2026: `POST /jobs/research-watch/run?since=2026-01-01&max_items=12` (API key, 202);
   watch `GET /jobs/research-watch/run` and `/runs`. This is also Phase 0 item 1: if tcmbblog.org
   refuses the server IP, the run fails with an HTTP error and we switch to the tcmb.gov.tr mirror.
3. Read the digests: `GET /jobs/research-watch/items?status=needs_review`; mark each with
   `PATCH /jobs/research-watch/items/{id}` `{"review_status": "reviewed"|"rejected"}`.
4. Add the Coolify scheduled task (INFRASTRUCTURE.md §5): `python -m src.jobs.research_watch.runner`, `0 7 * * 1-5`.
5. Merge and deploy the doviz branch (finance-api) so `/api/v1/research/digests` serves reviewed digests.
6. Approve adding the research endpoint to the social-manager role; first "Araştırma özeti" drafts follow playbook §3.6.

**Sample X draft from the real digest (not posted; for format review only):**

> Tasfiye kapsamındaki fonlarda 116 milyar TL reel sektör yatırımı var
> **Merkezin Güncesi · Finansal Piyasalar · Araştırma özeti**
> Yazarlar, fon tasfiyelerinin reel sektör firmaları, tedarikçileri ve kredi erişimini nasıl etkilediğini inceledi.
>
> Ne bulmuşlar?
> • 15 Eylül 2026 itibarıyla yaklaşık 3 bin firma, tasfiye kapsamındaki fonlarda 116 milyar TL tutuyor; 57 milyar TL para piyasası fonlarında.
> • Firmalar reel sektör aktiflerinin yüzde 1,2'sini, istihdamın yüzde 0,6'sını, cironun yüzde 0,9'unu ve ihracatın yüzde 1,1'ini oluşturuyor.
> • Yüksek maruziyetli firmalar istihdam ve cironun on binde 3'ünü, ticari kredilerin on binde 2'sini oluşturuyor.
>
> Ne anlama geliyor? Tasfiyeye maruz kalan firmaların doğrudan ekonomik ağırlığı ve tedarikçi bağlantıları görece sınırlı görünüyor.
> Ne demiyor? Yazı, fon piyasası gelişmelerinin reel sektör üzerindeki toplam etkisini ölçmüyor.
>
> Ünal Seven, Kadir Gürci · 4 Kas 2026 · <blog link>
> Yazarların görüşüdür; TCMB'nin resmi görüşü değildir.
> Yatırım tavsiyesi değildir.

