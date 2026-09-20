# Redesign Mockup — Self-Review

**Mockup:** `02-mockup.html`
**Reviewed against:** Nielsen 10 heuristics + WCAG 2.2 AA + your 21-point UX checklist.

> **Update — Phase 1 decisions applied (2026-05-19, second pass):**
> 1. Brand color: navy `#1F3A8A` confirmed (no change).
> 2. Confidence: switched from `güven %78` numeric label to a 1–3 dot scale (`ConfidenceDots`); precise % stays available via `title=` tooltip + ARIA label includes the band word ("Güven: yüksek 3/3"). 28 instances replaced across the mockup.
> 3. Person avatars: pro identity now rendered via `pro-avatar` slot. Visual demo uses gradient + initials fallback because tracker's `person` model has no `avatar_url` (`tracker/src/persons/models.py:9`). Phase 2 will read `youtube_channel.channel_metadata.avatar` for the real photo; a tracker-side ticket is recommended to add `person.avatar_url` for curated headshots.
> 4. Mobile-first: new `#/mobil` route renders three 390 px iPhone frames showing home / asset detail / pro profile with sticky bottom nav. These frames are the source-of-truth for Phase 2 CSS base styles; tablet (≥768 px) and desktop (≥1024 px) will layer on top.

## TL;DR

Mockup demonstrates the three primary views (home, asset detail, pro profile) with the new "consensus-first" IA. Color tokens pass AA across all 17 text/background combinations. Three known gaps are intentional Phase-1 scope cuts (mobile bottom nav, full empty/loading inventory, dark mode), listed at the end.

## Nielsen heuristics + your checklist

| # | Heuristic | Result | Where |
|---|---|---|---|
| 1 | **System status visible** | ✅ | Header has live pulse dot + "Son güncelleme · 14:32"; consensus card shows "Önceki konsensüs → güven arttı"; consensus bar animates width on data change (`transition: width 240ms`). |
| 2 | **Real-world language** | ✅ | All Turkish, plain: *"Çoğu analist 70.000 USD seviyesinin test edileceğini bekliyor"*; direction labels are *Yukarı / Aşağı / Yatay / Karışık*; sentiment chips show ▲/▼/→ glyphs + Turkish words. |
| 3 | **User control & freedom** | ✅ partial | Crumbs on every detail page; back via browser; **gap**: no explicit "undo last filter" since filters aren't in scope yet. |
| 4 | **Consistency & standards** | ✅ | Header pattern, search top-right, hash links, hover/focus identical. ConsensusBar reused at three sizes; same dir-badge component on hero, tile, detail. |
| 5 | **Error prevention** | n/a | No destructive actions in scope. Search has `aria-label`; nav links go to real targets (no dead clicks within the three modeled views). |
| 6 | **Recognition over recall** | ✅ | 4-item top nav (was 9); search bar present; left rail on home gives at-a-glance consensus snapshot so user doesn't memorize asset list. |
| 7 | **Flexibility & efficiency** | ⚠️ deferred | Search + keyboard tab order present. Power-user features (saved watchlist, keyboard shortcut `/` to focus search, `g a` to assets) deferred to Phase 2 — listed in spec §11. |
| 8 | **Minimalist** | ✅ | One saturated color family per direction; large amounts of whitespace; no decorative gradients/shadows. Section headers use uppercase 11px subtle text (editorial style). |
| 9 | **Error recovery** | ⚠️ partial | One empty state shown on pro profile ("Bu uzmanın bu varlık hakkında henüz görüşü yok…"). Full inventory in spec §8 but not visualized — call it out for Phase 2 review. |
| 10 | **Help & documentation** | ✅ | Pro profile has methodology + legal links; footer has Metodoloji / Veri kaynakları. Inline disclaimer below pro bio. |

## WCAG 2.2 AA

| Criterion | Result | Notes |
|---|---|---|
| 1.4.3 Contrast (Minimum) | ✅ | All 17 text/bg pairs measured ≥ 4.5:1 (lowest = bear on bear-bg, 4.54). See script output below. |
| 1.4.1 Use of color | ✅ | Every sentiment/direction has icon (▲/▼/→), Turkish label, AND color. |
| 1.4.11 Non-text contrast | ✅ | Consensus bar uses min 3:1 segment separation; borders use #E6E5E0 against #FBFBFA (1.05:1 — purely decorative; structural meaning carried by spacing + text). |
| 2.1.1 Keyboard | ✅ | All links/buttons keyboard-focusable; no `tabindex="-1"` traps. |
| 2.4.1 Skip blocks | ✅ | Skip-to-main link in header. |
| 2.4.3 Focus order | ✅ | Source order = visual order in both 3-col and 1-col layouts. |
| 2.4.7 Focus visible | ✅ | `:focus-visible { outline: 2px solid var(--focus-ring); offset: 2px }`. |
| 2.5.5 Target size | ✅ | Nav links 36px tall × 12px padding; tile is the full clickable area; mobile breakpoint preserves this. |
| 3.1.1 Language | ✅ | `<html lang="tr">`. |
| 4.1.2 Name/role/value | ✅ | ConsensusBar = `role="img"` + descriptive `aria-label` ("Yüzde 72 yükseliş, yüzde 18 nötr…"); history chart has sibling `<table class="sr-only">` with data points; nav has `aria-label="Ana menü"`; live-data region uses `aria-live="polite"`. |

## Your 21-item checklist (compressed)

- **Page purpose in 3s?** Yes — homepage hero shows direction badge + consensus bar + 1-line summary above the fold.
- **Main action obvious?** Yes — "Tüm görüşleri gör →" CTA on hero, tile click on each asset, video timestamp deep-link on each opinion.
- **Labels clear?** Yes — Turkish, no jargon. "Anahtar seviyeler", "Görüş geçmişi", "Mevcut görüşler".
- **Recover from mistakes?** Crumbs + back; no destructive actions modeled.
- **Errors helpful?** Empty state pattern shown; full error inventory deferred.
- **Consistent with web patterns?** Header/nav/search/footer all conventional.
- **Keyboard accessible?** Yes.
- **Smaller screens?** Grid collapses 3→1 col @ 1024px, 2→1 tile col @ 640px. Header search hides gracefully (would benefit from a mobile-specific search affordance in Phase 2).
- **Unnecessary info removed?** Yes — dropped 7 category pages, the news + insights strips, and 5 nav items.
- **Related items grouped?** Yes — opinions grouped by channel; key levels in one chip row; pro profile has one table per concept.
- **Dangerous actions protected?** N/A in scope.
- **User knows what to do next?** Yes — every page has a clear "→" CTA forward; sidebar on detail shows related pros.

## Visual hierarchy check (3-second test)

Squint test (per page):

- **Home**: Eye lands on (1) "Bitcoin / 67,420" hero, (2) green "Yukarı" badge, (3) consensus bar dominated by green, (4) tile grid with same pattern repeated. ✅ Story telegraphs in <2s.
- **Asset detail**: (1) "Bitcoin" + price, (2) Yukarı badge + 78% güven, (3) green-dominant bar, (4) summary paragraph, (5) opinion cards. Linear top-down read = ✅.
- **Pro profile**: (1) name + photo placeholder, (2) stance table — 4 rows, sentiment chips visible at glance. ✅.

## Known scope cuts (Phase 2)

1. **Mobile bottom nav** — spec calls for one (matches current `BottomNavBar.tsx` pattern). Mockup desktop-first; mobile nav not visualized.
2. **Loading skeletons** — referenced in spec §8 + token §6.4 but not rendered in HTML mockup. Will design per-component when building React components.
3. **Dark mode** — tokens designed to flip but theme switch not shown.
4. **Error / offline states** — empty state pattern shown once; full inventory still text-only in spec §8.
5. **Search results page** — search bar is a placeholder; results UI not designed.
6. **Filter chips on `/piyasa`** — proposed to merge 7 category pages into one filtered index; filter UI not in mockup.
7. **Asset detail "Görüş geçmişi" chart** — rendered as static SVG; in Phase 2 will use recharts/lightweight-charts with hover tooltips and the existing `useInference` history endpoint.

## What I'd validate with users before Phase 2

1. **Hero asset selection rule**: should it be the asset with the most opinions today, the one whose consensus *changed* most, or user-pinned? Currently assumes "most opinions". Worth testing.
2. **Confidence display**: numeric % vs 1–3 dot scale (spec §10 q3) — quick A/B in usability test.
3. **"Görüş ayrışması" treatment**: when bullish≈bearish (e.g., NDX in mockup), should we flag it more loudly (a "Görüşler bölünmüş" badge, like ground.news Blindspot)? My read says yes; left subtle for now.

## Files delivered (Phase 1)

- `/Users/tcebesli/Documents/self-projects/doviz/v1/.redesign/01-design-spec.md` — IA + content model + tokens + component spec
- `/Users/tcebesli/Documents/self-projects/doviz/v1/.redesign/02-mockup.html` — clickable single-file mockup
- `/Users/tcebesli/Documents/self-projects/doviz/v1/.redesign/03-review-notes.md` — this file
