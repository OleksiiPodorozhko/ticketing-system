# Test Strategy

**Scope of this document:** how the mandatory MVP of the ticketing system is tested. Sources: `requirements/Hackathon_Ticketing_System_Requirements_v3.pdf` (§ references), [requirements-analysis.md](../requirements-analysis.md), [business-rules.md](../business-rules.md) (BR-…), [user-flows.md](../user-flows.md) (F1–F9), [implementation-risks.md](../implementation-risks.md) (R1–R15). Acceptance criteria are DoD-1…DoD-10; open questions are Q1–Q44.

Companion documents: [test-checklist.md](test-checklist.md) (the run-sheet) · [traceability-matrix.md](traceability-matrix.md) (coverage) · [qa-review-log.md](qa-review-log.md) (review history).

---

## 1. Scope

### 1.1 In scope (mandatory MVP)

| Area | Flows | Rules |
|---|---|---|
| Authentication & email verification | F1–F4 | BR-A01…A15 |
| Team management | F5 | BR-T01…T07 |
| Epic management | F6 | BR-E01…E06 |
| Ticket lifecycle | F7 | BR-K01…K16 |
| Comments | F8 | BR-C01…C05 |
| Kanban board (incl. drag-and-drop, filters, 100-ticket scale) | F9 | BR-B01…B10 |
| API contract & persistence | — | BR-P01…P10 |
| Delivery & startup contract | — | BR-O01…O08 |

### 1.2 Out of scope — with one scope-guard exception

Features excluded by §12 (Scrum/sprints, SSO, roles/membership, attachments, notifications, real-time updates, custom workflows, reporting, …) are **not tested for presence or quality**. Instead, a single scope-guard check (CHK-OPS-07) verifies they were **not built** — scope creep consumes hackathon time without scoring and can contradict mandatory rules such as BR-T07 (risk R15).

Stretch items (§14: password reset, own-comment edit/delete, activity history, virtualization) are untested unless implemented; if implemented, they must not break mandatory behavior (notably BR-C05 boundaries and BR-B10 without virtualization).

## 2. Test levels & approach

1. **Checklist-driven manual testing** — the primary level for now. [test-checklist.md](test-checklist.md) is executed against a running stack; every item traces to BR/F/DoD IDs.
2. **Exploratory testing** — time-boxed sessions around the risk hotspots (R1–R15), especially auth-boundary probing (R12), token-lifecycle edge cases (R7), and drag-and-drop failure injection (R9).
3. **Automated tests (future, required by BR-O08)** — not written yet, but the slots are reserved now so they aren't dropped under time pressure (R14). Recommended candidates, chosen because they are the hardest to keep correct manually:
   - **Backend business flow (pick ≥1):** verification-token lifecycle (expiry / single-use / reissue-invalidates, BR-A07…A11) · restrict-delete 409 contract (BR-T06, BR-E06) · `modified_at` semantics incl. unchanged-save and comment cases (BR-K11, BR-K12).
   - **Frontend or API flow (pick ≥1):** sign-up → verify → login (DoD-1, API-level with a test SMTP sink) · board drag-and-drop persist + refresh (DoD-6).
4. **Startup/ops verification** — `docker compose up --build` from a clean checkout, ideally on all three OS families (R2). This is pass/fail (DoD-7) and must be tested on a genuinely clean machine, not only the dev machine.

## 3. Risk-based priorities

Priorities below drive checklist ordering and how testing time is spent. Derived from the risk register ordering (impact on DoD × likelihood of defect).

| Priority | Meaning | Driving risks | Focus |
|---|---|---|---|
| **P0** | Blocks the demo / hard pass-fail DoD | R1, R2, R8 | Email verification end-to-end (DoD-1); compose startup on clean machines (DoD-7); fresh-DB emptiness and no-seed rule (DoD-8/9/10) |
| **P1** | Business-critical invariants QA will explicitly probe | R3, R4, R5, R6, R7, R9 | `modified_at` semantics; ticket↔epic same-team invariant; 409 restrict-deletes; case-insensitive uniqueness; token lifecycle edges; drag-failure revert |
| **P2** | Everything else in mandatory scope | R10–R13, R15 | Board scale/filters, author display, auth boundary sweep, UTC handling, scope guard |

## 4. Environments & test data

- **Environment:** clean checkout + `docker compose up --build` at repo root; nothing installed beyond Docker Compose (BR-O01). Browsers: current desktop Chrome, Edge, or Firefox (BR-O06).
- **Test data:** created **exclusively through the UI or API** (DoD-10). No direct DB writes, no seed scripts in the startup path (DoD-9, R8). For the 100-ticket board check (BR-B10), scripted API calls are the legitimate channel; keep any such script out of the default startup path.
- **Email/SMTP:** DoD-1 requires a real mail round-trip. How QA runs mail is **undecided (Q8)** — DataArt relay (VPN?), own SMTP, or a bundled dev mailbox (e.g. MailHog/Mailpit) for local runs with `relay1.dataart.com` supported via configuration. Until decided, verification-path checks are executable only in an environment with working SMTP; this is the top schedule risk (R1).
- **Fresh-run discipline:** P0 fresh-DB checks require destroying volumes between runs (`docker compose down -v`); record in the run notes whether a run started from a fresh DB.

## 5. Entry / exit criteria per test cycle

**Entry:** stack starts via the compose contract; README startup steps work as written (BR-O07); tester has an SMTP-capable environment for auth checks (or those items are marked Blocked).

**Exit:**
- All P0 checklist items pass.
- All P1 items pass, or each failure has a logged defect with severity and a decision recorded in [qa-review-log.md](qa-review-log.md).
- P2 items executed; failures logged.
- No open **Critical/Major** defects against any DoD item.

**Severity convention:** *Critical* = a DoD item fails or data is lost/corrupted · *Major* = a BR-rule violation with no workaround · *Minor* = BR-rule violation with workaround, or degraded UX · *Cosmetic* = presentation only (wireframes are non-binding, §15).

**Recording results:** copy [test-checklist.md](test-checklist.md) per run (e.g. `docs/qa/runs/2026-07-07-run1.md`) and fill the Result column there; the master checklist stays result-empty. Summarize each cycle in [qa-review-log.md](qa-review-log.md).

## 6. Open questions that block test design

These Q-items (from [requirements-analysis.md](../requirements-analysis.md#8-consolidated-ambiguity--open-question-list)) prevent writing a deterministic expected result today. Affected checklist items are tagged `[blocked: Qnn]` and carry a provisional expectation where a reasonable presumption exists.

| Q | Blocks | Interim stance |
|---|---|---|
| **Q8** | The entire verification path in QA environments (R1) | Highest-priority question to the requirements owner; until answered, auth E2E checks run only where SMTP works |
| Q4 | Expected behavior of unverified login attempt | Presume: error + resend affordance (W2); any *access* to the main app is a failure (BR-A06) |
| Q5 | Duplicate sign-up expected response | Presume: any behavior that neither creates a duplicate nor breaks BR-A02 passes; record actual behavior |
| Q10 | Old verification link on already-verified account | Presume: error or benign "already verified" result; auto-relogin would fail BR-A09 spirit |
| Q12 | Status code for team-rename collision | Presume: any 4xx with a clear message passes; 409 preferred for contract coherence (R5) |
| Q21/Q22 | Team-change epic clearing UX; card leaving current board | Presume: epic cleared or replaced, never cross-team (BR-K06 is unambiguous — the *server* rejection is testable regardless) |
| Q25 | Comment author display (name vs email) | Presume: email shown (only data the model has, R11); wireframe names are non-binding |
| Q33 | Column tie-breaking for equal `modified_at` | Any stable order passes |
| Q44 | UI timestamp timezone | API must be UTC ISO-8601 regardless (BR-P06); UI display either UTC or local passes if consistent |

## 7. Regression policy

After any implementation change: re-run the checklist section(s) whose BR-refs the change touches, plus the P0 startup/fresh-DB checks if compose files, migrations, or configuration changed. The [traceability-matrix.md](traceability-matrix.md) maps rules → checks for exactly this purpose. Per CLAUDE.md, `@qa-reviewer` reviews precede every commit; those reviews are logged in [qa-review-log.md](qa-review-log.md).
