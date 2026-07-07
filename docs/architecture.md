# Architecture

Deliberately simple: **one developer, 48 hours, mandatory scope only.** Every choice below optimizes for (a) the hard startup contract (`docker compose up --build`, BR-O01), (b) the server-side business rules in [business-rules.md](business-rules.md), and (c) minimum moving parts. Anything not needed to pass the DoD is out.

Related: [requirements-analysis.md](requirements-analysis.md) · [entities.md](entities.md) · [implementation-plan.md](implementation-plan.md) · [project-state.md](project-state.md)

---

## 1. Stack decision

**TypeScript everywhere.** One language, one package manager, shared enum/type definitions between tiers, no context switching for a solo developer.

| Tier | Choice | Why |
|---|---|---|
| Frontend | **React + Vite + TypeScript** SPA | Fastest path to the 8 required screens; huge ecosystem for drag-and-drop |
| Drag-and-drop | **@hello-pangea/dnd** | Purpose-built for Kanban columns; optimistic update + revert-on-failure (BR-B05) is a documented pattern |
| Backend | **Node 22 + Fastify + TypeScript** | Minimal HTTP API framework; built-in schema validation covers BR-K05 (server-side enum/reference validation) cheaply |
| ORM / migrations | **Prisma** | Declarative schema + `prisma migrate deploy` satisfies the fresh-database rule (BR-P09/P10) with zero custom tooling |
| Database | **PostgreSQL 16** (official image) | Server-based RDBMS container, named in the spec as the example (BR-O03) |
| Auth | **Signed JWT in an httpOnly cookie** | Stateless — no session table, no session-store container. Cookie never appears in URLs (BR-A14). Logout = clear cookie (Q43) |
| Password hashing | **argon2** (node package) | Spec names Argon2id as the example (BR-A04) |
| Mail | **nodemailer**, SMTP host/port/credentials from env | "Configurable SMTP" (BR-A05); `relay1.dataart.com` is just an env value |
| Dev mailbox | **Mailpit** container in compose | Resolves R1/Q8: `docker compose up --build` works with zero secrets and a real SMTP round-trip out of the box; QA/demo can point env vars at `relay1.dataart.com` instead |
| Backend tests | **Vitest + supertest** against the API with a real Postgres | Integration-level tests are what the business rules need (modified_at, 409s, token lifecycle) |
| Frontend/API-flow test | **Vitest API flow** (sign-up → fetch token from Mailpit API → verify → login) | Fills the second mandatory test slot (BR-O08) without a browser-automation dependency; Playwright drag test only if time allows |

Note: `.gitignore` is .NET-flavored from the initial commit; CLAUDE.md explicitly says not to read a stack choice into it. Node/TS entries will be added to `.gitignore` in the skeleton slice.

**Rejected on purpose** (over-engineering for this scope): NestJS, GraphQL, Redis, message queues, WebSockets (real-time is out of scope, §12), microservices, server-side session store, CQRS/repositories layering, monorepo tooling (npm workspaces at most).

## 2. Runtime topology

```
docker compose up --build
┌─────────────────────────────────────────────────────┐
│  app  (Node/Fastify)          db  (postgres:16)     │
│  ├── /api/*  → JSON API       └── volume: pgdata    │
│  ├── /*      → compiled SPA                         │
│  └── startup: prisma migrate deploy, then listen    │
│                                                     │
│  mailpit (dev SMTP sink + web UI)                   │
└─────────────────────────────────────────────────────┘
Host ports:  8080 → app        8025 → Mailpit web UI
```

- **Three containers**: `app`, `db`, `mailpit`. The backend serves the compiled SPA (explicitly allowed by §2); tier separation stays clear — `frontend/` and `backend/` are separate source trees, the SPA talks to the backend only via `/api/*` JSON, and the SPA build is copied into the app image in a multi-stage Dockerfile. One origin ⇒ no CORS, no reverse proxy, no second web server.
- `app` waits for `db` health (compose `depends_on: condition: service_healthy`), runs `prisma migrate deploy`, then listens. This is the entire init path — repeatable, no seed data (DoD-9).
- `GET /api/health` is public (allowed by BR-A13) and used as the compose healthcheck.
- All configuration via environment variables with working defaults in `docker-compose.yml` (Mailpit as SMTP, `APP_BASE_URL=http://localhost:8080`). A committed `.env.example` documents the `relay1.dataart.com` override; real credentials never committed (BR-A15).
- **DB password (DoD-7 vs DoD-8 tension):** compose uses `${POSTGRES_PASSWORD:-<dev-only default>}` — overridable via env, but a literal dev-only default must exist in compose or zero-config startup (DoD-7) fails. This is a **declared bounded exception** to a literal reading of BR-A15/DoD-8: the value is not a user credential, guards nothing outside the compose network, and is clearly labeled dev-only in compose and README. Tracked as an open item in [project-state.md](project-state.md) §5; CHK-AUTH-19 / CHK-OPS-04 need a matching carve-out note so the slice-7 secrets sweep doesn't false-positive (flagged in the 2026-07-07 planning QA review).

## 3. Repository layout

```
/backend            Fastify app, Prisma schema + migrations, tests
  /src
    /routes         one file per resource: auth, teams, epics, tickets, comments
    /plugins        auth guard, error mapper
    /lib            mailer, password hashing, token helpers
  /prisma           schema.prisma, /migrations
  /test             integration tests (vitest + supertest)
/frontend           React SPA
  /src
    /pages          board, ticket, teams, epics, login, signup, verify
    /api            typed fetch client
    /components     shared bits (only when actually shared)
/docker-compose.yml
/Dockerfile          multi-stage: build SPA → build backend → runtime image
```

No shared package: the canonical enum strings (`bug|feature|fix`, five states) are defined once per tier and cross-checked by the API tests — a shared workspace package is not worth the build complexity for two small constant sets.

## 4. Data model (physical, from [entities.md](entities.md))

Tables: `users`, `email_verification_tokens`, `teams`, `epics`, `tickets`, `comments`. Direct mapping of the conceptual model; only the decisions that matter:

| Decision | Rule served |
|---|---|
| UUID primary keys everywhere (`gen_random_uuid()`) | BR-P05 |
| `users.email` stored trimmed+lowercased; **unique index on the stored value** (normalize at the API boundary, store canonical form) | BR-A02, R6 |
| `teams.name` stored as entered; **unique index on `lower(trim(name))`** via raw SQL in the migration | BR-T05, R6 |
| FKs: `epics.team_id → teams` **RESTRICT**, `tickets.team_id → teams` **RESTRICT**, `tickets.epic_id → epics` **RESTRICT**, `comments.ticket_id → tickets` **CASCADE** | BR-T06, BR-E06, BR-K15 — DB-level backstop; the API still returns the mapped 409 before hitting the FK where possible |
| `type` and `state` as `text` + CHECK constraints on the canonical strings (no native enum — avoids Postgres enum-migration pain) | BR-K02/K03 |
| All timestamps `timestamptz`, written by the server in UTC, serialized ISO-8601 | BR-K10/K11, BR-P06, R13 |
| Same-team epic invariant (`ticket.epic.team_id == ticket.team_id`) enforced **in the service layer inside the write transaction** (re-read epic, compare, reject 422) | BR-K06, R4 — a two-table invariant plain FKs can't express |
| `modified_at` advanced only when a fetched-and-compared field set actually differs (explicit per-field diff in the update handler, never a DB trigger or ORM auto-touch) | BR-K11/K12, R3 |
| `email_verification_tokens`: random 256-bit value (stored hashed), `expires_at = created + 24h`, `consumed_at`, invalidated by deleting the user's unused rows on reissue | BR-A07/A08/A11, R7 |

## 5. API surface

REST-ish JSON under `/api`. Public: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/verify` (token in body; SPA route `/verify?token=…` reads the URL and posts it — the sole token-in-URL exception, BR-A14/Q7), `POST /api/auth/resend`, `GET /api/health`. Everything else behind the auth guard (BR-A13, R12).

| Resource | Endpoints |
|---|---|
| auth | signup · login · logout · verify · resend · `GET /api/auth/me` |
| teams | list · create · rename (PATCH) · delete |
| epics | list (`?teamId=`) · create · update (title/description only — team immutable, BR-E02) · delete |
| tickets | list (`?teamId=`) · get · create · update (PATCH, any editable field incl. state — drag-and-drop is just `PATCH {state}`) · delete |
| comments | list per ticket · create per ticket |

**Error contract** (BR-P04): consistent body `{ "error": { "code", "message" } }`. 400/422 validation · 401 unauthenticated · 403 unverified account · 404 missing · **409** team-delete-with-contents, epic-delete-while-referenced, and duplicate email/team-name (Q12 resolved: 409 for all uniqueness/reference conflicts — one coherent rule).

**Board data**: the board fetches the selected team's tickets in one request; filtering/search/sorting is **client-side** (Q28 resolved — 100 tickets is trivial in memory, BR-B10) with column sort `modified_at desc, id desc` (Q33 tie-break).

## 6. Working decisions on open questions

Resolutions of the Q-items that block implementation (interim stances from [test-strategy.md](qa/test-strategy.md) §6 adopted where they existed). Recorded here so QA can test against them; all revisable if the requirements owner answers differently.

| Q | Decision |
|---|---|
| Q3 | JWT cookie lifetime 7 days; no idle expiry |
| Q4 | Unverified login → 403 + message + resend affordance on the login screen (W2 pattern) |
| Q5 | Duplicate sign-up → explicit 409 "email already registered" (enumeration acceptable for a hackathon tool where all users see all data anyway) |
| Q7/Q8 | Verification email links to `{APP_BASE_URL}/verify?token=…` (SPA route). Default SMTP = bundled Mailpit; `relay1.dataart.com` via env override documented in README/.env.example |
| Q9 | Resend form asks for the email address (works from both entry points, no hidden state) |
| Q10 | Any token for an already-verified account → friendly "already verified, go to login" result |
| Q12 | Uniqueness conflicts → 409 (coherent with the restrict-delete contract) |
| Q20/Q27 | Practical caps validated server-side: title 500, body/description/comment 10 000 chars |
| Q21 | Team change **clears** the epic (UI sets it to null; user may re-pick from the new team's list) |
| Q23 | Server-side per-field diff before write (yes) |
| Q25 | Comment author displays the **email** — the only data the model has (R11); no name field added |
| Q29/Q30 | Zero teams → empty state with "create a team" CTA; default selection = first team by name; selected team kept in the URL query |
| Q31 | Board counter shows the filtered count |
| Q33 | Tie-break `id desc` |
| Q34 | Filter state is in-memory only (resets on refresh — nothing persisted, BR-P02 safe) |
| Q44 | UI shows absolute UTC timestamps labeled "UTC" (matches W3; no timezone math to get wrong) |

Q1/Q2 (password/email format): min 8 chars + max 200; email checked with a simple pattern + trim/lowercase. Q6 (resend rate-limit): naive in-memory 1/min/email guard — enough to protect the corporate relay, no infrastructure.

## 7. Testing architecture (BR-O08)

- **Backend slot**: Vitest + supertest integration tests hitting the real API with a real Postgres (the compose `db` service, dedicated schema per run). Chosen flows = the risk hotspots: verification-token lifecycle (R7), 409 restrict-deletes (R5), `modified_at` semantics incl. unchanged-save and comment cases (R3).
- **Frontend-or-API slot**: API-level end-to-end flow sign-up → read mail from Mailpit's REST API → verify → login (DoD-1).
- Run commands documented in README; tests must run on a machine with Docker only.
