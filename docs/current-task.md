# Current Task

**Overwritten at every task transition.** Usage rules: [context-management.md](context-management.md) §4. Task source: [implementation-plan.md](implementation-plan.md).

---

## Current slice

**Slice 1 — Auth & email verification** (10 h budget, 9 tasks) — [implementation-plan.md](implementation-plan.md). The critical path (R1): every other DoD item sits behind a verified login.

## Current task

**Task 1.1 — Signup endpoint** (~60 min) — status: **not started**

## Goal

`POST /api/auth/signup` creates a user with a properly hashed password and normalized email. No mail yet (mailer is Task 1.2). Architecture reference: [architecture.md](architecture.md) §5 (API surface, error contract) and §6 (Q5 duplicate-signup decision).

## Allowed files/areas

- `backend/src/routes/auth.ts` (new), `backend/src/lib/password.ts` (new), related types.
- `backend/src/server.ts`: route registration only.
- `backend/test/auth-signup.test.ts` (new) — minimal smoke test.
- `backend/package.json`: `argon2` dependency (+ types if needed) only.

## Forbidden changes

- No schema/migration edits (`backend/prisma/` is done); a real gap found here is scope drift → stop and ask.
- No mailer/token/verification/login logic (Tasks 1.2–1.4).
- No frontend changes.
- No seed data; no secrets in the repo.
- Stack fixed per [architecture.md](architecture.md) §1; Prisma stays at **v6.19.3**.

## Acceptance criteria

1. Email trimmed + lowercased before storage/comparison; simple pattern check (BR-A02, Q1/Q2).
2. Password ≥8 and ≤200 chars, hashed with argon2 — never stored or logged in plaintext (BR-A04).
3. Duplicate email → 409 `{error:{code,message}}` (Q5 decision).
4. Success → 201; user starts unverified.

## Commands to run

```
cd backend && npx vitest run test/auth-signup.test.ts
```

## QA gate expectation

Task-scoped qa-reviewer review before commit (auth handling → review mandatory per [agentic-workflow.md](agentic-workflow.md)).

## Carried-over watch-items

**Active in this task:**

- From Task 0.1 (QA 2026-07-07): `error-mapper.ts` falls back to `err.code ?? 'BAD_REQUEST'` for 4xx — **this is the first validated endpoint**: re-check BR-P04 so Fastify-internal validation codes don't leak into the contract.
- From Task 0.2 (QA 2026-07-08): the signup handler must map `users_email_normalized_check` and `users_email_key` violations to the standard BR-P04 `{error:{code,message}}` / 409 contract — never a raw 500.

**Carried forward (not this task):**

- BR-K15 delete-confirmation UI (CHK-TKT-13/14) — waits for the ticket UI.
- Optional docs-only addendum to [architecture.md](architecture.md) §4: three Prisma-default RESTRICT FKs are intentional.
- From QA gate 0 (2026-07-08): `README.md` still a bare title (BR-O07/CHK-OPS-06) — must land before any demo-readiness claim; CHK-OPS-01 run on Windows only, macOS/Linux clean-machine run open (R2).

## Next step after completion

Overwrite this file with **Task 1.2 — Mailer + verification-token issue & send** (block in [implementation-plan.md](implementation-plan.md), Slice 1), then proceed per [agentic-workflow.md](agentic-workflow.md).
