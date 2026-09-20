# Döviz Veri — Redesign Spec (Phase 1)

**Status:** Design proposal, pending review. Implementation deferred to Phase 2.
**Date:** 2026-05-19
**Author:** Eren

---

## 1. The one-line product positioning

> "Profesyoneller bu varlık hakkında ne düşünüyor? — 5 saniyede gör."
> *("What do the pros think about this asset? — see it in 5 seconds.")*

The current site treats live prices and pro-opinions as equal strips; the redesign promotes pro-opinion consensus to the headline and re-frames live data as supporting context that stays fully visible.

**Live data is kept, not removed.** Every asset tile still shows current price + 24h delta; asset detail still shows the lightweight-charts chart, SSE-fed price ticker, 24h range, and provider attribution — they just sit in a right rail beside the consensus card rather than above it. The product hierarchy is *opinion-first, price-second*, not *opinion-only*.

## 2. What we already have (data ground truth)

From `tracker` API (proxied by `finance-api`):

| Layer | Endpoint | What it gives us |
|---|---|---|
| **Per-video opinion** | `GET /topics/{slug}/opinions` | A pro's stance on one asset, in one video: `sentiment` (bullish/bearish/neutral), `confidence`, `summary`, `key_levels[]`, `start_time` (YouTube deep-link timestamp) |
| **Aggregated consensus** | `GET /inference/latest` | Today's snapshot per asset: `direction` (up/down/sideways/mixed), `confidence`, `summary`, source video weights, `changed_from_prev` |
| **Consensus history** | `GET /inference/topics/{key}/history?days=N` | Direction + confidence over time → a "stance history" chart |
| **Pro profile** | `GET /persons/{id}/topics/overview` + `/timeline` | One pro's current stance per topic + their full opinion timeline |

From `finance-api` natively: live quotes, sparklines, market overview, SSE quote stream. Useful as *context*, not the headline.

**The gap today:** The React app has `InferenceTopicCard`, `useInference`, etc., but they appear as one of several equal-weight strips on the homepage. The richest signal — *who* thinks *what* about *which asset* — is buried.

## 3. Information Architecture

```
/                          Bugünün piyasa görüşü  (consensus dashboard, was "Markets")
/piyasa/:slug              Varlık detayı          (asset deep-dive: consensus + opinions + sources + price)
/uzmanlar                  Uzmanlar               (NEW — pros directory)
/uzmanlar/:slug            Uzman profili          (NEW — one pro's stance per asset, timeline)
/haberler                  Haberler               (keep — video summaries feed)
/haberler/:videoId         Haber detayı           (keep)
/sozluk, /metodoloji, ...  Statik sayfalar        (keep)
```

**Removed from primary nav** (still reachable from `/piyasa`): the per-category index pages (`/doviz`, `/altin`, `/kripto`, …). They're filters on `/piyasa`, not destinations.

**Why this matters (Nielsen #6 — recognition over recall):** The current 9-item top nav forces users to remember which category their asset is in. New nav has 4 destinations + 1 search box.

## 4. Page specifications

### 4.1 `/` — Bugünün piyasa görüşü

**Goal:** In 3 seconds the user knows the consensus stance on the 5–10 assets they care about, and which views have *changed* today.

Layout (desktop, 3 columns):

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER  [ Logo | Search | Bugün · Piyasa · Uzmanlar · Haberler ]       │
├──────────────┬────────────────────────────────────────┬─────────────────┤
│  Sol kolon   │  Hero asset (en çok görüş alan)        │  Bugün değişen  │
│              │  ┌──────────────────────────────────┐  │  görüşler       │
│  Hızlı       │  │ BITCOIN                          │  │  ────────────   │
│  konsensüs   │  │ 67,420 USD  ▼ 1.2%               │  │  Altın: ↘ idi,  │
│              │  │                                  │  │  → şimdi yatay  │
│  • BTC ↑     │  │ ▲ Yukarı   güven %78             │  │                 │
│  • Altın →   │  │ ────█████░░░░░ 12 uzman          │  │  BIST 100: ↗    │
│  • USD/TRY ↓ │  │ %72 yükseliş · %18 nötr · %10 d.│  │  güven artıyor  │
│  • BIST ↑    │  │                                  │  │                 │
│  • NDX ↑     │  │ "Çoğu analist 70k'nın test       │  │  ...            │
│  ...         │  │ edilmesini bekliyor"             │  │                 │
│              │  │ → Detaylar                       │  │                 │
│              │  └──────────────────────────────────┘  │                 │
│              │                                        │                 │
│              │  Diğer varlıklar (grid 2 kolon)        │                 │
│              │  ─────────────  ─────────────          │                 │
│              │  USD/TRY ▼      Altın gr →             │                 │
│              │  ░░░░██████░    ████████░░░░           │                 │
│              │  9 uzman görüşü  7 uzman görüşü        │                 │
│              │                                        │                 │
│              │  ...                                   │                 │
└──────────────┴────────────────────────────────────────┴─────────────────┘
```

**Components used:** `ConsensusBar`, `DirectionBadge`, `AssetTile`, `ChangedStanceItem`, `QuickConsensusList`.

**Mobile:** Single column; sidebar items become collapsible accordions above the asset grid.

### 4.2 `/piyasa/:slug` — Varlık detayı (e.g., Bitcoin)

**Goal:** Show the consensus, then the evidence for it.

Sections (top→bottom):

1. **Asset header** — name, current price (small, with sparkline), category breadcrumb.
2. **Consensus card** (large) — `DirectionBadge` (Yukarı / Aşağı / Yatay / Karışık) + confidence %, 3-segment `ConsensusBar` (bullish/neutral/bearish), 1-line plain-language summary, "X uzman görüşü · son 7 gün" meta.
3. **Anahtar seviyeler** — chips from `key_levels[]` aggregated across recent opinions (e.g., 67,000 · 70,000 · 65,500). Hover → which pros mentioned each.
4. **Uzman görüşleri** — list of `OpinionCard` grouped by channel, sorted by recency. Each card: pro avatar, channel, sentiment chip, 2-line summary, key levels, video thumbnail + deep-link "Videoda 12:35'te bahsetti →".
5. **Görüş geçmişi** — line chart of consensus direction + confidence over last 30 days. (Recharts.)
6. **Fiyat & kaynaklar** — small chart + provider attribution. Demoted to bottom.

### 4.3 `/uzmanlar/:slug` — Uzman profili (NEW)

**Goal:** Know one pro's track record and current stances at a glance.

1. **Header** — name, channel, bio, link to YouTube channel.
2. **Mevcut görüşler** — table: asset · current stance (bull/bear/neutral) · confidence · last updated · "n video". Sortable.
3. **Zaman çizelgesi** — per-asset stance over time (sparkline of bull=+1/neutral=0/bear=-1), expandable to show video list with summaries.

## 5. Core component inventory

| Component | Variants | Purpose | Data binding |
|---|---|---|---|
| `ConsensusBar` | sm, md, lg | 3-segment horizontal bar showing bullish/neutral/bearish split | `{bullish: n, neutral: n, bearish: n}` |
| `DirectionBadge` | up / down / sideways / mixed | Icon + Turkish label + optional confidence | `direction`, `confidence` |
| `ConfidenceDots` | inline | 1–3 dot scale encoding confidence band (low/med/high) + exact % in `title` | `confidence: 0–1` |
| `ProAvatar` | sm/md/lg | `<img>` with channel-avatar fallback chain → initials | `personId`, `channelId` |
| `SentimentChip` | bullish / bearish / neutral | Small colored chip for a single opinion | `sentiment` |
| `AssetTile` | hero / standard / compact | Asset card on homepage grid | quote + inference topic |
| `OpinionCard` | default / dense | One pro's opinion on one asset | `topic_mention` row |
| `ChangedStanceItem` | up→down / new / confidence-up | Item in "Bugün değişen görüşler" rail | `changed_from_prev` |
| `SourceVideoRow` | — | Video thumbnail + title + timestamp deep-link | tracker `video` |
| `KeyLevelChip` | — | Price level chip (e.g., 67,000) | string |
| `Sparkline` | keep current | Small price chart | history endpoint |
| `EmptyState` | no-opinions / no-data | What is this page, why empty, what next | `{title, body, cta}` |
| `Skeleton` | tile / card / row | Loading placeholder matching final shape | — |

## 6. Design tokens

### 6.1 Color (semantic, WCAG AA on `--bg`)

```css
/* Backgrounds */
--bg:               #FBFBFA;  /* near-white, warm */
--surface:          #FFFFFF;
--surface-2:        #F4F4F2;
--border:           #E6E5E0;

/* Text */
--text:             #15171A;  /* contrast 16.8:1 on bg */
--text-muted:       #5B5F66;  /* 6.2:1 on bg */
--text-subtle:      #6B6F76;  /* 4.87:1 on bg, 4.58:1 on surface-2 — body min */

/* Sentiment (the only saturated colors on the page) */
--bull:             #15703D;  /* green, 6.15:1 on white, 5.39:1 on bull-bg */
--bull-bg:          #E4F4EA;
--bear:             #C0392B;  /* red, 5.44:1 on white, 4.54:1 on bear-bg */
--bear-bg:          #FBE6E2;
--neutral:          #4B5563;  /* 7.3:1 on bg, 6.51:1 on neutral-bg */
--neutral-bg:       #EDEEEF;

/* Accent (links, focus, brand thread) */
--accent:           #1F3A8A;  /* deep navy, 9.4:1 */
--focus-ring:       #1F3A8A;
```

Dark mode flips backgrounds + text only; sentiment greens/reds shift one stop lighter to stay AA on dark.

### 6.2 Type scale (system stack; Inter if loaded)

```
display    34/40   600   Hero asset name
h1         26/32   600   Page titles
h2         20/28   600   Section headers
body       16/24   400   Default
small      14/20   400   Meta, captions
micro      12/16   500   Chips, badges (uppercase off — readable)
```

### 6.3 Spacing & radius

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (8-pt with 4-pt half-steps).
Radius: `4` chip · `8` card · `12` hero card.
Shadow: avoid heavy shadows; rely on 1px `--border` + `--surface-2` for elevation. (Ground.news style.)

### 6.4 Motion

- Default transition: `120ms ease-out` for hover/focus.
- Consensus bar segments animate width on data update (`240ms`).
- Avoid decorative animation; reserve motion for state changes (Nielsen #1 — system status).

## 7. Accessibility checklist (WCAG 2.2 AA)

- All sentiment is conveyed with **icon + label + color** (never color alone).
- Consensus bar has `role="img"` with `aria-label="Yükseliş %72, nötr %18, düşüş %10"`.
- Min touch target 44×44 on mobile.
- Visible focus ring (`2px solid --focus-ring`, `2px offset`) on every interactive element.
- Tab order matches reading order; skip-to-content link in header.
- Charts have a sibling `<table>` (visually hidden) listing data points.
- Turkish lang on `<html lang="tr">` for screen reader pronunciation.

## 8. Empty / loading / error states

| State | Pattern |
|---|---|
| Asset has no opinions yet | "Bu varlık için henüz analiz yok. İlk analiz yayınlandığında burada görünecek." + link to news feed |
| Inference run failed | Card with timestamp of last successful run + retry CTA + low-key error message |
| Loading | Skeletons matching final layout (no spinners on data dense pages — Nielsen #1) |
| Network offline | Inline banner above content, retry button |

## 9. What we drop / merge from current app

| Current | Decision | Why |
|---|---|---|
| `Markets` page with NewsStrip + InsightStrip + asset table | **Replace** with consensus dashboard | Strips hide the headline finding |
| `Currency`, `Gold`, `Indexes`, `Crypto`, `Commodities`, `Kapalicarsi`, `USMarkets` pages | **Merge** into `/piyasa` with filter chips | 7 pages of the same template = cognitive load (Nielsen #8) |
| `SymbolDirectory` (`/piyasa`) | **Promote** to category index + filters | Becomes the only price-data page |
| `SymbolDetail` (`/piyasa/:slug`) | **Redesign** to lead with consensus, **keep** live price + chart as a co-equal right rail | Live SSE quotes and history charts are a strength of the current site and stay visible; they just no longer outrank the consensus card |
| `Insights` (`/analiz`) | **Remove**; merge into homepage + asset detail | Insights *are* the home page now |
| TopNavBar (9 items) | **Reduce to 4** + search | Hick's Law |
| Material color palette (`#004fdb` primary) | **Replace** with editorial neutral + semantic sentiment | Brand thread = navy accent; saturated color reserved for sentiment |

## 10. Decisions (locked 2026-05-19)

1. **Brand color**: ✅ Editorial navy `#1F3A8A` (rationale: reads "serious finance"). All tokens already use this; no change.
2. **Pro identity**: ✅ Show photos. Tracker confirmed: `person` table has no `avatar_url` (see `tracker/src/persons/models.py:9`), but `youtube_channel.channel_metadata` is a JSON blob that already includes the channel avatar (per the comment at `tracker/src/channels/models.py:24`). **Strategy**:
   - Phase 2 frontend: read channel avatar from `channel_metadata.avatar` and use as the pro's photo (most pros are 1:1 with their channel).
   - Fallback chain: `person.avatar_url` (future field) → channel avatar → initials chip.
   - **Tracker request (not blocking)**: add `avatar_url: Optional[str]` to `Person` model + a `PATCH /persons/{id}` payload field, so we can override channel avatar with a curated headshot per person. File a separate ticket; Phase 2 frontend works without this.
3. **Confidence display**: ✅ 1–3 dot scale. Spec below.
4. **Build order**: ✅ Mobile-first. CSS authored mobile-up; Phase 2 build starts at 375px breakpoint and layers desktop on top.

### 10.1 ConfidenceDots component spec

Visual: three small dots, left-to-right, filled state encodes confidence band.

| Band | Filled dots | Threshold | Meaning |
|---|---|---|---|
| Low | ● ○ ○ | < 50% | Few sources / spread sentiment / low model confidence |
| Medium | ● ● ○ | 50–74% | Moderate agreement |
| High | ● ● ● | ≥ 75% | Strong consensus |

Markup:

```html
<span class="conf-dots" role="img"
      aria-label="Güven: yüksek (3 üzerinden 3)"
      title="Güven %78">
  <span class="conf-dot conf-dot--on"></span>
  <span class="conf-dot conf-dot--on"></span>
  <span class="conf-dot conf-dot--on"></span>
</span>
```

Rules:
- `aria-label` always uses words ("Güven: düşük / orta / yüksek") plus the X/3 ratio, so screen-reader users hear the same band that sighted users see.
- `title` exposes the precise percentage on hover — preserves the "numeric is more honest" property without crowding the layout.
- Dot color = `--text` for filled, `--border` for empty. Avoids competing with sentiment colors.
- Filled dot is 6px, empty dot is 6px with `border: 1px solid var(--border)` outline. Total component width ~28px.
- Never appears alone — always paired with a direction or sentiment indicator so confidence is anchored to a stance.

### 10.2 Mobile-first build order (Phase 2)

Per `mobile-first` decision, CSS is authored bottom-up:

```css
/* Base (mobile, 320–767px) — single column, stack, full-width tiles, sticky bottom nav */
.home-grid { display: block; }
.tile { width: 100%; }

@media (min-width: 768px) {
  /* Tablet — 2-column tile grid, side rail emerges */
}

@media (min-width: 1024px) {
  /* Desktop — full 3-column dashboard with quick rail + center + changed rail */
  .home-grid { grid-template-columns: 220px 1fr 280px; }
}
```

Mobile-specific patterns (not in current `02-mockup.html` main views — see `#/mobil` preview):
- **Bottom nav** (4 items, 56px tall, `position: sticky; bottom: 0`) — mirrors `BottomNavBar.tsx` in current app.
- **Hero asset** collapses to a single full-bleed card; ConsensusBar grows to `height: 12px` for thumb-friendly scanning.
- **Opinion cards** stack: thumbnail moves above the body text, full width.
- **Stance-table** on pro profile becomes a card list; columns render as label/value rows.
- **Search** moves to a dedicated `/ara` route accessed by a header icon button (no inline search input on header).
- **Touch targets** ≥ 44 × 44px everywhere (already enforced via 12px padding × 14px line-height on nav links).

## 11. Next steps

- Phase 1 deliverable: this spec + `02-mockup.html` clickable prototype.
- Phase 2 (post-approval):
  1. Build design tokens layer in `liquid-economy/src/styles/tokens.css`.
  2. Build new components: `ConsensusBar`, `DirectionBadge`, `OpinionCard`, `ChangedStanceItem`, `AssetTile`.
  3. Replace `Markets.tsx` → new `Home.tsx`.
  4. Replace `SymbolDetail.tsx` with new asset detail.
  5. Add `Uzmanlar` routes + page.
  6. Reduce nav, retire category pages.
  7. Lighthouse + axe-core regression pass.
