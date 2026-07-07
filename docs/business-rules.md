# Business Rules Catalogue

Numbered, testable rules extracted from `requirements/Hackathon_Ticketing_System_Requirements_v3.pdf` (§ references) and, where noted, wireframes (W references, non-binding). **Enforcement locus:** unless a rule is purely presentational, it must be enforced **server-side** — §6 states client-side validation alone is insufficient, and §9 requires DB constraints and/or server-side validation.

Legend: **[S]** server-enforced · **[U]** UI behavior · **[S+U]** both. Q-numbers refer to the open-question list in [requirements-analysis.md](requirements-analysis.md#8-consolidated-ambiguity--open-question-list). DoD-n refers to the Definition of Done items there.

---

## AUTH — Accounts & authentication (§3)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-A01 | Sign-up requires an email address and password; no other identity mechanism (no SSO/OAuth). | S+U | §3, §12 |
| BR-A02 | Emails are trimmed and compared case-insensitively; the resulting value must be unique across users. | S | §3 |
| BR-A03 | Passwords must be at least 8 characters. (No other policy specified — Q1.) | S+U | §3 |
| BR-A04 | Passwords are never stored in plain text; hashing uses an established password-hashing algorithm (e.g. Argon2id). | S | §3 |
| BR-A05 | After sign-up, the system sends an email-verification message via a configurable SMTP service; `relay1.dataart.com` must be supported. | S | §3 |
| BR-A06 | An account cannot use the main application until its email is verified. | S | §3 |
| BR-A07 | Verification links/tokens expire after 24 hours. | S | §3 |
| BR-A08 | Verification tokens are single-use. | S | §3 |
| BR-A09 | Successful verification leads the user to the login screen; automatic login is not required. | U | §3 |
| BR-A10 | An unverified user can request a new verification email from the login screen and from the verification-result screen. | U | §3, §10 |
| BR-A11 | Issuing a new verification token invalidates all earlier unused tokens for that user. | S | §3 |
| BR-A12 | Users can log in and log out with local credentials. | S+U | §3 |
| BR-A13 | All screens and API endpoints require authentication **except**: sign-up, login, email verification, verification-email resend. Static frontend assets and optional health/readiness endpoints may be public. | S | §3 |
| BR-A14 | Session identifiers, access tokens, and bearer tokens must never appear in URLs. Sole exception: the single-use email-verification token in the verification URL. | S | §9 |
| BR-A15 | No credentials or SMTP secrets in source control; no hard-coded user passwords. | — | §11, DoD-8 |

## TEAM — Teams (§4)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-T01 | Every ticket belongs to exactly one team; tickets are grouped by team. | S | §4, §6 |
| BR-T02 | Authenticated (verified) users can list, create, rename, and delete teams. | S+U | §4 |
| BR-T03 | A team has at least: identifier, name, created timestamp, modified timestamp. | S | §4 |
| BR-T04 | Team names must be non-empty after trimming. | S+U | §4 |
| BR-T05 | Team names are unique case-insensitively. (Status code for rename collisions unspecified — Q12.) | S | §4 |
| BR-T06 | A team cannot be deleted while it contains tickets **or** epics; no cascading team deletion. The API returns HTTP **409 Conflict**; the UI shows a clear validation message. | S+U | §4, §9 |
| BR-T07 | No team ownership or membership: all verified users can view and manage all teams. | S | §4, §12 |

## EPIC — Epics (§5)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-E01 | Each epic belongs to exactly one team. | S | §5 |
| BR-E02 | An epic's team is selected at creation and cannot be changed afterwards (moving epics between teams is out of scope). | S+U | §5 |
| BR-E03 | Epic CRUD (create, list, edit, delete) happens on a dedicated screen. | U | §5, §10 |
| BR-E04 | An epic has at least: identifier, team reference, title, optional description, created timestamp, modified timestamp. | S | §5 |
| BR-E05 | Epic titles must be non-empty after trimming. (Uniqueness not required — Q15.) | S+U | §5 |
| BR-E06 | An epic cannot be deleted while any ticket references it. The API returns HTTP **409 Conflict**; the UI shows a clear validation message. | S+U | §5, §9 |

## TKT — Tickets (§6)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-K01 | Ticket fields: system-generated stable unique id; team (required, must exist); type; state; optional epic; title; body; created_at; modified_at; created_by. | S | §6 |
| BR-K02 | `type` accepts exactly `bug`, `feature`, `fix`. Labels only — no behavioral difference between types. | S | §6 |
| BR-K03 | `state` accepts exactly `new`, `ready_for_implementation`, `in_progress`, `ready_for_acceptance`, `done` as canonical API values. The workflow is fixed; no custom states. | S | §6 |
| BR-K04 | The UI displays human-readable state labels with spaces (e.g. “Ready for implementation”). | U | §6 |
| BR-K05 | The backend validates **all** submitted enum values and references; client-side validation alone is insufficient. | S | §6 |
| BR-K06 | A ticket's epic must be null or reference an epic belonging to **the same team** as the ticket; the backend enforces this. | S | §5, §6 |
| BR-K07 | Epic selection in the UI offers only epics of the ticket's team (drop-down). | U | §5 |
| BR-K08 | When a ticket's team changes, the UI must clear or replace the selected epic (Q21); the backend must reject a ticket whose epic belongs to a different team. | S+U | §6 |
| BR-K09 | Title must be non-empty after trimming; body must be non-empty. No mandated maximum lengths (Q20). Plain text or Markdown body is acceptable; rich text not required. | S+U | §6 |
| BR-K10 | `created_at` is set by the server, in UTC, at creation. | S | §6 |
| BR-K11 | `modified_at` is set by the server, in UTC, whenever ticket fields or state actually change. Saving unchanged values must **not** advance it. | S | §6 |
| BR-K12 | Adding a comment does **not** change `modified_at` (and therefore does not change board ordering). | S | §6, §7 |
| BR-K13 | `created_by` is set automatically from the authenticated user. | S | §6 |
| BR-K14 | Users can create a ticket; open and view **all** fields including created_by, created_at, modified_at; and edit type, team, epic, title, body, state. | S+U | §6 |
| BR-K15 | Deleting a ticket requires explicit confirmation and also deletes its comments. | S+U | §6 |
| BR-K16 | State changes performed via drag-and-drop are persisted immediately in the database. | S+U | §6, §8 |

## CMT — Comments (§7)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-C01 | Authenticated users can add comments to a ticket. | S+U | §7 |
| BR-C02 | A comment contains: identifier, ticket reference, author, body, created timestamp. | S | §7 |
| BR-C03 | Comment bodies must be non-empty. | S+U | §7 |
| BR-C04 | Comments are displayed chronologically, oldest first. | U | §7 |
| BR-C05 | Comments are immutable after creation in mandatory scope (edit/delete own comments is stretch only). | S | §7, §14 |

## BRD — Kanban board (§8)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-B01 | The primary screen is a Kanban board for **one selected team**. | U | §8, §10 |
| BR-B02 | Exactly five columns, one per state, in workflow order. | U | §8 |
| BR-B03 | Each card shows at least title and type; showing the epic is recommended (W1 also shows it). | U | §8 |
| BR-B04 | Dragging a card to another column changes the ticket's state and persists it through the backend API. | S+U | §8 |
| BR-B05 | If a drag-and-drop update fails, the card returns to its previous column and the UI displays an error. | U | §8 |
| BR-B06 | Cards may move directly between **any** two states; sequential-transition enforcement is not required. | S | §8 |
| BR-B07 | Within a column, cards are ordered most-recently-modified first; persisting a custom manual order is not required. (Tie-breaking unspecified — Q33.) | U | §8 |
| BR-B08 | The board provides a clear way to create a ticket and to open an existing ticket. | U | §8 |
| BR-B09 | Minimum filtering: by ticket type, by epic, plus case-insensitive substring search over ticket **title**. Active filters combine with AND. Client-side or server-side implementation both acceptable (Q28). | U (or S) | §8 |
| BR-B10 | The board must remain usable with at least 100 tickets on one team board (Q32). | U | §8 |

## API — API & persistence (§9)

| ID | Rule | Locus | Spec |
|---|---|---|---|
| BR-P01 | All create/update/delete operations go through the backend API and persist in the RDBMS. | S | §9 |
| BR-P02 | Browser local storage must not be the system of record. | U | §9 |
| BR-P03 | Referential integrity is maintained via database constraints and/or server-side validation. | S | §9 |
| BR-P04 | Meaningful HTTP status codes and error messages for: validation failures, authentication failures, missing records, conflicts. Team-delete-with-contents and epic-delete-while-referenced return **409 Conflict**. | S | §9 |
| BR-P05 | Identifiers: UUIDs or database-generated numeric values. | S | §9 |
| BR-P06 | API timestamps use ISO-8601 representation in UTC. | S | §9 |
| BR-P07 | Cookie sessions or bearer tokens are both acceptable (subject to BR-A14). | S | §9 |
| BR-P08 | No concurrent-edit conflict detection: last successful write wins (Q40). | S | §9 |
| BR-P09 | Schema creation is automated via migrations or an equivalent repeatable initialization mechanism. | S | §9 |
| BR-P10 | After initialization, a fresh database contains **no** application users, teams, epics, tickets, or comments — migration metadata only. The default startup path loads no sample/seed data. | S | §9, DoD-9 |

## OPS — Delivery & operations (§2, §11)

| ID | Rule | Spec |
|---|---|---|
| BR-O01 | `docker compose up --build` from the repo root starts the complete solution from a clean checkout; no host-installed runtimes beyond Docker Compose; works on clean Windows/macOS/Linux. | §2, DoD-7 |
| BR-O02 | Three logical tiers (presentation / application-API / persistence) remain clearly separated regardless of container layout. | §2 |
| BR-O03 | The RDBMS runs as a dedicated server-based container (e.g. PostgreSQL). | §2 |
| BR-O04 | A browser refresh or application restart must not lose persisted data. | §11 |
| BR-O05 | The UI displays loading, empty, success, and error states where applicable. | §11 |
| BR-O06 | Supported browsers: a current desktop Chrome, Edge, or Firefox. | §11 |
| BR-O07 | README documents prerequisites, configuration, and startup commands. | §11 |
| BR-O08 | Automated tests cover at least one backend business flow and at least one frontend-or-API flow. | §11 |

---

## DoD traceability

| DoD | Covered by rules |
|---|---|
| DoD-1 (sign-up → email → verify → login) | BR-A01…BR-A12 |
| DoD-2 (teams & epics managed via UI, persisted) | BR-T02…BR-T06, BR-E02…BR-E06, BR-P01 |
| DoD-3 (verified user: ticket CRUD) | BR-A06, BR-K01…BR-K15 |
| DoD-4 (comments with author & timestamp) | BR-C01…BR-C04 |
| DoD-5 (board shows correct columns per team) | BR-B01…BR-B03, BR-B07 |
| DoD-6 (drag persists; survives refresh) | BR-K16, BR-B04, BR-B05, BR-O04 |
| DoD-7 (compose startup) | BR-O01 |
| DoD-8 (no committed secrets) | BR-A15 |
| DoD-9 (fresh DB empty) | BR-P09, BR-P10 |
| DoD-10 (QA creates data via UI/API) | BR-P01, BR-P10 |
