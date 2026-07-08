# Current Task

**Overwritten at every task transition.** Usage rules: [context-management.md](context-management.md) §4. Task source: [implementation-plan.md](implementation-plan.md).

---

## Current slice

**Slice 0 — Walking skeleton** (4 h budget, 3 tasks) — [implementation-plan.md](implementation-plan.md)

## Current task

**Task 0.3 — Compose stack + test harness + clean-checkout proof** (~90 min) — status: **not started**

## Goal

`docker compose up --build` brings up the whole stack from a clean checkout; the test harness runs one trivial API test against the compose DB. Slice-closing task — ends in **full QA gate 0**. Architecture reference: [architecture.md](architecture.md) §2 (topology) and §7 (testing).

## Allowed files/areas

- Repo root: `docker-compose.yml`, `Dockerfile` (multi-stage per [architecture.md](architecture.md) §2), `.env.example`.
- `backend/test/` (new): `health.test.ts`; `backend/vitest.config.ts`.
- `backend/package.json`: test scripts + test devDependencies (vitest, supertest) only.
- Minor backend startup wiring only as needed to run `prisma migrate deploy` on boot (per [architecture.md](architecture.md) §2 — migrations run on app start).

## Forbidden changes

- No auth logic, no business endpoints, no Prisma client repositories/queries beyond what boot-time `migrate deploy` wiring strictly needs.
- No schema/migration edits (`backend/prisma/` is done — task 0.2, commit 6b95b71); a real gap found here is scope drift → stop and ask.
- No seed data in any startup path (BR-P09/P10).
- No secrets in the repo: DB password only via the declared bounded exception `${POSTGRES_PASSWORD:-…}` (dev-only label); SMTP secrets stay out of source (`.env.example` documents names, not values).
- No edits to `requirements/`, `docs/qa/` (except what the full gate itself requires), `CLAUDE.md`, `frontend/` app code.
- Stack fixed per [architecture.md](architecture.md) §1; Prisma stays at **v6.19.3** (classic `DATABASE_URL` workflow — pinned decision, [project-state.md](project-state.md) §4 2026-07-08).

## Acceptance criteria

1. `docker compose down -v && docker compose up --build` → app on **:8080** (SPA shell + `/api/health`), Mailpit UI on **:8025**, healthchecks green, `depends_on` ordering respected (BR-O01…O03).
2. Fresh DB contains schema + migration metadata only — zero application rows (BR-P09/P10, DoD-9).
3. One vitest + supertest test (`backend/test/health.test.ts`) passes against the running stack's API.
4. DB password follows the declared bounded exception (`${POSTGRES_PASSWORD:-…}` labeled dev-only); no other secrets in the repo.
5. `.env.example` documents the `relay1.dataart.com` SMTP override.

## Commands to run

```
docker compose down -v && docker compose up --build
cd backend && npm test
```

## QA gate expectation

**Full QA gate 0** (slice-closing — protocol in [implementation-plan.md](implementation-plan.md) "QA gate protocol"): run CHK-OPS-01/02/03/10 against the compose stack and include the evidence; invoke qa-reviewer with the slice goal, changed files, and BR-O01…O03 / BR-P09/P10 claims; **record the DB-password carve-out sign-off** (DoD-7/8 bounded exception) in [qa/qa-review-log.md](qa/qa-review-log.md) with carve-out notes on CHK-AUTH-19 / CHK-OPS-04 — must land before this gate closes ([project-state.md](project-state.md) §5); then update [project-state.md](project-state.md) §1/§2 and the qa-review-log.

## Carried-over watch-items

From Task 0.1 (retroactive QA review, 2026-07-07, PASS):

- `error-mapper.ts` falls back to `err.code ?? 'BAD_REQUEST'` for 4xx — once real Fastify schema validation lands (first validated endpoint, slice 1), re-check BR-P04 so Fastify-internal codes don't leak into the contract.
- Committed automated test for `/api/health` / error contract lands **in this task** (`backend/test/health.test.ts`) — don't let it slip.

From Task 0.2 (QA review 2026-07-08, PASS — entries in [qa/qa-review-log.md](qa/qa-review-log.md)):

- The future signup handler (task 1.1) must map `users_email_normalized_check` and `users_email_key` violations to the standard BR-P04 `{error:{code,message}}` / 409 contract — never a raw 500.
- BR-K15 is only half-covered by the DB cascade; CHK-TKT-13/14 (delete confirmation UI) stay uncovered until the ticket UI lands.
- Optional docs-only addendum to [architecture.md](architecture.md) §4: note the three Prisma-default RESTRICT FKs (`email_verification_tokens.user_id`, `tickets.created_by`, `comments.author_id`) as intentional.

## Next step after completion

Slice 0 done. Overwrite this file with **Task 1.1 — Signup endpoint** (block in [implementation-plan.md](implementation-plan.md), Slice 1), then proceed per [agentic-workflow.md](agentic-workflow.md).
