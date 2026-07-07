# Current Task

**Overwritten at every task transition.** Usage rules: [context-management.md](context-management.md) §4. Task source: [implementation-plan.md](implementation-plan.md).

---

## Current slice

**Slice 0 — Walking skeleton** (4 h budget, 3 tasks) — [implementation-plan.md](implementation-plan.md)

## Current task

**Task 0.1 — Backend & frontend scaffolding** (~75 min) — status: **not started**

## Goal

Compilable backend and frontend skeletons with a health endpoint, the `{error:{code,message}}` error contract, and an SPA shell with route stubs — no Docker, no database, no Prisma yet (those are tasks 0.2 and 0.3).

## Allowed files/areas

- `backend/` — new Fastify + TypeScript project: `package.json`, `tsconfig.json`, `src/server.ts`, `src/routes/health.ts`, `src/plugins/error-mapper.ts`.
- `frontend/` — new Vite + React + TypeScript project: SPA shell, router, route stubs for the 8 required screens (board, ticket details/edit, teams, epics, login, signup, verify, resend/verification-result).
- `.gitignore` — append Node entries (`node_modules/`, build output, `.env`) only.

## Forbidden changes

- No `docker-compose.yml`, no `Dockerfile` (task 0.3).
- No Prisma schema, no migrations, no DB access of any kind (task 0.2).
- No auth, no business endpoints beyond `/api/health` — route stubs render placeholders only.
- No seed data, no sample entities anywhere.
- No edits to `requirements/`, `docs/qa/`, `CLAUDE.md`, or existing `.gitignore` entries.
- Stack is fixed per [architecture.md](architecture.md) §1 — no framework/library substitutions.

## Acceptance criteria

1. Backend starts in dev mode; `GET /api/health` returns 200 with a JSON body.
2. A deliberately thrown error is returned as `{error:{code,message}}` by the error-mapper plugin (BR-P04).
3. `frontend` builds; the SPA shell renders with router stubs for all 8 screens.
4. `.gitignore` covers `node_modules/`, build output, `.env`.
5. `git status` shows only `backend/`, `frontend/`, `.gitignore` changes.

## Commands to run

```
cd backend  && npm run build
cd frontend && npm run build
# manual: start backend dev server, curl http://localhost:<port>/api/health
```

## QA gate expectation

**Task-scoped qa-reviewer review before commit** (not a full gate). Provide: task goal, changed-file list, claimed IDs (BR-P04), and build/check output. Full QA gate 0 comes at the end of task 0.3.

## Next step after completion

Overwrite this file with **Task 0.2 — Prisma schema + initial migration** (block in [implementation-plan.md](implementation-plan.md), Slice 0), then proceed per [agentic-workflow.md](agentic-workflow.md).
