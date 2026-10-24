# X playbook — @dovizveri

Operating rules for the X account. Distilled 2026-10-24 from the owner's source list (Buffer
strategy + X growth guides, Kitces evergreen-content guide, Hootsuite financial services, Reuters
standards). Profile, formats and templates: `x-account-kit.md`, `launch-posts.md`.

## 1. Position
- **Who it is for**: Turkish retail readers who follow YouTube market commentators and want to know
  "kim ne bekliyor" for Dolar/TL, altın, BIST, Bitcoin, ABD borsaları, gümüş, petrol.
- **What we offer**: the commentators' *explicit* views, with source (video + minute), and how
  they changed. Curation + education, not our own calls. Every post ends in a site link.
- **What we never do**: give our own forecast or investment advice, post hype ("BOMBA", "ŞOK"),
  argue with commentators, post off-topic memes or politics.

## 2. Editorial standard (Reuters-style)
1. Every number is checked on the live site the same day (`/piyasa/<key>`). No number from memory.
2. Every view is attributed to a named person, with a link. We are responsible for what we post,
   whatever tool drafted it.
3. Count only `outlook_explicit = true` views with `outlook != none` — the same rule the site uses.
   Never use `sentiment` or `/v1/consensus` (legacy, disagrees with the site).
4. Suspicious rows (old prices in the quote, summaries labelled as quotes, duplicate names,
   channels listed as people) are left out and reported as data issues, not posted.
5. Mistakes: reply under the post with the correction within the day; don't silently delete.

## 3. Content mix (per week, starting hypothesis — adjust from data)
| Format | Share | Notes |
|---|---|---|
| Daily outlook card (one instrument) | ~40% | Card image + 1-line summary + view changes + UTM link |
| View change ("X görüşünü değiştirdi") | ~25% | Only real changes shown on the site |
| Weekly thread (Friday) | 1/week | All instruments, 1 card |
| Evergreen explainer | ~15% | "Görüşleri nasıl sayıyoruz?", "Açık beklenti ne demek?" — reusable library (Kitces) |
| News → which views it supports | ~20% | Only from reliable sources, linked |

### 3.1 Commentator posts carry the full view ("Görüşün tamamı") — from 2026-10-24
Every post about one person's view (view change, new view) shows the same full view the site shows
under "Görüşün tamamı" (`ViewDetails.tsx`), not only the one-sentence quote:
1. **Main post** (≤ 280): name + instrument + direction, the verbatim `outlook_quote` in quote marks
   (date), "▶ Videoda m:ss" link, site link. Unchanged.
2. **Reply under the main post (same thread)** — the full view:
   - Opens with `Görüşün tamamı (özet):` then `cleanSummary(summary)` — the opinion's `summary` with
     the leading "Konu:" prefix (≤ 40 chars before the first colon) removed. It is an AI summary, so
     **never put it in quote marks** and never call it a quote.
   - If `outlook_horizon` exists, end with `Vade: <horizon>.` Add up to 6 `key_levels` only when they
     are real price levels or dates (skip ages, durations like "1 ay", "%" without context).
   - Last line: `Videonun tüm özeti 👉 https://dovizveri.com/haberler/<video_id>?utm_source=x&utm_medium=social&utm_campaign=full_view`
   - Split at sentence ends into ≤ 280-char parts (1–3 replies). Never cut a sentence; if it would
     need more than 3 parts, drop the last sentences and keep the link.
3. **Card**: the right-hand panel shows "Görüşün tamamı" with the first sentences of the same summary
   (see `design/README.md`), so readers who only see the image still get the full view.
4. The summary text must equal the site's text that day. If `summary` is empty or about a different
   instrument, post no reply and say so in the run log.

Cadence: **1–3 posts per day**, never more than 4. A post's "Görüşün tamamı" replies count as part
of that post, not as extra posts. Quality over volume; skip a day rather than
post filler. Post times are a hypothesis (09:30 and 18:00 TR); re-check after 4 weeks of data.

## 4. Natural growth (no aggressive tactics)
Allowed, with daily limits:
- **Follow** ≤ 10 relevant accounts/day: tracked commentators, their channels, data sources
  (TCMB, TÜİK, BIST, AA Finans, Bloomberg HT, Reuters), economists. Never follow-for-follow,
  never mass-follow/unfollow.
- **Replies** ≤ 5/day under commentators' or finance news posts, only when we add a sourced fact
  ("Bu görüş sitedeki 6 yorumcudan 5'iyle aynı yönde: link"). No generic "Harika analiz!".
- **Quote posts** ≤ 1/day, only with added data.
- **Lists**: maintain public X Lists "Takip edilen yorumcular" and "Veri kaynakları".
- **Mentions**: may mention a commentator when their view changed; never tag people in bulk.
- **Hashtags**: ≤ 1 per post (#dolar, #altın, #borsa), only when topical.
- **Site loop**: link the X profile from dovizveri.com (footer) — needs owner/dev decision.

Forbidden: buying followers or engagement, follow/unfollow churn, DMs to strangers, automated
mass replies, engagement bait ("RT yap kazan"), giveaways, impersonation, posting identical text
repeatedly. These violate X rules and the brand.

## 5. Measurement (weekly, Friday)
| Metric | Source | Why |
|---|---|---|
| Followers (start 2026-10-24: 1) | profile | headline growth |
| Impressions, profile visits, engagement rate per post | X post analytics | which formats work |
| Link clicks to the site | GA4, `utm_source=x` | reach → site (the real goal) |
| Returning visitors from X | GA4 | real readers, not one-off clicks |
| Corrections needed | run log | quality guard |

Engagement alone is not success (a heated post can be wrong). Judge formats on clicks + returning
readers + zero corrections. Initial 4-week target (hypothesis, not a promise): 100 followers,
≥ 1 site visit per 100 impressions.

## 6. Approval model
- The **owner approves every public action** (post, reply, quote, follow batch, list change,
  profile change) in chat, per batch. A draft is never published without that approval.
- Drafts, metrics and the run log may be prepared without asking.
