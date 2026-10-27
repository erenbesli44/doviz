# Commentator card v3 trial — 2026-10-27 (**A adopted by the owner 2026-10-27**)

Owner asked (2026-10-27): use the video image or the commentator's profile photo, and make posts
easier to read and react to. This folder holds a trial on the 26 Oct Erkan Öz post (same data).


Variants compared (images kept in the session scratchpad, not committed, because they contain the
commentator's photo): old v2 scaled to phone width (~520 px); **A: channel profile photo** + big
direction + short quote (WebP 44 KB); **B: YouTube video thumbnail** with ▶ 1:09 badge (WebP 69 KB).
A is now `../card-commentator-v3.html`. The "Post text" proposals below (site link in the reply) were **not** adopted; they stay the D8 test.

## Findings at phone size
- v2: the right "Görüşün tamamı" panel and the old → new boxes are unreadable at ~520 px (≈ 7 px text).
  The card carries ~110 words; a reader gets "Erkan Öz · ↓ · quote" and nothing else.
- A: a face + one name + one coloured direction + one quote all read at a glance. ~35 words.
- B: the thumbnail dominates and **contradicts the post** here ("Nasıl yükselir?" with green arrows
  on a ↓ Düşüş card). YouTube thumbnails are clickbait by design and bring hype words we ban
  (playbook §1). It is also 69 KB (> 45 KB upload target).

## Recommendation: A, with these rules
1. Photo = the channel's own YouTube profile image (`channel_avatar_url`), small circle, credited in
   the footer ("profil fotoğrafı: <Name> YouTube kanalı"). No video thumbnails on cards.
2. Only for a named person whose channel is theirs. On multi-guest channels (Integral Forextv,
   Kanal Finans, NCM) the avatar is a company logo, not the speaker → use an initials circle instead.
3. Drop the right summary panel from the card; the full view stays in the "Görüşün tamamı" replies.
4. Quote ≤ ~100 chars on the card, cut with "…" at a word end; the full verbatim quote stays in the
   post text. Old view = one line "önceki görüş: ↑ Yükseliş (20 Eki)".
5. Keep disclaimer, date, site path, direction = arrow + word + colour.

Optional, test later: a post with no card and the YouTube link last shows X's own video preview
(licensed via YouTube's share card) but moves our site link to the reply, and link-only posts tend
to get less reach. Not recommended as the default.

## Post text (engagement), proposal
- First line = the news in ≤ 70 chars: "Erkan Öz ABD borsalarında görüşünü değiştirdi: ↑ → ↓".
- Keep quote + video minute; move the site link to the first reply (link posts reach less; test it
  as D8, the week-3 link-placement test).
- End replies with one neutral question that invites answers without a call ("Sizce ilk destek
  hangisi: 7.300 mü?" is too directional → use "Bu görüşü videoda nasıl buldunuz?" style, or none).

## Risks
- Rights: profile photos and thumbnails belong to the creators. A small, credited profile photo in
  non-commercial commentary is the lower-risk option; thumbnails are higher-risk and off-brand.
  Remove on any creator request. Not legal advice.
- Likeness can read as endorsement → footer credit + "Yatırım tavsiyesi değildir." stay mandatory.
