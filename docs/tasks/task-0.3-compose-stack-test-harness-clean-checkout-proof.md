# Task 0.3 — Compose stack + test harness + clean-checkout proof

> **Historical archive. Not part of normal runtime context unless explicitly requested.**

- **Status:** done — full pipeline passed 2026-07-08; **Commit: pending** (held at the human's stop-before-commit instruction)
- **Branch:** `main`
- **Commits:** pending (staged/working-tree at archive time)
- **Slice:** 0 — Walking skeleton, slice-closing task (~90 min budget); closed **QA gate 0**

## Task Start Brief (approved 2026-07-08)

Presented via `/task-start` and explicitly approved by the human before implementation. Summary: goal = `docker compose up --build` brings up the whole stack from a clean checkout (app :8080 with SPA shell + `/api/health`, PostgreSQL 16, Mailpit :8025) with a vitest+supertest health test; allowed files = root `docker-compose.yml`/`Dockerfile`/`.env.example`, `backend/test/`, `backend/vitest.config.ts`, test-only `package.json` changes, migrate-deploy boot wiring; forbidden = auth/business logic, `backend/prisma/` edits, seed data, secrets (beyond the declared `${POSTGRES_PASSWORD:-…}` dev-only exception), Prisma pinned 6.19.3.

## Implementation Plan (approved 2026-07-08)

Approved by the human before any edit, including one **declared scope deviation**: `@fastify/static` as a production dependency + an env-gated (`STATIC_DIR`) SPA-serving block in `backend/src/server.ts` — required because acceptance criterion 1 (SPA shell on :8080) and architecture.md §2 (backend serves the compiled SPA) were unsatisfiable within the literal allowed-files list. Migrate-deploy wiring placed in the Dockerfile CMD so backend src needed no migration-related changes. Deviation later recorded in project-state.md §4 (decision log) after QA flagged the missing durable record.

## What was implemented

- **`Dockerfile`** (multi-stage): SPA build → backend tsc build → `node:22-alpine` runtime with prod deps + prisma CLI; CMD `npx prisma migrate deploy && node dist/server.js` (the entire DB init path — no seed data).
- **`docker-compose.yml`**: `app` (:8080, healthcheck on `/api/health` via `127.0.0.1` — alpine resolves `localhost` to `::1` while the server binds IPv4; this was a self-found-and-fixed bug), `db` (postgres:16, `pgdata` volume, `pg_isready` healthcheck, `${POSTGRES_PASSWORD:-dev-only-not-a-secret}` labeled dev-only), `mailpit` (UI :8025); `depends_on: db healthy`.
- **`.env.example`**: documents `POSTGRES_PASSWORD`, SMTP override incl. `relay1.dataart.com`, `APP_BASE_URL`; names/placeholders only.
- **`.dockerignore`** (Dockerfile companion).
- **`backend/src/server.ts`**: env-gated `@fastify/static` registration (`wildcard: false`) + `GET /*` SPA fallback that preserves the JSON 404 contract for unknown `/api/*` via `reply.callNotFound()`; dev mode without `STATIC_DIR` unaffected.
- **Test harness**: `backend/vitest.config.ts`; `backend/test/health.test.ts`; `backend/test/static-fallback.test.ts` (added post-QA to cover the new static logic); `backend/test/tsconfig.json` (added post-QA to fix WebStorm TS1259 — test files were outside every tsconfig project, so the IDE inferred a no-interop project; the test tsconfig extends the main NodeNext config, `noEmit`); `"test": "vitest run"` script + vitest/supertest devDeps.
- **Post-QA CVE remediation**: `@fastify/static` upgraded ^8.3.0 → **^9.3.0** (CVE-2026-6410 / CVE-2026-6414, fixed ≥9.1.1); no code change required; `npm audit` 0 vulnerabilities; full compose + test validation re-run green.

## Files changed (pending commit)

New: `Dockerfile`, `docker-compose.yml`, `.env.example`, `.dockerignore`, `backend/test/health.test.ts`, `backend/test/static-fallback.test.ts`, `backend/test/tsconfig.json`, `backend/vitest.config.ts`, `docs/qa/runs/2026-07-08-run1.md`, `docs/tasks/*` (this archive). Modified: `backend/package.json`, `backend/package-lock.json`, `backend/src/server.ts`, `docs/current-task.md` (→ Task 1.1), `docs/project-state.md`, `docs/qa/qa-review-log.md`.

## Validation / test evidence (final verification pass, 2026-07-08)

1. `npm audit` → 0 vulnerabilities. 2. `npm run build` → clean. 3. `docker compose down -v && docker compose up --build` → all 3 containers **(healthy)**, `depends_on` ordering observed, migration applied on boot. 4. Live: `/api/health` → `{"status":"ok"}`; `/` and `/board` → 200 text/html; `/api/nope` → 404 JSON contract. 5. `npm test` → 2 files, **4/4 tests passed** against the running stack. 6. Fresh-DB proof: psql after `down -v` — all six app tables 0 rows, `_prisma_migrations` 1 row, exactly 7 tables. 7. `npx tsc -p test --noEmit` → clean. Manual CHK evidence: `docs/qa/runs/2026-07-08-run1.md` (CHK-OPS-01/02/03/04/10, CHK-AUTH-19).

## QA result

**Full QA gate 0: PASS WITH RISKS** — qa-reviewer subagent, 2026-07-08 (entry in `docs/qa/qa-review-log.md`). No Critical findings. The sole Major (process/traceability: unrecorded deviation approval) plus two Minors (missing dated run file; untested static-fallback logic) were **resolved same-day** via `task-fix`. **DB-password carve-out (DoD-7/8) signed off**, bounded exactly to `${POSTGRES_PASSWORD:-dev-only-not-a-secret}` in compose; carve-out notes on CHK-AUTH-19/CHK-OPS-04 in the run file; project-state.md §5 blocker closed.

## Final summary

Slice 0 complete: from a clean checkout, `docker compose up --build` yields a fully healthy 3-container stack with an empty, migration-initialized DB, one-origin SPA+API serving, and a working automated test harness. DoD scoreboard moved 0/10 → 3/10 (DoD-7, DoD-8 with carve-out, DoD-9).

## Decisions

- `@fastify/static` deviation approved with the Implementation Plan; recorded in project-state.md §4.
- Healthcheck uses `127.0.0.1`, not `localhost` (alpine IPv6-first resolution vs IPv4-only bind).
- `@fastify/static` ^9.3.0 (CVE remediation, post-gate, validation unchanged).

## Risks / limitations / follow-ups

- CHK-OPS-01 executed on Windows only; macOS/Linux clean-machine run open (R2).
- `README.md` still a bare title (BR-O07/CHK-OPS-06) — must land before any demo-readiness claim.
- Local `main` and `origin/main` diverged by one commit each at archive time — needs reconciling around the commit.
- Watch-items active at Task 1.1: error-mapper `err.code` fallback (BR-P04); signup 409 mapping for the email uniqueness/normalization constraints.

## Evidence sources

Current session (implementation, self-check, QA gate, fix, CVE remediation, TS1259 investigation, final verification — all with live command output) · `docs/qa/qa-review-log.md` (2026-07-08 gate-0 entry) · `docs/qa/runs/2026-07-08-run1.md` · `docs/project-state.md` §1/§2/§4/§5 · `docs/implementation-plan.md` Task 0.3 block · `git status`.
