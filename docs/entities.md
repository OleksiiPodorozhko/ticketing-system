# Entities — Conceptual Data Model

Logical model only: **no physical schema, table names, column types, or index decisions.** Attribute lists reflect what the spec mandates (“at least” — §4, §5, §7 phrasing means extra attributes are permitted). Spec references: §3–§9 of `requirements/Hackathon_Ticketing_System_Requirements_v3.pdf`; wireframes W1–W5. Open questions are referenced as Q-numbers from [requirements-analysis.md](requirements-analysis.md#8-consolidated-ambiguity--open-question-list).

---

## 1. Entity overview

```
User 1 ──── * Ticket   (created_by)
User 1 ──── * Comment  (author)
User 1 ──── * EmailVerificationToken   (implied entity)

Team 1 ──── * Epic     (team fixed at creation, immutable)
Team 1 ──── * Ticket   (required; ticket may move between teams)

Epic 0..1 ── * Ticket  (optional; epic must belong to the SAME team as the ticket)

Ticket 1 ─── * Comment (deleted with the ticket)
```

Deletion semantics:

| Parent | Children | Rule | Spec |
|---|---|---|---|
| Team | Tickets, Epics | **Restrict** — deletion blocked (HTTP 409) while any exist; no cascade | §4, §9 |
| Epic | Tickets (referencing) | **Restrict** — deletion blocked (HTTP 409) while referenced | §5, §9 |
| Ticket | Comments | **Cascade** — deleting a ticket deletes its comments | §6 |
| User | — | User deletion is not in scope; no rule specified | — |

## 2. Explicit entities

### 2.1 User (§3)

| Attribute | Required | Notes |
|---|---|---|
| identifier | yes | System-generated; UUID or numeric (§9) |
| email | yes | Trimmed; compared case-insensitively; unique (§3) |
| password (hashed) | yes | ≥ 8 chars at entry; stored only as a hash from an established algorithm, e.g. Argon2id; never plaintext (§3) |
| email-verified flag / verified-at | yes (implied) | Gates access to the main application (§3) |
| created / modified timestamps | not mandated | Not listed for users; optional |

Not present anywhere in the spec: display name, avatar, roles. Wireframes show first names as comment authors (Δ2 / Q25) — the mandated model cannot produce these.

### 2.2 Team (§4)

| Attribute | Required | Notes |
|---|---|---|
| identifier | yes | |
| name | yes | Non-empty after trimming; unique case-insensitively |
| created timestamp | yes | |
| modified timestamp | yes | What updates it beyond rename is unspecified (Q11) |

No ownership or membership attributes — all verified users view and manage all teams (§4).

### 2.3 Epic (§5)

| Attribute | Required | Notes |
|---|---|---|
| identifier | yes | |
| team reference | yes | Chosen at creation, **immutable** — moving epics between teams is out of scope |
| title | yes | Non-empty after trimming; uniqueness **not** required (Q15) |
| description | no | Optional; no length bound specified (Q17) |
| created timestamp | yes | |
| modified timestamp | yes | Update semantics beyond edits unspecified (Q16) |

### 2.4 Ticket (§6)

| Attribute | Required | Allowed values / type | Notes |
|---|---|---|---|
| identifier | yes | System-generated | Stable and unique. Human-readable key (`TCK-1042`, W3) is a wireframe delta, not a requirement (Q19) |
| team reference | yes | Existing team | Determines the board. **Mutable** — editing the team is a required operation |
| type | yes | `bug` \| `feature` \| `fix` | Exactly these three; classification labels only — no workflow differences |
| state | yes | `new` \| `ready_for_implementation` \| `in_progress` \| `ready_for_acceptance` \| `done` | Canonical API values; UI shows human-readable labels with spaces; workflow fixed, no custom states |
| epic reference | no | Null or an epic **of the same team** | Backend must enforce the same-team rule; UI clears/replaces epic when team changes |
| title | yes | Text | Non-empty after trimming; no mandated max length (Q20) |
| body | yes | Long text | Non-empty; plain text or Markdown acceptable; rich text not required; no mandated max length (Q20) |
| created_at | yes | Timestamp | Server-set, UTC, at creation |
| modified_at | yes | Timestamp | Server-set, UTC, on **actual** field/state change only. Unchanged saves must not advance it; comments never advance it (§6, §7) |
| created_by | yes | User reference | Set automatically from the authenticated user; not editable |

Editable fields (§6): type, team, epic, title, body, state. Not editable: id, created_at, created_by (modified_at is server-managed).

### 2.5 Comment (§7)

| Attribute | Required | Notes |
|---|---|---|
| identifier | yes | |
| ticket reference | yes | Cascade-deleted with the ticket |
| author (user reference) | yes | Displayed with the comment (DoD-4) |
| body | yes | Non-empty; no length bound specified (Q27) |
| created timestamp | yes | Comments display oldest-first |

No modified timestamp: comments are **immutable** in mandatory scope (edit/delete own comments is stretch, §14).

## 3. Implied entities

These are not named in the spec but its rules require persistent state that survives restarts (§11 reliability), implying entities of some form:

### 3.1 Email verification token (§3)

| Property | Rule |
|---|---|
| Belongs to | one User |
| Lifetime | expires 24 hours after issuance |
| Usage | single-use; consumed on successful verification |
| Invalidation | issuing a new token invalidates all earlier **unused** tokens for that user |
| Exposure | may appear in the verification URL (the only token allowed in a URL, §9) |

Open: behavior of an old link after the account is already verified (Q10).

### 3.2 Session / auth credential (§3, §9)

Cookie-based sessions and bearer tokens are both acceptable; whichever is chosen must never appear in URLs. Whether this is a persisted entity (server-side session store) or stateless (signed token) is an implementation decision — deliberately left open here. Lifetime unspecified (Q3).

## 4. Derived / display-only data (wireframes, non-binding)

Not part of the mandated model; if shown, computed from existing entities:

- Per-team ticket count and epic count (W4, Δ3/Q13).
- Per-epic ticket count (W5, Δ4).
- Board per-column counts and total “N tickets” counter (W1, Δ5/Q31).
- Relative display times (“2h ago”) — presentation of stored UTC timestamps (Δ6, Q44).

## 5. Integrity rules the model must support

Collected here for modeling purposes; the authoritative catalogue is [business-rules.md](business-rules.md).

1. Email uniqueness is **case-insensitive after trimming** (§3).
2. Team-name uniqueness is **case-insensitive after trimming** (§4).
3. Ticket → epic must be null or reference an epic **whose team equals the ticket's team**; note this is a cross-entity constraint that must hold both at write time and when a ticket's team changes (§5, §6).
4. Enum domains for ticket `type` and `state` are closed sets; the backend rejects anything else (§6).
5. Referential integrity via DB constraints and/or server-side validation (§9); restrict/cascade rules per the table in section 1.
6. All timestamps stored/emitted as UTC, exposed via API as ISO-8601 (§6, §9).
