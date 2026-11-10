# Daily bulletin clip ("Günün bülteni") — research and design, 2026-11-10

Status: **prototype, awaiting the owner's decision.** Nothing is posted in this format yet.
Owner request (10 Nov, ~22:4x TR): one end-of-day video that presents the day's views from
different people on different topics like a news bulletin, with no voice-over and professional
topic transitions; simple, clear, fitting a finance brand.

## 1. Research (web, 10 Nov)
No outlet publishes its social-video style guide, so these are patterns from trade press and
production guides, not rules from Bloomberg or Reuters. The videos themselves were not watched.

| Finding | Source | What we take from it |
|---|---|---|
| Daily roundups keep a fixed skeleton: preview of the headlines, then the items in order, then a sign-off. VOA60 is one minute of clips with simple captions and no presenter. | VOA60, GZERO "In 60 Seconds", Newsweek "The Bulletin" | Opening card with the rundown, same order in the video, closing card |
| Social video autoplays muted, so the text on screen has to carry the story. The often-quoted "85 % muted" figure is from 2016 and unverified; the direction is not disputed. | Digiday 2016, vidico, Verizon/Publicis 2019 (via Voxbooster) | Who + the key sentence stay on screen for the whole segment |
| On-screen text: 1–2 lines, 3 at most; on screen long enough to read aloud; solid background behind text; credit the source. | Wochit, University at Buffalo brand guide | One lead line per segment, on the paper background, source line in the footer |
| Chapter cards tell the viewer where they are; one line each. Speaker labels matter most in compilations, because clips travel without context. | Vimeo, Cursa, Klap, Trint | Topic card before each segment, counter "2 / 4", progress bar |
| News graphics: one typeface, a grid, simple motion (fade or wipe), nothing playful. CNBC's 2023 package uses one font for every element. | NewscastStudio (CNBC 2023), NBCU Academy | Helvetica Neue for everything except the quote (Charter); one transition for the whole video |
| X: mp4, 140 s for standard accounts, far longer with Premium. | third-party spec pages | @dovizveri has Premium+, so 60–120 s is allowed |

Sources: https://www.voanews.com (VOA60) · https://www.gzeromedia.com/in-60-seconds/money2/huawei-extradition ·
https://www.newsweek.com/videos/the-bulletin-june-26th-news-in-60-seconds ·
https://digiday.com/media/silent-world-facebook-video/ · https://vidico.com/news/short-form-video-statistics/ ·
https://voxbooster.com/blog/captions-subtitles-statistics-2026 ·
https://www.wochit.com/blog/winning-tips-using-text-in-social-video/ · https://www.buffalo.edu/brand/creative/video.html ·
https://vimeo.com/de/blog/post/what-is-lower-thirds · https://klap.app/blog/what-is-a-lower-third ·
https://trint.com/strategy-hub/boost-video-engagement-and-reach-with-captions ·
https://www.newscaststudio.com/2023/12/12/cnbc-new-graphics-logo-ticker/ · https://nbcuacademy.com/chyrons-lower-thirds/ ·
https://www.captions.ai/blog-post/twitter-video-length-limit

## 2. Design
Canvas 1080×1350 (4:5), 30 fps, fixed for the whole video. Same tokens as the banner clip
(navy `#1F3A8A`, paper `#FAFAF7`, Helvetica Neue, Charter for the quote).

| Part | Length | Content |
|---|---|---|
| Opening card | 3.2 s | "Bugün kim ne dedi?", date, "N görüş, tek video", numbered rundown: topic + speaker · channel |
| Topic card (per segment) | 1.5 s | "2 / 4", topic in large type, speaker photo or initials, name, channel · date |
| Segment (per view) | 10–22 s | The banner-clip layout: who, chip, lead line, 16:9 video, source line. Original audio only |
| Closing card | 3.0 s | "Kim ne bekliyor?", "Görüşlerin tamamı ve önceki görüşlerle karşılaştırması: dovizveri.com" |

- **Fixed frame.** The top strip (brand, "Günün bülteni", date, progress bar) and the footer
  (dovizveri.com, disclaimer, source line) are the same pixels in every part. The video sits at
  the same place in every segment.
- **Progress bar.** One bar per view, as in stories: played bars are white, the current one fills
  while the speaker talks.
- **Transition.** One soft wipe to the left (0.4 s) between all parts. Because the strip and the
  footer do not change, only the middle of the frame moves. No music, no sound effect, no
  voice-over: each segment's audio fades in and out, the cards are silent.
- **No speech is lost in a transition:** each segment holds its first and last frame for 0.4 s
  under the wipe.

## 3. Editorial rules (proposed)
1. Only views that were posted that day with the owner's approval; same lead line (editor-reviewed,
   §3.5 item 11), same source, same exclusions (people and instruments the owner has excluded).
2. One passage per speaker and topic, 10–22 s, whole sentences, both cuts in a pause. It is a
   shorter cut of the posted clip around the lead line, not the whole clip.
3. Order: Turkish markets first (BIST, Dolar/TL), then Altın/Gümüş, then global (ABD, petrol,
   bitcoin), main-idea segments last. At most 6 segments, 60–120 s in total.
4. Leave out a view that the same day's data has overtaken (example 10 Nov: Bora Özkent's
   expectation for the CPI release, recorded before the data came out).
5. No direction words added by us; the chip is the instrument or "Ana fikir", as in the posts.
6. Card-only channels (Kayıt Dışı İktisat) have no clip, so they are not in the bulletin.

## 4. Pipeline
`clip_bounds.py` (sentence spans) → raw cuts → `make_bulletin.py <spec.json> <out.mp4>` → frame
sheet `<out>-sheet.png` for review → owner approval of the video and the post text.

## 5. Prototype (10 Nov)
4 views, 77.9 s, 8.0 MB: Murat Sağman · BIST (10.5 s), Taner Genek · Altın (21.7 s),
Tunç Şatıroğlu · ABD borsaları (20.1 s), Barış Soydan · Enflasyon ve tasarruf (13.8 s).
Files are in the session scratchpad (`bul/`), not in the repo.

## 6. Open decisions for the owner
1. Go / no-go for the format, and the name ("Günün bülteni", title "Bugün kim ne dedi?").
2. Burned-in subtitles of the speech (better for muted viewing, but auto-captions have errors, so
   each one needs a manual check). Not in the prototype.
3. Posting time (proposal: once a day, about 21:30 TR, after the evening batch) and the post text.
4. Length cap (proposal: 6 segments, 120 s).
