# Current Task

**Overwritten at every task transition.** Usage rules: [context-management.md](context-management.md) §4. Task source: [implementation-plan.md](implementation-plan.md).

---

## Current slice

**Slice 0 — Walking skeleton** (4 h budget, 3 tasks) — [implementation-plan.md](implementation-plan.md)

## Current task

**Task 0.2 — Prisma schema + initial migration** (~60 min) — status: **not started**

## Goal

The complete physical data model — all six tables in one initial migration, so later slices only touch the schema if a real gap appears. Architecture reference: [architecture.md](architecture.md) §4.

## Allowed files/areas

- `backend/prisma/` **only**: `schema.prisma`, `migrations/…` (initial migration incl. raw-SQL additions).
- `backend/package.json` may gain the `prisma`/`@prisma/client` dependencies required to run the tooling — no other changes.

## Forbidden changes

- No `docker-compose.yml`, no `Dockerfile` (task 0.3).
- No runtime DB access from the app: no Prisma client wiring in `src/`, no repositories, no endpoints beyond the existing `/api/health`.
- No auth logic, no business endpoints, no seed data of any kind (BR-P09/P10).
- No edits to `requirements/`, `docs/qa/`, `CLAUDE.md`, `frontend/`, or existing `.gitignore` entries.
- Stack is fixed per [architecture.md](architecture.md) §1 — no ORM/library substitutions.

## Acceptance criteria

1. Tables `users`, `email_verification_tokens`, `teams`, `epics`, `tickets`, `comments` with UUID PKs (`gen_random_uuid()`) — BR-P05.
2. FK rules per [architecture.md](architecture.md) §4: RESTRICT for `epics.team_id`, `tickets.team_id`, `tickets.epic_id`; CASCADE for `comments.ticket_id` (BR-T06, BR-E06, BR-K15).
3. Raw-SQL case-insensitive unique indexes: `users.email` (stored normalized), `lower(trim(teams.name))` (BR-A02, BR-T05, R6).
4. `type`/`state` as text + CHECK constraints on the canonical strings (BR-K02/K03); all timestamps `timestamptz`.
5. `npx prisma validate` passes; migration applies cleanly to a local/dockerized Postgres.

## Commands to run

```
cd backend && npx prisma validate
cd backend && npx prisma migrate dev   # against a scratch database
```

## QA gate expectation

**Task-scoped qa-reviewer review before commit** (not a full gate). Schema is regression-critical — flag any FK/index deviation. Provide: task goal, changed-file list, claimed IDs (BR-P05, BR-T06, BR-E06, BR-K15, BR-A02, BR-T05, BR-K02/K03), and validate/migrate output. Full QA gate 0 comes at the end of task 0.3.

## Carried-over watch-items (from Task 0.1 retroactive QA review, 2026-07-07, verdict PASS)

- `error-mapper.ts` falls back to `err.code ?? 'BAD_REQUEST'` for 4xx — once real Fastify schema validation lands (first validated endpoint), re-check BR-P04 so Fastify-internal codes don't leak into the contract.
- No committed automated test yet for `/api/health` / error contract — task 0.3 adds `backend/test/health.test.ts`; don't let it slip.

## Next step after completion

Overwrite this file with **Task 0.3 — Compose stack + test harness + clean-checkout proof** (block in [implementation-plan.md](implementation-plan.md), Slice 0), then proceed per [agentic-workflow.md](agentic-workflow.md).
