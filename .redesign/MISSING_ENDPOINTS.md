# Missing API Endpoints — RESOLVED

All four endpoints originally listed here are now live in `finance-api`.
This file is kept only as a record; the frontend hooks wired to these
endpoints live in `liquid-economy/src/hooks/`.

| # | Endpoint | Hook | Page |
|---|---|---|---|
| 1 | `GET /api/v1/inference/topics/{key}/opinions` | `useTopicOpinions` | `/piyasa/:slug` |
| 2 | `GET /api/v1/channels/` | `useChannels` | `/uzmanlar` |
| 3 | `GET /api/v1/channels/{slug}/overview` | `usePersonOverview` | `/uzmanlar/:slug` |
| 4 | `GET /api/v1/channels/{slug}/timeline?topic_key=` | `usePersonTimeline` | `/uzmanlar/:slug` |

## Open data-quality follow-ups (tracker-side)

- **Person ↔ channel link**: tracker's `Person.primary_channel_id` is null for
  all 13 person rows, so `/topics/{slug}/opinions` doesn't return `person_id`
  and `finance-api` falls back to `person_name = channel_name`. Most pros are
  1:1 with their channel so this displays correctly today; populate the link
  when one channel hosts multiple analysts.
- **`published_at` on topic mentions**: many rows have `published_at: null`,
  which empties `last_updated` in `/v1/channels/{slug}/overview` and
  `published_at` in `/v1/inference/topics/{key}/opinions`. Tracker has
  `POST /videos/backfill-published-dates` — runs synchronously, takes minutes.
- **Inference history depth**: tracker has only one successful run
  (`run_id=3`, 2026-05-16); runs 4–6 were `skipped_no_new_videos`. The 30-day
  history chart on `/piyasa/:slug` will show one point until more runs land.
