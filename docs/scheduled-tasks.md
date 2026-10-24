# Scheduled task instructions

Two recurring Claude Code **cloud routines**, both daily, drive the workflow in `CLAUDE.md` (registered 2026-10-21 via `/schedule`; manage them at https://claude.ai/code/routines). Each runs as the **Lead** in an isolated cloud checkout of `erenbesli44/doviz` with the prompt below. Because the checkout is ephemeral, each run delivers its results as a branch `agent/<date>-<daily|product>` plus a PR to `main` (the one push exception in `CLAUDE.md`). Routines never deploy or touch secrets. The cloud sandbox may block outbound network: probe failures that look like DNS/connect errors on every host are reported as `MISSING DATA (sandbox network)`, not as an outage.

Prerequisites for the runner environment: the repo checked out at `main`, `uv` and Node 22 available, outbound HTTPS to `dovizveri.com`/`api.dovizveri.com` (for probes) and to npm/PyPI (for installs). No `.env` is required once `agent/hermetic-tests` is merged (OI-001). A GitHub remote is needed only if the owner later allows the Lead to push branches/open PRs.

---

## Task 1 — Daily technical check
- **Name**: `doviz-daily-tech-check`
- **Schedule**: every day 06:30 Europe/Istanbul = `30 3 * * *` UTC (Istanbul has no DST).
- **Scope**: steps 1–2 of the cycle with `reliability-analyst` only; implementation only for small, evidence-backed items already `open` in the registry.

**Prompt**
```
You are the Lead for the dovizveri.com maintenance workflow. Read CLAUDE.md fully and follow its "Multi-agent maintenance workflow" section.

Run the DAILY cycle:
1. Read docs/agent-runs/open-items.md and the two most recent files in docs/agent-runs/. Do not re-open closed/rejected items without new evidence.
2. Spawn `reliability-analyst` with a brief: run all 8 checks, compare with the most recent *-daily.md and the CLAUDE.md baseline, max 3 proposals.
3. If the analyst reports a regression versus the last run (new test failures, probe non-200, freshness or drift change, new high advisories), spawn `critic-reviewer` in Mode A on the proposals. Otherwise record "no action" and stop after writing the record.
4. Select at most one item, and only if it is inside the autonomy boundary (test hygiene, lint, in-range dependency bumps, docs) and its acceptance criteria are measurable without a deploy. Otherwise select nothing.
5. If an item is selected: developer in a worktree `../doviz-wt-<slug>` on branch `agent/<slug>`, then `qa-verifier` and `critic-reviewer` Mode B. Max two fix rounds; stop and record `blocked` otherwise. Never push, never deploy.
6. Write docs/agent-runs/YYYY-MM-DD-daily.md using the template in docs/agent-runs/README.md and update open-items.md (statuses, evidence, dates). Commit the record (and any implementation commits) on branch `agent/YYYY-MM-DD-daily`, push it, and open a PR to main with `gh pr create` (title `agent: daily check YYYY-MM-DD`, body = your summary, ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`). Never push to main.
7. Finish with a ≤10-line summary for the owner: status table deltas, what was selected, the branch to review, and every NEEDS OWNER DECISION / MISSING DATA line verbatim.
Rules: never change tests or agent rules just to pass; never print secret values; surface anything requiring an owner decision instead of doing it.
```

**Expected outputs**: `docs/agent-runs/<date>-daily.md`, updated `open-items.md`, optionally a branch `agent/<slug>` with QA + review evidence.

---

## Task 2 — Daily product analysis (with Google Analytics)
- **Name**: `doviz-daily-product-analysis` (routine `trig_015RjKNbJJwC9ZEMuYLCiagu`, renamed from `doviz-weekly-product-analysis` and moved from weekly to daily on 2026-10-23 at the owner's request).
- **Schedule**: every day 07:00 Europe/Istanbul = `0 4 * * *` UTC, 30 minutes after the daily technical check.
- **Scope**: product-analyst + critic (+ at most one implementation). Reliability is covered by Task 1, so it is not re-run here.
- **Google Analytics**: `scripts/ga_report.py` reads GA4 property `531225194` through the GA4 Data API (read-only) and prints markdown tables: totals, pages by path, channels, landing pages, devices, countries/cities, events and a 14-day daily series, each against the previous period.

**GA prerequisites (owner, one-time)** — until these are done every run records `MISSING DATA: GA4 metrics …`:
1. In Google Cloud, create a project (or reuse one), enable the **Google Analytics Data API**, create a service account and a JSON key. No paid service is involved.
2. In GA → Admin → Property access management for property `531225194`, add the service account e-mail with the **Viewer** role.
3. In the cloud environment the routine uses (**Default**, `env_018rtWrDmr1k8DUtRZ8SJrXj`, at claude.ai/code → environment settings), add an environment variable `GA_SERVICE_ACCOUNT_JSON` holding the whole key JSON, and make sure network access allows `analyticsdata.googleapis.com` and `oauth2.googleapis.com`.
4. Optional, recommended: in GA → Admin → Data streams → Define internal traffic, filter your own IP so your visits do not dominate the numbers.

Local run (same output): `GOOGLE_APPLICATION_CREDENTIALS=/path/key.json uv run --script scripts/ga_report.py --days 7`.

**Prompt**
```
You are the Lead for the dovizveri.com product-improvement workflow, running as a scheduled cloud routine in a fresh checkout of erenbesli44/doviz (branch main). Read CLAUDE.md fully and follow its "Multi-agent maintenance workflow" section, plus docs/product.md and docs/scheduled-tasks.md (Task 2). The specialist roles are in .claude/agents/ and can be spawned with the Agent tool using subagent_type = product-analyst | critic-reviewer | developer | qa-verifier.

Setup: `cd finance-api && uv sync --frozen --extra dev` and `cd liquid-economy && npm ci --ignore-scripts`. No .env is needed; the backend test suite is hermetic.

Run the DAILY PRODUCT cycle:
1. Read docs/agent-runs/open-items.md, the three most recent *-product.md records (or the latest *-weekly.md / *-trial.md if none exist) and the most recent *-daily.md. Items with status selected/in-progress/review carry over; do not propose duplicates.
2. Google Analytics: run `uv run --script scripts/ga_report.py --days 7` from the repo root and keep its full markdown output. It compares the last 7 days with the 7 days before and adds a 14-day daily series. If it prints a `MISSING DATA:` line, copy that line verbatim and continue without GA. Never print, echo or log the GA_SERVICE_ACCOUNT_JSON value.
3. Spawn `product-analyst` with a brief: scope, what the last product record measured, which open items are owner-blocked, and the full GA output from step 2 pasted in. Ask it to (a) re-measure every number in docs/product.md section 5 and report deltas, (b) read GA by page path against the "kim ne bekliyor" goals in docs/product.md section 3 (instrument pages /piyasa/*, person pages /uzmanlar/*, home, story pages /haberler/*), traffic channels and landing pages. Traffic is very small: with fewer than 100 sessions in the window, treat GA as directional, never base a proposal on a day-to-day change, and say so. GA has no internal-traffic filter, so visits from the owner may dominate; note it. If every outbound probe to dovizveri.com fails with DNS or connection errors, the sandbox has no network: record `MISSING DATA (sandbox network)` for live measurements instead of reporting an outage.
4. Collect every MISSING DATA line verbatim; never estimate user demand without a source.
5. Merge to at most 3 proposals, each with problem, evidence, baseline, expected outcome, effort, risk, how to measure (name the GA metric and page path when GA can measure it), acceptance criteria. Zero proposals is fine on a quiet day.
6. If there is at least one proposal, spawn `critic-reviewer` in Mode A. Respect a "pick nothing" recommendation.
7. Select at most one implementation item. Anything that is a new product direction, breaking change, schema migration, deploy, infra or secret change is recorded as needs-owner, not implemented.
8. If selected: `developer` implements it on this checkout on a branch `agent/<slug>`; then `qa-verifier` and `critic-reviewer` Mode B; max two fix rounds. Never deploy, never call Coolify/Hetzner, never create .env files, never print secret values.
9. Write docs/agent-runs/YYYY-MM-DD-product.md (today's UTC date; template in docs/agent-runs/README.md) with a "Google Analytics" section containing the GA tables (or the MISSING DATA line) and the post-release measurement plan; update open-items.md and, if numbers changed, docs/product.md section 5. Commit everything on branch `agent/YYYY-MM-DD-product` (merge any implementation branch into it), push, and open a PR to main with `gh pr create` — title `agent: product analysis YYYY-MM-DD`, body = your summary below, ending with the line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Commit messages end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Never push to main, never merge the PR. If push or gh fails, say so in the final message and include the run record text inline.
10. Finish with a summary of at most 15 lines: GA headline (active users, sessions, views, top 3 pages, with deltas), other metric deltas vs the previous product record, proposals + critic verdicts, what was selected and why, the PR link, and every NEEDS OWNER DECISION / MISSING DATA line verbatim.

Rules: never claim success for anything not yet measured on production; never change tests, CLAUDE.md rule sections or .claude/agents/* just to make a check pass; never print secret values.
```

**Expected outputs**: `docs/agent-runs/<date>-product.md` with a Google Analytics section, updated `open-items.md` and `docs/product.md` §5, optionally one branch with evidence.

---

## Task 3 — Daily X plan (growth plan, local desktop task)

- **Task ID:** `x-usdtry-monday-draft`, desktop app scheduled task. Weekdays at 08:30 local time; it runs only while the app is open.
- **Prompt:** the prompt itself lives in `~/.claude/scheduled-tasks/x-usdtry-monday-draft/SKILL.md`, not in this repo.
- **What it does:** applies `docs/social/growth-plan-2026-10.md` §0 from 2026-10-27 to 2026-11-23.
  1. Checks the gates: whether OI-020 is live (the bundle no longer contains "son 12 ay"), the week number, and the posts-per-day limit.
  2. Spawns `social-manager` to write the run file and `social-designer` to make the cards. Every card carries the disclaimer and alt text.
  3. Shows the owner the drafts and waits for approval of each item.
  4. Executes only the approved actions in the built-in browser.
  5. Commits `docs/social/` to main, without pushing.
  6. On Fridays, adds the weekly checkpoint. On or after 2026-11-23, writes the 4-week review.
- **It never:** publishes without approval, deletes legacy posts, or handles credentials.

---

## Owner checklist after each run
1. Read the PR; answer any `NEEDS OWNER DECISION` / `MISSING DATA` lines by editing `open-items.md` or `docs/product.md` (that is how answers reach the next run).
2. Review the diff on the PR; merge it (squash or rebase) or close it with a comment explaining why — the next run reads closed PRs' records only if merged, so record rejections in `open-items.md`.
3. Delete the `agent/*` branch after merge.
4. Deploy, if needed, per `INFRASTRUCTURE.md` §5 — agents never do this.

## Cost guardrails
- Daily run without regression: 1 analyst ≈ 80–120k subagent tokens. With an implementation: + developer/QA/reviewer ≈ 250k.
- Daily product run: product-analyst + critic ≈ 150–200k; with implementation ≈ 450k. Two daily routines together cost roughly 7× the old weekly product run. Review the schedule if product runs select nothing for two weeks in a row (move back to weekly).
