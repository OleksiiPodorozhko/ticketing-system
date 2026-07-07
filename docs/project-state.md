# Project State

**Living document — update at every QA gate and whenever a decision changes.** One glance answers: where are we, what's decided, what's next, what's blocked.

Last updated: **2026-07-07** · Phase: **Planning complete — implementation not started**

---

## 1. Status snapshot

| Slice ([implementation-plan.md](implementation-plan.md)) | Status | QA gate | Commit |
|---|---|---|---|
| 0 — Walking skeleton | not started | — | — |
| 1 — Auth & email verification | not started | — | — |
| 2 — Teams | not started | — | — |
| 3 — Epics | not started | — | — |
| 4 — Tickets | not started | — | — |
| 5 — Comments | not started | — | — |
| 6 — Kanban board | not started | — | — |
| 7 — Hardening & delivery | not started | — | — |

Status values: `not started` · `in progress` · `gate pending` · `done (gate passed <date>)` · `descoped`.

**DoD scoreboard:** 0 / 10 demonstrable. **BR-O08 test slots:** 0 / 2 filled (planned: slices 1–5).

## 2. Next action

Start **Slice 0 — Walking skeleton**: scaffold `backend/` + `frontend/`, write `docker-compose.yml` + multi-stage `Dockerfile`, full Prisma schema + initial migration, health endpoint, prove `docker compose up --build` from clean checkout. Then QA gate 0.

## 3. What exists today

| Layer | Artifacts | State |
|---|---|---|
| Requirements | `requirements/*.pdf`, 5 wireframes | authoritative input |
| Analysis | [requirements-analysis.md](requirements-analysis.md) (Q1–Q44) · [entities.md](entities.md) · [business-rules.md](business-rules.md) (77 BR) · [user-flows.md](user-flows.md) (F1–F9) · [implementation-risks.md](implementation-risks.md) (R1–R15) | complete |
| QA | [qa/test-strategy.md](qa/test-strategy.md) · [qa/test-checklist.md](qa/test-checklist.md) (81 CHK) · [qa/traceability-matrix.md](qa/traceability-matrix.md) · [qa/qa-review-log.md](qa/qa-review-log.md) (baseline review 2026-07-07) | complete for planning stage |
| Planning | [architecture.md](architecture.md) · [implementation-plan.md](implementation-plan.md) · this file | created 2026-07-07 |
| Code | — | **none** (greenfield) |
| Tooling | `.claude/agents/qa-reviewer.md` subagent | ready |

## 4. Decision log

Newest last. Full rationale lives in [architecture.md](architecture.md); this is the ledger.

| Date | Decision | Where |
|---|---|---|
| 2026-07-07 | Stack: TypeScript end-to-end — React/Vite SPA, Fastify API, Prisma, PostgreSQL 16, JWT httpOnly cookie, argon2, nodemailer, @hello-pangea/dnd | [architecture.md](architecture.md) §1 |
| 2026-07-07 | Topology: 3 containers (app serves compiled SPA + `/api`, db, Mailpit); port 8080; migrations run on app start | [architecture.md](architecture.md) §2 |
| 2026-07-07 | SMTP (Q7/Q8, R1): Mailpit as zero-config compose default; `relay1.dataart.com` via env override; verification links to SPA `/verify?token=…` from `APP_BASE_URL` | [architecture.md](architecture.md) §6 |
| 2026-07-07 | Error contract: `{error:{code,message}}`; 409 for restrict-deletes **and** uniqueness conflicts (Q12) | [architecture.md](architecture.md) §5 |
| 2026-07-07 | Working stances on Q1–Q6, Q9, Q10, Q20/Q27, Q21 (clear epic), Q23, Q25 (author = email), Q29–Q31, Q33, Q34, Q44 (UTC display) | [architecture.md](architecture.md) §6 |
| 2026-07-07 | Board filtering client-side (Q28); no virtualization for the 100-ticket bar | [architecture.md](architecture.md) §5 |
| 2026-07-07 | BR-O08 test slots: backend = token lifecycle + 409s + `modified_at` (slices 1/2/4/5); frontend-or-API = sign-up→verify→login via Mailpit API (slice 1) | [implementation-plan.md](implementation-plan.md) |
| 2026-07-07 | Plan shape: 8 vertical slices, each with a mandatory `@qa-reviewer` gate before commit; 4 h buffer | [implementation-plan.md](implementation-plan.md) |
| 2026-07-07 | Q5 security posture: duplicate sign-up returns an explicit 409 — account-enumeration disclosure knowingly accepted for this hackathon tool (distinct from the BR-T07 all-data-visible rule; deliberate, challengeable choice) | [architecture.md](architecture.md) §6 |
| 2026-07-07 | DB password: `${POSTGRES_PASSWORD:-dev default}` in compose, declared bounded exception to literal BR-A15/DoD-8 wording (see §5) | [architecture.md](architecture.md) §2 |

## 5. Open questions & blockers

- **No hard blockers.** Q8 (QA mail path) was the only blocking item; the Mailpit-default + env-override design unblocks development and local QA. **Still owed to the requirements owner:** confirm how evaluation-day QA runs mail (relay VPN access?) — affects demo prep only, not build order.
- All other Q-items carry working decisions ([architecture.md](architecture.md) §6) mirroring the interim stances in [qa/test-strategy.md](qa/test-strategy.md) §6. If an owner answer contradicts a decision, update architecture.md §6, this log, and the affected `[blocked: Qnn]` checklist items.
- **DoD-7 vs DoD-8 tension — dev-only Postgres default password in compose** ([architecture.md](architecture.md) §2): declared bounded exception; needs sign-off recorded in [qa/qa-review-log.md](qa/qa-review-log.md) and a carve-out note on CHK-AUTH-19 / CHK-OPS-04 **before the slice-0 gate closes**, else the slice-7 secrets sweep false-positives (2026-07-07 planning QA review, critical-attention finding).
- Pending from the baseline QA review: direct PDF spot-check against derived docs once PDF tooling is available (finding 1, [qa/qa-review-log.md](qa/qa-review-log.md)).

**QA-doc follow-ups from the 2026-07-07 planning review** (to apply at the slice where the behavior lands):
- Add CHK items for the new server-side length caps (title 500 / body, description, comment 10 000 / password max 200 — slice 1 & 4) and for the resend rate-limit guard (Q6 — slice 1); map them in [qa/traceability-matrix.md](qa/traceability-matrix.md).
- Tighten [qa/test-strategy.md](qa/test-strategy.md) §6 interim stances and `[blocked: Qnn]` checklist tags to the concrete decisions in [architecture.md](architecture.md) §6 (e.g. Q4 → exact 403, Q12 → 409) once slices 0–1 land.
- Append the planning-review entry to [qa/qa-review-log.md](qa/qa-review-log.md) (verdict PASS WITH RISKS, 2026-07-07).

## 6. Risk watch (top 3 right now)

1. **R1 — verification path**: front-loaded into slice 1 with a real SMTP round-trip from day one. Watch: relay reachability for demo day.
2. **R2 — cross-platform compose**: proven in slice 0 and re-proven on a second OS in slice 7. Watch: CRLF in any shell entrypoint, port 8080/8025 collisions.
3. **R3/R4 — `modified_at` + same-team epic invariants**: implemented with explicit per-field diff and in-transaction checks (never ORM defaults), locked by integration tests in slices 4–5.

## 7. Update protocol

At every QA gate: set the slice row in §1 (status, gate verdict, commit hash), tick the DoD scoreboard, rewrite §2 "Next action", append any new decisions to §4, and prune §5/§6. The qa-reviewer entry itself goes in [qa/qa-review-log.md](qa/qa-review-log.md) — this file only points at it.
