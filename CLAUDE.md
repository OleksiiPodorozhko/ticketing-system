# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Greenfield. As of this writing the repo contains **only requirements and design inputs** — no application code exists yet:

- `requirements/Hackathon_Ticketing_System_Requirements_v3.pdf` — the authoritative spec (read this before building anything).
- `requirements/wireframes/*.png` — 5 low-fidelity wireframes (reference only; layout is not prescriptive as long as all mandatory actions/states remain usable).
- `docs/`, `prompts/` — currently empty.
- `.gitignore` is preconfigured for .NET, but **languages and frameworks are unrestricted** — do not read a stack choice into it.

There are no build/lint/test commands yet. Once a stack is chosen, the single hard requirement below governs how the app runs.

## What to build

A Kanban-style ticket tracker: a **three-tier SPA** (SPA frontend → HTTP API backend → RDBMS). Mandatory scope is exactly: authentication, teams, epics, tickets, comments, and a draggable Kanban board. **Scrum/sprints, SSO, roles/membership, attachments, notifications, and real-time updates are explicitly out of scope** — do not add them.

### Mandatory startup contract (non-negotiable)

From a clean checkout, `docker compose up --build` run from the repo root must bring up the entire solution — frontend, backend, and a **server-based RDBMS container (e.g. PostgreSQL)**. QA must need nothing installed beyond Docker Compose on a clean Windows/macOS/Linux machine. No host-installed frontend/backend/DB runtime may be required. Keep the three tiers logically separated (the backend may serve the compiled SPA, but the separation must remain clear).

### Fresh-database rule

Schema creation must be automated via **migrations or equivalent repeatable init**. After init, a fresh DB contains **schema + migration metadata only** — zero application users, teams, epics, tickets, or comments. The default startup path must not seed sample data; QA creates all test data through the UI/API.

## Domain model & invariants

These rules are business-critical and must be enforced **server-side** (client validation alone is insufficient). The backend must validate all enum values and references.

**Auth**
- Email/password local auth only. Emails: trimmed, compared case-insensitively, unique. Passwords: ≥8 chars, hashed with an established algorithm (e.g. Argon2id), never plaintext.
- Sign-up triggers an email-verification message via configurable SMTP (**must support `relay1.dataart.com`**; keep SMTP secrets out of source control). Unverified accounts cannot use the main app.
- Verification tokens: expire after 24h, single-use. Issuing a new token invalidates earlier unused ones. Successful verification lands on the login screen (auto-login not required).
- All screens/endpoints require auth **except** sign-up, login, email verification, and verification-email resend. Static assets and health/readiness endpoints may be public.

**Teams** — fields: id, name, created, modified. Name non-empty after trim, unique case-insensitively. **Cannot delete a team that contains tickets or epics** (no cascade) → return **HTTP 409**. All verified users manage all teams (no ownership).

**Epics** — belong to exactly one team, set at creation and **immutable** (no moving between teams). Fields: id, team ref, title, optional description, created, modified. Title non-empty after trim. **Cannot delete an epic while tickets reference it** → **HTTP 409**.

**Tickets** — fields: id, team (required, existing), type (`bug|feature|fix`), state (see below), epic (optional), title (non-empty trimmed), body (non-empty; plain text/Markdown), created_at, modified_at, created_by (from auth user).
- A ticket's epic must be null or belong to **the same team as the ticket** — enforce on the backend. When a ticket's team changes, the UI must clear/replace the epic.
- `modified_at` (UTC) advances only on an **actual field/state change**; saving unchanged values must not advance it, and **adding a comment must not advance it**.
- Deleting a ticket requires explicit confirmation and **also deletes its comments**.

**Ticket states** (canonical API values, fixed workflow, in order): `new`, `ready_for_implementation`, `in_progress`, `ready_for_acceptance`, `done`. The UI shows human-readable labels with spaces. Type/state are stored as these exact strings.

**Comments** — fields: id, ticket ref, author, body (non-empty), created. Displayed oldest-first. Immutable in mandatory scope (edit/delete are stretch only).

## Kanban board (primary screen)

- Board is per selected team, with exactly **5 columns** (one per state, in workflow order).
- Cards show at least title and type (epic recommended). Within a column, order by **most-recently-modified first** (no persisted manual order).
- Drag-and-drop between any two columns changes state and **persists immediately via the API**. On failure, the card returns to its previous column and an error is shown. Sequential-transition enforcement is not required.
- Provide filtering by type and epic plus a case-insensitive substring search on title; combine active filters with **AND**. Must stay usable with ≥100 tickets on one board.

## API & persistence expectations

- All create/update/delete go through the backend API and persist in the RDBMS. **Browser local storage must never be the system of record.**
- Meaningful HTTP status codes/messages for validation, auth, not-found, and conflict failures (409 for the delete-conflict cases above).
- IDs may be UUIDs or DB numeric. API timestamps are **ISO-8601 in UTC**.
- Cookie sessions or bearer tokens both fine, but **never put session ids / tokens in URLs** (the single-use email-verification token in a verification URL is the sole exception). Last-write-wins; no concurrent-edit detection needed.

## Minimum screens

Sign-up · email-verification result (with resend for unverified/expired) · login · Kanban board with team selector · ticket create/edit/details · team management · epic management.

## Testing requirement

Include automated tests covering **at least one backend business flow and at least one frontend or API flow**.

When tests fail, first investigate whether the application code is wrong.
Do not weaken, delete, or rewrite tests just to make them pass.
Only update tests when the requirement or intended behavior has changed.
Explain the root cause before changing either production code or tests.

After every implementation task:
- run the smallest relevant test set first
- run full test suite before commit if the change affects shared behavior
- invoke @qa-reviewer before commit
- do not claim completion without test command output