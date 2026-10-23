# Agent run records

One file per cycle: `YYYY-MM-DD-<daily|product|weekly|trial>.md`. `open-items.md` is the single registry of known problems and decisions; update it in the same commit as the run record. Never create a second record for the same problem — update the existing item's status and evidence.

## Run record template
```
# <daily|product|weekly|trial> run — YYYY-MM-DD
Lead: <session/model>   Agents used: <list>   Duration: <approx>

## 1. Inputs read
- open-items.md (n open), last records: ...

## 2. Evidence summary
- ...

## 3. Missing data (verbatim from analysts)
- MISSING DATA: ...

## 4. Proposals (≤3) — problem / evidence / baseline / expected outcome / effort / risk / how to measure
### P1 ...
## 5. Critic verdicts
| Proposal | Verdict | Reason |
## 6. Lead decision
Selected: <one item or none> — reasoning
## 7. Implementation (if any)
Branch / worktree / commits; developer report tail; QA report; review verdict; fix rounds used (max 2); blockers.
## 8. Deliverable
PR link or `git diff main...agent/<slug>` + test evidence
## 9. Post-release measurement plan
| Metric | Method | When | Owner |
## 10. open-items.md changes
- OI-xxx: created/updated → status
```

## Item statuses
`open` → `selected` → `in-progress` → `review` → `done` (merged + measured) | `blocked` | `rejected` (with reason) | `needs-owner`.
