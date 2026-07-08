# Task 0.2 — Prisma schema + initial migration

> **Historical archive. Not part of normal runtime context unless explicitly requested.**

- **Status:** done (committed 2026-07-08 through the full pipeline)
- **Branch:** `main`
- **Commits:** `6b95b71` (implementation, 2026-07-08) · `5cefd74` (docs close-out "docs: close out task 0.2, plan task 0.3")
- **Slice:** 0 — Walking skeleton (~60 min budget)

## Goal (from implementation-plan.md)

The complete physical data model — all six tables in one initial migration, so later slices only touch the schema if a real gap appears. Allowed scope: `backend/prisma/` only (plus the `prisma`/`@prisma/client` dependencies).

## Implementation plan

The detailed in-session Implementation Plan text is not available from current evidence (session predates this archive). The task contract (goal, allowed scope, acceptance criteria) is preserved in `docs/implementation-plan.md` Task 0.2 block.

## What was implemented

- `backend/prisma/schema.prisma` (128 lines): six tables — `users`, `email_verification_tokens`, `teams`, `epics`, `tickets`, `comments` — UUID PKs via `gen_random_uuid()` (BR-P05), all timestamps `timestamptz`.
- Initial migration `20260708115533_init/migration.sql` (138 lines) incl. raw-SQL additions: case-insensitive unique indexes on normalized `users.email` and `lower(trim(teams.name))` (BR-A02/BR-T05/R6); `type`/`state` as text + CHECK constraints on canonical strings (BR-K02/K03); FK rules RESTRICT for `epics.team_id`/`tickets.team_id`/`tickets.epic_id`, CASCADE for `comments.ticket_id` (BR-T06/BR-E06/BR-K15); plus a `users_email_normalized_check` DB backstop (accepted hardening).
- Deliberately no Prisma `generator` block and no `@updatedAt` on `modified_at` — BR-K11/K12 forbid ORM auto-touch; confirmed correct by QA.

## Files changed

5 files, +697/−1 (from `git show --stat 6b95b71`): `schema.prisma`, `migrations/20260708115533_init/migration.sql`, `migration_lock.toml`, `backend/package.json` (+`prisma`/`@prisma/client` ^6.19.3 only), lockfile.

## Validation / test evidence

Per the pipeline record (project-state.md §2 at close-out; qa-review-log): self-check **5/5 PASS**; `npx prisma validate` + migration applied cleanly; qa-reviewer independently re-verified live against a fresh postgres:16 scratch DB (FK delete rules via `pg_constraint`, CHECK/index negative tests, fresh-DB row counts).

## QA result

**PASS** — task-scoped pre-commit qa-reviewer review, 2026-07-08 (entry in `docs/qa/qa-review-log.md`). No Critical/Major findings. Non-blocking findings:
1. *(Minor)* three Prisma-default RESTRICT FKs not enumerated in architecture.md §4 (`email_verification_tokens.user_id`, `tickets.created_by`, `comments.author_id`) — consistent in spirit; optional docs addendum recommended.
2. *(Minor)* BR-K15 only half-covered by DB cascade; delete-confirmation UI waits for the ticket UI (CHK-TKT-13/14 not yet coverable).
3. *(Cosmetic, watch-item)* future signup handler must map `users_email_normalized_check` / `users_email_key` violations to the BR-P04 409 contract, never a raw 500 (carried to Task 1.1).

## Decisions

- **Prisma pinned to v6 (6.19.3), not v7** — v7 requires `prisma.config.ts` at the backend root + runtime driver-adapter packages, outside the task's file boundary; v6 matches the documented classic `DATABASE_URL` workflow. Reversible; QA-adjudicated and accepted. Recorded in project-state.md §4 and qa-review-log.
- `users_email_normalized_check` accepted as hardening beyond architecture.md §4's letter.

## Risks / follow-ups

Findings 1–3 carried as watch-items (1 = optional docs addendum, 2 = waits for ticket UI, 3 = active at Task 1.1).

## Evidence sources

`git show --stat 6b95b71` · `git log --oneline` · `docs/qa/qa-review-log.md` (2026-07-08 Task 0.2 entry) · `docs/implementation-plan.md` Task 0.2 block · `docs/project-state.md` §1/§2/§4.
