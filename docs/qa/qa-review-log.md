# QA Review Log

Append-only record of QA reviews: requirements/baseline reviews, test-cycle summaries, and pre-commit `@qa-reviewer` reviews (per CLAUDE.md). Newest entry **last**. Do not rewrite past entries; corrections go in a new entry referencing the old one.

**Entry format**

```
## YYYY-MM-DD — <short title> (<reviewer>)
**Scope reviewed:** what was examined (docs, commits, screens, checklist sections)
**Findings:** numbered; each with severity (Critical/Major/Minor/Cosmetic, per test-strategy.md §5) and refs (BR/CHK/DoD/Q/R)
**Decisions / actions:** what was decided or must happen, and by whom
**Open items:** anything unresolved, carried to the next review
```

---

## 2026-07-07 — Baseline requirements review & QA doc set creation (Claude / QA)

**Scope reviewed:** `requirements/Hackathon_Ticketing_System_Requirements_v3.pdf` (via the derived analysis docs — see finding 1), the five wireframes as described in [requirements-analysis.md](../requirements-analysis.md) §7, and all five analysis documents: [requirements-analysis.md](../requirements-analysis.md), [business-rules.md](../business-rules.md), [entities.md](../entities.md), [user-flows.md](../user-flows.md), [implementation-risks.md](../implementation-risks.md). No application code exists yet.

**Findings:**

1. *(Minor, process)* The requirements PDF could not be rendered in the review environment (no PDF tooling); the review relied on the derived docs, which carry § references to the PDF and are mutually consistent and consistent with CLAUDE.md. A direct PDF spot-check should be done once tooling is available, to rule out drift between the PDF and the derived docs.
2. *(Major, blocking test execution)* **Q8 — SMTP/QA mail path is undecided** (R1). DoD-1 needs a real mail round-trip and every other user-facing DoD item sits behind a verified account. Until the requirements owner answers how QA runs mail (DataArt relay + VPN, own SMTP, or a bundled dev mailbox), CHK-AUTH-02/07/11/12/13 are executable only in an SMTP-capable environment. This is the top schedule risk.
3. *(Minor)* Nine further open questions affect expected results but have workable interim stances recorded in [test-strategy.md](test-strategy.md) §6: Q4 (unverified login), Q5 (duplicate sign-up), Q10 (used link on verified account), Q12 (rename-collision status code), Q21/Q22 (team-change epic UX), Q25 (comment author display — note R11: decide **before** building sign-up), Q33 (order tie-break), Q44 (UI timezone). Affected checklist items are tagged `[blocked: Qnn]`.
4. *(Observation)* The analysis docs provide a complete, numbered rule/flow/risk spine (BR/F/R/Q/DoD); the QA docs reuse it directly rather than introducing parallel numbering.

**Decisions / actions:**

- Created the initial QA doc set: [test-strategy.md](test-strategy.md) (approach, P0–P2 risk-based priorities, entry/exit criteria), [test-checklist.md](test-checklist.md) (81 checks: 14 P0 / 43 P1 / 24 P2), [traceability-matrix.md](traceability-matrix.md) (DoD→BR→F→CHK→R mapping + reverse BR→CHK coverage check), and this log.
- Coverage verified: all 10 DoD items and all 77 BR rules mapped; 4 rules carry explicit non-testable markers (BR-P05/P07/P08/O08 — see matrix §3).
- Reserved the two mandatory automated-test slots (BR-O08) with named candidates (verification-token lifecycle or 409 restrict-deletes or `modified_at` semantics for backend; sign-up→verify→login or drag-and-drop persist for frontend/API) so they are chosen early, not written last (R14). No automated tests created yet, by design.
- **Action → requirements owner:** answer Q8 (QA mail path + verification-link base URL) before auth implementation starts.
- **Action → dev:** decide Q25 (comment author source) before building the sign-up screen, since the answer may add a field there (R11).

**Open items:** Q8 (blocking); Q4/Q5/Q10/Q12/Q21/Q22/Q25/Q33/Q44 (interim stances in place); PDF spot-check pending tooling; automated-test slot selection pending stack choice.
