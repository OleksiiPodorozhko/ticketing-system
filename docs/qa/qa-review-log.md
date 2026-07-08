# QA Review Log — Index

Lightweight **navigation index** of QA reviews — one table row per completed review, newest **last**. This file is runtime state (see [../context-management.md](../context-management.md) §7) and must stay small: **full reports live in [reviews/](reviews/)**, one file per review, written by `task-qa` at review time. Review files are historical archives — immutable once written, and not read during normal pipeline runs.

**Rules**

- One row per review: date · task/scope · verdict · link to the full report in `reviews/` · open follow-ups (concise IDs/phrases only).
- Rows are append-only. Corrections go in a **new** row (and a new review file) referencing the old one — never rewrite past rows or past review files.
- **Never paste a full QA report into this file.** The complete report (scope, findings, decisions, open items) belongs only in its `reviews/` file.
- Review filenames: `reviews/YYYY-MM-DD-task-<N>-<slug>.md`, or `reviews/YYYY-MM-DD-<topic>.md` for non-task reviews.

| Date | Task / scope | Verdict | Review file | Open follow-ups |
|---|---|---|---|---|
| 2026-07-07 | Baseline requirements review & QA doc-set creation | — (baseline) | [2026-07-07-baseline-requirements-review.md](reviews/2026-07-07-baseline-requirements-review.md) | Q8 mail path (top risk at the time); Q4/Q5/Q10/Q12/Q21/Q22/Q25/Q33/Q44 on interim stances; PDF spot-check pending tooling; BR-O08 test-slot selection |
| 2026-07-07 | Task 0.1 scaffolding — retroactive review & reconciliation | PASS | [2026-07-07-task-0.1-retroactive-review.md](reviews/2026-07-07-task-0.1-retroactive-review.md) | error-mapper `err.code` fallback watch-item; committed health test deferred to Task 0.3 |
| 2026-07-08 | Task 0.2 Prisma schema + initial migration (pre-commit) | PASS | [2026-07-08-task-0.2-prisma-schema-review.md](reviews/2026-07-08-task-0.2-prisma-schema-review.md) | signup 409/CHECK error mapping watch-item; BR-K15 UI-confirmation half; optional architecture §4 FK addendum |
| 2026-07-08 | Task 0.3 compose stack + harness — **QA gate 0** (slice-0 close) | PASS WITH RISKS | [2026-07-08-task-0.3-gate0.md](reviews/2026-07-08-task-0.3-gate0.md) | README bare (BR-O07); R2 cross-platform compose run; DB-password carve-out bounded (any widening reopens BR-A15); 0.1/0.2 watch-items carried |
