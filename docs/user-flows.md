# User Flows

Step-by-step flows with success and error branches, derived from the spec (§ references) and wireframes (W1–W5, non-binding layout). Rule IDs (BR-…) refer to [business-rules.md](business-rules.md); open questions (Q…) to [requirements-analysis.md](requirements-analysis.md#8-consolidated-ambiguity--open-question-list).

Global preconditions unless stated otherwise: the user is **authenticated and email-verified** (BR-A06, BR-A13). Flows F1–F4 are the only unauthenticated ones.

---

## F1 — Sign-up and email verification (§3, W2) — DoD-1

1. Visitor opens the sign-up screen (public, BR-A13).
2. Enters email, password, confirm-password (W2 shows a confirm field; the spec does not mandate it).
3. Submits.
   - **Error — invalid input:** empty/invalid email (Q2), password < 8 chars (BR-A03), passwords don't match → validation message, stay on form.
   - **Error — email already registered** (after trim, case-insensitive — BR-A02): response behavior unspecified (Q5 — explicit error vs silent resend).
4. **Success:** account is created **unverified**; the system sends a verification email through the configured SMTP service (BR-A05).
5. User receives the email and clicks the verification link (token in URL — the only permitted token-in-URL, BR-A14).
6. System validates the token:
   - **Valid & unexpired & unused →** account marked verified; token consumed (BR-A08); **verification-result screen: success** with a “Continue to login” action (W2, BR-A09). No auto-login.
   - **Expired (>24 h, BR-A07) / invalid / already-used →** **verification-result screen: error** with a resend action (BR-A10, W2). (Already-verified-account edge: Q10.)

## F2 — Resend verification email (§3, §10, W2)

Entry points: login screen (“Account not verified? → Resend email”, W2) **and** the verification-result error screen (BR-A10).

1. Unverified user triggers resend (whether email must be re-entered is unspecified — Q9).
2. System issues a **new** token and sends a new email.
3. All earlier unused tokens for that user become invalid (BR-A11).
4. Old links now hit the F1 step-6 error branch.
   - Rate-limiting behavior unspecified (Q6).

## F3 — Login (§3, W2)

1. Visitor opens the login screen (public).
2. Enters email + password, submits.
   - **Error — bad credentials:** authentication failure with a meaningful status/message (BR-P04); no session.
   - **Error — account not verified:** the user cannot enter the main application (BR-A06). Exact behavior (error message + resend affordance vs limited session) unspecified — Q4; W2 suggests an inline resend affordance on the login card.
3. **Success:** session/token established (cookie or bearer, BR-P07; never in a URL, BR-A14). User lands in the main application — presumably the board (landing target unspecified).

## F4 — Logout (§3, §15)

1. Authenticated user opens the header user menu (shows the email; W1/W3–W5) and chooses **Log out** (§15).
2. Session ends (server-side invalidation semantics unspecified — Q43); user returns to a public screen (presumably login).

## F5 — Team management (§4, W4) — DoD-2

Screen: team list with per-team actions; W4 additionally shows derived Tickets/Epics counts (Δ3/Q13).

**F5a — Create team**
1. User clicks “+ Create team”; enters a name (W4 shows a single-field modal).
2. Submit.
   - **Error:** name empty after trim (BR-T04) or duplicate case-insensitively (BR-T05) → clear validation message.
   - **Success:** team appears in the list; created/modified timestamps set.

**F5b — Rename team**
1. User clicks Edit on a team; changes the name; saves.
   - **Error:** empty or duplicate name → validation message (status code for duplicates: Q12).
   - **Success:** name updated; modified timestamp advances (further `modified` semantics: Q11).

**F5c — Delete team**
1. User clicks Delete on a team.
   - **Blocked:** the team contains tickets or epics → HTTP 409 + clear UI message (BR-T06). W4 shows the Delete button pre-disabled with the caption “Delete is disabled while a team contains tickets or epics.” — both a disabled control **and** a server-side 409 are consistent with §4/§9; the server rule is mandatory regardless of UI treatment.
   - **Success:** empty team is removed.

## F6 — Epic management (§5, W5) — DoD-2

Screen: dedicated epic CRUD screen (BR-E03). W5 scopes the list by a team selector (whether that scoping is required: Q18).

**F6a — Create epic**
1. User clicks “+ Create epic”; selects the **team** (fixed forever after — BR-E02), enters title, optional description.
2. Submit.
   - **Error:** title empty after trim (BR-E05) → validation message.
   - **Success:** epic appears in the list.

**F6b — Edit epic**
1. User clicks Edit; may change title/description (not the team — BR-E02; W5's edit panel shows no team field).
   - **Error:** title emptied → validation message.
   - **Success:** saved; modified timestamp advances (Q16).

**F6c — Delete epic**
1. User clicks Delete (×).
   - **Blocked:** tickets reference the epic → HTTP 409 + clear UI message (BR-E06). W5 shows the control disabled with the caption “Delete is disabled while tickets reference the epic.”
   - **Success:** unreferenced epic is removed.

## F7 — Ticket lifecycle (§6, W1, W3) — DoD-3

**F7a — Create ticket**
1. From the board, user clicks “+ New ticket” (BR-B08). Presumably defaults to the selected team (unspecified).
2. User fills: team, type, state, optional epic (drop-down limited to the team's epics — BR-K07), title, body.
3. Submit.
   - **Error:** missing/invalid enum, empty title/body, epic from another team → server-side rejection with validation message (BR-K05, BR-K06, BR-K09).
   - **Success:** server sets id, created_at (UTC), created_by from the session (BR-K10, BR-K13); card appears in the matching column of the team board.

**F7b — View ticket**
1. User opens a card from the board (BR-B08).
2. Details view shows **all** fields including created_by, created_at, modified_at (BR-K14; W3 shows a metadata line and a back-link to the team board).

**F7c — Edit ticket**
1. User edits any of: type, team, epic, title, body, state (BR-K14) and clicks Save.
2. **Team changed:** the UI clears or replaces the epic (BR-K08, Q21); the epic drop-down now offers the new team's epics.
3. Submit.
   - **Error:** any invalid enum/reference or cross-team epic → server rejects (BR-K05, BR-K06); UI shows the error.
   - **Success — actual change:** modified_at advances (BR-K11); board position/column updates accordingly (a team change moves the ticket to the other team's board — Q22).
   - **Success — nothing changed:** modified_at must **not** advance (BR-K11).

**F7d — Delete ticket**
1. User clicks Delete (W3).
2. UI asks for **explicit confirmation** (BR-K15).
3. On confirm: ticket and **all its comments** are deleted (BR-K15); user returns to the board.

## F8 — Comments (§7, W3) — DoD-4

1. In the ticket details view, user types into “Add comment” and posts.
   - **Error:** empty body → validation message (BR-C03).
   - **Success:** comment stored with author + created timestamp; appears at the **bottom** of the oldest-first list (BR-C04). Author display: Q25.
2. The ticket's modified_at does **not** change; board ordering is unaffected (BR-K12).
3. No edit/delete controls in mandatory scope (BR-C05).

## F9 — Kanban board (§8, W1) — DoD-5, DoD-6

**F9a — Team selection & display**
1. User opens the board; selects a team from the selector (default selection: Q30; zero-teams empty state: Q29).
2. Board renders exactly five columns in workflow order (BR-B02) containing that team's tickets, each card showing at least title + type, epic recommended (BR-B03), ordered most-recently-modified first within each column (BR-B07).

**F9b — Drag-and-drop state change**
1. User drags a card to another column (any-to-any allowed — BR-B06).
2. The state change is persisted immediately through the API (BR-K16, BR-B04).
   - **Success:** card stays in the new column; modified_at advances (actual state change, BR-K11), so the card typically moves to the top of its new column; a page refresh shows the same result (DoD-6).
   - **Failure (API error, network loss, auth expiry):** the card **returns to its previous column** and the UI displays an error (BR-B05).

**F9c — Filter & search**
1. User sets any combination of: title substring search (case-insensitive), type filter, epic filter (BR-B09).
2. Active filters combine with AND; the board shows only matching cards. “Clear” resets (W1).
3. Client-side or server-side filtering both acceptable (Q28); persistence of filter state across navigation unspecified (Q34).

**F9d — Scale**
- With ≥100 tickets on one team board the interface must remain usable (BR-B10, Q32). Virtualized rendering is stretch (§14).

---

## Flow-level open questions (doc-specific)

Collected from the branches above; all are also in the master list:

- **Q4** — unverified login: error vs limited session; where the resend affordance lives.
- **Q5** — duplicate sign-up response (enumeration disclosure vs silent resend).
- **Q9** — whether resend requires re-entering the email.
- **Q10** — old verification link on an already-verified account.
- **Q21** — team change: clear epic vs force replacement.
- **Q22** — UX when a ticket leaves the currently displayed board via team change.
- **Q29 / Q30** — board with zero teams; default team selection.
- **Q34** — filter/search state persistence.
- Landing screen after login is unspecified (assumed: board).
- Whether “+ New ticket” pre-selects the board's current team is unspecified (assumed: yes).

## DoD traceability

| DoD | Flow(s) |
|---|---|
| DoD-1 | F1, F2, F3 |
| DoD-2 | F5, F6 |
| DoD-3 | F7 |
| DoD-4 | F8 |
| DoD-5 | F9a |
| DoD-6 | F9b |
| DoD-7…DoD-10 | Delivery/operations — see BR-O01, BR-P09/P10 in [business-rules.md](business-rules.md) |
