# Review: "Kim ne bekliyor?" — influencer-view-per-instrument as the main theme

Date: 2026-10-22 · Author: Claude (Lead session) at the owner's request · Status: **decided 2026-10-22 — adopted as the main direction with the news layer as evidence (`docs/product.md` §3); Phase 1 tracked as OI-017**

## 0. The proposal (as stated by the owner)

Make the main theme of dovizveri.com: for each financial item (dolar, BIST 100, altın, stock indexes, …),
show what each YouTube commentator **explicitly** expects (yükseliş / düşüş / net görüş yok), in very plain
form, and put their **previous** stance next to the current one so a reader can judge how consistent the
person is. If a commentator only talks in generalities about an item, they do not appear in that item's
insight section at all.

## 1. Verdict in short

- **The job-to-be-done is real and locally unserved.** No Turkish product tracks what named YouTube
  commentators expect per instrument over time (search 2026-10-22: Ustads lets *users* post predictions with
  a success score; Borsa Tahmin AI, Investing, TradingView, Foreks do not track commentators). Worldwide the
  closest products are TipRanks, FinfluencerTracker and the (defunct) CXO Advisory Guru Grades.
- **"Explicit views only" is the right rule.** CXO excluded forecasts "too vague to grade"; it is also the
  main defence against mis-attributing a stance to a named person.
- **It is a pivot, not a feature.** `docs/product.md` (2026-09-20) says experts are secondary (§3.2) and the
  consensus-first dashboard is out of scope (§8). A new product direction is an owner decision (§9). This
  document does not make that decision.
- **The current pipeline cannot deliver it.** Today's extraction matches topics *broadly*, collapses
  "cautious/mixed/neutral" into one value, keeps only the first segment's stance per topic, discards the
  evidence quote, stores no horizon, no instrument, no statement price, and `published_at` is null for the
  stories sampled. Shipping the theme on this data would show wrong stances under real names.
- **"Consistency" must be split into three things** (stance change, accuracy, acknowledged change) and only
  the first is safe to show at launch. Accuracy needs resolution rules, minimum sample sizes and a baseline
  (the dollar "always rises" in TL terms), otherwise everyone looks 70 % right.
- **Legal exposure is specific**: attributing graded forecasts to named people in Turkey (kişilik hakları,
  SPK context). Verbatim quote + timestamp + neutral wording + a correction channel are the minimum.

Recommendation: adopt the theme as the **instrument-page hero on top of the news layer**, in three phases
(schema + prompt first, UI second, scoring last), and get a legal read before any accuracy number is shown.

## 2. What comparable products do

| Product | Who is tracked | Unit of record | Score shown | History / consistency | Lesson for dovizveri |
|---|---|---|---|---|---|
| **TipRanks** (US) | sell-side analysts, bloggers, hedge funds, insiders | one rating per stock (Buy/Sell/Hold) | success rate + average return over 1 year; Hold closes the position; Z-test for small samples; star rank, "top" = top 20–30 % | full list of past ratings per expert | model a call as an *open position* that closes on reversal or neutral; show no rank below a minimum sample |
| **CXO Advisory Guru Grades** (2005–2012) | 68 US market gurus, 6 582 public forecasts | directional forecast on S&P 500, graded from publication close | per-guru accuracy 20–72 %, average 47 %; aggregate judged reliable, individual grades not | per-guru forecast list | excluded vague forecasts (same rule as this proposal); expect gurus to dispute grades; individual accuracy is noisy |
| **FinfluencerTracker** (live) | YouTube and X finance creators | positive/negative view on a stock; enters next US trading day; expires after ~3 months | **simulated returns** (long-only, long-short), not hit rate; ranking by return | full call history (paid) | mechanical entry/expiry rules solve "no horizon stated"; they chose returns over accuracy; heavy "educational, not the creator's real record" disclaimer |
| **Finfluencer Detector** (open-source sheet) | any finfluencer | one row per call: ticker, direction, date, target | win = ≥ +10 % or target hit; ≥ 60 % "LEGIT", < 45 % "LARP" | per-person log | thresholds are arbitrary; pejorative labels are a legal risk in Turkey |
| **Seeking Alpha** | contributing authors | article rating Strong Buy…Strong Sell | author performance (Premium) | per-author | five-point scale; performance is a paid feature |
| **StockTwits** | users (self-tag) | Bullish / Bearish tag per cashtag, optional | aggregate sentiment | — | far more users ever post bullish than bearish; expect the same skew on Turkish YouTube |
| **Good Judgment Open / Metaculus** | forecasters | probability on a resolvable question | Brier, **relative Brier vs crowd median**; scored only after resolution | per-forecaster track record | judge a person *relative to the consensus*, not in absolute terms; nothing is scored before resolution |
| **Polymarket** | markets | yes/no with written resolution clause | — | — | resolution disputes come from loose wording (source, time window, edge cases); write the rule before the call is made |
| **TCMB Piyasa Katılımcıları Anketi**, AA Finans anketi | institutional economists | year-end and 12-month USD/TRY, inflation, rate | monthly point estimates | monthly series | Turkish readers already understand "yıl sonu dolar beklentisi"; use it as the institutional reference line |
| **Ustads** (TR app) | app users | prediction with success score | per-user score | — | nearest local concept; not about commentators |

Research context: a CNBC/Benzinga study found 64 % of 87 TikTok finfluencer calls correct (2023 – mid-2024),
with the explicit caveat that the market rose over the period. One econ paper reports that the *frequency*
of finfluencer recommendations on YouTube predicts returns. Neither supports grading individuals from a small
sample.

## 3. Critique of the proposal

### 3.1 What is right about it
- Clear reader question ("X dolar için ne diyor, geçen ay ne demişti?"), unserved in Turkey.
- Explicit-only is both the product promise and the safety mechanism.
- It reuses what exists: segment-level stance/evidence/key_levels extraction (tracker), consensus and
  per-channel timelines (finance-api), `/uzmanlar/:slug` profiles with a "Geçmiş" panel and `OpinionCard`
  with a `&t=` deep link (liquid-economy).

### 3.2 Problems, ranked

**A. Direction conflict (owner decision).** product.md §3.2 and §8 put experts second and consensus
dashboards out of scope. The proposal makes "who expects what" the main theme. Both can coexist if the
instrument page is the entry and the story is the *evidence*: every call links to a video moment. But that is
a rewrite of §1–§3, and §9 reserves it for the owner.

**B. The data cannot carry the promise today** (verified in the tracker and finance-api code):
- Prompt rule 1 is "MATCH BROADLY" (`src/llm/prompts.py:71`); nothing restricts output to explicit views.
- `confidence` measures depth of discussion (`prompts.py:161`), not how explicit the view is.
- `cautious`, `neutral` and `mixed` all become `neutral` (`src/ingestion/service.py:133-139`); "no view" and
  "sees both sides" are indistinguishable.
- Only the **first** segment's stance per topic is kept (`service.py:726-729`); at most 5 mentions per video.
- The `evidence` quote is generated and then discarded (used only as a summary fallback).
- A keyword fallback assigns one sentiment to **every** topic in a video.
- Topics are buckets: `doviz-kur` mixes USD/TRY, EUR/USD and DXY; `amerikan-piyasalari` mixes three indexes.
  There is no instrument id on a mention.
- No horizon, no price at statement time, no resolution field.
- `published_at` null on 50/50 sampled stories (OI-013) and the opinion window filters on ingestion time, so
  "önce / şimdi" ordering is unreliable. Ingestion is unscheduled (OI-005), content ~90 days old.
- Opinions are grouped by **channel**; `person_name` falls back to the channel name (OI-002). A channel cannot
  be "consistent"; multi-guest channels (Mesele Ekonomi, Integral Forex) need person attribution.

**C. "Tutarlılık" is three different claims.**
1. *Stance change* — did the person flip? (Observable from quotes; safe to show as a neutral event with both
   quotes and dates. A flip after new facts is not a vice.)
2. *Accuracy* — was the direction right at the horizon? (Needs resolution rules, prices, minimum N.)
3. *Acknowledged change* — did they say "görüşümü değiştirdim" or quietly flip? (Valuable, hard to extract.)
Collapsing these into one "tutarlılık puanı" at launch would be misleading and the most contestable artefact.

**D. Resolution rules are the hard engineering.** "Dolar yükselir" needs: instrument (USD/TRY spot? TCMB
rate?), horizon (hafta / ay / yıl sonu — usually unstated), threshold (any move, or beyond the noise band),
reference price at statement time. FinfluencerTracker answers this mechanically (entry next trading day, expiry
~3 months). Calls with no stated horizon should never resolve as "wrong"; show "o günden bu yana %x" instead.

**E. Base rates.** In TL terms USD/TRY and nominal BIST rise most years; "dolar yükselir" is right by default,
and bullish calls outnumber bearish ones on every social platform measured. A hit rate only means something
against a naive baseline (always-up) and against the crowd (relative score, as Good Judgment Open does).

**F. Legal and reputational exposure (not legal advice; get counsel).**
- *Kişilik hakları*: showing a wrong stance, or a pejorative label, under a real name. Defence = verbatim
  quote, timestamp, link, neutral wording ("görüşünü değiştirdi", never "tutarsız"), and a visible correction
  channel ("Yanlış mı aktardık?"). CXO published gurus' rebuttals; plan for the same.
- *SPK*: the site republishes others' views, but a page headed "Dolar: düşüş bekleniyor" with a strong
  consensus label reads like a general recommendation. Keep the standard "yatırım danışmanlığı kapsamında
  değildir" notice on every instrument and person page, no imperative copy, no al/sat wording. SPK actively
  sanctions social-media tipsters (a 3.9 M TL fine and a six-month trading ban reported in 2023), so the product
  can serve accountability, but it must not amplify sanctioned accounts; consider a flag or exclusion rule.
- *Copyright*: short quotes with a link are fine; do not republish transcripts.

**G. Volume after the filter.** Explicit-only will drop most of today's mentions. With 13 persons and no
scheduled ingestion, many instrument pages would be empty. Measure before committing (see §6).

**H. Simplicity vs nuance.** The owner wants "çok sade". The honest minimum card is: kişi · araç · yön
(↑ ↓ →) · kısa alıntı · tarih · ufuk (varsa) · [video 12:34]; below it one line "Önceki görüş: ↓ (12 Eyl)"
and a tag "Değişti / Aynı". Drop confidence dots on this surface: by definition every item shown is explicit.
People with no explicit view are absent from the instrument page, but the person page may say "Son 30 günde
dolar için net görüş belirtmedi" — that is itself information.

## 4. Proposed shape (for discussion, not a spec)

**Record: `Call` (Görüş)** — one per person × instrument × video, replacing the role of `TopicMention` for
this surface:

| Field | Notes |
|---|---|
| `person_id` (required) | person, not channel |
| `instrument` | `USDTRY`, `BIST100`, `XAUTRY`/`XAUUSD`, `BTCUSD`, `SPX`, `EURUSD`, … (narrow, not topic buckets) |
| `direction` | `up` / `down` / `flat` / `none` (none is stored, never shown on the instrument page) |
| `explicit` | bool; the instrument page filters on `true` |
| `quote` | verbatim ≤ 200 chars from the transcript, with `start_time` |
| `horizon_text`, `horizon_days` | as stated; `horizon_days` null when unstated |
| `levels` | numeric levels with `kind` = target / support / resistance |
| `stated_at` | video `published_at` (requires fixing OI-013) |
| `price_at_statement` | from finance-api price history |
| `prev_call_id` | previous call by the same person on the same instrument (for the "önce / şimdi" line) |

**Prompt rule (new)** — "Report `explicit=true` only when the speaker states their own expected direction for
this instrument. Hedged or conditional remarks ("yükselirse şaşırmam", "her şey olabilir", "belirsiz") are
`explicit=false`. Reporting someone else's view is not the speaker's view." Keep every segment, drop the
first-segment rule and the keyword fallback for calls. Add Turkish positive and negative examples.

**Scoring (later, Phase 3)** — a call "resolves" at `horizon_days` (default per instrument when unstated,
e.g. 30 trading days) against a noise band from realised volatility; show per-person numbers only with
N ≥ 10 resolved calls, and always next to the crowd (consensus) result for the same period.

## 5. Phasing

| Phase | Scope | Gate |
|---|---|---|
| 0 — decision | owner decides pivot vs second pillar; update product.md §1–§3; write the resolution policy before code | owner |
| 1 — data | `Call` table + prompt + `published_at` fix + person attribution; re-extract on a sample | precision ≥ 0.90 on direction for explicit calls, hand-labelled 100 segments |
| 2 — UI | instrument page "Kim ne bekliyor" (explicit only), person page "Görüş geçmişi" with change markers, correction link; no scores | ≥ 3 explicit calls per launch instrument in the last 30 days |
| 3 — scoring | resolution + relative accuracy, legal review, dispute handling | counsel sign-off; N ≥ 10 resolved calls per person |

## 6. How to measure

- Extraction: precision / recall of `explicit` and `direction` on a hand-labelled sample (before Phase 2).
- Coverage: share of mentions that pass the explicit filter; instrument pages with ≥ 3 calls in 30 days.
- Reader: click-through from a call card to the video moment; repeat visits to person pages.
- Trust: corrections requested per 100 calls shown; time to correct.

## 7. Open questions for the owner (MISSING DATA)

1. Is this a pivot of `docs/product.md` (news-first, experts secondary) or an added pillar? (§9 reserves this.)
2. Launch instruments: USD/TRY, BIST 100, altın, BTC, S&P 500 — which, in what order?
3. Appetite for publishing accuracy numbers under real names, and budget for a legal read?
4. Ingestion cadence (OI-005): without it the "şimdi" side of the comparison is stale.

## Sources

- TipRanks FAQ — https://www.tipranks.com/glossary/f/faq ; how-to guide — https://www.tipranks.com/news/how-to-use/how-to-follow-the-recommendations-of-top-experts-on-tipranks-and-how-to-leverage-them-to-improve-your-investment-strategy
- CXO Advisory Guru Grades — https://www.cxoadvisory.com/gurus/ ; re-grades — https://www.cxoadvisory.com/investing-expertise/guru-re-grades/ ; analysis — https://mathinvestor.org/2014/03/a-sobering-analysis-of-financial-gurus-market-forecasts/
- PunditTracker — https://ritholtz.com/2013/02/pundit-tracker/ ; https://www.aol.com/news/2012-12-19-pundit-predictions-how-accurate-are-the-pros-bold-guesses.html
- FinfluencerTracker — https://www.finfluencertracker.com/
- Finfluencer Detector — https://github.com/rifattahmid/Finfluencer-Detector
- TikTok finfluencer accuracy study — https://www.cnbc.com/2024/08/16/tiktok-finfluencers-predicted-the-ai-rally-can-you-trust-them.html ; finfluencer recommendations paper — https://www.sciencedirect.com/science/article/abs/pii/S0165176525003489
- Seeking Alpha author performance — https://help.seekingalpha.com/premium/which-seeking-alpha-analysts-find-winning-stocks
- StockTwits sentiment tags — https://www.howardlindzon.com/p/introducing-stocktwits-social-sentiment-indicator ; dataset — https://journalqd.org/article/view/8780 ; skew — https://www.cs.nccu.edu.tw/~hhhuang/docs/fnp2018.pdf
- Good Judgment Open FAQ — https://gjopen.com/faq ; platform scoring critique — https://arxiv.org/pdf/2106.11248 ; Brier score — https://en.wikipedia.org/wiki/Brier_score
- Polymarket resolution disputes — https://ambcrypto.com/polymarket-faces-backlash-over-disputed-strategy-bitcoin-market/ ; https://orrery.me/research/polymarket-resolution-risk-examples
- TCMB Piyasa Katılımcıları Anketi coverage — https://www.cnbce.com/piyasalar/piyasa-katilimcilari-anketi-subat-2025-enflasyon-beklentisi-yukseldi-dolar-tahmini-geriledi-h9488 ; https://www.forbes.com.tr/haberler/piyasa-katilimcilari-anketi-yil-sonu-dolar-ve-enflasyon-tahmini-geriledi
- SPK enforcement — https://www.diken.com.tr/spk-sinyali-vermisti-yatirim-tavsiyesine-para-cezasi/ ; https://www.patronlardunyasi.com/spkdan-borsa-tavsiyesi-veren-uc-sosyal-medya-fenomenine-ceza ; https://www.haberturk.com/spk-net-acikladi-sosyal-medyadan-al-verenler-kendi-hissesini-satiyor-2702024-ekonomi
- Legal commentary (lawyer blogs, not primary) — https://www.kaansafak.av.tr/izinsiz-sermaye-piyasasi-faaliyeti/ ; https://bilalalyar.av.tr/yatirim-danismanligi-izinsiz-faaliyet-2026/ ; https://hukukcularevi.com/sosyal-medya-tavsiyesiyle-fon-aldim-izinsiz-yatirim-danismanligi-tavsiye-verenin-sorumlulugu-spkn-109-107/
- Turkish apps — Ustads https://play.google.com/store/apps/details?id=com.ottoo.ustads.app&hl=tr ; Borsa Tahmin AI https://play.google.com/store/apps/details?id=com.emre.borsatahminai&hl=tr
- Stance / hallucination research — https://arxiv.org/pdf/2510.23464 ; https://arxiv.org/pdf/2604.23588 ; https://preview.aclanthology.org/setup/2025.acl-long.53
