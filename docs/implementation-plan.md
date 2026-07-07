# Implementation Plan

**Shape:** vertical slices, executed as small tasks. Every slice delivers API + UI + server-side rules + at least a smoke-level test for one feature, ends in a working `docker compose up --build` stack, and passes a **full QA gate** before the slice is called done. No slice starts until the previous slice's gate passed — a half-finished later slice is worth less than a demo-ready earlier one.

Sources: [architecture.md](architecture.md) (stack & decisions) · [business-rules.md](business-rules.md) (BR) · [user-flows.md](user-flows.md) (F) · [implementation-risks.md](implementation-risks.md) (R) · [qa/test-checklist.md](qa/test-checklist.md) (CHK). Live status is tracked in [project-state.md](project-state.md); the active task lives in [current-task.md](current-task.md). Execution process: [agentic-workflow.md](agentic-workflow.md) · [context-management.md](context-management.md).

---

## Task protocol

Each slice is broken into numbered tasks (**0.1, 0.2, …**) sized for one focused Claude session (**30–90 minutes** of implementation). Rules:

- **One task at a time.** The active task is copied into [current-task.md](current-task.md) before implementation starts; the implementer works only inside that task's allowed scope.
- **Tasks are sequenced.** Within a slice, execute in numeric order unless a task's block says otherwise.
- **Risk-based QA**:
  - **Self-check before every task commit** — the implementation agent must check the task acceptance criteria, changed files, and relevant test output before committing.
  - **Task-scoped `@qa-reviewer` review only for high-risk changes** — authentication, authorization, email verification, database schema/migrations, Docker Compose, persistence rules, delete restrictions, ticket state transitions, comments, or requirement/QA documentation changes.
  - **Full QA gate** — the last task of each slice always ends in the full QA gate below: checklist items + `@qa-reviewer` + `docs/qa/qa-review-log.md` entry + `docs/project-state.md` update.
  - **Trivial docs-only commits** do not require `@qa-reviewer`.
- Every task block states: **Goal · Allowed scope · Files/areas · Acceptance criteria · Test/check · QA review**. Estimates are indicative; slice budgets are the binding constraint.

## QA gate protocol (every slice)

Per CLAUDE.md, at the end of each slice, **before the slice-closing commit**:

1. Run the smallest relevant test set for the slice; then the full suite if shared behavior changed.
2. Manually run the slice's CHK items from [qa/test-checklist.md](qa/test-checklist.md) against the compose stack.
3. **Invoke `@qa-reviewer`** with: the slice goal, changed files, and the BR/F/CHK IDs claimed as covered.
4. Address Critical/Major findings before committing; log the review in [qa/qa-review-log.md](qa/qa-review-log.md); update [project-state.md](project-state.md).
5. Commit only with test command output in hand — no completion claims without it.

Verdict `FAIL` or `BLOCKED` from qa-reviewer stops the line: fix or descope before moving on.

## Budget overview (48 h)

| # | Slice | Tasks | Est. | Cum. | Demoable outcome |
|---|---|---|---|---|---|
| 0 | Walking skeleton | 3 | 4 h | 4 | Compose stack up: SPA shell, health, migrated empty DB, Mailpit |
| 1 | Auth & email verification | 9 | 10 h | 14 | Sign-up → email → verify → login → logout (DoD-1) |
| 2 | Teams | 2 | 3 h | 17 | Team CRUD with 409 guard (DoD-2 half) |
| 3 | Epics | 2 | 3 h | 20 | Epic CRUD with 409 guard (DoD-2 done) |
| 4 | Tickets | 6 | 8 h | 28 | Ticket CRUD + invariants; list-view stand-in for board (DoD-3) |
| 5 | Comments | 2 | 2 h | 30 | Comments on tickets (DoD-4) |
| 6 | Kanban board | 5 | 8 h | 38 | Drag-and-drop board + filters (DoD-5, DoD-6) |
| 7 | Hardening & delivery | 4 | 6 h | 44 | Fresh-machine startup proof, README, test suite complete (DoD-7…10) |
| — | Buffer | — | 4 h | 48 | Absorbed by whatever slips (expect: 1 and 6) |

Slices 2, 3, 5 are deliberately thin — same CRUD skeleton reused. Slices 1, 4, 6 carry the risk (R1/R7, R3/R4, R9/R10).

---

## Slice 0 — Walking skeleton (4 h)

Everything infrastructural, once, while the codebase is empty — de-risks R2 (cross-platform compose) on day one. Architecture reference: [architecture.md](architecture.md) §2–§4.

### Task 0.1 — Backend & frontend scaffolding (~75 min)

- **Goal:** Compilable backend and frontend skeletons with a health endpoint, error contract, and SPA shell — no Docker, no database yet.
- **Allowed scope:** `backend/`, `frontend/`, `.gitignore` (append Node entries only).
- **Files/areas:** `backend/package.json`, `backend/tsconfig.json`, `backend/src/server.ts`, `backend/src/routes/health.ts`, `backend/src/plugins/error-mapper.ts`; `frontend/package.json`, `frontend/src/` (Vite + React + TS, router with route stubs for the 8 required screens).
- **Acceptance criteria:**
  1. Backend starts in dev mode; `GET /api/health` returns 200 with a JSON body.
  2. A deliberately thrown error is returned as `{error:{code,message}}` by the error-mapper plugin (BR-P04).
  3. `frontend` builds; the SPA shell renders with router stubs for board, ticket, teams, epics, login, signup, verify.
  4. `.gitignore` covers `node_modules/`, build output, `.env`.
- **Test/check:** `cd backend && npm run build`; `cd frontend && npm run build`; manual `curl http://localhost:<port>/api/health` against the dev server.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 0.2 — Prisma schema + initial migration (~60 min)

- **Goal:** The complete physical data model — all six tables in one initial migration, so later slices only touch the schema if a real gap appears.
- **Allowed scope:** `backend/prisma/` only.
- **Files/areas:** `backend/prisma/schema.prisma`, `backend/prisma/migrations/…` (initial migration incl. raw-SQL additions).
- **Acceptance criteria:**
  1. Tables `users`, `email_verification_tokens`, `teams`, `epics`, `tickets`, `comments` with UUID PKs (`gen_random_uuid()`) — BR-P05.
  2. FK rules per [architecture.md](architecture.md) §4: RESTRICT for `epics.team_id`, `tickets.team_id`, `tickets.epic_id`; CASCADE for `comments.ticket_id` (BR-T06, BR-E06, BR-K15).
  3. Raw-SQL case-insensitive unique indexes: `users.email` (stored normalized), `lower(trim(teams.name))` (BR-A02, BR-T05, R6).
  4. `type`/`state` as text + CHECK constraints on the canonical strings (BR-K02/K03); all timestamps `timestamptz`.
  5. `npx prisma validate` passes; migration applies cleanly to a local/dockerized Postgres.
- **Test/check:** `cd backend && npx prisma validate && npx prisma migrate dev` against a scratch database.
- **QA review:** task-scoped qa-reviewer before commit (schema is regression-critical — flag any FK/index deviation).

### Task 0.3 — Compose stack + test harness + clean-checkout proof (~90 min)

- **Goal:** `docker compose up --build` brings up the whole stack from a clean checkout; the test harness runs one trivial API test against the compose DB.
- **Allowed scope:** `docker-compose.yml`, `Dockerfile`, `.env.example`, `backend/test/`, `backend/package.json` (test scripts), minor backend startup wiring (`prisma migrate deploy` on boot).
- **Files/areas:** repo-root compose + multi-stage Dockerfile per [architecture.md](architecture.md) §2; `backend/test/health.test.ts`; `backend/vitest.config.ts`.
- **Acceptance criteria:**
  1. `docker compose down -v && docker compose up --build` → app on :8080 (SPA shell + `/api/health`), Mailpit UI on :8025, healthchecks green, `depends_on` ordering respected (BR-O01…O03).
  2. Fresh DB contains schema + migration metadata only — zero application rows (BR-P09/P10, DoD-9).
  3. One vitest + supertest test passes against the running stack's API.
  4. DB password follows the declared bounded exception (`${POSTGRES_PASSWORD:-…}` labeled dev-only); no other secrets in the repo.
  5. `.env.example` documents the `relay1.dataart.com` SMTP override.
- **Test/check:** `docker compose down -v && docker compose up --build`; `cd backend && npm test`.
- **QA review:** **Full QA gate 0** — CHK-OPS-01/02/03/10 evidence + qa-reviewer review of compose/migration/layout vs BR-O01…O03, BR-P09/P10; record the DB-password carve-out per [project-state.md](project-state.md) §5.

## Slice 1 — Auth & email verification (10 h) — F1–F4, DoD-1

The critical path (R1): every other DoD item sits behind a verified login. Largest slice; do it first, do it completely. Tasks 1.1–1.5 are API, 1.6–1.7 UI, 1.8–1.9 the two BR-O08 test slots.

### Task 1.1 — Signup endpoint (~60 min)

- **Goal:** `POST /api/auth/signup` creates a user with a properly hashed password and normalized email. No mail yet.
- **Allowed scope:** `backend/src/routes/auth.ts`, `backend/src/lib/password.ts`, related types; a minimal smoke test.
- **Files/areas:** as above + `backend/test/auth-signup.test.ts`.
- **Acceptance criteria:**
  1. Email trimmed + lowercased before storage/comparison; simple pattern check (BR-A02, Q1/Q2).
  2. Password ≥8 and ≤200 chars, hashed with argon2 — never stored or logged in plaintext (BR-A04).
  3. Duplicate email → 409 `{error:{code,message}}` (Q5 decision).
  4. Success → 201; user starts unverified.
- **Test/check:** `cd backend && npx vitest run test/auth-signup.test.ts`.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 1.2 — Mailer + verification-token issue & send (~75 min)

- **Goal:** Signup issues a 24 h verification token (stored hashed) and sends the verification email through env-configured SMTP; Mailpit receives it.
- **Allowed scope:** `backend/src/lib/mailer.ts`, `backend/src/lib/tokens.ts`, signup handler wiring, env plumbing in compose/`.env.example`.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. nodemailer configured purely from env (host/port/credentials); defaults point at the compose Mailpit (BR-A05, BR-A15).
  2. Token: random 256-bit, stored hashed, `expires_at = created + 24h` (BR-A07/A08).
  3. Email contains a link to `{APP_BASE_URL}/verify?token=…` (Q7 — the sole token-in-URL exception, BR-A14).
  4. After signup, the message is visible in Mailpit with the correct link.
- **Test/check:** `docker compose up --build`, sign up via curl, inspect Mailpit at :8025 (or its REST API).
- **QA review:** task-scoped qa-reviewer before commit.

### Task 1.3 — Verify + resend endpoints (~90 min)

- **Goal:** Full token lifecycle: verification consumes a valid token; resend reissues and invalidates older tokens; edges behave per spec.
- **Allowed scope:** `backend/src/routes/auth.ts`, `backend/src/lib/tokens.ts`.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. `POST /api/auth/verify` (token in body): valid unconsumed unexpired token → account verified, token consumed (single-use, BR-A08/A09).
  2. Expired / consumed / unknown token → clear error responses (BR-A08, R7).
  3. Token for an already-verified account → friendly "already verified" result (Q10).
  4. `POST /api/auth/resend` (email in body): issues a new token, invalidates the user's earlier unused tokens (BR-A11), naive in-memory 1/min/email guard (Q6).
- **Test/check:** `cd backend && npx vitest run test/auth-signup.test.ts` (regression) + manual curl walkthrough of one verify path.
- **QA review:** task-scoped qa-reviewer before commit (R7 edges are the review focus).

### Task 1.4 — Login, logout, me + JWT cookie (~60 min)

- **Goal:** Session establishment via signed JWT in an httpOnly cookie; unverified accounts blocked with a distinguishable 403.
- **Allowed scope:** `backend/src/routes/auth.ts`, `backend/src/lib/` (JWT helper).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. `POST /api/auth/login`: valid verified credentials → JWT httpOnly cookie, 7-day lifetime (Q3); token never in a URL (BR-A14).
  2. Wrong credentials → 401; correct credentials but unverified → 403 with a code the UI can map to a resend affordance (Q4, BR-A06).
  3. `POST /api/auth/logout` clears the cookie (Q43); `GET /api/auth/me` returns the authenticated user's email.
- **Test/check:** curl walkthrough (login → me → logout → me = 401); backend suite still green.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 1.5 — Auth-guard plugin (~45 min)

- **Goal:** Everything outside the public allowlist rejects unauthenticated/unverified requests — the R12 boundary.
- **Allowed scope:** `backend/src/plugins/auth-guard.ts`, route registration wiring.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Public: signup, login, verify, resend, `/api/health`, static SPA assets — nothing else (BR-A13).
  2. Any other `/api/*` without a valid cookie → 401; valid cookie but unverified account → 403.
  3. Guard is applied by default (opt-out for public routes, not opt-in for protected ones) so new routes are protected automatically.
- **Test/check:** curl sweep of a protected stub route with no cookie / unverified cookie / verified cookie.
- **QA review:** task-scoped qa-reviewer before commit (BR-A13/A14 boundary emphasis).

### Task 1.6 — UI: sign-up + login screens (~75 min)

- **Goal:** Working sign-up and login forms wired to the API, with the error states QA will probe.
- **Allowed scope:** `frontend/src/pages/` (signup, login), `frontend/src/api/` (typed fetch client for auth).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Sign-up: client validation mirrors server rules; server errors (409 duplicate, validation) surfaced clearly; success shows "check your email" guidance (F1).
  2. Login: 401 shows a credentials error; 403-unverified shows the message + resend affordance (W2 pattern, Q4).
  3. No token/session id ever appears in a URL.
- **Test/check:** `cd frontend && npm run build`; manual browser pass of both forms against the compose stack.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 1.7 — UI: verification result, resend, route guard, header (~75 min)

- **Goal:** Complete the auth UI loop: `/verify` SPA route posts the URL token to the API; unauthenticated users are redirected; the shell shows who is logged in.
- **Allowed scope:** `frontend/src/pages/` (verify, resend), router guard, header component, auth context/state.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. `/verify?token=…` posts the token, then shows success (→ link to login, BR-A10), expired/invalid (→ resend affordance), or already-verified states (F2, Q10).
  2. Resend form asks for the email address (Q9).
  3. Route guard: unauthenticated access to protected routes redirects to login (F4).
  4. Header shows the user's email + Log out (working against `me`/`logout`).
- **Test/check:** manual browser pass: full sign-up → email → verify → login → logout loop on the compose stack.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 1.8 — Token-lifecycle integration tests (~90 min) — backend test slot, part 1

- **Goal:** Lock the R7 edges with automated tests (first half of the BR-O08 backend slot).
- **Allowed scope:** `backend/test/` only (plus test helpers). **No production-code changes** — if a test exposes a defect, fix it as a separate follow-up with its own review.
- **Files/areas:** `backend/test/token-lifecycle.test.ts`, shared test setup.
- **Acceptance criteria:**
  1. Covered: valid token verifies; expired token rejected; consumed token rejected on reuse; resend supersedes (old token invalid, new valid); already-verified account handled (CHK-AUTH-07/11/12/13).
  2. Tests run against a real Postgres (compose `db`), deterministic (expiry via injected clock or direct token-row manipulation through the API-legitimate path where possible).
- **Test/check:** `cd backend && npx vitest run test/token-lifecycle.test.ts`, then `npm test`.
- **QA review:** task-scoped qa-reviewer before commit (test-quality review: behavior-focused, deterministic).

### Task 1.9 — API-flow test: sign-up → Mailpit → verify → login (~60 min) — second BR-O08 slot

- **Goal:** End-to-end proof of DoD-1 at API level: register, pull the real email via Mailpit's REST API, verify, log in.
- **Allowed scope:** `backend/test/` (or a dedicated `e2e` test dir) only.
- **Files/areas:** `backend/test/signup-verify-login.e2e.test.ts`.
- **Acceptance criteria:**
  1. Flow passes against the compose stack with zero manual steps (CHK-AUTH-02/08).
  2. The test extracts the verification link from the actual email body — no backdoor token reads from the DB.
- **Test/check:** `cd backend && npm test` (full suite).
- **QA review:** **Full QA gate 1** — CHK-AUTH-01…19 (18–19 by inspection) + qa-reviewer, emphasis BR-A13/A14 boundary and R7 edges; log in [qa/qa-review-log.md](qa/qa-review-log.md), update [project-state.md](project-state.md).

## Slice 2 — Teams (3 h) — F5, DoD-2 (part)

### Task 2.1 — Teams API + conflict tests (~90 min)

- **Goal:** Team CRUD with the uniqueness and restrict-delete contract, locked by tests.
- **Allowed scope:** `backend/src/routes/teams.ts`, `backend/test/teams.test.ts`.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. List / create / rename (PATCH) / delete; name trimmed, non-empty, case-insensitively unique → 409 on duplicates (BR-T05, Q12).
  2. Delete a team containing tickets or epics → 409 (service check + RESTRICT FK backstop, BR-T06, R5). *(Until slices 3–4 exist, the test seeds the referencing rows through Prisma test helpers or direct inserts inside the test — never via startup seed.)*
  3. Integration tests: duplicate-name 409 + delete-with-contents 409 (completes the restrict-delete part of the backend test slot).
- **Test/check:** `cd backend && npx vitest run test/teams.test.ts`, then `npm test`.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 2.2 — Teams UI (~75 min)

- **Goal:** Team management screen — the screen that also unblocks the board's team selector later.
- **Allowed scope:** `frontend/src/pages/teams*`, `frontend/src/api/` (teams client).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. List, create, rename, delete; 409 responses surfaced as clear errors (delete-conflict and duplicate-name).
  2. Validation feedback for empty/whitespace names.
- **Test/check:** `cd frontend && npm run build`; manual browser pass against compose stack.
- **QA review:** **Full QA gate 2** — CHK-TEAM-01…07, CHK-API-04 + qa-reviewer.

## Slice 3 — Epics (3 h) — F6, DoD-2 (done)

### Task 3.1 — Epics API + tests (~90 min)

- **Goal:** Epic CRUD with the immutable-team rule and restrict-delete, locked by tests.
- **Allowed scope:** `backend/src/routes/epics.ts`, `backend/test/epics.test.ts`.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. List (`?teamId=`) / create / update / delete; title trimmed non-empty; description optional (BR-E01…E05).
  2. Team set at creation, immutable — update rejects/ignores `teamId` (BR-E02, CHK-EPIC-03).
  3. Delete while tickets reference the epic → 409 (BR-E06).
  4. Integration tests: immutable-team + 409-while-referenced.
- **Test/check:** `cd backend && npx vitest run test/epics.test.ts`, then `npm test`.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 3.2 — Epics UI (~75 min)

- **Goal:** Epic management screen with team-scoped listing (W5 pattern).
- **Allowed scope:** `frontend/src/pages/epics*`, `frontend/src/api/` (epics client).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Team selector scopes the epic list; create/edit (title, description)/delete work; 409 delete-conflict surfaced.
  2. No UI affordance to move an epic between teams.
- **Test/check:** `cd frontend && npm run build`; manual browser pass.
- **QA review:** **Full QA gate 3** — CHK-EPIC-01…07 + qa-reviewer.

## Slice 4 — Tickets (8 h) — F7, DoD-3

The invariants slice (R3, R4). Board UI comes in slice 6; here the UI is create/edit/details + a plain per-team list so tickets are visible and testable.

### Task 4.1 — Ticket create/list/get API with full validation (~90 min)

- **Goal:** Ticket creation and reading with every server-side validation rule in place from the first endpoint.
- **Allowed scope:** `backend/src/routes/tickets.ts` (+ a service module if the handler grows), smoke test.
- **Files/areas:** as above + `backend/test/tickets.test.ts` (started here, extended in 4.4).
- **Acceptance criteria:**
  1. Create: team required + must exist; type in `bug|feature|fix`; state in the five canonical values; title/body non-empty after trim; caps title 500 / body 10 000 (BR-K01…K05, Q20/Q27); `created_by` from the session user (BR-K13).
  2. Epic optional; if set, must exist **and belong to the ticket's team** — checked in-transaction, else 422 (BR-K06, R4).
  3. List by `?teamId=`; get by id; 404 for missing.
  4. Invalid enum / missing ref → 400/422 with the error contract; never trust client values (BR-K05).
- **Test/check:** `cd backend && npx vitest run test/tickets.test.ts`.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 4.2 — Ticket update: per-field diff + same-team invariant (~90 min)

- **Goal:** `PATCH /api/tickets/:id` with the two hardest invariants: `modified_at` advances only on real change, and team/epic changes re-validate the same-team rule in the write transaction.
- **Allowed scope:** `backend/src/routes/tickets.ts` / ticket service.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Update handler fetches the current row, diffs the editable fields explicitly, and writes + advances `modified_at` (UTC) **only** when something actually differs — no DB trigger, no ORM auto-touch (BR-K11/K12, R3, Q23).
  2. Saving unchanged values returns success without advancing `modified_at`.
  3. On team or epic change, the epic must be null or belong to the (new) team — re-read inside the transaction, 422 otherwise (BR-K06, R4).
  4. State change via `PATCH {state}` validates the closed enum (this is the drag-and-drop path for slice 6).
- **Test/check:** `cd backend && npx vitest run test/tickets.test.ts`.
- **QA review:** task-scoped qa-reviewer before commit (R3/R4 are the review focus).

### Task 4.3 — Ticket delete + comment cascade (~45 min)

- **Goal:** Ticket deletion API that also removes its comments; confirmation lives in the UI (4.6).
- **Allowed scope:** `backend/src/routes/tickets.ts`.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. `DELETE /api/tickets/:id` removes the ticket and its comments (CASCADE FK from 0.2 verified in practice, BR-K15).
  2. 404 for missing ticket; auth guard applies.
- **Test/check:** curl walkthrough + backend suite green (`npm test`). *(Automated cascade evidence lands with comments in 5.1 — CHK-TKT-14.)*
- **QA review:** task-scoped qa-reviewer before commit.

### Task 4.4 — Ticket invariant tests (~90 min) — backend test slot, part 2

- **Goal:** Lock R3/R4 with automated tests.
- **Allowed scope:** `backend/test/tickets.test.ts` only. No production-code changes (defects → separate follow-up).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. `modified_at` advances on a real field change; unchanged save does not advance it (CHK-TKT-11/12). *(Comment case added in 5.1.)*
  2. Cross-team epic rejected on create **and** on team-change (CHK-TKT-06).
  3. Enum validation: bad type/state rejected.
- **Test/check:** `cd backend && npx vitest run test/tickets.test.ts`, then `npm test`.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 4.5 — UI: ticket list + details (~75 min)

- **Goal:** Tickets visible and navigable per team before the board exists.
- **Allowed scope:** `frontend/src/pages/tickets*`, `frontend/src/api/` (tickets client).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Per-team ticket list (team selector), showing title, type, state, epic.
  2. Details view (W3): all fields + metadata line (created/modified UTC-labeled, created_by — Q44).
- **Test/check:** `cd frontend && npm run build`; manual browser pass.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 4.6 — UI: ticket create/edit form + delete-confirm (~90 min)

- **Goal:** Full ticket editing UI with the team/epic coupling rules.
- **Allowed scope:** `frontend/src/pages/tickets*` (form), shared form components if needed.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Create/edit form: team/type/state/epic dropdowns; epic list scoped to the selected team (BR-K07); **team change clears the epic** (Q21, BR-K08).
  2. Server validation errors surfaced (422 cross-team epic, enum, empty title/body).
  3. Delete requires an explicit confirmation dialog (BR-K14).
- **Test/check:** `cd frontend && npm run build`; manual browser pass incl. team-change-clears-epic and delete-confirm.
- **QA review:** **Full QA gate 4** — CHK-TKT-01…14 (13 of 14; CHK-TKT-14 evidence completed in slice 5) + qa-reviewer, emphasis R3/R4.

## Slice 5 — Comments (2 h) — F8, DoD-4

### Task 5.1 — Comments API + `modified_at`/cascade tests (~75 min)

- **Goal:** Append-only comments plus the two tests that complete the backend test slot.
- **Allowed scope:** `backend/src/routes/comments.ts`, `backend/test/comments.test.ts`.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. List per ticket oldest-first; create with non-empty body (cap 10 000), author from session (BR-C01…C04).
  2. **No update/delete routes exist at all** (BR-C05).
  3. Test: adding a comment does **not** advance the ticket's `modified_at` (BR-K12 — completes the backend slot).
  4. Test: deleting a ticket removes its comments (CHK-TKT-14 evidence).
- **Test/check:** `cd backend && npx vitest run test/comments.test.ts`, then `npm test`.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 5.2 — Comments UI (~45 min)

- **Goal:** Comments panel in ticket details.
- **Allowed scope:** `frontend/src/pages/tickets*` (details), `frontend/src/api/` (comments client).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. List oldest-first with author email (Q25) + timestamp; add-comment box with empty-body validation.
  2. No edit/delete affordances.
- **Test/check:** `cd frontend && npm run build`; manual browser pass.
- **QA review:** **Full QA gate 5** — CHK-CMT-01…05 + qa-reviewer.

## Slice 6 — Kanban board (8 h) — F9, DoD-5, DoD-6

The primary screen, last of the features because it composes everything before it.

### Task 6.1 — Board page: columns, cards, selector, sort (~90 min)

- **Goal:** The static board: correct columns, cards, ordering, and navigation — no drag yet.
- **Allowed scope:** `frontend/src/pages/board*`, board components, `frontend/src/api/` reuse.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Team selector with URL-query state; default = first team by name (Q29/Q30).
  2. Exactly 5 columns in workflow order with human-readable labels (BR-B02, BR-K04).
  3. Cards show title, type, epic; column sort `modified_at desc, id desc` (BR-B07, Q33); per-column counts.
  4. "+ New ticket" and card → details navigation work.
- **Test/check:** `cd frontend && npm run build`; manual browser pass.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 6.2 — Drag-and-drop with optimistic revert (~90 min)

- **Goal:** State changes by dragging, persisted immediately, reverting on failure.
- **Allowed scope:** board components (`@hello-pangea/dnd` integration), tickets API client.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Drag between any two columns → optimistic move → `PATCH {state}` (BR-B04).
  2. On API failure: card returns to its previous column and an error is shown (BR-B05, R9).
  3. Guard against a second drag of the same card while its PATCH is in flight.
  4. State survives refresh (server is the system of record — DoD-6, BR-O04, BR-P02).
- **Test/check:** `cd frontend && npm run build`; manual drag pass incl. a refresh check.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 6.3 — Filters + search (~75 min)

- **Goal:** Client-side board filtering per spec.
- **Allowed scope:** board components (filter bar, filter state).
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Filter by type, by epic, and case-insensitive title substring search; active filters AND-combined (BR-B09).
  2. Clear-filters affordance; counter shows the filtered count (Q31).
  3. Filter state in-memory only — resets on refresh (Q34).
- **Test/check:** `cd frontend && npm run build`; manual browser pass of each filter and combinations.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 6.4 — Empty states + 100-ticket scale check (~75 min)

- **Goal:** Board handles empty and large datasets.
- **Allowed scope:** board components (empty states); `scripts/` for a manually-run API seeding tool (outside any startup path).
- **Files/areas:** as above + `scripts/seed-tickets.ts` (or similar).
- **Acceptance criteria:**
  1. Empty states: zero teams (create-team CTA), empty team, empty column (BR-O05, Q29).
  2. Script creates ~120 tickets **via the API** (legitimate channel, DoD-10); script is documented as a manual tool and never runs at startup (R8, DoD-9).
  3. Board stays usable (scroll, filter, drag) with 120 tickets on one board (BR-B10, CHK-BRD-11).
- **Test/check:** run the script against the compose stack; manual usability pass; `docker compose down -v && docker compose up --build` still yields an empty DB.
- **QA review:** task-scoped qa-reviewer before commit (fresh-DB rule is the review focus).

### Task 6.5 — Failure injection + board polish (~60 min)

- **Goal:** Prove the failure path and close the slice.
- **Allowed scope:** board components (fixes only), no new features.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. Manual failure injection: stop the backend mid-drag → card reverts + error shown (CHK-BRD-07).
  2. All CHK-BRD items pass on the compose stack.
- **Test/check:** full suite `cd backend && npm test`; manual CHK-BRD run.
- **QA review:** **Full QA gate 6** — CHK-BRD-01…13 + qa-reviewer, emphasis DoD-6 refresh-persistence and R9/R10. *(Playwright drag test only from buffer time — the slice-1 API-flow test already fills the second BR-O08 slot.)*

## Slice 7 — Hardening & delivery (6 h) — DoD-7…10

### Task 7.1 — README + secrets sweep (~75 min)

- **Goal:** Delivery documentation and the DoD-8 sweep.
- **Allowed scope:** `README.md`, `.env.example`; no behavior changes.
- **Files/areas:** as above.
- **Acceptance criteria:**
  1. README: prerequisites (Docker only), startup, ports, SMTP configuration incl. the `relay1.dataart.com` override, test commands (BR-O07).
  2. Repo sweep: no credentials/SMTP secrets/hard-coded passwords (CHK-AUTH-19, DoD-8), with the dev-only Postgres default documented as the declared bounded exception ([architecture.md](architecture.md) §2).
- **Test/check:** follow the README verbatim on the dev machine: every command works as written.
- **QA review:** task-scoped qa-reviewer before commit.

### Task 7.2 — Full checklist run (~2 h; split across sessions if needed)

- **Goal:** Execute all 81 CHK items and fix what they surface.
- **Allowed scope:** `docs/qa/runs/` (new run sheet); defect fixes anywhere **only** with a logged defect + its own task-scoped review per fix.
- **Files/areas:** `docs/qa/runs/<date>-run1.md` (copy of [qa/test-checklist.md](qa/test-checklist.md)).
- **Acceptance criteria:**
  1. All 81 items executed with results recorded; defects logged with severity.
  2. All Critical/Major defects fixed and re-checked.
- **Test/check:** the run sheet itself + full suite green after any fix.
- **QA review:** task-scoped qa-reviewer per defect fix; run summary logged in [qa/qa-review-log.md](qa/qa-review-log.md).

### Task 7.3 — Fresh-machine + fresh-DB proofs (~60 min)

- **Goal:** Prove the startup contract off the dev machine.
- **Allowed scope:** none (verification only); compose/doc fixes only if the proof fails, each with review.
- **Files/areas:** —.
- **Acceptance criteria:**
  1. Clean clone on at least one other OS (or a pristine Docker context): `docker compose up --build` → DoD-1 end-to-end (R2, DoD-7).
  2. Fresh-DB proof: `docker compose down -v && docker compose up --build` → API confirms zero entities (CHK-OPS-02/03, DoD-9).
- **Test/check:** the two proofs above, results recorded in the run sheet.
- **QA review:** task-scoped qa-reviewer only if fixes were needed.

### Task 7.4 — Final demo-readiness gate (~60 min)

- **Goal:** Close the project: scope guard, full suite, cross-browser spot-check, final verdict.
- **Allowed scope:** docs/state updates; no behavior changes.
- **Files/areas:** [project-state.md](project-state.md), [qa/qa-review-log.md](qa/qa-review-log.md).
- **Acceptance criteria:**
  1. Scope guard: nothing from §12 crept in (CHK-OPS-07, R15).
  2. Full test suite green; second-browser spot-check done (CHK-OPS-09).
  3. DoD scoreboard 10/10 or every gap explicitly descoped and logged.
- **Test/check:** `cd backend && npm test` (full suite) + evidence bundle from 7.2/7.3.
- **QA review:** **Full QA gate 7 (final)** — qa-reviewer demo-readiness review across all DoD items; verdict recorded in [qa/qa-review-log.md](qa/qa-review-log.md).

---

## Explicitly deferred

- **Stretch (§14)** — password reset, own-comment edit/delete, activity history, virtualization: only if all gates 0–7 passed and buffer remains. Realistic answer: none.
- **Out of scope (§12)** — hard deny-list; qa-reviewer checks every gate (R15).
- Playwright browser tests, CI pipeline, shared types package, staging environments: not required by any DoD item.

## Standing risks while executing

- **R1 first**: if slice 1 slips past ~14 h cumulative, cut UI polish elsewhere — never the verification flow.
- **Tests inside slices, not after** (R14): the two BR-O08 slots are filled in slices 1–5 by design (tasks 1.8, 1.9, 2.1, 4.4, 5.1); slice 7 only completes coverage.
- **Fresh-DB discipline** (R8): no seed logic anywhere in the startup path; the 100-ticket script (task 6.4) is a manually-run tool.
