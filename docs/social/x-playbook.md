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
   With Premium+ (§3.2) a post may be **edited within 1 hour** (≤ 5 edits; original posts and quote
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
| Weekly Article (Friday) | 1/week | All instruments in one X Article (§3.2); replaces the weekly thread |
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

### 3.1a Long-post trial (Premium+, from the first approved long post, for two weeks)
Commentator posts alternate between two formats, post by post (A, B, A, B …), so morning and evening
slots get both. The run file names the format of every commentator post.
- **A — thread (current)**: main post ≤ 280 + 1–3 "Görüşün tamamı" replies, exactly as §3.1.
  Links: `utm_campaign=commentator` and `full_view`.
- **B — one long post**: the same content in a single post, in this order:
  1. The first 280 X characters are the complete main post of §3.1 (name, instrument, direction,
     quote, date, "▶ Videoda m:ss" link, site link), because the timeline shows only about that much
     before "Show more" and the post must work without expanding it.
  2. A blank line, then `Görüşün tamamı (özet):` and the same summary text as the A replies (never in
     quote marks), `Vade: …`, real `key_levels`, and the `Videonun tüm özeti 👉` link.
  Links: `utm_campaign=commentator_long` and `full_view_long`. Same card and alt text as A.
- Both formats: the summary text must equal the site's text that day (§3.1 rule 4).
- Decision at the second Friday review: compare A and B on median views, link clicks (GA4 sessions by
  campaign), key events, and corrections needed; keep the format that brings more site visits per
  post, or keep both if the difference is within noise. Record the result here.

Cadence: **1–3 posts per day**, never more than 4. A post's "Görüşün tamamı" replies count as part
of that post, not as extra posts. Quality over volume; skip a day rather than
post filler. Post times are a hypothesis (09:30 and 18:00 TR); re-check after 4 weeks of data.

## 3.2 Premium+ features (account on X Premium+; rules adopted 2026-10-27, tier corrected same day)
Limits come from X's help center as quoted by third-party pages (the help center itself was not
readable to the agent); re-check in the composer if something does not behave as written.
Premium+ adds to Premium: the largest reply boost, no ads, Radar (trend search, preview), higher Grok
limits and the fullest analytics. It adds **no new post format**: long posts, bold, edit and Articles
are the same as on Premium.
- **Long posts** up to 25,000 characters; anyone can read them, only Premium can write them. Used
  only by the §3.1a trial for now. Long posts cannot be scheduled (we post manually anyway).
- **Native bold**, header line only: the first line of a commentator post (e.g. **Erkan Öz · Bitcoin ·
  Düşüş bekliyor**) is set in bold with the composer's B button. No bold or italics anywhere else,
  and never Unicode "bold letters" (screen readers spell them out, search misses them). In run files
  the header is marked `**…**`; the Lead applies the formatting in the composer.
- **Edit within 1 hour**: rules in §2 item 5.
- **Weekly Article (Friday)** instead of the weekly thread: title `Bu hafta kim ne bekliyor — <dd Ay>`;
  one heading per instrument; under each, the counts of explicit views by direction as on the site,
  the week's view changes (person, old → new, date, link), and the week's posts embedded; closing
  line "Yatırım tavsiyesi değildir." and the site link with `utm_campaign=weekly_article`. Never
  subscriber-only. Articles are written on desktop x.com only; editing a published Article unpublishes
  it until it is republished, so check before publishing. Evergreen explainers (§3) may also be
  Articles; pin the best one to the profile.
- **Reply ranking boost (largest on Premium+)**: our replies rank higher, which makes the §4 rule
  "only sourced, value-adding replies" more important, not the limits looser. A boosted bad reply is
  seen by more people.
- **Undo post**: owner sets the undo window to 20–60 s (Settings → Premium; an account-settings change,
  owner decision). After pressing Post, check the toast/preview in that window; this is the cheapest
  guard against the duplicate-post failure of 2026-10-26. Reported missing on some Android/X Lite
  builds (June 2026) — check it is there on the device used for posting.
- **Analytics**: read account-level impressions, profile visits, link clicks and follower change from
  X analytics every Friday (§5); this closes the growth plan's "account analytics" MISSING DATA line.
- **Radar** (preview): read-only search for reply candidates and topics (commentator names,
  "dolar", "altın", "BIST" in Turkish). Results are leads, not facts: the §4 reply still needs a site
  link and our own data.
- **Checkmark**: changing the display name, @handle or profile photo can send the checkmark back to
  review and hide it for a while. Batch any such change with the owner, never mid-week before a
  planned post series. Bio and banner changes are not affected.
- **Grok**: never a source for a number, quote, summary or direction (§2). May be used only for
  wording ideas the Lead then checks against the site.
- Not used: long videos, ads revenue / creator subscriptions / subscriber-only posts (all public, no
  paywall), Grok-generated images, the ad-free setting (no effect on our posts).

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
| Account impressions, profile visits, follower change (week) | X account analytics (Premium+) | account trend |
| Link clicks to the site | GA4, `utm_source=x` | reach → site (the real goal) |
| Returning visitors from X | GA4 | real readers, not one-off clicks |
| Corrections needed | run log | quality guard |
| A vs B (long-post trial) | X post views + GA4 by `utm_campaign` | §3.1a decision |
| Weekly Article reads and clicks | Article analytics + GA4 `weekly_article` | keep or drop the format |

Engagement alone is not success (a heated post can be wrong). Judge formats on clicks + returning
readers + zero corrections. Initial 4-week target (hypothesis, not a promise): 100 followers,
≥ 1 site visit per 100 impressions.

## 6. Approval model
- The **owner approves every public action** (post, reply, quote, follow batch, list change,
  profile change) in chat, per batch. A draft is never published without that approval.
- Drafts, metrics and the run log may be prepared without asking.
