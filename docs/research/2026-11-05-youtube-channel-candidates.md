# YouTube channel review and candidates — 2026-11-05

Owner request (2026-11-05): check which channels we track, find the best Turkish finance channels to add, and at most 1–2 English US-market channels worth a trial. Method: tracker `config/watched_channels.yaml`, explicit-view counts from the live API (last 30 days), `yt-dlp` on the last 10–12 uploads of every tracked channel and ~35 candidates (uploads tab only; live streams are never tracked), web search for backgrounds. Numbers are approximate (YouTube rounds view counts); "unverified" means no reliable source was found.

## 1. What we track today (14 channels)

| Channel | Person | Median views / upload (last 10) | Explicit views, last 30 d | Note |
|---|---|---|---|---|
| Devrim Akyıl | Devrim Akyıl | 174k | 26 | best yield |
| İslam Memiş | İslam Memiş | 78k | 23 | gold/dollar, very explicit |
| Integral Forextv | Atilla Yeşilada (13), Cüneyt Paksoy, M. H. Karagöz | 65k | 16 | multi-guest |
| Selçuk Geçer | Selçuk Geçer | 172k | 13 | |
| Emrah Lafçı | Emrah Lafçı | hidden in listing (unverified) | 13 | |
| Kanal Finans | Tunç Şatıroğlu | 61k | 13 | |
| Mesele Ekonomi | Atilla (7), Murat Aysan, Hakan Kara, others | 73k | 12 | multi-guest |
| Atilla Yeşilada | Atilla Yeşilada | 113k | 12 | |
| Barış Soydan | Barış Soydan | 141k | 7 | thesis style |
| Yatırım 101 | (single host) | 158k (5 uploads) | 7 | main-idea posts only |
| Cevik Finance | Cuma Çevik | **8k** | 7 | low reach |
| NCM Investment TR | Taner Genek, Alparslan Budak | **~300** | 4 | daily show host unnamed → hidden |
| Erkan Öz | Erkan Öz | 54k | 4 | thesis style, long videos |
| Murat Muratoğlu | Murat Muratoğlu | 170k | **1** | big reach, almost no explicit views |

Dropped earlier: Hatice Kolçak (owner, OI-016), Emre Şirin, Bora Özkent, and five English educators (The Plain Bagel, WhiteBoard Finance, The Swedish Investor, Patrick Boyle, The Money Guy Show) — commented out in tracker `1cd08e6` without a recorded reason; the five are education channels with no market calls. No new evidence for a retry of any of them.

Critique of the current list:
- **NCM Investment TR** costs a transcript + LLM call per video for ~300 views and 4 views a month, and its daily host is unnamed. Candidate to retire (`is_active=false`, same path as OI-016).
- **Murat Muratoğlu** has reach but speaks in macro/political commentary, not forecasts: 1 explicit view in 30 days. Keep only if the "videonun ana fikri" format is wanted for him too.
- **Cevik Finance** (8k views) adds little reach; its 7 views a month are fine, so neutral.
- The list is strong on Dolar/TL, altın and BIST; weakest on **kripto** (only Erkan Öz, long-horizon) and on **ABD borsaları with named US voices**.

## 2. Turkish candidates (ranked)

| # | Channel (handle) | Person(s) | Subs | Median views (n) | Uploads/wk | Instruments | Explicit? | Credibility | Warnings |
|---|---|---|---|---|---|---|---|---|---|
| 1 | QNB Invest (`@qnbinvesttr`) | Tuncay Turşucu, Erdem Kaynar, Can Alagöz (+ Barış Soydan, tracked) | 22k | 22k (10; analyst videos 20–70k) | ~1.5 | BIST, altın, gümüş, ABD, petrol | yes | bank brokerage, licensed analysts | product/robo-advisor clips (100–23k views) need a title filter |
| 2 | Tuncay Turşucu (`@tuncay-tursucu`) | Tuncay Turşucu | 249k | 27k (12) | ~0.5 | BIST (deep), altın, gümüş, ABD | yes | licensed analyst since 1995, CNBC-e/Matriks regular | **no upload since 2026-08-23**; impersonator accounts exist on Instagram |
| 3 | Emre Kulcanay EKTV (`@EmreKulcanayEKTV`) | host journalist; guests Prof. Osman Altuğ, Prof. Tahsin Bakırtaş, Onur Çanakçı, Bayram Başaran, Şenol Babuşcu | 77k | 74k (12; up to 359k) | ~3 | Dolar/TL (core), altın, faiz | yes (dollar levels and dates) | academic guests, named attribution easy | sensational titles ("Dolar 60–70"), ~1/3 of uploads are pension/housing topics |
| 4 | Dikkat Boğa Çıkabilir (`UCdw_hrRESHAuthNP9Pg8EIQ`) | host Burak Tamaç; guests Kirkor Baloğlu, Nuri Sevgen, Haydar Acun, Sertaç Ekeke, Helin Çelik | 57k | 22k (12) | ~3 | Bitcoin/kripto (core), BIST, ABD, emtia | yes (BTC levels) | CoinTR / BlockchainIST background (partly unverified) | crypto hype risk; some lifestyle episodes; also hosts Erkan Öz (overlap) |
| 5 | PARA ANALİZ (`@paraanaliz827`) | Dr. Cüneyt Akman, Zeynep Ece Ulukaya | 35k | 14k (12) | ~1 | Dolar/TL, faiz, BIST macro | partly (devaluation calls, few targets) | economist, ex-Halk TV, Yeditepe lecturer | political framing; 45–60 min |
| 6 | Nasıl Bir Ekonomi TV (`@nasilbirekonomi`) | Ali Ağaoğlu, Dr. Nuri Sevgen, M. A. Yıldırımtürk, Helin Çelik | 227k | 1.3k (12) | 20+ clips/day | all 7 | yes | veteran strategists | far too noisy without a duration/title filter |
| 7 | Matriks Trader (`@matrikstrader`) | Turşucu, Selçuk Gönençler, Dr. Barış Esen | 24k | 9k (12) | ~5 | BIST, dolar, faiz | yes | data vendor, licensed guests | product tutorials mixed in |
| 8 | Ekonomi Ekranı (`@EkonomiEkranı`) | Sami Altınkaya; Şebnem Ayabakan, Sertaç Ekeke | 263k | 12k uploads (12) | ~0.6 uploads; mostly live streams | BIST, altın, gümüş, dolar | partly | known technicians | live-stream format (not tracked); removed from our list once before (`c3c77cf`) |
| 9 | İş Yatırım (`@isyatirim`) | Şant Manukyan, Dağlar Özkan, Serhat Gürleyen | 817k | 4.5k (12) | ~6 | all except kripto | partly (hedged house view) | top broker; Manukyan daily on Bloomberg HT | institutional hedging, short low-view clips |
| 10 | KIDEMLİ ANALİST | anonymous | 254k | 13k (4; 8 of 12 members-only) | ~3 | dolar, altın, gümüş, BIST, kripto | yes | none (no named person) | anonymous, paid membership, "Dolar 70 TL" bait — fails the named-person rule |

No own channel (reach them via 1, 3, 6, 7, 9): Şant Manukyan, Şenol Babuşcu, Murat Sağman, Ahmet Mergen, Selçuk Gönençler, Mehmet Ali Yıldırımtürk. Özgür Demirtaş left YouTube. İris Cibre's channel is inactive since 2024. Arya Polat and HangiKredi expert videos: unverified cadence.

Rejected popular channels: EKOTÜRK TV (191k subs, dozens of TV clips a day at ~340 views median, astrology segments on top), CNBC-e (same pattern, 540 views median), Simge Fıstıkoğlu (282k, mostly astrology/doomsday), KIDEMLİ ANALİST (anonymous), Destek Yatırım (daily hedged show at ~460 views).

### Recommended Turkish additions
1. **QNB Invest** — Tuncay Turşucu's only regular outlet (every 2–4 weeks) plus Erdem Kaynar's explicit US-equity calls; broker credibility; clean per-guest attribution (OI-018 handles the speaker). Recent: "Dibi Gördük Ama Hızlı Bir Yükseliş Beklenmemeli | Tuncay Turşucu" (22k), "ABD Borsalarında Yeniden Yükseliş Tarafındayım | Erdem Kaynar" (30k), "Geri Alım Yapan Şirketleri Not Edin!" (2026-10-21, 69k).
2. **Emre Kulcanay EKTV** — the highest engagement of any candidate and very explicit Dolar/TL levels from named academics; feeds the dollar page. Off-topic uploads (emeklilik, konut) will produce no instrument mentions, so they only cost one LLM call each. Recent: "Dolar Fiyatı Yanlış | Örtülü Devalüasyon | Prof. Dr. Osman Altuğ" (2026-10-21, 109k), "Dolar'da Yeni Barajlar | Altın'ın Artış Tarihi | Bayram Başaran" (2026-11-04, 25k).
3. **Dikkat Boğa Çıkabilir** — fills the kripto gap with named analysts giving BTC levels, 3 uploads a week. Recent: "Bitcoin'de 89.000$ Kapıda mı? | Kirkor Baloğlu" (Oct 2026).
4. **Tuncay Turşucu (own channel)** — add with `video_count: 2`; it costs nothing while he is silent and catches him if he resumes.

Later, with a title/duration filter in the tracker: Nasıl Bir Ekonomi TV (ingest only > 5 min with a named guest) and Matriks Trader.

## 3. English US-market candidates (ranked)

| # | Channel (handle) | Host | Subs | Median views (n) | Uploads/wk | Length | Explicit? | Credibility | Warnings |
|---|---|---|---|---|---|---|---|---|---|
| 1 | The David Lin Report (`@TheDavidLinReport`) | David Lin (ex-Kitco anchor, ex-BCA Research) interviewing named guests | 339k | 63k (11) | ~8.6 | 21–45 min | **yes** (guests give levels and timing; verified in one transcript) | high for the format; guests include BCA strategists, David Woo, Tavi Costa, Gareth Soloway, Chris Vermeulen | sponsor intros; bearish "crash" titles; the call is the guest's, never Lin's |
| 2 | Benjamin Cowen (`@benjaminjcowen`) | Benjamin Cowen (PhD engineering; Into the Cryptoverse) | 1.02M | 131k (12) | ~5 | 6–34 min | yes/partly (cycle timing, % corrections, BTC/gold/S&P levels, probabilistic) | data-driven; publishes dated calls he revisits | crypto-first; hedged wording; sells Premium; transcript not verified (rate-limited) |
| 3 | Kitco NEWS (`@kitco`) | rotating anchors; named guests | 785k | 60k (12) | ~11 | 20–56 min | yes (gold/silver, some indices) | established metals outlet | gold-bull guest bias; high volume |
| 4 | Wealthion (`@Wealthion`) | rotating hosts; named guests (Larry McDonald, Gareth Soloway) | 357k | 43k (11) | ~3.3 | 21–77 min | yes | real strategists | softball hosts; 1 h+ episodes; views 1k–125k |
| 5 | Ciovacco Capital (`@CiovaccoCapital`) | Chris Ciovacco (CCM, technician since 1999) | 81k | 22k (12) | **~1** | 20–41 min | partly (weight-of-evidence probabilities) | high, sober, no clickbait | only weekly; cautious wording |
| 6 | Bravos Research = Game of Trades (`@bravosresearch`) | Peter Massaut + team (no finance credential) | 651k | 243k (12) | ~1.9 | 11–22 min | yes, doom-framed | low–medium: subscription funnel, "We Just Sold Everything" (2023) | every upload is a sales funnel; reputational risk |
| 7 | Forward Guidance (`@ForwardGuidanceBW`) | Felix Jauvin; strategist guests | 193k | 16k (12) | ~1.2 | 20–72 min | partly | high | too few, too long |
| 8 | Steven Van Metre | Steven Van Metre, CFP | 310k | 66k (9) | ~4.8 | 16–19 min | partly, rarely levels | medium; "bond bull" since 2020 | ALL-CAPS clickbait, perma-bear |
| 9 | Eurodollar University (`@EurodollarUniversity`) | Jeff Snider | 235k | 108k (11) | ~4.5 | 18–30 min | no/partly (macro narrative) | respected niche thinker; disputed calls | fear titles, not instrument-level |
| 10 | Peter Schiff (`@peterschiff`) | Peter Schiff | 639k | 181k (12) | ~1.6 | 55–75 min | partly (always the same) | famous perma-bear; CNBC scorecard 5/17 | identical thesis every episode, so "earlier view" is empty |
| 11 | Market Misbehavior (`@DKellerCMT`) | David Keller, CMT (ex-Fidelity) | 28k | 3.4k (12) | ~5.5 | 28–37 min | **yes** (daily S&P levels) | very high | audience too small |
| 12 | Heresy Financial (`@HeresyFinancial`) | Joe Brown | 403k | 105k (12) | ~2 | 13–26 min | no | medium | funnel to training |

Rejected: Meet Kevin (half the uploads off-topic, flip-flop reputation), Joseph Carlson (portfolio vlog), The Compound (40–85 min conversation, few levels), Bravos/Game of Trades (doom funnel; note: Game of Trades no longer exists separately, it redirects to Bravos), Peter Schiff, Verified Investing/Gareth Soloway own channel (3–11k views, sells trading rooms), Mark Moss and Felix Prehn (course sellers), ClearValue Tax (tax content), Real Investment Show (live stream), Lead-Lag Report (no YouTube channel).

### Recommended English trial
1. **The David Lin Report** — the closest match to "kim ne bekliyor": one named guest per upload giving a falsifiable call, daily, 50–150k views. Verified on the 2026-11-03 upload "Trader Called Tech Crash — Now Predicts 'Black Christmas' For Stocks | Todd Horwitz" (116k views): Horwitz expects a sellable bear-market rally, then a further Nasdaq decline and a "40–60% haircut" in AI names. Risks: bearish guest skew; some guests (geopolitics, uranium) give no market calls; ~8 uploads a week is the most expensive channel on the list — start with `video_count: 2`.
2. **Benjamin Cowen** — second choice, only if the owner also wants a US/crypto single-host voice: 1M subs, dated calls he revisits ("Stock Market Correction: Q4 2026", 2026-11-02, 136k). Risk: probabilistic wording may not pass the explicit-view test; unverified at transcript level.

## 4. Things to decide before adding English channels
- **Quotes are shown verbatim.** Summaries come out in Turkish (`LLM_DEFAULT_OUTPUT_LANGUAGE=tr`), but `outlook_quote` is the speaker's sentence, so the site and the X cards would show an English quote next to Turkish text. Options: show it as is with an "EN" mark, or add a translated quote field (prompt change in the tracker).
- **Attribution:** the person is the guest, never David Lin. OI-018 participants already credit the named guest; Lin's own framing must not become a view (the same rule as unnamed NCM hosts).
- **Cost:** ~170 videos a month today. QNB + EKTV + DBÇ add ~30 a month; David Lin at `video_count: 2` adds ~35. At MiniMax-M3.1-Flash prices that is roughly +$1.5 a month; the MiniMax balance is currently zero (see the 2026-11-01 run log), so nothing can be ingested until it is topped up.
- **Capacity on X:** more channels mean more qualifying views per day than the 2-hour spacing rule allows; the watcher already ranks and drops, so this is a ranking question, not a blocker.

## 5. Proposed change (tracker `config/watched_channels.yaml`, not applied)
Add: `@qnbinvesttr` (QNB Invest, video_count 4), `@EmreKulcanayEKTV` (Emre Kulcanay EKTV, 4), channel id `UCdw_hrRESHAuthNP9Pg8EIQ` (Dikkat Boğa Çıkabilir, 4), `@tuncay-tursucu` (2), and for the English trial `@TheDavidLinReport` (2, `transcript_languages: ["en"]`). Retire NCM Investment TR via `is_active=false`. Deploy is owner-gated (CLAUDE.md autonomy boundaries). Measure after 2 weeks: explicit views per channel per 30 days (target ≥ 8 for a kept channel) and views per X post for the new names.

## Sources
Turkish: https://www.youtube.com/@qnbinvesttr · https://www.youtube.com/@tuncay-tursucu · https://www.youtube.com/@EmreKulcanayEKTV · https://www.youtube.com/channel/UCdw_hrRESHAuthNP9Pg8EIQ · https://www.youtube.com/@paraanaliz827 · https://www.youtube.com/@nasilbirekonomi · https://www.youtube.com/@matrikstrader · https://www.youtube.com/@isyatirim · https://www.timeturk.com/genel/tuncay-tursucu-kimdir/haber-1763616 · https://sbe.yeditepe.edu.tr/en/node/9389 · https://onedio.com/haber/sesi-solugu-cikmayan-ozgur-demirtas-sosyal-medyadan-detayli-bir-aciklama-yaparak-kararini-acikladi-1281921
English: https://www.youtube.com/@TheDavidLinReport · https://www.youtube.com/@benjaminjcowen · https://www.youtube.com/@kitco · https://www.youtube.com/@Wealthion · https://www.youtube.com/@CiovaccoCapital · https://www.youtube.com/@bravosresearch · https://barrettmedia.com/2023/04/11/is-david-lin-financial-medias-next-star/ · https://bravosresearch.com/ · https://ca.trustpilot.com/review/bravosresearch.com · https://rosetta.to/u/intothecryptoverse/s-p-500-outlook-for-the-rest-of-2026 · https://seekingalpha.com/author/chris-ciovacco · https://www.cnbc.com/2015/12/20/the-peter-meter-assessing-schiffs-predictions.html
