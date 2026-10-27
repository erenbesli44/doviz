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
   With Premium (§3.2) a post may be **edited within 1 hour** (≤ 5 edits; original posts and quote
   posts only — X's help lists replies, threads and pinned posts as not editable, so a format-A main
   post with replies under it may not be editable either) for a typo, a broken or wrong link, or a wrong UTM tag. Never edit the
   person, instrument, direction, quote words, a number or a date: those get the correction reply,
   because edit history is public and a silent change of a view would mislead. Log every edit with its
   reason under "Executed" in the run file.

## 3. Content mix (per week, starting hypothesis — adjust from data)
| Format | Share | Notes |
|---|---|---|
| Daily outlook card (one instrument) | ~40% | Card image + 1-line summary + view changes + UTM link |
| View change ("X görüşünü değiştirdi") | ~25% | Only real changes shown on the site |
| Weekly roundup (Friday) | 1/week | One long post until 100 followers, then an X Article (§3.2); replaces the weekly thread |
| Evergreen explainer | ~15% | "Görüşleri nasıl sayıyoruz?", "Açık beklenti ne demek?" — reusable library (Kitces) |
| News → which views it supports | ~20% | Only from reliable sources, linked |

### 3.1 Commentator posts carry the full view ("Görüşün tamamı") — from 2026-10-24
Every post about one person's view (view change, new view) shows the same full view the site shows
under "Görüşün tamamı" (`ViewDetails.tsx`), not only the one-sentence quote:
1. **Main post** (≤ 280): name + instrument + direction, the speaker's sentence in quote marks — `outlook_quote_clean` (the
   verbatim `outlook_quote` with fillers, repeats and false starts removed, same words; from 2026-10-26),
   falling back to `outlook_quote` only when the clean field is empty — the same sentence the site shows
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
3. **Card** (v3.1 mobile-first, from 2026-10-27): commentator photo, name, instrument, big direction
   and, for a change, the previous view (see `design/README.md`). Quote and video minute are in the post
   text; the full view is only in the replies. Alt text carries the quote and the photo credit.
4. The summary text must equal the site's text that day. If `summary` is empty or about a different
   instrument, post no reply and say so in the run log.

### 3.1a Long post is the default (Premium; revised 2026-10-27)
**B is the default format** for commentator posts. The reason is operational, not metric: it is one
approval and one send instead of 2–4, so there is no half-posted thread and no duplicate (2026-10-26).
It can be edited within the hour, which replies cannot. Readers also see the full view without opening
a thread. Use A only when B fails (composer problem, preview missing, "Show more" cuts the header);
the run file names the format of every commentator post and the reason for any A.
Why not the A/B trial: at about 17 views per post and 1 follower, two weeks give some 10–20 posts and
0–2 link clicks per format. Any difference would be noise. Reopen A vs B only when the median is
≥ 100 views per post.
- **A — thread (current)**: main post ≤ 280 + 1–3 "Görüşün tamamı" replies, exactly as §3.1.
  Links: `utm_campaign=commentator` and `full_view`.
- **B — one long post**: the same content in a single post, in this order:
  1. The first 280 X characters, in at most 4 lines, are the complete main post of §3.1 (name,
     instrument, direction, quote, date, "▶ Videoda m:ss" link, site link). The timeline shows only
     about that much before "Show more", and fewer characters when there are many line breaks. The
     post must work without expanding it.
  2. A blank line, then `Görüşün tamamı (özet):` and the same summary text as the A replies (never in
     quote marks), `Vade: …`, real `key_levels`, and the `Videonun tüm özeti 👉` link.
  Links: `utm_campaign=commentator_long` and `full_view_long`. Same card and alt text as A.
- Both formats: the summary text must equal the site's text that day (§3.1 rule 4).
- Keep the separate UTM campaigns, so the comparison can be made later from GA4 without changing links.

Cadence: **1–3 posts per day**, never more than 4. A post's "Görüşün tamamı" replies count as part
of that post, not as extra posts. Quality over volume; skip a day rather than
post filler. Post times are a hypothesis (09:30 and 18:00 TR); re-check after 4 weeks of data.

## 3.2 X Premium features (tier checked 2026-10-27: **Premium, not Premium+**)
Tier evidence, from the Lead's logged-in read of x.com on 2026-10-27:
- The home timeline shows ads.
- The Premium hub offers "Go ad free → Upgrade my plan".
- It lists Radar, X Pro and "Request an inactive handle" under "Upgrade to unlock".

The owner can confirm under Settings → Premium → Manage subscription. Items marked ⁺ apply only if
the account is upgraded. **Do not upgrade now** (owner decision D13). Premium+ adds the largest reply
boost, Radar and no ads. None of these is worth the extra cost at 1 follower. Revisit at the 4-week
review, and only if replies turn out to be the main source of new followers.

What the account has, checked in the Premium hub: long posts up to 25,000 characters, HD/4K and
longer video, Articles (web only), desktop livestream (Media Studio), Analytics, Boost, Bookmark
Folders, reply boost, ID verification, profile customization and Grok. Edit and undo limits come from
third-party copies of X's help center, which the agent cannot read past its bot check. Re-check them
in the composer.

- **Long posts:** the default for commentator posts (§3.1a). Anyone can read them; only Premium
  accounts can write them. They cannot be scheduled, which does not matter because we post manually.
- **Native bold**, header line only: the first line of a commentator post (e.g. **Erkan Öz · Bitcoin ·
  Düşüş bekliyor**) is set in bold with the composer's B button. No bold or italics anywhere else,
  and never Unicode "bold letters" (screen readers spell them out, search misses them). In run files
  the header is marked `**…**`; the Lead applies the formatting in the composer.
- **Edit within 1 hour:** rules in §2 item 5. This is a second reason long posts are the default:
  replies cannot be edited.
- **Pinned post:** replace the pinned 6-post thread with one long post that carries the same text
  (owner decision D12). A profile visitor arriving from one of our replies then reads the whole
  introduction without opening a thread.
- **Articles:** they need a click-through to read and get little reach from a 1-follower account.
  - **Now:** at most one evergreen Article, "Görüşleri nasıl sayıyoruz?", linked from the pinned post.
  - **Friday "kim ne bekliyor" roundup:** until the account reaches 100 followers it is one long post,
    not an Article. From 100 followers, the roundup becomes the weekly Article:
    - Title: `Bu hafta kim ne bekliyor — <dd Ay>`.
    - One heading per instrument, with the counts of explicit views by direction as on the site and
      the week's view changes (person, old → new, date, link).
    - The week's posts embedded.
    - Closing: "Yatırım tavsiyesi değildir." and the site link with `utm_campaign=weekly_article`.
  - **Always:** never subscriber-only. Write Articles on desktop x.com only. Editing a published
    Article unpublishes it until it is republished, so check it before publishing.
  - **Counts** in the roundup or an Article follow the OI-020 gate like any count-based post.
- **Reply boost:** smaller than Premium+'s largest boost, but our replies still rank above
  unverified accounts' replies. Replies are the main growth lever at this size (growth plan §0a).
  The boost makes the §4 rule "only sourced, value-adding replies" more important; the daily limits
  stay the same. A boosted bad reply is seen by more people.
- **Undo post:** owner sets the undo window to 20–60 s (Settings → Premium; an account-settings change,
  owner decision). After pressing Post, check the toast/preview in that window; this is the cheapest
  guard against the duplicate-post failure of 2026-10-26. Reported missing on some Android/X Lite
  builds (June 2026) — check it is there on the device used for posting.
- **Analytics:** locked. The page says "Detailed engagement metrics become available once you reach
  50 followers". Until then, the Friday review reads per-post views from the posts themselves and
  site visits from GA4 `utm_source=x`. Account impressions stay MISSING DATA.
- **Radar⁺:** not available on Premium. Find reply candidates through X search and the commentator
  List instead.
- **Checkmark:** changing the display name, @handle or profile photo can send the checkmark back to
  review and hide it for a while. Batch any such change with the owner, never mid-week before a
  planned post series. Bio and banner changes are not affected.
- **Grok:** never a source for a number, quote, summary or direction (§2). Use it only for wording
  ideas, which the Lead then checks against the site.
- **Not used:**
  - **Boost (paid promotion):** a paid service, so it needs the owner's decision. It would also mix
    paid reach into the organic measurement.
  - Long videos and desktop livestream: we have no video assets.
  - Creator subscriptions and subscriber-only posts: everything stays public, with no paywall.
  - Grok-generated images.
  - ID verification: owner only. The agent never handles identity documents.

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
| Impressions, profile visits, link clicks, engagement rate per post | X post analytics | which formats work |
| Account impressions, profile visits, follower change (week) | X account analytics (locked until 50 followers) | account trend |
| Link clicks to the site | GA4, `utm_source=x` | reach → site (the real goal) |
| Returning visitors from X | GA4 | real readers, not one-off clicks |
| Corrections needed | run log | quality guard |
| A vs B (only once median ≥ 100 views) | X post views + GA4 by `utm_campaign` | §3.1a |
| Weekly roundup clicks | GA4 `weekly_article` | keep or drop the format |

Engagement alone is not success (a heated post can be wrong). Judge formats on clicks + returning
readers + zero corrections. Initial 4-week target (hypothesis, not a promise): 100 followers,
≥ 1 site visit per 100 impressions.

## 6. Approval model
- The **owner approves every public action** (post, reply, quote, follow batch, list change,
  profile change) in chat, per batch. A draft is never published without that approval.
- Drafts, metrics and the run log may be prepared without asking.
