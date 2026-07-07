# Traceability Matrix

Links the acceptance criteria (DoD-1…10) and business rules (BR-…) to user flows (F), checklist items (CHK, [test-checklist.md](test-checklist.md)), risks (R, [implementation-risks.md](../implementation-risks.md)), and — once they exist — automated tests. The DoD→BR and DoD→flow mappings originate in [business-rules.md](../business-rules.md) and [user-flows.md](../user-flows.md); this document adds the CHK and automation columns.

**Maintenance:** when a checklist item is added/removed, update both tables here. When automated tests are written (BR-O08), replace the placeholder in the **Automated** column with the test file/name.

---

## 1. DoD → coverage

| DoD | Criterion (short) | Rules | Flows | Checklist items | Risks | Automated |
|---|---|---|---|---|---|---|
| DoD-1 | Sign-up → email → verify → login | BR-A01…A12 | F1, F2, F3 | CHK-AUTH-02…13 | R1, R6, R7 | — *(candidate: sign-up→verify→login API flow)* |
| DoD-2 | Teams & epics managed via UI, persisted | BR-T02…T06, BR-E02…E06, BR-P01 | F5, F6 | CHK-TEAM-01…07, CHK-EPIC-01…07, CHK-API-04 | R5, R6 | — *(candidate: 409 restrict-delete backend flow)* |
| DoD-3 | Verified user: full ticket CRUD | BR-A06, BR-K01…K15 | F7 | CHK-TKT-01…14 | R3, R4 | — *(candidate: modified_at semantics backend flow)* |
| DoD-4 | Comments show author & timestamp | BR-C01…C04 | F8 | CHK-CMT-01…04 | R11 | — |
| DoD-5 | Board: correct columns per team | BR-B01…B03, BR-B07 | F9a | CHK-BRD-01…04 | R3, R13 | — |
| DoD-6 | Drag persists; survives refresh | BR-K16, BR-B04, BR-B05, BR-O04 | F9b | CHK-BRD-05…07, CHK-API-01 | R9, R13 | — *(candidate: drag-and-drop persist frontend flow)* |
| DoD-7 | `docker compose up --build` starts all | BR-O01 | — | CHK-OPS-01 | R2 | — |
| DoD-8 | No committed secrets / hard-coded passwords | BR-A15 | — | CHK-AUTH-19, CHK-OPS-04 | R8, R12 | — |
| DoD-9 | Fresh DB: schema + migrations only | BR-P09, BR-P10 | — | CHK-OPS-02, CHK-OPS-03, CHK-OPS-04 | R8 | — |
| DoD-10 | All test data creatable via UI/API | BR-P01, BR-P10 | — | CHK-OPS-05, CHK-BRD-11 | R8 | — |

## 2. BR rule → checklist coverage (reverse check)

Every server-enforceable or observable rule must have ≥1 CHK reference. Rules with no dedicated check carry an explicit marker: **(implicit)** = exercised as a side effect of the listed checks · **(process)** = verified by inspection/process, not a runtime test · **(design choice)** = spec permits multiple behaviors, nothing to assert.

### AUTH

| Rule | Checklist items |
|---|---|
| BR-A01 | CHK-AUTH-02 |
| BR-A02 | CHK-AUTH-04, CHK-AUTH-05, CHK-AUTH-06 |
| BR-A03 | CHK-AUTH-03 |
| BR-A04 | CHK-AUTH-18 |
| BR-A05 | CHK-AUTH-02 |
| BR-A06 | CHK-AUTH-10 |
| BR-A07 | CHK-AUTH-11 |
| BR-A08 | CHK-AUTH-07, CHK-AUTH-12 |
| BR-A09 | CHK-AUTH-07 |
| BR-A10 | CHK-AUTH-11, CHK-AUTH-14 |
| BR-A11 | CHK-AUTH-13 |
| BR-A12 | CHK-AUTH-08, CHK-AUTH-15 |
| BR-A13 | CHK-AUTH-01, CHK-AUTH-16 |
| BR-A14 | CHK-AUTH-17 |
| BR-A15 | CHK-AUTH-19 |

### TEAM

| Rule | Checklist items |
|---|---|
| BR-T01 | CHK-TKT-01, CHK-TKT-04 (implicit — every ticket requires an existing team) |
| BR-T02 | CHK-TEAM-01, CHK-TEAM-04, CHK-TEAM-05 |
| BR-T03 | CHK-TEAM-01, CHK-TEAM-04 |
| BR-T04 | CHK-TEAM-02 |
| BR-T05 | CHK-TEAM-03 |
| BR-T06 | CHK-TEAM-06, CHK-API-04 |
| BR-T07 | CHK-TEAM-07 |

### EPIC

| Rule | Checklist items |
|---|---|
| BR-E01 | CHK-EPIC-01 |
| BR-E02 | CHK-EPIC-03 |
| BR-E03 | CHK-EPIC-01 |
| BR-E04 | CHK-EPIC-01, CHK-EPIC-04 |
| BR-E05 | CHK-EPIC-02, CHK-EPIC-07 |
| BR-E06 | CHK-EPIC-06, CHK-API-04 |

### TKT

| Rule | Checklist items |
|---|---|
| BR-K01 | CHK-TKT-01, CHK-TKT-04 |
| BR-K02 | CHK-TKT-03, CHK-API-06 |
| BR-K03 | CHK-TKT-03, CHK-API-06 |
| BR-K04 | CHK-BRD-01 |
| BR-K05 | CHK-TKT-02, CHK-TKT-03, CHK-TKT-06 (all API-level) |
| BR-K06 | CHK-TKT-06 |
| BR-K07 | CHK-TKT-05 |
| BR-K08 | CHK-TKT-10 |
| BR-K09 | CHK-TKT-02 |
| BR-K10 | CHK-TKT-07 |
| BR-K11 | CHK-TKT-11, CHK-TKT-12 |
| BR-K12 | CHK-CMT-04 |
| BR-K13 | CHK-TKT-07 |
| BR-K14 | CHK-TKT-08, CHK-TKT-09 |
| BR-K15 | CHK-TKT-13, CHK-TKT-14 |
| BR-K16 | CHK-BRD-05 |

### CMT

| Rule | Checklist items |
|---|---|
| BR-C01 | CHK-CMT-01 |
| BR-C02 | CHK-CMT-01 |
| BR-C03 | CHK-CMT-02 |
| BR-C04 | CHK-CMT-03 |
| BR-C05 | CHK-CMT-05 |

### BRD

| Rule | Checklist items |
|---|---|
| BR-B01 | CHK-BRD-02 |
| BR-B02 | CHK-BRD-01 |
| BR-B03 | CHK-BRD-03 |
| BR-B04 | CHK-BRD-05 |
| BR-B05 | CHK-BRD-07 |
| BR-B06 | CHK-BRD-05 |
| BR-B07 | CHK-BRD-04 |
| BR-B08 | CHK-BRD-12 |
| BR-B09 | CHK-BRD-08, CHK-BRD-09, CHK-BRD-10 |
| BR-B10 | CHK-BRD-11 |

### API

| Rule | Checklist items |
|---|---|
| BR-P01 | CHK-API-01, CHK-API-02 |
| BR-P02 | CHK-API-02 |
| BR-P03 | CHK-TKT-04 |
| BR-P04 | CHK-API-03, CHK-API-04 |
| BR-P05 | (implicit — ID form observed in CHK-TKT-07 API responses; both UUID and numeric pass) |
| BR-P06 | CHK-API-05 |
| BR-P07 | (design choice — cookie vs bearer both pass; constrained by CHK-AUTH-17) |
| BR-P08 | (design choice — last-write-wins is the specified behavior; no conflict detection to test) |
| BR-P09 | CHK-OPS-03 |
| BR-P10 | CHK-OPS-02, CHK-OPS-04 |

### OPS

| Rule | Checklist items |
|---|---|
| BR-O01 | CHK-OPS-01 |
| BR-O02 | CHK-OPS-10 |
| BR-O03 | CHK-OPS-10 |
| BR-O04 | CHK-API-01, CHK-BRD-06 |
| BR-O05 | CHK-OPS-08, CHK-BRD-13 |
| BR-O06 | CHK-OPS-09 |
| BR-O07 | CHK-OPS-06 |
| BR-O08 | (process — satisfied when the automated tests named in [test-strategy.md](test-strategy.md) §2.3 exist and pass; track in column "Automated" above) |

## 3. Coverage summary

- All 10 DoD items map to ≥1 checklist item.
- All 77 BR rules are accounted for: 73 with direct or implicit checklist coverage, 4 with an explicit marker (BR-P05 implicit, BR-P07/P08 design choices, BR-O08 process check).
- Checklist items with no BR anchor: none — every CHK item lists BR/F/DoD refs.
- Automated coverage: **0 of 2 required slots filled** (BR-O08) — candidates named per DoD row above.
