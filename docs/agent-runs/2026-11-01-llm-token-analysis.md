# LLM token usage analysis — MiniMax M3.1-Flash (2026-11-01)

Ad-hoc analysis requested by the owner: "is there any token usage improvement we can implement
without losing accuracy and LLM performance". Read-only: no code changed, nothing deployed.
All LLM calls live in the tracker repo (`src/llm/service.py`); the doviz repo makes none.

## 1. Where the tokens go

| Call | Where | When | Input (measured) | Output at today's settings |
|---|---|---|---|---|
| Analysis (summary + topics) | `generate_analysis_json` | every new video; `fill-missing-topics` re-runs it | 2.0k template + rendered transcript (22-min video: 12.8k) = **14.8k** | **27.9k** (24.1k reasoning) |
| Outlook (per-instrument view) | `generate_outlook_json` | every video with instrument mentions; `/outlook/backfill` | 3.5k template + ≤3.5k chars per mention (5 mentions: **11.7k**) | **14–16k** (13.5–15.2k reasoning) |
| Quote clean | `generate_quote_clean_json` | after outlook, batches of 15 | 0.8k template + ~0.45k per quote (**3.1k**) | **3.2k** (2.9k reasoning) |
| Participants | `generate_participants_json` | multi-guest channels only | ~0.4k + 4k-char intro (~1.5k) | not measured (small) |
| Market inference | `generate_market_inference_json` | 11 topics, once a day | 0.7k + 8 sources (~2–3k) | small |

Volume: ~6 videos/day since 2026-10-21 (watch runs: 179 ingested 2026-10-20 → 11-01, of which
116 on the first day). Transcript plain text of the last 56 videos: p50 15.0k chars, p90 28.2k,
max 34.9k — the 80k `ANALYSIS_TRANSCRIPT_MAX_CHARS` cut never triggers.

Pricing (official pay-as-you-go page, 2026-11-01): $0.15/M input, $0.60/M output,
$0.015/M cache read. Reasoning tokens are counted in `completion_tokens`, i.e. billed as output.

## 2. Findings (live calls on one real 22-min NCM video, production prompts, same key as prod)

**F1 — Every call runs at `reasoning_effort=max`.** M3.1-Flash always thinks
(`thinking.type=disabled` → HTTP 400 code 2013) and `reasoning_effort` defaults to `max` when
omitted; the tracker passes nothing. Reasoning is 86 % of analysis output and 96 % of outlook
output, i.e. roughly 85–90 % of the money per call.

| Call | effort | in | out | reasoning | seconds | $/call |
|---|---|---|---|---|---|---|
| Analysis | max (today) | 14,843 | 27,870 | 24,077 | 127 | 0.0190 |
| Analysis | medium | 14,843 | 6,410 | 2,803 | 30 | 0.0061 |
| Analysis | low | 14,843 | 4,268 | 594 | 23 | 0.0048 |
| Analysis, sparse timestamps (F2) | max | 9,966 | 22,469 | 18,604 | 154 | 0.0150 |
| Outlook | max (today) | 11,676 | 14,193–15,922 | 13,512–15,232 | 105–114 | 0.0108 |
| Outlook | high | 11,676 | 4,932 | 4,257 | 38 | 0.0047 |
| Outlook | medium | 11,676 | 5,018 | 4,389 | 43 | 0.0048 |
| Outlook | low | 11,676 | 1,161 | 494 | 12 | 0.0024 |
| Quote clean | max (today) | 3,081 | 3,154 | 2,854 | 17 | 0.0024 |
| Quote clean | low | 3,081 | 688 | 406 | 4 | 0.0009 |

Quality on this sample: analysis at medium found the same 8 subtopics, 5 key points, valid JSON,
82 key levels vs 95 at max; `low` kept the topics but dropped to 58 key levels (−40 %) → not
acceptable. Outlook: all four levels gave future/own_view/explicit on the same mentions; the
direction differed on one instrument (Altın: max=flat, high=down, medium=down, low=flat) — but two
**max** runs on the identical prompt also disagreed (down vs flat), so this is run-to-run noise
(temperature is fixed at 1 on this model), not an effort effect. Quote clean: both accepted 5/5,
but `low` changed "inerse" to "inirse" and `accept()` let it through (one new word allowed) →
use medium, not low, there.

**F2 — Timestamp rendering doubles the transcript tokens.** `_render_segments_for_llm` writes
`[MM:SS-MM:SS]` before every ~5-second caption segment (518 segments, 35 chars each). Measured:
+38 % characters and +93 % tokens vs plain text (tiktoken proxy); on the MiniMax tokenizer the
analysis prompt drops from 14.8k to 10.0k with one `[MM:SS]` marker every 30 s. Same topics,
97 key levels, times rounded to the marker (e.g. 06:30 instead of 06:38).

**F3 — Prompt caching is on but almost never hits.** Caching is passive, prefix-based, ≥512
tokens, 10× cheaper on hits. Production calls cached only 128 tokens because variable text comes
early (analysis: channel name on line 28; outlook: video title on line 5), so the 1.9k / 3.4k
tokens of static rules after it are paid in full each time. Identical retries do hit (14.6k of
14.8k cached on a repeat minutes later).

**F4 — No usage accounting.** `completion.usage` (prompt_tokens, completion_tokens,
`completion_tokens_details.reasoning_tokens`, `prompt_tokens_details.cached_tokens`) is
discarded; nothing in logs or the DB shows where the credit went (OI-030 balance surprise).

**F5 — Latency risk at max.** 127 s / 110 s per call against `MINIMAX_TIMEOUT_SECONDS=240` and
4 attempts. A 60-min video (~35k input) at max effort can plausibly exceed 240 s; a timed-out
attempt is retried and likely still billed. Not verified here (Coolify logs not reachable from
this session) — check the logs for "MiniMax timeout" warnings.

**F6 — Output fields nobody reads.** Analysis `evidence`, `is_expected`, `language`
(evidence is stored but not exposed by the tracker API nor shown on the site); outlook `reason`.
~5–8 % of medium-effort output; may still help grounding, so gate on the eval.

## 3. Cost picture

Per video today ≈ $0.032 (analysis 0.019 + outlook 0.011 + quote 0.002) → ≈ $0.19/day,
≈ $5.8/month at 6 videos/day. Backfills dominate: the outlook backfill running since 15:36 UTC
(508 videos) ≈ $5.5 at max; `fill-missing-topics` ≈ $0.95 per 50 videos.
With F1 (medium) + F2: ≈ $0.011/video (−65 %), backfills ≈ −55 %, calls 3–4× faster.

## 4. Proposed sequence (each a small tracker PR, owner decides)

1. **Log usage per call** (F4): one `logger.info` with call type, in/out/reasoning/cached tokens
   and seconds; optionally a running daily sum in the pipeline-health endpoint. Zero risk.
   Acceptance: every MiniMax call logs usage; a 24 h sum is reproducible.
2. **`reasoning_effort` per call type** (F1): analysis `medium`, outlook `high` (or `medium`),
   quote clean `medium`, participants `medium`, inference `medium`; one setting per call in
   `config.py`, env-overridable. Never `low`.
   Accuracy gate before merging the outlook level: `scripts/eval_outlook_prompts.py` on the
   OI-030 labelled set at max vs chosen level, ≥ 50 views, precision ≥ 0.90 and no drop vs max
   beyond noise (run max twice to size the noise). Analysis gate: 20 recent videos, same subtopic
   set in ≥ 90 % and key-level count ≥ 85 % of max.
3. **Sparse timestamp markers** (F2): one `[MM:SS]` every 20–30 s instead of
   `[MM:SS-MM:SS]` per segment. Downstream: mention start/end become marker-granular
   (X "&t=" links land ≤ 30 s early; outlook excerpt pad is already 45 s). Tests to update:
   `tests/ingestion/test_llm_pipeline_helpers.py`, `tests/ingestion/test_fill_missing_topics.py`.
   Zero-behaviour-change alternative: keep per-segment markers but drop the end time.
4. **Static-first prompt layout** (F3): move INPUT METADATA / CHANNEL CONTEXT to just before the
   transcript, and the outlook header (title, speaker, date) to just before the items. ~2 % saving,
   no accuracy risk; do it in the same PR as 2.
5. Optional: `max_completion_tokens` guard (≥ 2× the typical medium output, e.g. 16k analysis /
   12k outlook) — a `length` finish today raises and re-bills the whole call, so keep it generous.
6. Optional, eval-gated: drop `evidence` from the analysis schema and `reason` from outlook (F6).

Measure after release: 7-day sums from the usage log vs. the per-call numbers above; outlook
precision per the OI-030 plan (blind-label 50 new explicit views).

## 5. Side notes

- OI-030 "not yet verified: one successful call on M3.1-Flash" is now verified: the backfill
  shows queued 508 / done 9 / failed 0 at 15:36 UTC and the test calls above succeeded.
- `tracker/.env` lines 45 and 48 have no `=` (python-dotenv warns on every start); they hold X
  OAuth client values — fix the format. `GEMINI_*` entries there are unused by the code.
- Outlook excerpts are capped at 3,500 chars per mention; an 11-minute BIST mention (~9k chars)
  sends only its first ~4 minutes, so the quote search is already truncated. Raising the cap costs
  tokens but may improve recall — separate decision, not a saving.
- Evidence files (scratchpad, not in the repo): `live_experiment_results.json`,
  `experiment3_log.jsonl`, `analysis_medium.json`.
