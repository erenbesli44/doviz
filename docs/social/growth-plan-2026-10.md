# @dovizveri — account audit and first growth plan (2026-10)

Status: v2 (critic-reviewed), awaiting owner approval · Written 2026-10-24 (Sat) by `social-manager`;
reviewed the same day by `critic-reviewer` (Mode A). Where §0 and later sections differ, **§0 wins**.
Rules: `x-playbook.md` (limits, approval model), `x-account-kit.md`, `launch-posts.md`, `design/README.md`.
Account state below comes from the Lead's logged-in read of x.com/dovizveri on 2026-10-24
afternoon TR; site/API checks were GET-only on the same day.

## 0. Plan to apply (after critic review)

Verdict: the direction is right, but there was too much to do at once. Make it smaller, and post nothing based on counts until OI-020 is live.

The critic checked these claims with GET requests:
- **Verified:** the site has no X link, no `twitter:site` and no `sameAs`.
- **Verified:** production still serves the old build. Its bundle still says "son 12 ay", and the new bundle returns 404.
- **Verified:** links shared on X show the home page's preview.
- **Verified:** all 7 commentator handles.
- **Corrected:** euro has a *price* page (`/piyasa/euro-kuru-eur-try`) but no *views*.
- **Corrected:** @tuncsatiroglu was found through the "Kanal Finans" channel. The site counts that channel as a person, so he is not yet a tracked commentator.

**Issue ranking (revised):**
1. No distribution.
2. Post numbers and the site disagree until OI-020 is live. This is a trust and correctness problem, and it blocks every count-based post.
3. Tracker data quality: duplicate names, channels counted as people, stale quotes. This is the main threat to the "0 corrections" target. Example: the "Emrah Lafçı yatay → yükseliş" change in the 24 Oct post must be checked against the video, because "EMRAH LAFCI" also appears as a separate person.
4. Legacy-post wall.
5. Posts are too dense.
6. Site → X loop. It is cheap, but the site has about 9 users a week, so it is not urgent.

**Week 1 — top 5 actions, in order:**
1. **Owner/infra:** get OI-020 live. Until then, post nothing count-based, i.e. no outlook cards that say "{n} yorumcudan…".
2. **Owner:** apply D2 (bio + website link with UTM), confirm the Professional account and category, and answer the genuine reply on the pinned thread.
3. **Owner:** approve follow batch 1: the 6 tracked commentators, plus @tuncsatiroglu labelled as Kanal Finans's source, plus TCMB, TÜİK and Borsa İstanbul. Approve the 2 Lists. The commentator List holds only people the site attributes, not channels.
4. **Owner:** download the X archive, then delete only the hype and Unicode-bold posts visible at the top of the profile (≈30–50). Decide on the rest at the week-2 review.
5. **Us:** from Wed 29 Oct, 1 post a day: an evergreen explainer, or a view change checked against the video minute. Add up to 3 replies a day. Every card gets alt text and the line "Yatırım tavsiyesi değildir". Fri 31 Oct: first read of GA4 and post views.

**Moving up to 2 posts a day:** only after OI-020 is live *and* a full week has passed with 0 corrections. After that, the §2.3/§2.6 cadence applies, with outlook cards back in. "Yatırım 101" rows are excluded from all counts.

**Targets:** as in §2.1, plus alt text and the disclaimer on 100% of cards.

**Added risks:**
- **SPK sensitivity.** A line like "5'i yükseliş" can read as a signal. The disclaimer goes on every card image, as `product.md` §7 requires on pages.
- **Replies under commentators** can look like piling on. Use neutral wording and a link, and no direction words in the first replies.
- **Old handle @somebusiness01** is now free for anyone to register (impersonation risk). The owner may register it as a placeholder.

**Owner decisions (revised list):**
- **D1:** archive first, then delete only the visible hype posts; decide the rest at the week-2 review.
- **D2:** bio, website UTM, category. Optionally add "ABD borsaları" to the bio if it fits in 160 characters.
- **D3:** site → X loop. Low-priority open item, after OI-020.
- **D6:** weekends ≤ 1 post.
- **D7:** tag commentators — **deferred** until 2 weeks with 0 corrections, and each change checked against the video minute.
- **D8:** link-placement test in week 3 (changes the playbook wording).
- **D10:** one morning approval batch per day.
- **Removed:**
  - D11 is merged into OI-020.
  - D4 (nginx prerender, infra), D5 (Premium, paid) and D9 (X API, paid) move to the week-4 review. They are not asked now.

## 1. Audit

### 1.1 What is already good (keep)
- One clear promise, consistent everywhere: "Kim ne bekliyor?" on banner, bio, cards and site.
- Brand assets live and on-system (DV avatar, banner B, card tokens = site tokens).
- Bio carries the disclaimer ("Yatırım tavsiyesi değildir.") and names the method ("kaynağıyla").
- Pinned 6-tweet explainer thread exists; every new post has a UTM link.
- The Atilla Yeşilada post (view change + quote + video minute 1:41) is the best format we have:
  named person, old → new, verbatim evidence, exact source. This is what nobody else on Turkish X does.
- Editorial guard partly works: 5 data issues were caught and not posted on day 1. But the duplicate
  "Emrah Lafçı" / "EMRAH LAFCI" rows mean P1's Lafçı change still needs to be checked against the video (§0).

### 1.2 Issues, ranked by impact on growth
| # | Issue | Evidence | Impact | Fix (owner / dev / us) |
|---|---|---|---|---|
| 1 | **No distribution at all** | 0 following, 0 replies, 0 Lists, 1 follower. New posts get 8–17 views | A new account with no graph and no replies is shown to almost nobody; posting more will not fix this | Replies + follows + Lists (§2), owner approves batches |
| 2 | **Legacy-post wall contradicts the brand** | ~254 automated @somebusiness01 "Piyasa Takip" posts up to 2026-05-18 directly under today's 4; Unicode-bold names; titles like "3 VAKTE ALTIN ŞOKU", "Paniğin sebebi ne?" | Any profile visitor (the moment a follow decision happens) sees a hype bot after 4 posts; "Joined April 2026 · 263 posts · 1 follower" reads as abandoned automation. Violates playbook §1 no-hype | Owner decision D1 (export archive, then delete) |
| 3 | **Post numbers and the site disagree until OI-020 is live** | OI-020 (30-day window) is merged but production still serves the old build ("son 12 ay") per `open-items.md` 2026-10-24 | A reader who clicks "6 yorumcudan 5'i" lands on a page that counts differently → trust loss on the very first click | Deploy OI-020 (owner/infra). Until then: say "son 30 gün" in the text and avoid count-only hooks |
| 4 | **Site → X loop missing** | `SiteFooter.tsx` has no X link; no `twitter:site`; Organization JSON-LD has no `sameAs`; no share-to-X on instrument pages | Site visitors (≈9 active users / 7 days per GA, `product.md` §2) cannot find the account | Dev item D3 (small) |
| 5 | **Link previews on X are generic** | `curl https://dovizveri.com/piyasa/dolar-tl` returns the home `og:title` ("Piyasa Haberleri ve Uzman Özetleri"), no `og:image`, no description; per-page tags are set client-side (`SeoHead.tsx` `useEffect`), X's crawler does not run JS | Any link posted without our own image (replies, other people sharing us) shows a bare, off-message card | Dev item D4 (larger: prerender/static meta touches nginx → owner) |
| 6 | **Posts are dense** | P1 used 274/280 chars with 3 view changes + URL in one post | On a phone the hook ("5'i yükseliş") is buried; 3 changes in one line are hard to scan. One point per post reads better | Us: target ≤ 200 chars, 1 idea; extra changes go on the card or a 2nd post |
| 7 | **Bio/thread promise "euro" views that the site does not have** (a price page `/piyasa/euro-kuru-eur-try` exists, but it has no views) | Bio and thread 1/ say "dolar, euro, altın, BIST"; site keys are dolar-tl, altin, bist, bitcoin, us-markets, gumus, petrol-enerji; `launch-posts.md` Week 1 has an EUR/TRY day | Promise the reader cannot find; drafted EUR/TRY posts would have no page | Owner: new bio (D2). Us: drop EUR/TRY from the calendar |
| 8 | **Measurement is blind** | GA4 `utm_source=x`: MISSING DATA; account type/category not confirmed; account-level X analytics may require Premium (verify) | Cannot tell which format drives site visits — the real goal (playbook §5) | Owner reads GA4 on Fridays; per-post views copied into the run log |
| 9 | **Timing** | All 4 posts went out on a Saturday within a few hours | Weekend is a low-activity day for market content (hypothesis); posts compete with each other | Spread to 09:30 / 18:00 on weekdays |
| 10 | **No commentator mentions** | View-change post did not tag Atilla Yeşilada (per Lead read: no tags visible) | A neutral mention notifies the person and their audience may see it; playbook §4 allows it on view changes | Owner decision D7 |

Minor: confirm Professional account + category "Media & News" (kit §1) and Location "İstanbul, Türkiye"
— both unconfirmed (MISSING DATA). Verification badge: not needed for credibility at this stage (D5).
The 1 reply on the pinned thread should get an answer if it is genuine (owner to check).

### 1.3 Legacy posts — options
| Option | Pros | Cons |
|---|---|---|
| Keep | No work; history preserved | Hype wall under every new post; contradicts playbook §1; old posts' 24–33 views are the account's highest, so they also keep surfacing in search |
| "Bulk-hide" | — | Not an X feature for your own posts (to my knowledge; verify). Protecting the account hides *everything* — not an option |
| Delete (manual, owner) | Clean profile; brand matches content | **Permanent**. ~254 manual deletions (owner time). SEO value is low (X posts are weakly indexed; the site is our SEO asset), but any external links to those posts break |
| Delete via third-party tool | Fast | Needs account OAuth access to a third party and often payment → security + paid-service decision; not recommended |

Recommendation: owner downloads the X archive first (Settings → Your account → Download an archive),
then deletes manually in batches (e.g. 50/day over 5 days). Highest-priority to delete first: posts with
hype words or Unicode-bold names visible near the top of the profile.

## 2. First growth plan — 4 weeks (2026-10-27 → 2026-11-23)

Principle: distribution first (replies, follows, Lists), then volume. Every public action needs the
owner's approval per batch (playbook §6). Limits: posts 1–3/day (max 4), replies ≤ 5/day,
follows ≤ 10/day, quote posts ≤ 1/day, ≤ 1 hashtag, no own forecasts.

### 2.1 Targets
Playbook §5 target: 100 followers in 4 weeks, ≥ 1 site visit per 100 impressions.
Assessment: from 1 follower, 0 following and 8–17 views/post, 100 organic followers in 4 weeks
depends almost entirely on replies under larger accounts landing well. We have no benchmark for this
niche, so it is possible but not likely. Proposed adjusted targets — **hypotheses, not promises**:

| Metric | By 2026-11-23 | Source |
|---|---|---|
| Followers | 30 (stretch: 100) | profile |
| Median views per original post (last 7 days) | ≥ 50 | per-post views |
| Replies posted, each with a sourced fact + link | ≥ 15/week from week 2 | run log |
| Site sessions from X | ≥ 1 per 100 impressions (keep playbook target) | GA4 `utm_source=x` |
| Returning visitors from X | ≥ 1/week by week 4 | GA4 |
| Corrections needed | 0 | run log |

### 2.2 Week 0 — this weekend (2026-10-24 → 10-26), quick fixes
- [ ] Owner: decide D1 (legacy posts); if delete, download archive today, start batches.
- [ ] Owner: update bio (D2) — proposed, 153 chars:
      `Piyasa beklentileri, kaynağıyla. Hangi yorumcu ne bekliyor, görüşü nasıl değişti: dolar, altın, BIST, Bitcoin, gümüş, petrol. Yatırım tavsiyesi değildir.`
- [ ] Owner: Website field → `https://dovizveri.com/?utm_source=x&utm_medium=social&utm_campaign=profile`
      (separates profile clicks from post clicks in GA4).
- [ ] Owner: confirm Professional account, category, Location (kit §1–2).
- [ ] Owner: answer the 1 reply on the pinned thread if genuine.
- [ ] Owner/infra: get OI-020 live (blocks count-based posts matching the site — issue #3).
- [ ] Owner: approve follow batch 1 (§2.4) and the two Lists (§2.5).
- [ ] Us: `designer` brief for the weekly card and the view-change card (both "to design" in `design/README.md`).
- [ ] No more posts this weekend (4 already today).

### 2.3 Weekly plan
| Week | Goal | Posts | Replies / follows / Lists | Owner actions | Checkpoint (Friday) |
|---|---|---|---|---|---|
| 1 · 27 Oct–2 Nov | Foundation: clean profile, get into the graph | 2/day weekdays (outlook card 09:30 + view change or explainer 18:00); Fri weekly thread; 29 Oct holiday 1 post; weekend 0–1 | Follow batch 1 (10) Mon, batch 2 (≤ 8) Thu; create 2 Lists Mon; replies 2–3/day from Tue | Approve daily batch each morning; legacy deletion; D3 dev item go/no-go | Fri 31 Oct: followers, views per post, first GA4 read, replies posted |
| 2 · 3–9 Nov | Reply engine: be useful under commentators' posts | 2/day; 1 news → views post on the TÜİK inflation day (date to verify); 2 evergreen explainers into the library | Replies up to 5/day weekdays; follows ≤ 10 new, only relevant (no follow-backs chasing); mention the person on each view-change post (if D7 yes) | Approve batches; read GA4 Fri | Fri 7 Nov: which format got most views + GA sessions; corrections = 0? |
| 3 · 10–16 Nov | Double down on the best format; test link placement | 2–3/day weighted to week 2's best format; ≤ 1 quote post/day with added data | Replies 5/day; Lists updated with any new tracked commentators | Approve link-placement test (D8) | Fri 14 Nov: test result direction (views and GA sessions, body-link vs reply-link) |
| 4 · 17–23 Nov | Review and set month-2 plan | 2/day | Replies 5/day; follows only for new tracked people/sources | Read 4-week GA4; decide D5 (Premium) and D9 (API) with data | Fri 21 Nov: 4-week review vs §2.1; times re-check (09:30/18:00 hypothesis) |

Skip rule (playbook §3): no real view change → no view-change post; < 3 explicit views in the 30-day
window → no outlook card for that instrument.

### 2.4 First follow list (batch 1, ≤ 10)
Handles verified 2026-10-24 as linked from the person's own YouTube channel "about" links
(commentators) or the institution's own website (sources). Owner confirms each account is active
before following.

| # | Handle | Category | Reason |
|---|---|---|---|
| 1 | @AtillaYesilada1 | tracked commentator | Linked from his channel; views on dolar-tl, altin, bist, us-markets, petrol in window |
| 2 | @_selcukgecer | tracked commentator | Linked from channel "Selçuk Geçer"; dolar-tl, altin, bist, petrol |
| 3 | @islammemiss | tracked commentator | Linked from channel "İSLAM MEMİŞ"; 6 instruments in window |
| 4 | @emrahlafcu | tracked commentator | Linked from channel "EMRAH LAFCI"; 5 instruments in window |
| 5 | @MuratMuratoglux | tracked commentator | Linked from channel "Murat Muratoğlu"; dolar-tl |
| 6 | @_ErkanOz | tracked commentator | Linked from channel "Erkan Öz"; altin, bist, bitcoin, us-markets, petrol |
| 7 | @tuncsatiroglu | channel source (not yet attributed) | Linked from channel "Kanal Finans", which the site still counts as a person (data issue); keep him out of the commentator List until attributed |
| 8 | @Merkez_Bankasi | primary data source | Linked from tcmb.gov.tr (rates, kur data) |
| 9 | @tuikbilgi | primary data source | Linked from tuik.gov.tr (inflation) |
| 10 | @borsaistanbul | primary data source | Linked from borsaistanbul.com |

Batch 2 (week 1 Thu, ≤ 8): @laplace2011 (linked from "Devrim Akyıl" channel; handle differs from
name — confirm it is his), @cevikfinance (Cuma Cevik channel), @Yatirim101 (channel), @ekonomidesaadet
(linked from Kanal Finans), @spkgovtr (spk.gov.tr), @BloombergHt (bloomberght.com),
Barış Soydan — **handle to verify** (no X link on his channel), AA Finans — **handle to verify**.

### 2.5 Public Lists (create Mon 27 Oct)
1. **"Takip edilen yorumcular"** — description: `dovizveri.com'da görüşlerini kaynağıyla derlediğimiz yorumcular.`
   Members: verified commentator handles above (7 + batch-2 commentators once confirmed).
2. **"Veri kaynakları"** — description: `Resmi veri ve piyasa kaynakları: TCMB, TÜİK, Borsa İstanbul, SPK.`
   Members: @Merkez_Bankasi, @tuikbilgi, @borsaistanbul, @spkgovtr, @BloombergHt (+ AA Finans when verified).

### 2.6 Week 1 content calendar (TR time; every number re-checked on `/piyasa/<key>` that morning)
Pre-check on 2026-10-24 (API, 30-day rule, before exclusions — not for posting): dolar-tl 7 people,
altin 9, bist 7, us-markets 6, petrol-enerji 6, gumus 4, bitcoin 3 (one row from 6 Oct, drops out ~5 Nov).
Rows cluster 20–23 Oct, so freshness depends on tracker ingestion continuing.

| Day | 09:30 | 18:00 | Campaign |
|---|---|---|---|
| Mon 27 | Outlook card — Dolar/TL (new angle vs 24 Oct: only what changed since) | Evergreen: "Görüşleri nasıl sayıyoruz?" (explicit only, 30 days, newest per person) | daily_outlook / explainer |
| Tue 28 | Outlook card — BIST 100 (last shown as a single view change on 24 Oct) | View change (any instrument, only if real); else skip | daily_outlook / view_change |
| Wed 29 | Cumhuriyet Bayramı — 1 post 12:00: outlook card Petrol/enerji | — | daily_outlook |
| Thu 30 | Outlook card — ABD borsaları | News → which views it supports (reliable source, linked) | daily_outlook / news_views |
| Fri 31 | Outlook card — Gümüş (only if ≥ 3 views after exclusions) | 17:00 weekly thread + weekly card | daily_outlook / weekly |
| Sat 1 | Optional: Bitcoin only if ≥ 3 views in window that day; else nothing | — | daily_outlook |
| Sun 2 | Nothing (or evergreen if D6 allows) | — | explainer |

Altın is deliberately not in week 1's first half: it was posted on 24 Oct (no repeat within 7 days
unless a new angle such as a fresh view change). Market hours around 28–29 Oct: verify the BIST
holiday calendar before any "today" wording.

Post style for week 1 (example shape, numbers to be filled from the site):
`BIST 100 için son 30 günün açık görüşleri: {n} yorumcudan {a}'i düşüş, {b}'si yükseliş bekliyor. Kim ne dedi, hangi dakikada: <link>`
— ≤ 200 chars, number first, one idea, card carries the names, no emoji needed.

## 3. Owner decisions needed
1. **D1 Legacy posts** — Recommend: download archive, then delete manually in batches (permanent;
   owner-only). Alternative if you want history: keep, accept the brand cost.
2. **D2 Bio + website UTM + Location/category** — Recommend: apply the 153-char bio (drops "euro",
   which has no page), website with `utm_campaign=profile`.
3. **D3 Site → X loop (dev item, small)** — Recommend yes: footer X link, `twitter:site=@dovizveri`,
   `sameAs` in Organization JSON-LD, optional share-to-X on `/piyasa/*`. Open as one OI.
4. **D4 Per-page link previews (dev, larger, touches nginx/prerender → infra)** — Recommend after OI-020
   is live; until then always attach our own card image to posts.
5. **D5 X Premium / verification (paid)** — **Decided 2026-10-27 by the owner: account is on Premium+.**
   Usage rules in `x-playbook.md` §3.2.
6. **D6 Weekend cadence** — Recommend ≤ 1 post/day Sat–Sun, only Bitcoin or evergreen; no replies duty.
7. **D7 Mention the commentator on view-change posts** — Recommend yes, one person per post, neutral
   wording ("görüşünü güncelledi"), quote + minute; never on count posts.
8. **D8 Link-placement test (week 3)** — X is widely reported to reduce reach for posts with external
   links (unverified). Recommend: half the posts with the link in the first reply instead of the body,
   compare views and GA sessions. Needs a playbook wording change ("every post ends in a site link").
9. **D9 X API automation (paid)** — Recommend later (after the 4-week review); manual + approval for now.
10. **D10 Approval rhythm** — Recommend one morning batch per day (posts + replies + follows) to keep
    owner time low; the playbook's per-batch approval stays unchanged.
11. **D11 OI-020 deploy** — Needed before count-based posts can match the site exactly.

## 4. Risks and what we will not do
- Risks: a wrong number amplified by replies (guard: same-day site check, correction reply within the day);
  commentators reading mentions as criticism (guard: neutral wording, no scores, quote + minute);
  site/post count mismatch until OI-020 is live; legacy deletion is irreversible; growth may be slow —
  we report it honestly rather than add volume.
- We will not: buy followers/engagement, follow/unfollow churn, follow-for-follow, mass or automated
  replies, DMs to strangers, giveaways or "RT yap" bait, hype words, > 1 hashtag, our own forecasts or
  investment advice, repeat a text or angle within 7 days, argue with commentators.

## 5. MISSING DATA
- ~~MISSING DATA: GA4 sessions/users with `utm_source=x` since 2026-10-24~~ **Closed 2026-10-25.** GA4 over 7 days shows 13 sessions from X (11 from `x / social`, 2 from `t.co / referral`). Logged in `runs/2026-10-24.md`.
  - Still open: there is no internal-traffic filter, and no key event is defined.
- MISSING DATA: X account type (Professional?) and category; Location field.
- MISSING DATA: per-post profile visits and link clicks on X (only views were read). Account analytics: available with Premium+ from 2026-10-27; first read at the Friday review.
- MISSING DATA: X handles for Barış Soydan and AA Finans (not linked from their own pages).
- MISSING DATA: rendered `/piyasa/<key>` counts for week 1 (API pre-check only; production still on the pre-OI-020 build).
- MISSING DATA: market calendar for weeks 1–2 — BIST hours 28–29 Oct, TÜİK CPI release date, TCMB PPK date, FOMC date (verify on official calendars before any dated post).

Data issues seen in this run (for the owner / tracker):
- "Yatırım 101" (channel name) counted as a person on altin and bist (23 Oct rows) — exclude until attributed.
- Bitcoin has only 3 people in the window, one dated 6 Oct → below 3 after ~5 Nov.
- Altın: API rule now gives 9 people incl. two 23 Oct rows posted after this morning's 2/2/2 card — not
  an error in that post, but the next altın post must use the fresh count.
