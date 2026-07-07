# Requirements Analysis

**Source of truth:** `requirements/Hackathon_Ticketing_System_Requirements_v3.pdf` (referenced below as §1–§15) and the five wireframes in `requirements/wireframes/` (referenced as W1–W5). Wireframes are explicitly **non-binding** (§15): they illustrate information hierarchy and flows, not required visual design.

Related documents: [entities.md](entities.md) · [business-rules.md](business-rules.md) · [user-flows.md](user-flows.md) · [implementation-risks.md](implementation-risks.md)

---

## 1. Objective (§1)

A small, working **Kanban-style ticket tracker**: registered users organize work tickets by team and move them through a **fixed five-state workflow**. The solution must demonstrate a functional UI, server-side business logic, and persistent relational storage.

## 2. Required architecture (§2)

| Constraint | Detail |
|---|---|
| Frontend | Single-page application (SPA) |
| Backend | Application exposing an HTTP API |
| Storage | Server-based RDBMS container (e.g. PostgreSQL) for **all** persistent application data |
| Tier separation | Presentation / application-API / persistence must remain clearly separated. Backend *may* serve the compiled SPA, or frontend/backend may be separate containers |
| Stack | Languages and frameworks unrestricted; must be cross-platform |
| **Startup contract** | From a clean checkout, `docker compose up --build` at the repo root starts the **entire** solution. No host-installed frontend/backend/DB runtime beyond Docker Compose. Must work on clean Windows, macOS, and Linux laptops (QA requirement) |

## 3. Scope

### 3.1 Mandatory (cover page, §3–§10)

| Area | Summary | Spec |
|---|---|---|
| Authentication | Local email/password sign-up, login, logout; mandatory email verification via configurable SMTP | §3 |
| Teams | Global CRUD (create, rename, delete); no ownership/membership | §4 |
| Epics | Per-team CRUD on a dedicated screen; team fixed at creation | §5 |
| Tickets | Full CRUD with type/state enums, optional same-team epic, audit fields | §6 |
| Comments | Append-only comments on tickets, oldest-first | §7 |
| Kanban board | Primary screen; 5 columns; drag-and-drop persisted immediately; filters + search | §8 |
| API & persistence | RDBMS as sole system of record; migrations; empty fresh DB; meaningful HTTP semantics | §9 |
| Screens | 8 minimum screens/actions | §10 |

### 3.2 Explicitly out of scope (§12) — do not build

- Scrum: sprints, backlogs, story points, velocity, burndown, sprint planning.
- SSO, OAuth, corporate identity, social login.
- Fine-grained roles, administrators, team membership, private teams, per-ticket access control.
- File attachments, notifications, mentions, watchers, audit history, real-time multi-user updates.
- Custom workflows, custom ticket types, subtasks, dependencies, time tracking, reporting dashboards.
- Production deployment, high availability, production-grade mail infrastructure.

### 3.3 Optional stretch (§14) — only after mandatory scope is done

1. Password reset flow.
2. Edit or delete **own** comments.
3. Ticket activity history.
4. Virtualized rendering for large boards.

## 4. Non-functional requirements (§11)

| Category | Requirement |
|---|---|
| Security | Protect authenticated endpoints; hash passwords; validate input; no credentials or SMTP secrets in source control |
| Reliability | Browser refresh or app restart must not lose persisted data |
| Usability | Loading, empty, success, and error states where applicable |
| Compatibility | Current desktop Chrome, Edge, or Firefox |
| Maintainability | README with prerequisites, configuration, startup commands |
| Testing | Automated tests: ≥1 backend business flow **and** ≥1 frontend-or-API flow |

## 5. Minimum screens (§10)

1. Sign-up screen (W2)
2. Email-verification result screen (W2)
3. Verification-email **resend** action for unverified / expired-token cases (W2 — reachable from login *and* verification-result screens per §3)
4. Login screen (W2)
5. Kanban board with team selector (W1)
6. Ticket create/edit/details view (W3)
7. Team management screen (W4)
8. Epic management screen (W5)

Additional UI expectation from §15: the collapsed user menu in the header includes **Log out**; disabled delete controls indicate records that cannot currently be deleted because they are referenced.

## 6. Definition of Done (§13) as acceptance criteria

| # | Acceptance criterion |
|---|---|
| DoD-1 | A user can sign up, receive a verification email through the configured SMTP service, verify the account, and log in |
| DoD-2 | Teams and epics can be managed through the UI and persist in the database |
| DoD-3 | A verified user can create, view, edit, and delete tickets |
| DoD-4 | A user can add comments and see their author and timestamp |
| DoD-5 | The Kanban board shows tickets in the correct state columns for the selected team |
| DoD-6 | Dragging a ticket to another column updates the server and remains correct after a page refresh |
| DoD-7 | `docker compose up --build` from a clean checkout at the repo root starts the application |
| DoD-8 | No hard-coded user password or committed secret anywhere in the solution |
| DoD-9 | A fresh database contains schema and migration metadata only; no application data preloaded |
| DoD-10 | QA can create all test/demo data through the UI or API without touching the database manually |

Traceability of DoD items to business rules and flows is maintained in [business-rules.md](business-rules.md) and [user-flows.md](user-flows.md).

## 7. Wireframe observations (W1–W5, non-binding)

### 7.1 Layout facts consistent with the spec

- **W1 (Board):** top nav `Board | Teams | Epics` + user menu (email shown); team dropdown; “+ New ticket” button; filter bar (title search, type dropdown, epic dropdown, Clear button, ticket counter); five columns `NEW / READY FOR IMPLEMENTATION / IN PROGRESS / READY FOR ACCEPTANCE / DONE`, each with a per-column count badge; cards show type badge, title, `Epic: <name>`, relative age (“2h ago”).
- **W2 (Auth):** three panels — Log in (with “Account not verified? → Resend email” and link to sign-up), Create account (email, password with “Minimum 8 characters” hint, confirm password), Email verification result (success state “Continue to login”; expired/invalid state “Show an error and a resend action”).
- **W3 (Ticket details):** back-link to team board; metadata line `TCK-1042 • Created by Alex • Created Jun 22, 09:15 UTC • Modified Jun 23, 12:40 UTC`; Delete + Save buttons; editable Team/Type/State dropdowns, Epic dropdown, Title input, Body textarea; comments panel with count, author + time per comment, add-comment box.
- **W4 (Teams):** table Name / Tickets / Epics / Modified / Actions; Edit always enabled, Delete disabled for teams with tickets or epics (caption: “Delete is disabled while a team contains tickets or epics.”); Create-team modal with a single Name field.
- **W5 (Epics):** team selector scoping the epic list; table Title(+short description) / Tickets / Modified / Actions; Delete (×) disabled while referenced (“Delete is disabled while tickets reference the epic.”); side panel Edit-epic form: Title, Description (optional), Cancel/Save.

### 7.2 Wireframe-vs-spec deltas (wireframe shows something the spec does not require)

| # | Delta | Where | Implication |
|---|---|---|---|
| Δ1 | Human-readable ticket key `TCK-1042` | W3 | §9 only requires UUID or numeric IDs. A display key is not mandated — decide whether to implement one |
| Δ2 | Author display names “Alex”, “Mina” | W3 | Sign-up (§3, W2) collects only email + password; there is no name field anywhere in the spec. Source of a display name is undefined |
| Δ3 | Per-team **Tickets** and **Epics** count columns | W4 | Derived data; not listed among required team fields (§4) |
| Δ4 | Per-epic **Tickets** count column | W5 | Derived data; not listed among required epic fields (§5) |
| Δ5 | “42 tickets” counter in the filter bar | W1 | Not required by §8; unclear whether it counts all team tickets or the filtered subset |
| Δ6 | Relative timestamps (“2h ago”, “Yesterday”, “Today 12:40”) | W1, W4, W5 | Display format is unspecified; API format is fixed (ISO-8601 UTC, §9) but UI format is free |
| Δ7 | Epic short description shown under title in list | W5 | Presentation choice, not required |
| Δ8 | Create-team as a modal; edit-epic as a side panel | W4, W5 | Layout is explicitly non-binding (§15) |

## 8. Consolidated ambiguity / open-question list

Every known gap, numbered for reference from the other documents. **None of these is resolved here** — resolving them is an implementation-phase decision or a question to the requirements owner.

### Authentication (§3)

| ID | Question |
|---|---|
| Q1 | Password policy beyond “≥ 8 characters”: is there a maximum length, allowed charset, or complexity requirement? (Spec names only the minimum.) |
| Q2 | How strict must email **format** validation be? Spec defines trim + case-insensitive uniqueness but no format rule. |
| Q3 | Session/token lifetime and idle expiry are unspecified. Is “logged in until logout” acceptable? |
| Q4 | What exactly happens when an **unverified** user attempts to log in — a specific error with a resend affordance (W2 hints at this), or a limited session? §3 says the account “cannot use the main application”, which permits either reading. |
| Q5 | Sign-up with an email that already exists (verified or unverified): what is the response? Silent resend? Explicit “account exists” error (user-enumeration disclosure)? Spec is silent. |
| Q6 | Is rate-limiting required on the resend-verification action? Not mentioned, but unlimited resends via `relay1.dataart.com` may be undesirable. |
| Q7 | Verification link target: does the link point at the SPA (which then calls the API) or directly at an API endpoint that redirects? §3 requires the result to “lead the user to the login screen”; the mechanism is open. |
| Q8 | “Configurable SMTP service … must support relay1.dataart.com”: does QA run with that relay (network/VPN access?) or with their own SMTP? What configuration surface is expected (env vars? file?), given secrets must not be committed (§11) and startup must be plain `docker compose up --build` (§2)? |
| Q9 | Does the resend action require the user to (re-)enter their email address, or is it tied to a prior context? W2 shows a bare “Resend email” button on the login card. |
| Q10 | Are verification tokens invalidated when the account becomes verified via a different token (i.e., is “single-use” per token or per account)? §3 implies both, but the already-verified-account + old-link case is unspecified. |

### Teams (§4)

| ID | Question |
|---|---|
| Q11 | Team `modified` timestamp semantics: does it change only on rename, or also when tickets/epics are added/changed? W4 shows “Today 12:40” for a team with 42 tickets, which could imply either. |
| Q12 | Renaming a team to a name that duplicates another team (case-insensitively): presumably a validation failure — which status code? (409 like other conflicts, or 400/422 as validation?) |
| Q13 | Are the per-team ticket/epic counts (W4) a requirement or a wireframe nicety? (Δ3) |
| Q14 | Is there any bound on team name length? Only “non-empty after trimming” is specified. |

### Epics (§5)

| ID | Question |
|---|---|
| Q15 | Epic titles are only required to be non-empty — duplicates within a team are therefore allowed. Intentional? |
| Q16 | Epic `modified` timestamp semantics: only on title/description edit? Does ticket attachment/detachment count? Unspecified. |
| Q17 | Any bound on epic description length? None specified. |
| Q18 | Is the epic screen scoped by a team selector (as in W5) required, or may all epics be listed together? §5 only says “a separate screen for epic CRUD”. |

### Tickets (§6)

| ID | Question |
|---|---|
| Q19 | Is a human-readable ticket key (W3 `TCK-1042`) required? (Δ1) |
| Q20 | Title/body have **explicitly no mandatory maximum length** — but storage and UI must pick practical bounds. What is acceptable? |
| Q21 | When a ticket's team changes, the UI must “clear **or** replace” the epic — which behavior is preferred? |
| Q22 | Does changing a ticket's team while keeping its state need any special handling on the old team's board (e.g., the ticket simply disappears)? Presumed yes-disappear, but unstated. |
| Q23 | “Saving unchanged values must not advance `modified_at`” — is per-field diffing on the server the expected mechanism? (Mechanism unspecified; only the observable behavior is.) |
| Q24 | Who may edit/delete a ticket? No per-ticket access control is in scope (§12), so presumably any verified user may edit/delete any ticket — including tickets created by others. Confirm. |

### Comments (§7)

| ID | Question |
|---|---|
| Q25 | Comment author display: name vs email (Δ2 — wireframes show first names that the data model cannot produce). |
| Q26 | Any pagination/limit for large comment lists? Unspecified. |
| Q27 | Any bound on comment body length? Only non-empty is specified. |

### Kanban board (§8)

| ID | Question |
|---|---|
| Q28 | Filters may be client-side or server-side — explicitly either. Preference for QA/eval purposes? |
| Q29 | What does the board show when **no teams exist** (fresh DB, DoD-9)? An empty state prompting team creation is implied by §11 usability but not specified. |
| Q30 | Which team is selected by default when several exist? Unspecified. |
| Q31 | Does the “N tickets” counter (W1) reflect the filtered set or the whole team? (Δ5) |
| Q32 | “Usable with at least 100 tickets” — is this a hard performance target with defined metrics, or a qualitative bar? Virtualization is stretch (§14), so qualitative is presumed. |
| Q33 | Tie-breaking for cards with identical `modified_at` in a column is unspecified. |
| Q34 | Should filter/search state survive navigation or refresh? Unspecified (localStorage as system-of-record is banned, §9, but UI state persistence is a different matter — clarify). |

### API & persistence (§9)

| ID | Question |
|---|---|
| Q35 | Error-response **body** format is unspecified (“meaningful … error messages” only). |
| Q36 | API path conventions / versioning are unspecified. |
| Q37 | Health/readiness endpoints are optional — include or not? |
| Q38 | Which ports does compose expose, and what env configuration is expected out of the box? (Interacts with Q8 and the no-committed-secrets rule.) |
| Q39 | Migration mechanism is free (“migrations or an equivalent repeatable initialization mechanism”) — any preference? |
| Q40 | “Last successful write wins” — confirmed no optimistic locking anywhere, including drag-and-drop races between two users? |

### Cross-cutting

| ID | Question |
|---|---|
| Q41 | Accessibility requirements (keyboard drag-and-drop alternative, ARIA) are not mentioned — any bar to meet? Drag-and-drop without a keyboard alternative may be unusable for some users. |
| Q42 | Internationalization/localization is not mentioned — English-only presumed. |
| Q43 | Log-out mechanics: §15 expects a Log out entry in the user menu; session invalidation behavior on the server is unspecified. |
| Q44 | Timestamp display timezone in the UI: W3 shows explicit “UTC” labels — should the UI display UTC or the browser's local time? |
