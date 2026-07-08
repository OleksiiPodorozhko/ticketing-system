# Test Checklist (master)

Manual run-sheet for the mandatory MVP. Refs point to [business-rules.md](../business-rules.md) (BR), [user-flows.md](../user-flows.md) (F), DoD items, and open questions (Q) in [requirements-analysis.md](../requirements-analysis.md). Priorities per [test-strategy.md](test-strategy.md) §3.

**How to use:** this master stays result-empty. For each test cycle, copy this file to `docs/qa/runs/<date>-run<n>.md`, fill **Result** (`Pass` / `Fail` / `Blocked` / `N/A`) and **Notes** (defect refs, observed behavior for `[blocked: Qnn]` items), and record the cycle in `docs/qa/reviews/` (one index row in [qa-review-log.md](qa-review-log.md)). Items tagged `[blocked: Qnn]` have a provisional expectation — record actual behavior rather than failing them, unless they violate a hard BR rule.

**Conventions:** "API-level" = exercise with an HTTP client, not the UI, because client-side validation alone is insufficient (BR-K05). Fresh-DB items require `docker compose down -v` first.

---

## AUTH — Authentication & verification (F1–F4)

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-AUTH-01 | Sign-up, login, verification, and resend screens/endpoints are reachable **without** authentication | BR-A13 | P1 | | |
| CHK-AUTH-02 | Sign-up with valid email + ≥8-char password creates an **unverified** account and sends a verification email via configured SMTP | BR-A01, A05; F1; DoD-1 | P0 | | SMTP env required (Q8) |
| CHK-AUTH-03 | Sign-up rejects a password shorter than 8 characters with a clear message | BR-A03 | P1 | | |
| CHK-AUTH-04 | Sign-up rejects an empty/whitespace-only email; surrounding whitespace in email is trimmed | BR-A02 | P1 | | |
| CHK-AUTH-05 | Sign-up with an already-registered email creates **no duplicate account** `[blocked: Q5]` | BR-A02; F1 | P1 | | Record actual response behavior |
| CHK-AUTH-06 | Sign-up with an existing email differing only in **case or surrounding whitespace** is treated as the same email (no duplicate) | BR-A02; R6 | P1 | | |
| CHK-AUTH-07 | Clicking a valid, unexpired, unused verification link marks the account verified and shows the success result screen with a path to login; **no auto-login** | BR-A08, A09; F1 | P0 | | |
| CHK-AUTH-08 | A verified user can log in with correct credentials and reach the main application | BR-A12; F3; DoD-1 | P0 | | |
| CHK-AUTH-09 | Login with wrong password/unknown email fails with a meaningful error and **no session** | BR-P04; F3 | P1 | | |
| CHK-AUTH-10 | An **unverified** account cannot use the main application (screens or API) `[blocked: Q4]` | BR-A06 | P0 | | Presume error + resend affordance |
| CHK-AUTH-11 | An **expired** verification link (>24 h) shows the error result screen with a resend action | BR-A07, A10 | P1 | | Needs clock/config control or a pre-aged token |
| CHK-AUTH-12 | Re-using an already-**consumed** verification link shows an error (token is single-use) `[blocked: Q10]` | BR-A08 | P1 | | |
| CHK-AUTH-13 | Resend issues a new token and email; **all earlier unused links become invalid** | BR-A11; F2 | P1 | | |
| CHK-AUTH-14 | Resend is available from **both** the login screen and the verification-result error screen | BR-A10; F2 | P2 | | |
| CHK-AUTH-15 | Log out (header user menu) ends the session; protected screens/API then require re-login | BR-A12; F4 | P1 | | |
| CHK-AUTH-16 | API-level: every endpoint **except** sign-up/login/verify/resend (and static assets, optional health) rejects unauthenticated requests | BR-A13; R12 | P1 | | Sweep once routes exist |
| CHK-AUTH-17 | Session id / auth token never appears in any URL (only the verification token in the verification link) | BR-A14 | P1 | | Watch address bar + network log |
| CHK-AUTH-18 | Passwords are stored only as hashes from an established algorithm — never plaintext (code/DB inspection) | BR-A04 | P1 | | White-box check |
| CHK-AUTH-19 | No credentials, SMTP secrets, or hard-coded user passwords anywhere in the repository | BR-A15; DoD-8 | P0 | | Repo scan |

## TEAM — Team management (F5)

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-TEAM-01 | Create team with a valid name → appears in list with created/modified timestamps | BR-T02, T03; F5a; DoD-2 | P1 | | |
| CHK-TEAM-02 | Create/rename with an empty or whitespace-only name is rejected; surrounding whitespace is trimmed | BR-T04 | P1 | | |
| CHK-TEAM-03 | Create/rename with a name duplicating another team **case-insensitively** is rejected `[blocked: Q12]` | BR-T05; R6 | P1 | | Any clear 4xx passes; record code |
| CHK-TEAM-04 | Rename a team → name updates, modified timestamp advances | BR-T03; F5b | P2 | | Q11: only rename need advance it |
| CHK-TEAM-05 | Delete an **empty** team succeeds and removes it | F5c | P1 | | |
| CHK-TEAM-06 | Delete a team containing tickets **or** epics → API returns **409** and UI shows a clear message (or pre-disabled control + 409 at API level) | BR-T06; R5 | P1 | | API-level too |
| CHK-TEAM-07 | A second verified user can see and manage teams created by the first (no ownership) | BR-T07 | P2 | | |

## EPIC — Epic management (F6)

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-EPIC-01 | Create epic on the dedicated screen with team + title (+ optional description) → appears in list | BR-E03, E04; F6a; DoD-2 | P1 | | |
| CHK-EPIC-02 | Create/edit with an empty or whitespace-only title is rejected | BR-E05 | P1 | | |
| CHK-EPIC-03 | An epic's team cannot be changed after creation — no UI control, and API-level team change is rejected | BR-E02 | P1 | | API-level |
| CHK-EPIC-04 | Edit title/description persists | F6b | P2 | | |
| CHK-EPIC-05 | Delete an **unreferenced** epic succeeds | F6c | P1 | | |
| CHK-EPIC-06 | Delete an epic referenced by ≥1 ticket → API returns **409** and UI shows a clear message | BR-E06; R5 | P1 | | API-level too |
| CHK-EPIC-07 | Two epics with the same title in one team are **allowed** (uniqueness not required) | BR-E05; Q15 | P2 | | |

## TKT — Ticket lifecycle (F7)

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-TKT-01 | Create ticket (team, type, state, optional epic, title, body) → card appears in the matching column of that team's board | BR-K01; F7a; DoD-3 | P0 | | |
| CHK-TKT-02 | Empty/whitespace title or empty body is rejected — including at API level | BR-K09, K05 | P1 | | API-level |
| CHK-TKT-03 | API-level: invalid `type` or `state` value (anything outside the two closed enums) is rejected | BR-K02, K03, K05 | P1 | | e.g. `type=task`, `state=closed` |
| CHK-TKT-04 | API-level: creating/updating with a nonexistent team or epic id is rejected | BR-P03, K01 | P1 | | |
| CHK-TKT-05 | Epic drop-down offers only epics of the ticket's currently selected team | BR-K07 | P2 | | |
| CHK-TKT-06 | API-level: a ticket whose epic belongs to a **different team** is rejected (create and edit) | BR-K06; R4 | P1 | | Core invariant |
| CHK-TKT-07 | On create, server sets id, `created_at` (UTC), and `created_by` = the authenticated user | BR-K10, K13 | P2 | | Verify via API response |
| CHK-TKT-08 | Details view shows all fields incl. created_by, created_at, modified_at | BR-K14; F7b | P2 | | |
| CHK-TKT-09 | Each editable field (type, team, epic, title, body, state) can be changed and persists | BR-K14; F7c; DoD-3 | P1 | | |
| CHK-TKT-10 | Changing the ticket's team clears or replaces the epic in the UI; the epic list switches to the new team `[blocked: Q21]` | BR-K08 | P1 | | Either behavior passes |
| CHK-TKT-11 | An actual field/state change advances `modified_at` (UTC) | BR-K11 | P1 | | |
| CHK-TKT-12 | Saving with **no changes** does **not** advance `modified_at` | BR-K11; R3 | P1 | | Compare API timestamps before/after |
| CHK-TKT-13 | Delete asks for **explicit confirmation** before deleting | BR-K15; F7d | P1 | | |
| CHK-TKT-14 | Deleting a ticket also deletes **all its comments** | BR-K15 | P1 | | Verify comments gone (API/DB) |

## CMT — Comments (F8)

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-CMT-01 | Add a comment → stored and displayed with author and created timestamp `[blocked: Q25]` | BR-C01, C02; DoD-4 | P1 | | Presume email as author display |
| CHK-CMT-02 | Empty/whitespace comment is rejected | BR-C03 | P1 | | |
| CHK-CMT-03 | Comments display oldest-first; a new comment appears at the bottom | BR-C04 | P2 | | |
| CHK-CMT-04 | Adding a comment does **not** advance the ticket's `modified_at` and does not change its board position | BR-K12; R3 | P1 | | |
| CHK-CMT-05 | No comment edit/delete in mandatory scope — no UI controls; API-level modification of an existing comment is rejected | BR-C05 | P2 | | Skip if stretch §14.2 implemented — then only **own** comments editable |

## BRD — Kanban board (F9)

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-BRD-01 | Board shows exactly **5 columns** in workflow order with human-readable labels (`New`, `Ready for implementation`, …) | BR-B02, K04; DoD-5 | P0 | | |
| CHK-BRD-02 | Board shows only the selected team's tickets; switching teams switches the cards | BR-B01; F9a; DoD-5 | P1 | | |
| CHK-BRD-03 | Cards show at least title and type (epic recommended) | BR-B03 | P2 | | |
| CHK-BRD-04 | Within each column, cards are ordered **most-recently-modified first** | BR-B07 | P1 | | Ties: any stable order (Q33) |
| CHK-BRD-05 | Dragging a card to another column (incl. non-adjacent, forward and backward) changes state and persists **immediately** via the API | BR-B04, B06, K16; F9b; DoD-6 | P0 | | Check network call fires |
| CHK-BRD-06 | After a drag, a full page refresh shows the card still in the new column | DoD-6; BR-O04 | P0 | | |
| CHK-BRD-07 | Forced drag failure (e.g. stop backend, cut network) → card **returns to its previous column** and an error is shown | BR-B05; R9 | P1 | | Deliberate failure injection |
| CHK-BRD-08 | Title search is a case-insensitive **substring** match | BR-B09; F9c | P2 | | |
| CHK-BRD-09 | Type filter and epic filter each narrow the board correctly | BR-B09 | P2 | | |
| CHK-BRD-10 | Multiple active filters combine with **AND**; Clear resets all filters | BR-B09 | P2 | | |
| CHK-BRD-11 | Board remains usable (scroll, open, drag, filter) with **≥100 tickets** on one team board | BR-B10; R10 | P2 | | Create via API script (DoD-10) |
| CHK-BRD-12 | Board offers a clear way to create a new ticket and to open an existing one | BR-B08 | P2 | | |
| CHK-BRD-13 | Sensible empty states: zero teams, and a team with zero tickets `[blocked: Q29]` | BR-O05 | P2 | | Fresh-DB scenario |

## API — API contract & persistence

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-API-01 | All created data survives a full stack restart (`docker compose restart` / down+up **without** `-v`) | BR-P01, O04 | P1 | | |
| CHK-API-02 | Data created in one browser is visible from another browser/incognito session — local storage is not the system of record | BR-P02 | P1 | | |
| CHK-API-03 | Validation failures return 4xx with a meaningful message; auth failures return 401/403; missing records return 404 | BR-P04 | P2 | | Spot-check per entity |
| CHK-API-04 | The two restrict-delete conflicts return **409** specifically | BR-P04, T06, E06 | P1 | | Same evidence as CHK-TEAM-06 / CHK-EPIC-06 |
| CHK-API-05 | All API timestamps are ISO-8601 in **UTC** (correct value, not local time mislabeled) | BR-P06; R13 | P1 | | Compare with a known clock |
| CHK-API-06 | Type/state are stored and returned as the exact canonical strings (`bug`/`feature`/`fix`; `new`/`ready_for_implementation`/…) | BR-K02, K03 | P2 | | |

## OPS — Delivery & startup contract

| ID | Check | Refs | Pri | Result | Notes |
|---|---|---|---|---|---|
| CHK-OPS-01 | From a **clean checkout**, `docker compose up --build` at repo root starts frontend, backend, and DB container; app is usable with nothing else installed | BR-O01; DoD-7; R2 | P0 | | Clean machine per OS if possible |
| CHK-OPS-02 | After a fresh init, the DB contains **schema + migration metadata only** — zero users, teams, epics, tickets, comments | BR-P10; DoD-9 | P0 | | `down -v` first; inspect via API/DB |
| CHK-OPS-03 | Repeatable init: `docker compose down -v` then `up --build` again succeeds and yields the same fresh state | BR-P09 | P0 | | |
| CHK-OPS-04 | The default startup path loads **no** sample/seed data at any point (incl. no default admin user in migrations) | BR-P10; R8; DoD-8/9 | P0 | | |
| CHK-OPS-05 | All test data for this run was creatable via UI/API only — no manual DB writes were needed | DoD-10 | P0 | | Attest per run |
| CHK-OPS-06 | README documents prerequisites, configuration (incl. SMTP), and startup commands accurately | BR-O07 | P2 | | Follow it literally |
| CHK-OPS-07 | **Scope guard:** no §12 features present (sprints, SSO, roles/membership, attachments, notifications, real-time updates, custom workflows, reporting) | §12; R15; BR-T07 | P2 | | Presence = finding, not a pass |
| CHK-OPS-08 | Loading and error states appear where applicable (slow network, backend down) | BR-O05 | P2 | | |
| CHK-OPS-09 | Core flows work in at least one current desktop browser; spot-check a second (Chrome/Edge/Firefox) | BR-O06 | P2 | | |
| CHK-OPS-10 | Three-tier separation is evident: SPA ↔ HTTP API ↔ server-based RDBMS container | BR-O02, O03 | P2 | | Compose/architecture inspection |

---

**Totals:** 81 checks — AUTH 19 · TEAM 7 · EPIC 7 · TKT 14 · CMT 5 · BRD 13 · API 6 · OPS 10. P0: 14 · P1: 43 · P2: 24.
