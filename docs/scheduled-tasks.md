# Scheduled task instructions

Two recurring Claude Code tasks drive the workflow in `CLAUDE.md`. Register them with the Claude Code scheduled-tasks feature (`/schedule` in an interactive `claude` session, or the Scheduled tasks UI in the desktop app). Each task runs as the **Lead** in this repository with the prompt below. Both are read-mostly; neither pushes, deploys, or touches secrets.

Prerequisites for the runner environment: the repo checked out at `main`, `uv` and Node 22 available, outbound HTTPS to `dovizveri.com`/`api.dovizveri.com` (for probes) and to npm/PyPI (for installs). No `.env` is required once `agent/hermetic-tests` is merged (OI-001). A GitHub remote is needed only if the owner later allows the Lead to push branches/open PRs.

---

## Task 1 — Daily technical check
- **Name**: `doviz-daily-tech-check`
- **Schedule**: `30 6 * * 1-5` (Europe/Istanbul, weekdays 06:30) — before the owner's day starts; skip weekends to save tokens.
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
6. Write docs/agent-runs/YYYY-MM-DD-daily.md using the template in docs/agent-runs/README.md, update open-items.md (statuses, evidence, dates), and leave the changes uncommitted on main for the owner to review (do not commit to main; branches created for implementation may contain commits).
7. Finish with a ≤10-line summary for the owner: status table deltas, what was selected, the branch to review, and every NEEDS OWNER DECISION / MISSING DATA line verbatim.
Rules: never change tests or agent rules just to pass; never print secret values; surface anything requiring an owner decision instead of doing it.
```

**Expected outputs**: `docs/agent-runs/<date>-daily.md`, updated `open-items.md`, optionally a branch `agent/<slug>` with QA + review evidence.

---

## Task 2 — Weekly product analysis
- **Name**: `doviz-weekly-product-analysis`
- **Schedule**: `0 7 * * 1` (Europe/Istanbul, Monday 07:00).
- **Scope**: the full 12-step cycle with both analysts.

**Prompt**
```
You are the Lead for the dovizveri.com maintenance and product-improvement workflow. Read CLAUDE.md fully and follow its "Multi-agent maintenance workflow" section and docs/product.md.

Run the WEEKLY cycle:
1. Read docs/agent-runs/open-items.md, the most recent *-weekly.md (or *-trial.md) and the last five *-daily.md records. Items with status `selected`/`in-progress`/`review` carry over; do not propose duplicates.
2. Spawn `product-analyst` and `reliability-analyst` in parallel with briefs (scope, what was measured last week, which open items are owner-blocked). Ask the product analyst to re-measure every number in docs/product.md §5 and to report deltas.
3. Collect every MISSING DATA line verbatim; never estimate user demand without a source.
4. Merge to at most 3 proposals, each with problem, evidence, baseline, expected outcome, effort, risk, how to measure, acceptance criteria.
5. Spawn `critic-reviewer` Mode A. Respect a "pick nothing" recommendation.
6. Select at most one implementation item. Anything that is a new product direction, breaking change, schema migration, deploy, infra or secret change is recorded as `needs-owner`, not implemented.
7. If selected: developer in a worktree on `agent/<slug>`; then `qa-verifier` and `critic-reviewer` Mode B; max two fix rounds. Never push, never deploy.
8. Write docs/agent-runs/YYYY-MM-DD-weekly.md (template in docs/agent-runs/README.md) including the post-release measurement plan; update open-items.md and, if numbers changed, docs/product.md §5. Leave changes uncommitted on main for the owner.
9. Finish with a ≤15-line summary: metric deltas vs last week, proposals + critic verdicts, what was selected and why, the branch to review, and every NEEDS OWNER DECISION / MISSING DATA line verbatim.
Rules: never claim success for anything not yet measured on production; never change tests or agent rules just to pass; never print secret values.
```

**Expected outputs**: `docs/agent-runs/<date>-weekly.md`, updated `open-items.md` and `docs/product.md` §5, optionally one branch with evidence.

---

## Owner checklist after each run
1. Read the summary; answer any `NEEDS OWNER DECISION` / `MISSING DATA` lines by editing `open-items.md` or `docs/product.md` (that is how answers reach the next run).
2. Review the branch: `git diff main...agent/<slug>`; merge with `git merge --ff-only agent/<slug>` and remove the worktree.
3. Commit the run record (`docs/agent-runs/*`) together with the merge.
4. Deploy, if needed, per `INFRASTRUCTURE.md` §5 — agents never do this.

## Cost guardrails
- Daily run without regression: 1 analyst ≈ 80–120k subagent tokens. With an implementation: + developer/QA/reviewer ≈ 250k.
- Weekly run: 2 analysts + critic ≈ 300k; with implementation ≈ 550k. Review the schedule if runs routinely select nothing for two weeks (reduce to weekly only).
