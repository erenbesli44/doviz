# Guest attribution on multi-guest channels — critique and plan

Date: 2026-10-22 · Author: Claude (Lead session) at the owner's request · Status: **plan, not started** · Tracking: OI-018

## 1. The problem

Some watched channels are not one person's channel. Mesele Ekonomi, Integral Forextv and NCM Investment TR
host different guests. An opinion in their videos belongs to the **guest who said it**, not to the channel.
The same person also appears on several channels. Atilla Yeşilada has his own channel and appears on both
Mesele Ekonomi and Integral Forextv. On dovizveri.com, all of these views should land on **one** Atilla
Yeşilada page.

## 2. What happens today (verified 2026-10-22)

**Person detection** (tracker `src/persons/detector.py`) is one person per video:
1. It returns the **first** alias from `config/known_persons.yaml` that appears anywhere in the title.
2. If none matches, it uses `channel_defaults` (single-host channels).
3. Otherwise the person is null.

**Weights** (`config/inference_weights.yaml`) keep only curated guests on multi-guest channels and set
everyone else to 0.0. For example, Mesele Ekonomi keeps only Atilla, and NCM keeps only Taner Gener.

**Live sample** (`/api/v1/news/latest?limit=50`, 2026-10-22):

| Channel | Videos | With a person | Typical title |
|---|---|---|---|
| Mesele Ekonomi | 5 | 2 | `… \| Atilla Yeşilada & Yunus Emre Erdölen`, `… \| Erdal Sağlam`, `… \| Murat Aysan & Ömer Gencal` |
| Integral Forextv | 5 | 2 | `… \| Piyasanın Efendisi \| Atilla Yeşilada & Perihan Tantuğ`, `… \| Melis Hazal Karagöz & Murat Sağman & Ali Perşembe` |
| NCM Investment TR | 6 | 0 | `Seans Başlarken 22.10.2026` (no name in the title) |
| Cuma Cevik | 3 | 0 | single host, but no `channel_defaults` entry |
| Yatırım 101 | 2 | 0 | host unknown |
| Single-host channels (8) | 33 | 33 | — |

**The site** keys "uzmanlar" on **channels**. `/uzmanlar/:slug` reads `/channels/{slug}/overview`, and the
opinion list falls back from `person_name` to `channel_name` (OI-002). Since the 2026-10-22 redesign,
"Mesele Ekonomi" therefore appears as one "uzman" whose arrows mix five different people.

**The in-flight outlook classifier** (OI-017, uncommitted in the tracker, `src/classification/outlook.py:159-167`)
passes `channel.name` as `speaker_name`. On a Mesele Ekonomi video the LLM is told the speaker is "Mesele
Ekonomi", so it cannot say whose view a quote is.

## 3. Critique

Ranked by harm to the "kim ne bekliyor" promise. A wrong arrow under a real name is the worst failure.

1. **Wrong person on a shared video.** In `Atilla Yeşilada & Yunus Emre Erdölen`, the first-alias rule assigns
   the **whole video** to Atilla. Erdölen's explicit views are then shown under Atilla's name. This is the
   only failure that publishes a false statement about a named person, so it must be fixed before any
   per-person page shows multi-guest content.
2. **Channels shown as people.** "Mesele Ekonomi", "Integral Forextv" and "NCM Investment TR" are on the
   live uzmanlar list with mixed stances. Their "önceki görüş / şimdiki görüş" comparison is meaningless,
   because the two arrows may come from different people.
3. **The host is not the guest.** Perihan Tantuğ appears to host "Piyasanın Efendisi" **[ASSUMPTION]**.
   Host questions ("Sizce dolar yükselir mi?") are not views, and a host's own remarks are not the guest's.
4. **Signal is thrown away.** Eight of the 16 sampled multi-guest videos have no person, so weight 0.0
   drops them. That covers Erdal Sağlam, Tanju Yorulmazer, Feyyaz Ünal, Murat Sağman, Ali Perşembe and
   others. NCM's Taner Gener rule never fires, because his name is not in "Seans Başlarken" titles.
5. **The alias rule is fragile.** It uses a bare substring (`"yeşilada"`) and stops at the first match.
   A title *about* someone ("Atilla Yeşilada'ya yanıt") would be attributed to them. Aliases live in YAML,
   so each new guest needs a code change and a deploy.
6. **There are no speaker labels.** YouTube auto-captions carry no speaker labels. Who said a sentence
   must be inferred from text cues ("Atilla Bey, siz ne düşünüyorsunuz?" followed by the answer) or from
   audio. Text inference will sometimes fail, so the design must allow "unknown" and drop those views
   rather than guess.
7. **Do not over-engineer.** Three of 15 active channels are multi-guest. Audio diarization (pyannote,
   WhisperX) is the most accurate option. It also needs audio download and real compute, which the
   2 vCPU box cannot provide. It belongs in a later validation step, not the first fix.

## 4. Plan

The principle is: **a person is the unit, a channel is a source, and unattributed means unshown.**

| Step | What | Where | Effort | Acceptance |
|---|---|---|---|---|
| A — quick config | Add `channel_defaults` for Cuma Cevik, and for Yatırım 101 once the owner names its host. Mark Mesele Ekonomi, Integral Forextv and NCM as `multi_guest` (no default). Remove the bare `"yeşilada"`/`"yesilada"` aliases and keep full names. | tracker `config/` | hours | Cuma Cevik videos get a person; no title without "Atilla" maps to Atilla |
| B — video participants | New `video_participant(video_id, person_id, role host\|guest\|solo, source title\|description\|transcript\|channel_default\|manual, confidence)`. Fill it from (1) the title tail after the last `\|`, split on `&` and `,`; (2) the YouTube description; (3) one LLM pass over the first ~3 minutes of transcript ("Konuğumuz …"). Single-host channels get one `solo` row. | tracker | 2–3 days | On 30 hand-labelled multi-guest videos, the participant list is complete and correct in ≥ 90 % |
| C — person registry in the DB | Move aliases from YAML to the `Person` table. A new name found in step B becomes `status=candidate`. It is stored and matched, but not shown until the owner approves it. Add a person ↔ channel link (`owns` / `appears_on`). | tracker | 1–2 days | Approving a candidate needs no deploy; no candidate appears on the site |
| D — speaker per view | The OI-017 outlook prompt receives the participant list (name + role) instead of the channel name. It returns `speaker` per item (a participant slug or `unknown`) and is told that the host's questions are not views. Each view's person comes from that answer and is stored on the existing `TopicMention.person_id`. Solo videos skip this. `unknown` or `host` views are never shown on person or instrument pages. | tracker (extends OI-017) | 1–2 days | On the labelled set, **attribution precision ≥ 0.95** for shown explicit views; the unknown rate is reported |
| E — API and site by person | The tracker opinions endpoint groups by person and returns `person_id`, `person_slug`, `person_name` and the source channel. finance-api passes them through, which resolves OI-002. `/uzmanlar` lists approved persons. `/uzmanlar/:slug` aggregates across channels and shows "Kaynak: Mesele Ekonomi" on each card. Multi-guest channels leave the uzmanlar list, and their old slugs redirect to a source page or the guest list. | tracker + finance-api + liquid-economy | 2–3 days | Atilla's page shows views from his channel, Mesele and Integral; "Mesele Ekonomi" is no longer listed as a person |
| F — weights by person (owner decision) | Move inference weights from channel rules to person rules. Decide whether approved but uncurated guests (e.g. Erdal Sağlam) count at weight 1.0 or stay excluded. | tracker config | hours | Documented decision |
| G — later, optional | Validate text attribution with audio diarization on a GPU box, offline and on a sample. Adopt it only if step D's precision misses the gate. | offline | — | Measured precision difference |

**Order and dependencies.** Step A can ship alone. Step D extends the OI-017 work currently uncommitted in
the tracker. Land OI-017 first, then build D on top, so the two efforts do not edit `outlook.py` and
`prompts.py` at the same time. Step E closes OI-002. Step B depends on video `published_at` only for
ordering (OI-013).

**Until step E ships**, the safe interim is to hide multi-guest channels from `/uzmanlar` and keep their views
off instrument pages unless the video has exactly one detected participant. This is a small change in the
web app and the tracker weights.

## 5. How to measure

- Build a hand-labelled set of 30 multi-guest videos with the true participants and the true speaker for
  every explicit view. This set gates steps B and D.
- Track the share of multi-guest videos that end with ≥ 1 attributed participant. Today it is 4 of 16.
- Track the share of explicit views with speaker `unknown`. If it exceeds about 30 %, step G is worth trying.
- Count corrections requested on person pages, using the review note's correction channel.

## 6. Owner questions

1. Who hosts Yatırım 101, and is Perihan Tantuğ the host of "Piyasanın Efendisi"?
2. Should approved guests who are not curated (Erdal Sağlam, Murat Sağman, …) appear on the site, or only a curated list?
3. Is the interim hide in §4 acceptable until step E ships?
