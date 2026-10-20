# dovizveri.com — Product goals and constraints

Last updated: 2026-10-20 (initial version, written from repo history, memory notes and live-site probes).
Anything tagged **[ASSUMPTION]** has not been confirmed by the owner. Analysts must treat it as unverified and must not derive "user demand" from it.

## 1. What the product is
A Turkish-language, **reading-first news site** for financial markets. Content is derived from YouTube finance channels: the tracker service ingests videos, generates LLM summaries, and the site presents them as stories, topic pages and expert (uzman) profiles, alongside live market data (döviz, altın, endeks, emtia, kripto).

Services: `liquid-economy/` (web, `dovizveri.com`), `finance-api/` (BFF, `api.dovizveri.com`), and an external `tracker-api` (separate repo `erenbesli44/tracker`; owns ingestion + summaries + Postgres). The iOS app is **out of scope** for this workflow.

## 2. Audience
- **[ASSUMPTION]** Turkish retail investors and followers of finance YouTubers who want the substance of long videos in a few minutes of reading.
- **[ASSUMPTION]** Mobile-heavy traffic (the UI has a dedicated bottom nav bar and mobile-first ordering was requested in commit history).
- No analytics export, survey, or interview data is available to agents. GA4 is wired (`liquid-economy/.env.production`, `src/lib/analytics.ts`) but agents have no access to its reports.

## 3. Goals (as decided by the owner on 2026-09-20)
1. The site's main value is readable news content: home leads with the newest video summaries; article pages show the **full** summary; `/konular` groups summaries by topic.
2. Market data (`/piyasa`) and experts (`/uzmanlar`) stay reachable but are secondary.
3. Best-in-class reading UX: strong editorial hierarchy, calm visual language, provenance next to every claim (channel, published/updated time, content type), progressive disclosure, explicit "load more", scroll restored on Back, WCAG AA contrast in light and dark, no layout shift.

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
| Tracked channels | 23 | `GET /api/v1/channels/` |
| Deployed web bundle date | 2026-09-20 (HEAD has a 2026-10-12 API fix not yet deployed) | `Last-Modified` of `assets/index-*.js` |
| Main JS bundle | 678 kB minified / 203 kB gzip | `npm run build` |
| Uptime monitoring | none | INFRASTRUCTURE.md §7 |

The tracker's ingestion is **not scheduled** (INFRASTRUCTURE.md §7 item 4): a news-first site currently shows three-month-old news. This is the single largest product risk and needs the owner (it lives in the tracker repo / Coolify).

## 6. Success metrics
Nothing is measured today. Candidate metrics, all **[ASSUMPTION]** until the owner confirms access or intent:
- Content freshness: age of the newest story (target: < 24 h on weekdays).
- Reading engagement: GA4 `page_view` on `/haberler/:id` and scroll/read-time events (would need new events).
- Performance: TTFB of `/api/v1/news/latest` (target < 1 s), Web Vitals LCP/CLS on home and article pages.
- Reliability: health-probe success rate; days of drift between `main` and production.

## 7. Constraints
- Single 2 vCPU / 4 GB Hetzner box runs everything; builds saturate it; deploy one service at a time.
- `finance-api` fans out to the tracker per channel on every `/news/latest` call (no cache) — see `finance-api/app/services/tracker_service.py`.
- Public GitHub repo: no secrets in code, docs or run records.
- Deploys are manual (Coolify API, owner's token). Agents never deploy.
- Frontend has no test runner; backend tests are not hermetic at baseline (see `docs/agent-runs/open-items.md` OI-001).

## 8. Non-goals / out of scope
- iOS app (`tracker-ios-app`).
- The superseded consensus-first dashboard in `.redesign/`.
- New paid data providers or paid monitoring without owner approval.

## 9. Decisions reserved for the owner
New product direction, breaking changes, schema/data migrations, production deployments, infra/secret changes, pushing branches or opening PRs, adding paid services.

## 10. Open questions for the owner
1. Who is the target reader, and is there any analytics/search-console data that can be exported for the analysts?
2. Is restoring scheduled YouTube ingestion (tracker repo) planned? Until then, product work on freshness is blocked.
3. Should the 2026-10-12 `/news/latest` paging fix be deployed? (Needs the Coolify token; see INFRASTRUCTURE.md §5.)
