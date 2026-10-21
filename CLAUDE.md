# dovizveri.com — Claude Code project guide

Two deployable services in one repo, plus infra docs:

| Path | What | Stack |
|---|---|---|
| `finance-api/` | BFF API (`api.dovizveri.com`): market quotes, news proxy to the YouTube tracker, consensus/inference proxies | Python 3.12, FastAPI, httpx, uv |
| `liquid-economy/` | Web app (`dovizveri.com`): reading-first news site with market data | React 19, TypeScript, Vite 8, Tailwind 4, nginx BFF proxy |
| `INFRASTRUCTURE.md` | Hetzner + Coolify topology, health probes, deploy procedure, known issues | — |
| `docs/product.md` | Product goals, audience, constraints (assumptions tagged) | — |
| `docs/agent-runs/` | Records of every maintenance/improvement cycle + `open-items.md` registry | — |
| `docs/scheduled-tasks.md` | Prompts + cron for the daily technical check and weekly product analysis | — |
| `.redesign/`, `stitch-designs/` | Superseded design history. Not the current plan. | — |

Product direction (2026-09-20): news-first reading site. Details in `docs/product.md`.

## Verified commands (checked 2026-10-20)

Run from the repo root unless noted. `uv` is at `~/.local/bin/uv`; Node 22.

```bash
# Backend
cd finance-api && uv sync --frozen --extra dev          # one-time / after lock changes
cd finance-api && uv run --frozen pytest -q             # unit tests (excludes -m live/e2e); hermetic, no .env needed
cd finance-api && uv run --frozen ruff check .          # lint (177 findings at baseline)
cd finance-api && uv run --frozen pytest -m live -q     # hits real providers; needs finance-api/.env keys
# Frontend
cd liquid-economy && npm ci --ignore-scripts            # one-time / after lockfile changes
cd liquid-economy && npm run lint                       # eslint (5 errors at baseline)
cd liquid-economy && npm run build                      # tsc -b && vite build → dist/
```

Dev servers: use the `.claude/launch.json` configs (`finance-api` → :8000, `liquid-economy` → :5180, Vite proxies `/api` to the API and injects the key from `liquid-economy/.env.local`). Backend refuses to start without `API_SECRET_KEY` (`finance-api/.env`, gitignored).

Production probes (GET only): `https://dovizveri.com/healthz`, `https://api.dovizveri.com/v1/health`, `https://dovizveri.com/api/v1/news/latest?limit=3`.

### Baseline state at 2026-10-20 (do not "rediscover" these; see `docs/agent-runs/open-items.md`)
- Backend: `pytest` → **21 passed / 1 failed**, no `.env` needed (suite made hermetic 2026-10-20, OI-001 done). The one failure is `test_topic_opinions_returns_flat_structured_opinions` (`person_name` test/code drift, OI-002, awaiting owner decision).
- Backend: `ruff check` → 177 findings, 71 auto-fixable.
- Frontend: `eslint` → 5 errors (`react-hooks/set-state-in-effect` in 4 hooks) + 1 warning; `build` OK, main bundle 678 kB (>500 kB warning).
- No CI workflows exist (`.github/workflows/` absent). No uptime monitoring (INFRASTRUCTURE.md §7).
- Deploy is manual via Coolify API; `git push` does nothing by itself (INFRASTRUCTURE.md §5).

## Conventions
- Python: ruff rules in `finance-api/pyproject.toml` (line length 100, E/F/I/UP/B/SIM). Async everywhere; providers behind `ProviderRegistry`.
- TypeScript: ESLint flat config, React hooks rules enforced. UI copy in Turkish, code and comments in English. Design principles in `docs/product.md` §4.
- Commits: conventional (`feat(scope):`, `fix(scope):`, `chore(scope):`). Tests live in `finance-api/tests/` (pytest) — the frontend has no test runner yet.
- Secrets: never commit; never print values. `finance-api/.env`, `liquid-economy/.env.local`, `.claude/settings.local.json` are gitignored and must stay so. The repo is public.

## Multi-agent maintenance workflow

The main session is the **Lead**. Specialists are defined in `.claude/agents/` and spawned as subagents with a brief that names the mode, the inputs to read and the exact output format.

| Role | File | Writes code? | Used for |
|---|---|---|---|
| product-analyst | `.claude/agents/product-analyst.md` | no | weekly product evidence + ≤3 proposals |
| reliability-analyst | `.claude/agents/reliability-analyst.md` | no | daily build/test/probe check + ≤3 maintenance proposals |
| critic-reviewer | `.claude/agents/critic-reviewer.md` | no | Mode A: challenge proposals (may reject all). Mode B: review the diff |
| developer | `.claude/agents/developer.md` | yes, on `agent/<slug>` branch in a worktree | implement the one selected item |
| qa-verifier | `.claude/agents/qa-verifier.md` | no | reproduce on main, verify on branch, PASS/FAIL per criterion |

### Cycle (Lead runs it; daily = steps 1–2 with reliability only, weekly = full)
1. Read `docs/agent-runs/open-items.md` and the last two run records. Never reopen a closed or rejected item without new evidence.
2. Spawn the analyst(s) in parallel with a brief. Daily: reliability-analyst. Weekly: both.
3. Surface every `MISSING DATA` line to the owner verbatim. Do not fabricate user needs.
4. Merge proposals; keep at most 3 in the run record.
5. Each proposal must have: problem, evidence, baseline, expected outcome, effort, risk, how to measure, acceptance criteria. Drop any that cannot.
6. Spawn critic-reviewer in Mode A. "Pick nothing" is a legitimate recommendation.
7. Lead selects **at most one** implementation item, or none. Record the reasoning.
8. Developer implements on an isolated branch/worktree (`git worktree add -b agent/<slug> ../doviz-wt-<slug> main`).
9. qa-verifier checks acceptance criteria; critic-reviewer (Mode B) reviews the diff.
10. At most **two** fix rounds. If a blocker remains, stop and record it as `blocked`.
11. Deliverable: a PR (only if the owner allowed pushing) or a local branch + `git diff main...agent/<slug>` + test evidence in the run record.
12. Record a post-release measurement plan (metric, method, when, who). Never claim success before it is measured.

### Autonomy boundaries
- **May do without asking**: small, evidence-backed bug fixes and clearly scoped maintenance (test hygiene, lint fixes, dependency bumps without breaking changes, docs), on a branch, with QA + review evidence.
- **Must get the owner's decision first**: new product direction, breaking API/UI change, schema or data migration, production deployment, anything touching secrets/infra (Coolify, Hetzner, nginx, Dockerfiles), pushing to GitHub, adding paid services.
- **Exception for scheduled cloud routines** (see `docs/scheduled-tasks.md`): they run in an isolated cloud checkout, so their only delivery channel is git. A routine may commit to a branch named `agent/<YYYY-MM-DD>-<daily|weekly>`, push it, and open a PR to `main`. It never pushes to `main` and never merges; the merge decision stays with the owner.
- Never change agent rules, `CLAUDE.md` rule sections, or tests merely to make a check pass. If a test is wrong, record it as an open item for the owner.
- Never duplicate work: search `open-items.md` first; update the existing record (status, evidence, date) instead of creating a new one.
- Summarise every cycle in `docs/agent-runs/YYYY-MM-DD-<daily|weekly|trial>.md` using the template in `docs/agent-runs/README.md`, and update `open-items.md` in the same commit.

### Commit attribution for agent work
End commit messages with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; end PR descriptions with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
