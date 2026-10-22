# dovizveri.com — Product goals and constraints

Last updated: 2026-10-22 (direction change decided by the owner; §1, §3, §6, §8, §10 rewritten. Initial version 2026-10-20 was written from repo history, memory notes and live-site probes.)
Anything tagged **[ASSUMPTION]** has not been confirmed by the owner. Analysts must treat it as unverified and must not derive "user demand" from it.

## 1. What the product is
A Turkish-language site that shows, **per financial instrument** (dolar/USD-TRY, BIST 100, altın, stock indexes, kripto), **what named YouTube finance commentators explicitly expect** — "kim ne bekliyor" — and how their current view compares with what they said before. The **news layer is the evidence**: the tracker service ingests videos and generates LLM summaries; every view shown on the site links to its story and to the exact moment in the video. Live market data (döviz, altın, endeks, emtia, kripto) sits next to the views.

Services: `liquid-economy/` (web, `dovizveri.com`), `finance-api/` (BFF, `api.dovizveri.com`), and an external `tracker-api` (separate repo `erenbesli44/tracker`; owns ingestion + extraction + summaries + Postgres). The iOS app is **out of scope** for this workflow.

Background and critique of this direction: `docs/research/2026-10-22-influencer-view-theme-review.md` (comparable products, risks, proposed `Call` schema, phases).

## 2. Audience
- **[ASSUMPTION]** Turkish retail investors and followers of finance YouTubers who want to know, in a minute, who expects what for an instrument and whether that person has been consistent.
- **[ASSUMPTION]** Mobile-heavy traffic (the UI has a dedicated bottom nav bar and mobile-first ordering was requested in commit history).
- No analytics export, survey, or interview data is available to agents. GA4 is wired (`liquid-economy/.env.production`, `src/lib/analytics.ts`) but agents have no access to its reports.

## 3. Goals (decided by the owner on 2026-10-22; supersedes the 2026-09-20 news-first goals)
1. **Explicit views per instrument.** For each instrument, list each commentator's explicitly stated expected direction (yükseliş / düşüş / yatay) in the plainest possible form: person, direction, a short verbatim quote, date, horizon if stated, link to the video moment. A commentator who only speaks in generalities about an instrument does **not** appear in that instrument's view section. Hedged or conditional remarks ("yükselirse şaşırmam", "her şey olabilir") are not explicit views.
2. **Previous vs current, per person per instrument.** Show the person's earlier stance next to the current one so the reader can judge consistency. A stance change is shown as a neutral event with both quotes and dates ("görüşünü değiştirdi"), never with pejorative labels. Accuracy or "tutarlılık" scores are **not** shown until Phase 3 gates are met (written resolution rules, ≥ 10 resolved calls per person, comparison against the crowd baseline, legal read).
3. **News as evidence.** Home, story pages and `/konular` remain, but their role is proof: provenance next to every claim (person, channel, published time, timestamp), full summaries on story pages, and a visible correction channel ("Yanlış mı aktardık?") on instrument and person pages.
4. **Reading UX stays best-in-class**: strong editorial hierarchy, calm visual language, progressive disclosure, explicit "load more", scroll restored on Back, WCAG AA contrast in light and dark, no layout shift.

Delivery phases (details in the review note §4–§5):

| Phase | Scope | Gate | Tracking |
|---|---|---|---|
| 1 — data | `Call` record in the tracker (person, instrument, direction, `explicit` flag, verbatim quote + timestamp, horizon, price at statement, previous call link) + explicit-only extraction prompt; fix `published_at`; person attribution | precision ≥ 0.90 on direction for explicit calls, hand-labelled 100 segments | OI-017 (depends on OI-013, OI-002) |
| 2 — UI | instrument page "Kim ne bekliyor" (explicit only), person page "Görüş geçmişi" with change markers, correction link; no scores | ≥ 3 explicit calls per launch instrument in the last 30 days | to be opened after Phase 1 |
| 3 — scoring | resolution rules, relative accuracy vs crowd, dispute handling | counsel sign-off; N ≥ 10 resolved calls per person | owner decision |

## 4. Design principles to preserve (from the owner's brief)
- One lead, few secondary, compact feed — not a wall of equal cards.
- Paper background, charcoal ink, single navy accent; red/green reserved for market direction and always paired with icon + word.
- Serif headlines, sans UI; thin rules instead of boxed cards; ~68ch article measure at 18–20px.
- References the owner cited: NN/g (hierarchy, reading patterns, progressive disclosure), The Trust Project, W3C contrast guidance, Web Vitals; FT Markets and Reuters Markets as pattern examples.

## 5. Current state (measured 2026-10-20)
| Signal | Value | Source |
|---|---|---|
| Newest story on live site | 2026-07-22 (≈90 days old) | `GET /api/v1/news/latest?limit=3` |
| `/api/v1/news/latest?limit=14` TTFB | 2.7–3.4 s (3 samples) | curl `time_starttransfer` |
| Home / healthz / API health | all HTTP 200 | probes |
| Tracked channels | 22 (23 before OI-016) | `GET /api/v1/channels/` |
| Deployed web bundle date | 2026-09-20 (HEAD has a 2026-10-12 API fix not yet deployed) | `Last-Modified` of `assets/index-*.js` |
| Main JS bundle | 678 kB minified / 203 kB gzip | `npm run build` |
| Uptime monitoring | none | INFRASTRUCTURE.md §7 |

The tracker's ingestion is **not scheduled** (INFRASTRUCTURE.md §7 item 4): the "current view" side of every comparison is therefore ~90 days stale. This is the single largest product risk and needs the owner (it lives in the tracker repo / Coolify).

What the extraction pipeline stores today is **not** what §3 needs (verified 2026-10-22, tracker repo): topic matching is deliberately broad, `cautious`/`mixed`/`neutral` collapse into one value, only the first segment's stance per topic is kept, the evidence quote is discarded, and there is no horizon, instrument id, statement price or resolution field. Topics are buckets (`doviz-kur` mixes USD/TRY, EUR/USD and DXY). Phase 1 exists to close this gap; nothing in §3.1–3.2 should be shown from the current data.

## 6. Success metrics
Nothing is measured today. Candidate metrics, all **[ASSUMPTION]** until the owner confirms access or intent:
- Extraction quality: precision/recall of `explicit` and `direction` on a hand-labelled sample (gate for Phase 2).
- Coverage: share of mentions that pass the explicit filter; instrument pages with ≥ 3 explicit calls in the last 30 days.
- Content freshness: age of the newest call (target: < 24 h on weekdays).
- Reader engagement: click-through from a call card to the video moment; repeat visits to person pages (GA4 events would need adding).
- Trust: corrections requested per 100 calls shown; time to correct.
- Performance and reliability: TTFB of `/api/v1/news/latest` (target < 1 s), Web Vitals LCP/CLS, health-probe success rate, days of drift between `main` and production.

## 7. Constraints
- Single 2 vCPU / 4 GB Hetzner box runs everything; builds saturate it; deploy one service at a time.
- `finance-api` fans out to the tracker per channel on every `/news/latest` call (no cache) — see `finance-api/app/services/tracker_service.py`.
- Public GitHub repo: no secrets in code, docs or run records.
- Deploys are manual (Coolify API, owner's token). Agents never deploy.
- Frontend has no test runner; backend tests were made hermetic on 2026-10-20 (OI-001 done).
- Attributing views to named people: every shown view must carry a verbatim quote, a timestamp and a link; wording stays neutral; the "yatırım danışmanlığı kapsamında değildir" notice stays on every instrument and person page; no imperative al/sat copy.

## 8. Non-goals / out of scope
- iOS app (`tracker-ios-app`).
- The superseded consensus-first dashboard in `.redesign/`. The new direction is per-person explicit views with evidence, not an aggregate consensus score as the hero.
- Composite "tutarlılık puanı" or accuracy percentages under real names before the Phase 3 gates in §3.
- Showing people with no explicit view on an instrument page (the person page may state "son 30 günde bu araç için net görüş belirtmedi").
- New paid data providers or paid monitoring without owner approval.

## 9. Decisions reserved for the owner
New product direction, breaking changes, schema/data migrations, production deployments, infra/secret changes, pushing branches or opening PRs, adding paid services.

## 10. Open questions for the owner
1. Who is the target reader, and is there any analytics/search-console data that can be exported for the analysts?
2. Is restoring scheduled YouTube ingestion (tracker repo) planned? Until then the "current view" side of every comparison is stale.
3. Should the 2026-10-12 `/news/latest` paging fix be deployed? (Needs the Coolify token; see INFRASTRUCTURE.md §5.)
4. Launch instruments for Phase 2 and their order (USD/TRY, BIST 100, altın, BTC, S&P 500?).
5. Budget and timing for a legal read before any accuracy number is published under a real name (Phase 3).
