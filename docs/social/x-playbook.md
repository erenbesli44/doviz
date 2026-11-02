# X playbook — @dovizveri

Operating rules for the X account. Distilled 2026-10-24 from the owner's source list (Buffer
strategy + X growth guides, Kitces evergreen-content guide, Hootsuite financial services, Reuters
standards). Profile, formats and templates: `x-account-kit.md`, `launch-posts.md`.

## 1. Position
- **Who it is for**: Turkish retail readers who follow YouTube market commentators and want to know
  "kim ne bekliyor" for Dolar/TL, altın, BIST, Bitcoin, ABD borsaları, gümüş, petrol.
- **What we offer**: the commentators' *explicit* views, with source (video + minute), and how
  they changed. Curation + education, not our own calls. Every commentator post carries two links: the
  video at the minute and the site (§3.3).
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
   (date), "▶ Videoda m:ss: <YouTube link with &t=Ns>" (owner, 2026-10-29: the minute link is back),
   and the site link `/piyasa/<key>` (§3.3).
2. **Reply under the main post (same thread)** — the full view:
   - Opens with `Görüşün tamamı (özet):` then `cleanSummary(summary)` — the opinion's `summary` with
     the leading "Konu:" prefix (≤ 40 chars before the first colon) removed. It is an AI summary, so
     **never put it in quote marks** and never call it a quote.
   - If `outlook_horizon` exists, end with `Vade: <horizon>.` Add up to 6 `key_levels` only when they
     are real price levels or dates (skip ages, durations like "1 ay", "%" without context).
   - No link in the replies (§3.3): the main post already carries the site link.
   - Split at sentence ends into ≤ 280-char parts (1–3 replies). Never cut a sentence; if it would
     need more than 3 parts, drop the last sentences.
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
  Link: one, in the main post, `utm_campaign=commentator`.
- **B — one long post**: the same content in a single post, in this order:
  1. The first 280 X characters, in at most 4 lines, are the complete main post of §3.1 (name,
     instrument, direction, quote, date, "▶ Videoda m:ss: <YouTube link>", site link). The timeline shows only
     about that much before "Show more", and fewer characters when there are many line breaks. The
     post must work without expanding it.
  2. A blank line, then `Görüşün tamamı (özet):` and the same summary text as the A replies (never in
     quote marks), `Vade: …` and real `key_levels`. No second link.
  Link: one, in the first part, `utm_campaign=commentator_long`. Same card and alt text as A.
- Both formats: the summary text must equal the site's text that day (§3.1 rule 4).
- Keep the separate UTM campaigns, so the comparison can be made later from GA4 without changing links.
  The `full_view` / `full_view_long` campaigns are retired with the one-link rule (2026-10-27).

Cadence: **1–3 posts per day**, never more than 4, and **at least 2 hours between our own posts**
(§3.3). A post's "Görüşün tamamı" replies count as part of that post, not as extra posts. Quality over volume; skip a day rather than
post filler. Post times are a hypothesis (09:30 and 18:00 TR); re-check after 4 weeks of data.

### 3.1b Thesis channels: post the video's main idea, not a direction (owner, 2026-10-28)
Some channels argue one big thesis per video instead of making calls on instruments. Today that means
**Erkan Öz**, **Yatırım 101** and **Barış Soydan** (owner, 2026-10-29: "barış soydan videolarında düşüş
 çıkış gibi düşünme, genel hangi konulara değindi özetini post et"). For these channels:
- No "Yükseliş / Düşüş / Yatay bekliyor" post per instrument, even when the tracker has an explicit row.
- One post per video, presenting the channel and the main idea it tries to explain.
  - Header: `<Kanal> · Videonun ana fikri`.
  - Then the site's `short_summary` (story `/api/v1/news/stories/<id>`) as an AI summary, never in quote
    marks, and the upload date.
  - Links: `▶ Video: <YouTube link>` (owner, 2026-10-29) and `/haberler/<id>` with `utm_campaign=main_idea`.
  - Long-post part: `Özet:` plus whole sentences from `long_summary`. Drop sentences with doubtful
    numbers and log them as data issues.
- Card: the v3.1 commentator card with the direction block replaced by **the main idea itself** in large
  accent text (e.g. "Sınırsız para basımı ve sınırlı varlıklar") and a small "dd Ay yayını" line. Do not
  write "Videonun ana fikri" on the card (owner, 2026-11-02). No arrow, no direction colour, no prediction
  words.
- These posts are not counted as views. The Yatırım 101 exclusion from counts (growth plan §0) stays.
- **Yatırım 101** (owner, 2026-11-02): "insight değil ama ana fikir ve özetini card olarak paylaşılabilir". Its videos are
  never views, but each one may get a main-idea post with the card above (no clip).
- **Excluded people** (owner, 2026-11-02): **Murat Muratoğlu**: no posts, no clips.
Why: one generic sentence ("altını, gümüşü, Bitcoin'i savunuyoruz") read as three separate "yükseliş"
calls (V4–V6, 28 Oct), which misstates what the video says.

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

## 3.3 Spam-risk rules (from 2026-10-27)
Why: X's platform-manipulation policy names duplicate links, bulk replies and repeated text as spam
signals, and its reply ranking looks at the author's past behaviour (`help.x.com`, platform
manipulation and "probable spam"). Our pattern on 24–27 Oct matched those signals: 2 links per post,
the same home-page preview under every summary reply, bursts of 4 posts in 45 minutes, and the same
fixed sentences. No restriction has been seen (Lead check 2026-10-27), so these are prevention rules.
1. **Links per post: the video minute and the site.** Owner decision 2026-10-29 ("yenileri video
   dakika linki ile gönder") reverses the 27 Oct one-link rule for commentator posts: the main post (or
   B's first part) carries "▶ Videoda m:ss: <youtube.com/watch?v=<id>&t=<s>s>" plus the site link
   `dovizveri.com/...` with UTM, and no other URL. Main-idea posts (§3.1b) carry "▶ Video: <YouTube link>" plus the
   `/haberler/<id>` link; explainers keep one site link. Watch the §3.3 rule 5 signals; two links per post was one of the 24–27 Oct spam patterns.
   Replies under our own post carry no link. A reply to someone else's post carries at most one site
   link, and the first replies to a new account carry none (§4).
2. **At least 2 hours between our own posts.** Measured from the previous post's send time. Our own
   "Görüşün tamamı" replies go out right under their post and do not count. Corrections go out as soon
   as they are ready. Replies to other accounts: at most 1 every 15 minutes.
3. **No repeated template sentences.** Within 7 days, no fixed sentence appears word for word in two
   posts or replies, other than the structural parts: the bold header line (`Ad · Enstrüman · Yön`),
   `Görüşün tamamı (özet):`, `Vade:` and "Yatırım tavsiyesi değildir." Opening lines, link lead-ins
   and corrections are written for each post. The run file lists the opening line of every post of
   the last 7 days, so repeats can be checked.
4. **D4 (per-page link previews) comes first among the dev items.** Every site link now shows the same
   generic home-page card, which reads as a duplicated link. Until D4 is live: attach our own card
   image to every post that has a site link, so X shows the image instead of the generic preview, and
   never post a site link without a card. This moves D4 ahead of the growth plan's week-4 review.
5. **Check after each week:** median views per post (falling below 15 for a week is a warning), and the
   owner checks from a personal account whether our replies appear or sit under "Show probable spam".

## 3.4 Video clips (owner decision 2026-11-01: own clips, with rules)
A commentator post may carry a short clip of the video moment it quotes, uploaded as native video.
Rights: YouTube's terms forbid downloading and redistributing content; our basis is the Turkish
quotation right (FSEK art. 35: a short, attributed excerpt, as much as the purpose justifies) and X's
copyright process (removal on a complaint, suspension for repeat complaints). The rules keep the
excerpt defensible; they do not make it safe.
1. **Length ≤ 30 s**, one clip per video, only the seconds in which the quoted sentence is said
   (the `outlook_quote` minute ± context). Never a montage, never the intro or the channel's branding.
2. **Caption bar on every clip** (`design/make_clip.sh`): name · channel · date · minute, the source
   URL `youtube.com/watch?v=<id>`, `dovizveri.com` and "Yatırım tavsiyesi değildir". The post text
   also names the person and the channel.
3. **Keep the audio and picture as published**: no re-cut, speed change, music, zoom or subtitle that
   alters the meaning. Burned-in Turkish captions of the speaker's own words are allowed.
4. **The clip replaces the card** on that post (one media item). **No card at all on a clip post**,
   not even in a reply (owner, 2026-11-02). The card is only the fallback when no clip can be made.
   The video minute text "▶ Videoda m:ss" stays too.
5. **Alt text / video description**: the quote and the caption line.
6. **Owner approves every clip** before upload, like every post. The Lead uploads it through the
   owner's Chrome (`design/README.md` step 4), ≤ 10 MB, 720p.
7. **Takedown rule**: on any request from the channel or person, or a copyright notice, delete the
   post the same day, log it in the run file, and stop clipping that channel. Do not argue.
8. **Start small**: at most 1 clip post per day for the first two weeks; compare views and site
   sessions against card posts at the Friday review before raising it.
9. **Never clip**: paid, members-only or unlisted videos, live streams, or anyone under "Known
   exclusions". Thesis channels (Erkan Öz, Barış Soydan) only with the main-idea sentence; Yatırım 101 gets a card, no clip.
Tools: `yt-dlp` and `ffmpeg` (Homebrew), `uv` for the caption; installed on the Lead's machine
2026-11-01. The script fails on clips over 30 s.

## 4. Natural growth (no aggressive tactics)
Allowed, with daily limits:
- **Follow** ≤ 10 relevant accounts/day: tracked commentators, their channels, data sources
  (TCMB, TÜİK, BIST, AA Finans, Bloomberg HT, Reuters), economists. Never follow-for-follow,
  never mass-follow/unfollow.
- **Replies** ≤ 5/day under commentators' or finance news posts, only when we add a sourced fact
  ("Bu görüş sitedeki 6 yorumcudan 5'iyle aynı yönde: link"). At most one link, none in the first
  replies to an account, ≥ 15 minutes apart (§3.3). No generic "Harika analiz!".
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
