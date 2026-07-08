# Task 0.1 — Backend & frontend scaffolding

> **Historical archive. Not part of normal runtime context unless explicitly requested.**

- **Status:** done (accepted via retroactive reconciliation, 2026-07-07)
- **Branch:** `main`
- **Commits:** `510a9fb` (implementation, 2026-07-07) · `106cc41` (docs reconciliation "Reconcile Task 0.1 and advance to Task 0.2")
- **Slice:** 0 — Walking skeleton (~75 min budget)

## Goal (from implementation-plan.md)

Compilable backend and frontend skeletons with a health endpoint, error contract, and SPA shell — no Docker, no database yet. Allowed scope: `backend/`, `frontend/`, `.gitignore` (append Node entries only).

## Implementation plan

Not available from current evidence (the task predates the per-task Implementation Plan approval gate; it was committed before the pre-commit qa-reviewer step and reconciled retroactively — see QA).

## What was implemented

- Fastify 5 backend skeleton (TypeScript, ESM, Node 22): `src/server.ts`, `GET /api/health` route, `error-mapper.ts` plugin implementing the `{error:{code,message}}` contract (BR-P04) incl. contract-shaped 404s.
- Vite + React 19 SPA shell with react-router stubs for the 8 required screens (board, ticket, teams, epics, login, signup, verify, resend).

## Files changed

22 files, +3409 lines (from `git show --stat 510a9fb`): `backend/package.json`, `backend/tsconfig.json`, `backend/src/server.ts`, `backend/src/routes/health.ts`, `backend/src/plugins/error-mapper.ts`, lockfile; `frontend/` package/tsconfig/vite config, `index.html`, `src/App.tsx`, `src/main.tsx`, `src/index.css`, 8 page stubs, lockfile.

## Validation / test evidence

From the retroactive review record (qa-review-log 2026-07-07): backend + frontend builds green; live `GET /api/health` → 200; deliberately thrown 400/500 errors returned as `{error:{code,message}}` with internal detail suppressed; unknown route → 404 in contract shape; all 8 screen stubs routed; `.gitignore` already covered required entries. No automated test committed (deferred to Task 0.3 by design — became a tracked watch-item).

## QA result

**PASS** — retroactive task-scoped qa-reviewer review, 2026-07-07 (entry in `docs/qa/qa-review-log.md`). Findings:
1. *(Major, process)* commit made before the required pre-commit qa-reviewer step and without doc updates; reconciled retroactively with human approval; process rule reaffirmed.
2. *(Minor, watch-item)* `error-mapper.ts` falls back to `err.code ?? 'BAD_REQUEST'` for 4xx — Fastify-internal codes could leak once schema validation lands; re-check at the first validated endpoint (carried to Task 1.1).
3. *(Minor, watch-item)* health/error-contract verification not captured as a committed automated test — closed by Task 0.3's `backend/test/health.test.ts`.

## Decisions

None at slice level recorded for this task beyond the stack decisions already made in `architecture.md` §1 (2026-07-07).

## Risks / follow-ups

- Watch-item 2 (error-mapper fallback) carried forward, active at Task 1.1.
- Watch-item 3 closed in Task 0.3.

## Evidence sources

`git show --stat 510a9fb` · `git log --oneline` · `docs/qa/qa-review-log.md` (2026-07-07 Task 0.1 retroactive entry) · `docs/implementation-plan.md` Task 0.1 block · `docs/project-state.md` §1.
