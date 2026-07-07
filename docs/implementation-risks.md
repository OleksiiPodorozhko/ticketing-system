# Implementation Risks & Watch-Items

Risks identified **before** any implementation decisions. Each entry states why it is risky and which question must be answered first — it deliberately does **not** prescribe a solution. Q-numbers refer to [requirements-analysis.md](requirements-analysis.md#8-consolidated-ambiguity--open-question-list); BR/DoD references to [business-rules.md](business-rules.md).

Ordering: highest first, by (impact on Definition of Done) × (likelihood of getting it wrong).

---

## R1 — Email verification is the critical path for everything

**Why risky:** DoD-1 requires a real end-to-end email round-trip, and BR-A06 gates *all* other user-facing DoD items behind a verified account. If mail sending fails on demo/QA day, nothing else is demonstrable. This is the single feature involving an external system (`relay1.dataart.com`) outside the compose stack.

**Sub-risks:**
- **Relay reachability (Q8):** `relay1.dataart.com` is presumably an internal DataArt relay — QA laptops or CI may lack network/VPN access, and it may throttle/reject unauthenticated senders or non-corporate recipient domains.
- **Secrets vs startup contract tension (Q8, Q38):** SMTP credentials must not be committed (BR-A15, DoD-8), yet the app must start from a clean checkout with plain `docker compose up --build` (BR-O01). The spec does not say how QA supplies SMTP configuration; “configurable” is the only hint.
- **Token/link routing (Q7):** the emailed link must open a verification-result screen in the SPA. Which host/port appears in the emailed URL depends on how compose exposes services — a wrong base URL makes every verification email a dead link.

**Answer first:** How will QA run mail — the DataArt relay, their own SMTP, or a bundled dev mailbox? What base URL should verification links carry?

## R2 — Cross-platform `docker compose up --build` (DoD-7)

**Why risky:** the startup contract is pass/fail and tested on clean Windows, macOS, and Linux machines (BR-O01). Common failure classes: Windows CRLF line endings breaking shell entrypoints; port collisions with services already on the laptop; architecture mismatches (Apple Silicon vs x86 images); slow first-run builds being mistaken for hangs; DB starting after the backend (readiness ordering); host file-permission quirks with volumes.

**Answer first:** none — but this must be verified on a genuinely clean machine per OS, not only on the development machine. Budget for it.

## R3 — `modified_at` semantics are easy to get subtly wrong (BR-K11, BR-K12)

**Why risky:** three separate traps, all externally observable and QA-checkable:
1. “Saving unchanged values must not advance it” → a blind `UPDATE … SET modified_at = now()` on every save violates the spec; the server must detect actual change.
2. Comments must not touch it — an ORM that treats comments as part of a ticket aggregate, or any touch-parent-on-child-write behavior, silently violates BR-K12 and changes board ordering.
3. Board ordering (BR-B07) is defined by this timestamp, so every violation is *visible* as cards jumping columns/positions.

**Answer first:** Q23 (is server-side per-field diffing the expected mechanism — presumed yes), Q33 (tie-breaking for equal timestamps).

## R4 — Cross-entity epic/team consistency (BR-K06, BR-K08)

**Why risky:** “ticket.epic must belong to ticket.team” is a **two-table invariant** that plain foreign keys don't express. It must hold at ticket create, ticket edit, and especially team change (where the client is told to clear/replace the epic, but the server must still reject bad combinations — client validation is insufficient, BR-K05). Race windows exist (e.g. epic deleted or ticket re-teamed between UI load and save); §9's last-write-wins does not excuse violating this invariant.

**Answer first:** Q21 (clear vs replace UX). Server-side enforcement approach is an implementation decision to make deliberately, not by ORM default.

## R5 — Restrict-delete rules and 409 contract (BR-T06, BR-E06)

**Why risky:** QA has explicit expectations: HTTP **409** for team-delete-with-contents and epic-delete-while-referenced, plus a clear UI message. Traps: returning 400/500 instead of 409; cascading deletes accidentally enabled at the DB layer (the spec *forbids* cascading team deletion); check-then-delete races where contents appear between the check and the delete; and a UI that only disables the button (W4/W5) without the server rule — the server rule is mandatory regardless.

**Answer first:** Q12 (status code for name-collision on rename, to keep the error contract coherent).

## R6 — Case-insensitive uniqueness (BR-A02, BR-T05)

**Why risky:** emails and team names must be unique *after trimming, case-insensitively*. Naive unique constraints are case-sensitive; app-level-only checks race under concurrent creates. Unicode case-folding differs across DB collations and languages. Getting it wrong yields either duplicate accounts/teams or false rejections.

**Answer first:** none blocking — but the enforcement layer (DB vs app vs both) must be an explicit decision.

## R7 — Verification-token lifecycle correctness (BR-A07…A11)

**Why risky:** four interacting rules — 24 h expiry, single-use, reissue-invalidates-all-prior, resend from two entry points — produce edge cases that QA can trivially probe: reuse of a consumed token, use of a token superseded by resend, expired token, token for an already-verified account (Q10). Each needs a distinct, correct result screen (F1/F2 in [user-flows.md](user-flows.md)). Also a token is security-sensitive material that lands in URLs, mail server logs, and browser history — by explicit spec exception, but the *session* must never do so (BR-A14).

**Answer first:** Q9, Q10; Q6 (rate-limiting resends against a corporate relay).

## R8 — Fresh-DB rule vs demo/QA data (BR-P10, DoD-9, DoD-10)

**Why risky:** two opposing pulls — a fresh database must contain zero application data, yet QA/demo needs realistic data (and BR-B10 implies demonstrating a 100-ticket board), creatable **only** via the UI or API. A seed script that writes to the DB directly violates DoD-10; sample data on startup violates DoD-9. Hackathon time pressure makes “just seed the DB” a tempting DoD-breaking shortcut. Also easy to violate accidentally: creating a default admin user in a migration breaks DoD-8 and DoD-9 at once.

**Answer first:** none — but plan how demo data gets created through legitimate channels (manual or API-driven), and keep it out of the default startup path.

## R9 — Drag-and-drop failure handling (BR-B04, BR-B05)

**Why risky:** the failure branch is an explicit requirement (revert card + show error), which QA can force (kill backend, drop network, expire the session). Optimistic-update UIs make correct reversion easy to get wrong: double drags mid-flight, revert landing in a reordered column, error states that strand the card. Also the *success* path must survive refresh (DoD-6), so state must come from the server, not client memory.

**Answer first:** none blocking; test the failure path deliberately.

## R10 — 100-ticket board usability (BR-B10)

**Why risky:** the target is qualitative (“usable”, Q32) and interacts with drag-and-drop performance, AND-combined filtering (BR-B09), and re-sorting on every modification. Virtualization is explicitly stretch — so the mandatory bar must be met without it. Untested-at-scale boards typically degrade in drag responsiveness first.

**Answer first:** Q28 (client vs server filtering), Q31 (counter semantics) — both shape where the 100-ticket load lives.

## R11 — User display-name gap (Δ2, Q25)

**Why risky:** DoD-4 requires comments to show an **author**; W3 shows human names (“Alex”, “Mina”), but sign-up collects only email + password — the mandated model has no name. Deferring this decision until comment UI is built risks either an unplanned schema/screen change (add a name field to sign-up?) or a mismatch with reviewer expectations (emails shown where wireframes show names).

**Answer first:** Q25 — decide the author-display source before building sign-up, because the answer may add a field there.

## R12 — Public/authenticated boundary mistakes (BR-A13, BR-A14)

**Why risky:** the public allowlist is short and exact (sign-up, login, verify, resend, static assets, optional health). Classic slips: an unauthenticated tickets endpoint discovered by QA probing; SPA routes that render data before the auth check; verification/resend endpoints accidentally behind auth (breaking F2); tokens leaking into URLs via redirects or query strings.

**Answer first:** Q3 (session lifetime), Q43 (logout semantics) — then audit the endpoint list against BR-A13 once routes exist.

## R13 — Timestamp handling end-to-end (BR-K10, BR-K11, BR-P06)

**Why risky:** UTC-everywhere is required at the API (ISO-8601), but local-time defaults creep in at every layer (DB session timezone, ORM defaults, container TZ, JS `Date` parsing). Symptoms are subtle: board ordering off by hours, “Modified” times in the future, W3-style “UTC”-labeled displays showing local time (Q44). Cross-checks span three tiers, so errors surface late.

**Answer first:** Q44 (UI display timezone).

## R14 — Minimum test bar left to the end (BR-O08)

**Why risky:** ≥1 backend business flow **and** ≥1 frontend-or-API flow is a small but *pass/fail* requirement. In a hackathon, tests written last are tests never written. The backend flows most worth the slot are exactly the tricky ones above (verification lifecycle, 409 rules, modified_at semantics) — choosing early which flows get automated multiplies the value.

**Answer first:** none — schedule it, don't defer it.

## R15 — Scope creep into explicitly-excluded features (§12)

**Why risky:** several out-of-scope items are natural “while I'm here” additions (roles, team membership, real-time board updates, audit history, notifications). §12 excludes them *explicitly* — they consume hackathon time without scoring, and some (membership, permissions) would contradict mandatory rules like BR-T07 (all verified users manage all teams).

**Answer first:** none — treat §12 as a hard deny-list during any design discussion.

---

## Summary matrix

| Risk | Threatens | Blocked-on questions |
|---|---|---|
| R1 SMTP / verification path | DoD-1 (and all of DoD-2…6 transitively) | Q7, Q8 |
| R2 Compose cross-platform | DoD-7 | — |
| R3 modified_at semantics | DoD-5, DoD-6, BR-K11/K12 | Q23, Q33 |
| R4 Epic/team invariant | DoD-3 | Q21 |
| R5 409 restrict-deletes | DoD-2 | Q12 |
| R6 Case-insensitive uniqueness | DoD-1, DoD-2 | — |
| R7 Token lifecycle | DoD-1 | Q6, Q9, Q10 |
| R8 Fresh DB vs demo data | DoD-8, DoD-9, DoD-10 | — |
| R9 Drag failure handling | DoD-6 | — |
| R10 100-ticket board | BR-B10 | Q28, Q31 |
| R11 Author display gap | DoD-4 | Q25 |
| R12 Auth boundary | DoD-8, BR-A13 | Q3, Q43 |
| R13 UTC end-to-end | DoD-5, DoD-6 | Q44 |
| R14 Test bar | BR-O08 | — |
| R15 Scope creep | schedule | — |
