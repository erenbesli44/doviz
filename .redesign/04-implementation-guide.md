# Döviz Veri Redesign — Phase 2 Implementation Guide

**Audience:** A fresh Claude session (or developer) picking this up with no prior context.
**Goal:** Ship the redesigned dovizveri frontend in `liquid-economy/`, mobile-first, opinion-first.
**Estimated scope:** 2–4 focused work sessions.

---

## 0. Read these first (in this order)

1. **`01-design-spec.md`** — IA, content model, tokens, component table, locked decisions (§10).
2. **`02-mockup.html`** — open in a browser. Click "Bugün / Piyasa / Uzmanlar / 📱 Mobil" in the top nav to see all four views. The mockup is the visual source of truth.
3. **`03-review-notes.md`** — WCAG/heuristic gaps and what was deferred.
4. This file (`04-implementation-guide.md`) — the build plan.

Don't re-research anything that's already in these files. The data model, endpoints, and component decisions are locked.

---

## 1. Product in one paragraph

dovizveri is a Turkish-language finance dashboard. Its differentiator is **what finance pros (YouTube analysts) currently think** about assets like Bitcoin, USD/TRY, BIST 100, NASDAQ, gold, oil — extracted automatically from their videos by the separate `tracker` service. The redesign promotes that consensus to the headline while keeping live prices, charts, and the SSE quote ticker fully visible as supporting context (it's "opinion-first, price-second", not "opinion-only").

Headline question for every page: **"5 saniyede ne anladım?"** ("What did I understand in 5 seconds?")

---

## 2. Architecture you're working with (don't change)

```
tracker (separate service, read-only for us)
  ↓ HTTP, X-API-Key
finance-api (Python/FastAPI, our backend)
  ├── /v1/quotes/*, /v1/market/*, /v1/stream/quotes  ← live price layer (own DB + providers)
  ├── /v1/news/*                                     ← proxies tracker /videos + summaries
  └── /v1/inference/*                                ← proxies tracker /inference
  ↓ HTTP
liquid-economy (React 19 + Vite + Tailwind v4, our frontend) ← REDESIGN THIS
```

**Do not modify tracker.** **Do not modify finance-api endpoints** (the data we need is already proxied). Add new services/hooks in liquid-economy only.

If you need a new data shape, add a *new* endpoint to finance-api — don't break existing ones.

---

## 3. What's locked (from Phase 1 decisions)

| Decision | Value | Source |
|---|---|---|
| Brand accent | `#1F3A8A` editorial navy | `01-design-spec.md` §6.1 |
| Confidence display | 1–3 dot scale (●●● / ●●○ / ●○○) | §10.1 |
| Pro avatars | `youtube_channel.channel_metadata.avatar` → initials fallback | §10, decision 2 |
| Build order | Mobile-first (320–767 → 768 → 1024) | §10.2 |
| Live data | Kept as right-rail context, never removed | §1, §9 |

Color tokens, type scale, spacing, ConsensusBar / DirectionBadge / ConfidenceDots specs: all in `01-design-spec.md` §6 and §10.1.

---

## 4. Routes — final shape

```
/                          Home  (was Markets) — consensus dashboard + live mini-prices
/piyasa                    Asset directory (filtered, replaces Currency/Gold/Indexes/Crypto/Commodities/Kapalicarsi/USMarkets pages)
/piyasa/:slug              Asset detail — consensus card + live price/chart rail + opinions
/uzmanlar                  Pros directory (NEW)
/uzmanlar/:slug            Pro profile (NEW)
/haberler                  News feed (keep mostly as-is, restyle to new tokens)
/haberler/:videoId         News detail (keep, restyle)
/ara                       Search results (NEW, mobile-first; desktop reuses header input)
/metodoloji /veri-kaynaklari /hakkimizda /iletisim /yasal-uyari /sozluk   (keep, restyle)
```

**Retire** (with redirects to `/piyasa?category=…`): `/doviz`, `/altin`, `/kapalicarsi`, `/endeksler`, `/amerika-borsasi`, `/emtialar`, `/kripto`. Also retire `/analiz` (merge into `/` and `/piyasa/:slug`).

---

## 5. Step-by-step build order

### Step 1 — Design tokens layer (½ session)

Create `liquid-economy/src/styles/tokens.css` with the full token block from `01-design-spec.md` §6 + §10.1. Wire it into `src/index.css` so Tailwind v4's `@theme` can reference the variables. Keep the existing Material color names alive only for components you haven't migrated yet — delete them as each component is replaced.

**Acceptance:** All new tokens accessible via `var(--bull)` etc. Lighthouse contrast pass.

### Step 2 — Core components (1 session)

Build, in order, in `liquid-economy/src/components/consensus/`:

1. `ConsensusBar.tsx` — props: `{bullish: number, neutral: number, bearish: number, size?: 'sm'|'md'|'lg'}`. Renders the 3-segment bar with descriptive `aria-label`. Reference mockup lines containing `class="cbar"`.
2. `DirectionBadge.tsx` — props: `{direction: 'up'|'down'|'sideways'|'mixed', label?: string}`. Pill with icon + Turkish word.
3. `ConfidenceDots.tsx` — props: `{confidence: number /* 0–1 */}`. Renders dots, computes band internally (`>= 0.75` high, `>= 0.5` med, `< 0.5` low), sets `aria-label` and `title` per §10.1.
4. `SentimentChip.tsx` — props: `{sentiment: 'bullish'|'bearish'|'neutral'}`.
5. `KeyLevelChip.tsx` — props: `{price: string|number, count?: number}`.
6. `ProAvatar.tsx` — props: `{personId?: string, channelId: string, name: string, size?: 'sm'|'md'|'lg'}`. Implements the fallback chain: try `person.avatar_url` → `channel_metadata.avatar` → gradient + initials. Always sets `alt`.

Storybook is overkill; render each component in a dev-only `/_/design-system` route so you can eyeball them.

**Acceptance:** Each component matches the equivalent block in `02-mockup.html`. All pass `eslint-plugin-jsx-a11y`.

### Step 3 — Data hooks (½ session)

Add to `liquid-economy/src/hooks/`:

- `useConsensusDashboard()` — fetches `/v1/inference/latest`, returns per-topic `{direction, confidence, summary, sourceCount, changedFromPrev}`. Cached 60 s.
- `useTopicOpinions(slug, days=7)` — calls `/v1/news` filtered by topic OR if needed adds a thin proxy endpoint on finance-api for tracker's `/topics/{slug}/opinions`. Returns opinions grouped by channel.
- `usePersonOverview(slug)` — proxy for tracker's `/persons/{id}/topics/overview`.
- `usePersonTimeline(personId, topicId)` — proxy for tracker's timeline endpoint.
- `useChangedStances()` — derives from `useConsensusDashboard()` where `changedFromPrev === true`.

Reuse existing `useSSEQuotes`, `useHistory`, `useMarketData`, `useLatestNews` as-is — they feed the live-data rails.

**If finance-api lacks a proxy** for `/topics/{slug}/opinions` or person endpoints, add one. Pattern: copy `app/services/inference_service.py` as a template.

### Step 4 — Page: Home (`/`)  (½–1 session)

Replace `src/pages/Markets.tsx` → `src/pages/Home.tsx`. Layout per mockup `view-home`:

- **Mobile baseline (320–767 px):** single column, hero card, then tile list, then "Bugün değişen görüşler" accordion, sticky bottom nav. No left rail.
- **Tablet (≥768 px):** add the "Hızlı görüş" left rail.
- **Desktop (≥1024 px):** 3-column grid `220px 1fr 280px` with the right "Bugün değişen" rail.

Each `AssetTile` shows: name, **current live price + delta** (from `useSSEQuotes`), `ConsensusBar`, `DirectionBadge` + `ConfidenceDots`, opinion count. Live data on the tile is essential — confirms the asset is fresh and gives users a familiar anchor.

**Acceptance:** 5-second squint test — green-dominant hero ConsensusBar visible above the fold on mobile.

### Step 5 — Page: Asset detail (`/piyasa/:slug`)  (1 session)

Replace `src/pages/SymbolDetail.tsx`. Layout per mockup `view-asset`:

- **Top:** asset name + live price (uses `useSSEQuotes`).
- **Two-column on desktop / stacked on mobile:**
  - Left/main: ConsensusCard → KeyLevelChips → grouped OpinionList (by channel) → 30-day consensus history chart.
  - Right rail: live price chart (`FocusChart` from existing components), 24h range, related pros list, provider attribution.

Reuse `FocusChart` and `Sparkline` from current components verbatim. Wrap them in new card chrome to match the new tokens.

**Acceptance:** Live price still updates via SSE while consensus card stays the visual hero.

### Step 6 — Pages: Asset directory (`/piyasa`)  (½ session)

Replace `src/pages/SymbolDirectory.tsx`. Filterable list of all 25 assets. Filter chips: All / Döviz / Altın / Endeks / Kripto / Emtia (these are the categories the retired pages used to cover). Each row shows live price + ConsensusBar + opinion count. URL: `/piyasa?kategori=kripto`.

Add 7 redirects in `App.tsx` from the retired routes to this page with the corresponding category query param.

### Step 7 — Pages: Uzmanlar (`/uzmanlar`, `/uzmanlar/:slug`)  (½ session)

New pages. Directory shows pros with their most-followed asset + recent stance. Profile shows the stance table from mockup `view-pro` (cards on mobile, table on desktop).

### Step 8 — Navigation refresh  (½ session)

Trim `TopNavBar.tsx` to 4 items + search. Rebuild `BottomNavBar.tsx` against the mobile mockup (Bugün / Piyasa / Uzmanlar / Haberler). Drop `TopAppBar.tsx` complexity in favor of a single thin mobile header (logo + search icon).

### Step 9 — Polish pass  (½ session)

- Empty states for every list (per spec §8).
- Loading skeletons matching final card shapes (no spinners on data-dense pages).
- Error banners with retry CTA on failed fetches.
- Run `axe-core` via vitest, fix any new violations.
- Lighthouse mobile + desktop, target 95+ Performance / 100 Accessibility / 100 Best Practices.
- Test all three breakpoints in Chrome DevTools device toolbar (iPhone 14, iPad mini, desktop 1280).

---

## 6. What you can delete after migration

Once Steps 4–7 ship and redirects are in place:

- `src/pages/Markets.tsx`, `Currency.tsx`, `Gold.tsx`, `Indexes.tsx`, `Crypto.tsx`, `Commodities.tsx`, `Kapalicarsi.tsx`, `USMarkets.tsx`, `Insights.tsx`
- `src/components/ui/AssetCard.tsx` (replaced by `AssetTile`), `InsightsCard.tsx`, `InsightStrip.tsx`, `NewsStrip.tsx` (kept-but-restyled `NewsCard.tsx`), `InferenceTopicCard.tsx`, `TickerBoard.tsx`, `MarketSummaryRow.tsx`
- Material color tokens from `src/index.css` once nothing references them
- Old `LiveDataBadge.tsx`, `CommodityCard.tsx`, `FAB.tsx` (drop floating action button — not needed in new nav)

**Keep:** `apiClient.ts`, `newsClient.ts`, `inferenceClient.ts`, `adapters.ts`, `useSSEQuotes`, `useHistory`, `useMarketData`, `analytics.ts`, `FocusChart.tsx`, `SparklineChart.tsx`, `PriceChange.tsx`, all SEO and content pages.

---

## 7. Acceptance criteria (Phase 2 done when…)

- All four mockup views are reproduced in React at all three breakpoints.
- Every page loads with live SSE quotes wired in.
- WCAG 2.2 AA: all colors verified (script in conversation history), axe-core green, keyboard-only navigable.
- Old category routes redirect cleanly; no dead links.
- Lighthouse mobile Performance ≥ 90, Accessibility = 100.
- Bundle size doesn't grow by more than 10 % over current.

---

## 8. Known unknowns / open tracker-side asks

1. **`person.avatar_url` field** — file a tracker ticket. Not blocking; frontend uses channel avatar as fallback today.
2. **`/topics/{slug}/opinions` proxy on finance-api** — may need to add. Pattern in `app/services/tracker_service.py`.
3. **Hero asset selection rule** — current spec assumes "most opinions today". Confirm with usage data after launch; might want "most-changed stance" instead.
4. **Görüş ayrışması badge** — when bullish ≈ bearish (e.g., NDX mockup), consider a "Görüşler bölünmüş" warning chip à la ground.news Blindspot. Subtle in current mockup; bump up if user testing says it's missed.

---

## 9. Where things live (quick map)

```
v1/
├── .redesign/
│   ├── 01-design-spec.md         ← IA, tokens, components
│   ├── 02-mockup.html            ← visual source of truth
│   ├── 03-review-notes.md        ← a11y + heuristic findings
│   └── 04-implementation-guide.md ← you are here
├── finance-api/
│   └── app/
│       ├── routers/              ← /v1/* endpoints
│       ├── services/             ← tracker_service.py, inference_service.py
│       └── symbols/registry.py   ← the 25 tracked instruments
└── liquid-economy/
    └── src/
        ├── pages/                ← REPLACE most of this
        ├── components/           ← BUILD new consensus/ folder; keep ui/{FocusChart,Sparkline,PriceChange}
        ├── hooks/                ← keep existing; add useConsensusDashboard etc.
        ├── lib/                  ← apiClient, newsClient, inferenceClient — KEEP
        ├── data/                 ← types — extend, don't replace
        └── styles/tokens.css     ← NEW
```

---

## 10. First commit checklist (so the new session has a clean start)

- [ ] Branch `redesign/phase-2-tokens`.
- [ ] Add `tokens.css`, wire into `index.css`.
- [ ] Build `ConsensusBar`, `DirectionBadge`, `ConfidenceDots` with a `/_/design-system` preview route.
- [ ] Open PR. Don't migrate any pages yet — get tokens + atoms reviewed first.

Good luck. The mockup is the contract; when in doubt, open `02-mockup.html` in a browser and compare.
