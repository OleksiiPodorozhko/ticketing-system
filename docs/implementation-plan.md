# Implementation Plan

**Shape:** vertical slices. Every slice delivers API + UI + server-side rules + at least a smoke-level test for one feature, ends in a working `docker compose up --build` stack, and passes a **QA gate** before commit. No slice starts until the previous slice's gate passed — a half-finished later slice is worth less than a demo-ready earlier one.

Sources: [architecture.md](architecture.md) (stack & decisions) · [business-rules.md](business-rules.md) (BR) · [user-flows.md](user-flows.md) (F) · [implementation-risks.md](implementation-risks.md) (R) · [qa/test-checklist.md](qa/test-checklist.md) (CHK). Live status is tracked in [project-state.md](project-state.md), not here.

---

## QA gate protocol (every slice)

Per CLAUDE.md, at the end of each slice, **before commit**:

1. Run the smallest relevant test set for the slice; then the full suite if shared behavior changed.
2. Manually run the slice's CHK items from [qa/test-checklist.md](qa/test-checklist.md) against the compose stack.
3. **Invoke `@qa-reviewer`** with: the slice goal, changed files, and the BR/F/CHK IDs claimed as covered.
4. Address Critical/Major findings before committing; log the review in [qa/qa-review-log.md](qa/qa-review-log.md); update [project-state.md](project-state.md).
5. Commit only with test command output in hand — no completion claims without it.

Verdict `FAIL` or `BLOCKED` from qa-reviewer stops the line: fix or descope before moving on.

## Budget overview (48 h)

| # | Slice | Est. | Cum. | Demoable outcome |
|---|---|---|---|---|
| 0 | Walking skeleton | 4 h | 4 | Compose stack up: SPA shell, health, migrated empty DB, Mailpit |
| 1 | Auth & email verification | 10 h | 14 | Sign-up → email → verify → login → logout (DoD-1) |
| 2 | Teams | 3 h | 17 | Team CRUD with 409 guard (DoD-2 half) |
| 3 | Epics | 3 h | 20 | Epic CRUD with 409 guard (DoD-2 done) |
| 4 | Tickets | 8 h | 28 | Ticket CRUD + invariants; list-view stand-in for board (DoD-3) |
| 5 | Comments | 2 h | 30 | Comments on tickets (DoD-4) |
| 6 | Kanban board | 8 h | 38 | Drag-and-drop board + filters (DoD-5, DoD-6) |
| 7 | Hardening & delivery | 6 h | 44 | Fresh-machine startup proof, README, test suite complete (DoD-7…10) |
| — | Buffer | 4 h | 48 | Absorbed by whatever slips (expect: 1 and 6) |

Slices 2, 3, 5 are deliberately thin — same CRUD skeleton reused. Slices 1, 4, 6 carry the risk (R1/R7, R3/R4, R9/R10).

---

## Slice 0 — Walking skeleton (4 h)

Everything infrastructural, once, while the codebase is empty — de-risks R2 (cross-platform compose) on day one.

- Repo scaffolding: `backend/` (Fastify + TS + Prisma + Vitest), `frontend/` (Vite + React + TS), Node entries added to `.gitignore`.
- `docker-compose.yml` (app, db, mailpit; healthchecks; `depends_on` ordering) + multi-stage `Dockerfile` per [architecture.md](architecture.md) §2.
- Prisma schema for **all six tables** + initial migration (incl. the raw-SQL case-insensitive unique indexes — R6). Schema up front, one migration; later slices only touch it if a real gap appears.
- `GET /api/health`; error-mapper plugin emitting the `{error:{code,message}}` contract; SPA shell with router and route stubs.
- Test harness proof: one trivial API test runs against the compose DB.
- **Verify:** `docker compose down -v && docker compose up --build` from a clean clone → app on :8080, Mailpit on :8025, DB empty except migration metadata.

**QA gate 0** — CHK-OPS-01/02/03/10 evidence + qa-reviewer review of compose/migration/layout vs BR-O01…O03, BR-P09/P10.

## Slice 1 — Auth & email verification (10 h) — F1–F4, DoD-1

The critical path (R1): every other DoD item sits behind a verified login. Largest slice; do it first, do it completely.

- API: signup (trim/lowercase email, argon2 hash, create token, send mail via nodemailer/env-SMTP), verify (single-use, 24 h expiry, reissue-invalidates — BR-A07/A08/A11), resend (with the 1/min guard), login (JWT httpOnly cookie; 403 + resend hint when unverified), logout, `me`.
- Auth-guard plugin: everything outside the public allowlist rejects 401/403 (BR-A13, R12).
- UI: sign-up, login (with resend affordance), verification-result (success/error/resend), route guard redirecting unauthenticated users; header shell with user email + Log out.
- **Backend test slot (part 1):** token lifecycle integration tests — valid, expired, consumed, superseded-by-resend, already-verified (CHK-AUTH-07/11/12/13).
- **API-flow test slot:** sign-up → pull mail from Mailpit REST API → verify → login (CHK-AUTH-02/08).

**QA gate 1** — CHK-AUTH-01…19 (items 18–19 are white-box/repo-scan checks, done by inspection) + qa-reviewer, emphasis BR-A13/A14 boundary and R7 edges.

## Slice 2 — Teams (3 h) — F5, DoD-2 (part)

- API: list/create/rename/delete; trim + non-empty + case-insensitive-unique name → 409 on duplicates (Q12 decision); delete with tickets or epics → **409** (service check + RESTRICT FK backstop, R5).
- UI: team management screen (list, create, rename, delete with disabled-state + error toast on 409); this screen also unblocks the board's team selector later.
- Test: 409-on-delete + duplicate-name integration tests (completes the restrict-delete part of the backend slot).

**QA gate 2** — CHK-TEAM-01…07, CHK-API-04 + qa-reviewer.

## Slice 3 — Epics (3 h) — F6, DoD-2 (done)

- API: list (by team)/create/update/delete; team set at creation, immutable — update ignores/rejects `teamId` (BR-E02, CHK-EPIC-03); delete while referenced → 409.
- UI: epic management screen with team selector scoping the list (W5 pattern).
- Test: epic 409 + immutable-team integration tests.

**QA gate 3** — CHK-EPIC-01…07 + qa-reviewer.

## Slice 4 — Tickets (8 h) — F7, DoD-3

The invariants slice (R3, R4). Board UI comes in slice 6; here the UI is create/edit/details + a plain per-team list so tickets are visible and testable.

- API: CRUD with full server-side validation — closed enums, existing team/epic refs, non-empty trimmed title/body, length caps (BR-K01…K09).
- **Same-team epic invariant** inside the write transaction: on create/update, re-read the epic and reject 422 unless `epic.team_id === ticket.team_id` (BR-K06, R4).
- **`modified_at` per-field diff**: update handler fetches current row, compares editable fields, writes + advances `modified_at` only on an actual difference (BR-K11, R3). No triggers, no ORM auto-touch.
- Delete: UI confirmation dialog; comments cascade (BR-K15).
- UI: ticket create/edit/details screen (W3): team/type/state/epic dropdowns (epic list scoped to selected team; team change **clears** epic — Q21), metadata line, delete-with-confirm.
- **Backend test slot (part 2):** `modified_at` semantics — real change advances, unchanged save does not, (comment case added in slice 5); cross-team epic rejected on create and on team-change (CHK-TKT-06/11/12).

**QA gate 4** — CHK-TKT-01…14 (13 of 14; CHK-TKT-14 evidence completed in slice 5) + qa-reviewer, emphasis R3/R4.

## Slice 5 — Comments (2 h) — F8, DoD-4

- API: list oldest-first + create (non-empty, author from session); no update/delete routes at all (BR-C05).
- UI: comments panel in ticket details — list with author email + timestamp, add-comment box.
- Test: **comment does not advance ticket `modified_at`** (BR-K12 — completes the backend slot) + cascade-delete evidence (CHK-TKT-14).

**QA gate 5** — CHK-CMT-01…05 + qa-reviewer.

## Slice 6 — Kanban board (8 h) — F9, DoD-5, DoD-6

The primary screen, last of the features because it composes everything before it.

- Board page: team selector (URL-query state, default first-by-name — Q29/Q30), five columns in workflow order with human-readable labels (BR-B02, BR-K04), cards with title/type/epic, column sort `modified_at desc, id desc` (BR-B07/Q33), counts, "+ New ticket", card→details navigation.
- Drag-and-drop (@hello-pangea/dnd): optimistic move → `PATCH {state}` → **on failure revert card + show error** (BR-B04/B05, R9). Guard against double-drag while a PATCH is in flight.
- Client-side filters: type + epic + case-insensitive title substring, AND-combined, clear button, filtered count (BR-B09, Q28/Q31).
- Empty states: zero teams (create-team CTA), empty team, empty column (BR-O05).
- Scale check: script ~120 tickets **via the API** (legitimate channel, DoD-10; script lives outside the startup path — R8), verify usability (CHK-BRD-11).
- Manual failure injection: stop backend mid-drag, confirm revert + error (CHK-BRD-07).
- If time allows (buffer, not slice budget): Playwright drag test; otherwise the API-flow test from slice 1 already fills the second BR-O08 slot.

**QA gate 6** — CHK-BRD-01…13 + qa-reviewer, emphasis DoD-6 refresh-persistence and R9/R10.

## Slice 7 — Hardening & delivery (6 h) — DoD-7…10

- Full checklist run: copy [qa/test-checklist.md](qa/test-checklist.md) to `docs/qa/runs/<date>-run1.md`, execute all 81 items, log defects, fix Critical/Major.
- Fresh-machine proof: clean clone on at least one other OS (or a pristine Docker context): `docker compose up --build` → run DoD-1 end-to-end (R2). Fresh-DB proof: `down -v` → `up --build` → API confirms zero entities (CHK-OPS-02/03).
- Secrets sweep: no credentials/SMTP secrets/hard-coded passwords in the repo (CHK-AUTH-19, DoD-8).
- README: prerequisites (Docker only), startup, ports, SMTP configuration incl. the `relay1.dataart.com` override, test commands (BR-O07).
- Scope guard self-check: nothing from §12 crept in (CHK-OPS-07, R15).
- Full test suite green; second-browser spot-check (CHK-OPS-09).

**QA gate 7 (final)** — qa-reviewer demo-readiness review across all DoD items; verdict recorded in [qa/qa-review-log.md](qa/qa-review-log.md).

---

## Explicitly deferred

- **Stretch (§14)** — password reset, own-comment edit/delete, activity history, virtualization: only if all gates 0–7 passed and buffer remains. Realistic answer: none.
- **Out of scope (§12)** — hard deny-list; qa-reviewer checks every gate (R15).
- Playwright browser tests, CI pipeline, shared types package, staging environments: not required by any DoD item.

## Standing risks while executing

- **R1 first**: if slice 1 slips past ~14 h cumulative, cut UI polish elsewhere — never the verification flow.
- **Tests inside slices, not after** (R14): the two BR-O08 slots are filled in slices 1–5 by design; slice 7 only completes coverage.
- **Fresh-DB discipline** (R8): no seed logic anywhere in the startup path; the 100-ticket script is a manually-run tool.
