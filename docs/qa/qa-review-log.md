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

## 2026-07-07 — Task 0.1 retroactive review & reconciliation (qa-reviewer subagent)

**Scope reviewed:** Commit `510a9fb` (Task 0.1 — backend & frontend scaffolding: Fastify skeleton with `/api/health` + error-mapper, Vite/React SPA shell with 8 route stubs), judged against the Task 0.1 acceptance criteria in [implementation-plan.md](../implementation-plan.md) Slice 0 and BR-P04.

**Findings:**

1. *(Major, process)* Commit `510a9fb` was made **before** the required pre-commit `@qa-reviewer` step (CLAUDE.md / [agentic-workflow.md](../agentic-workflow.md)), and without updating [current-task.md](../current-task.md) / [project-state.md](../project-state.md). Reconciled retroactively on 2026-07-07: all 5 acceptance criteria verified by the main agent (backend + frontend builds green; live `GET /api/health` → 200; deliberately thrown 400/500 errors returned as `{error:{code,message}}` with internal detail suppressed; unknown route → 404 in contract shape; all 8 screen stubs routed; `.gitignore` already covered `node_modules/`, build output, `.env` — no change needed), followed by a retroactive task-scoped qa-reviewer review. **Verdict: PASS**, no critical findings.
2. *(Minor, watch-item)* `backend/src/plugins/error-mapper.ts` falls back to `err.code ?? 'BAD_REQUEST'` for 4xx errors; once real Fastify schema validation lands, Fastify-internal codes would leak verbatim into the BR-P04 contract. Re-check at the first validated business endpoint.
3. *(Minor, watch-item)* The health/error-contract verification was performed live but is not yet captured as a committed automated test; Task 0.3's `backend/test/health.test.ts` closes this.

**Decisions / actions:**

- Task 0.1 accepted as done via retroactive reconciliation (human-approved); slice 0 row and next-action updated in [project-state.md](../project-state.md); [current-task.md](../current-task.md) advanced to Task 0.2 with findings 2–3 carried as watch-items.
- Process reminder reaffirmed: task-scoped qa-reviewer review **before** every task commit — no further out-of-workflow commits.

**Open items:** findings 2–3 (carried in [current-task.md](../current-task.md)); all open items from the baseline review remain unchanged.

## 2026-07-08 — Task 0.2 pre-commit review: Prisma schema + initial migration (qa-reviewer subagent)

**Scope reviewed:** Task 0.2 delta before commit `6b95b71` — `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260708115533_init/migration.sql`, `migration_lock.toml`, `backend/package.json` (+`prisma`/`@prisma/client` ^6.19.3 only), lockfile — against BR-P05, BR-T05/T06, BR-E06, BR-K02/K03, BR-K15, BR-A02, BR-P09/P10 and [architecture.md](../architecture.md) §4. The reviewer independently re-verified claims live against a fresh postgres:16 scratch DB (FK delete rules via `pg_constraint`, CHECK/index negative tests, fresh-DB row counts).

**Findings:**

1. *(Minor)* Three RESTRICT FKs not enumerated in [architecture.md](../architecture.md) §4's table (`email_verification_tokens.user_id`, `tickets.created_by`, `comments.author_id`) — Prisma defaults, consistent in spirit (user deletion out of scope, so inert). Optional one-line §4 addendum recommended for future readers.
2. *(Minor)* BR-K15 coverage is partial by design: the cascade-delete-comments half is DB-enforced here; "explicit confirmation" is UI scope for a later task — do not mark CHK-TKT-13/14 covered yet.
3. *(Cosmetic, watch-item)* `users_email_normalized_check` (accepted hardening beyond §4's letter): the future `/api/auth/signup` handler must map a violation of this CHECK (and `users_email_key` unique violations) to the standard BR-P04 `{error:{code,message}}` / 409 contract, never a raw 500.

**Decisions / actions:**

- **Verdict: PASS** — no Critical/Major findings; commit approved.
- Disclosures adjudicated and accepted: Prisma pinned to **v6.19.3** (v7 requires `prisma.config.ts` outside the task's allowed area + runtime driver adapters; architecture fixes "Prisma" without a major version — reversible later); email-normalization CHECK accepted as hardening; no `generator` block and no `@updatedAt` on `modified_at` confirmed as the *correct* calls (client wiring forbidden this task; BR-K11/K12 forbid ORM auto-touch).
- Finding 3 carried as a watch-item in [current-task.md](../current-task.md) until the signup task lands.

**Open items:** findings 1–3 above; Task 0.1 watch-items (error-mapper fallback, committed health test in 0.3) remain open; baseline-review open items unchanged.
