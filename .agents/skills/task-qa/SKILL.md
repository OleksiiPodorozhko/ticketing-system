---
name: task-qa
description: Run the QA review gate for the ticketing system after task-self-check passes — pick task-scoped or full-gate review from docs/current-task.md "QA gate expectation", invoke the qa-reviewer subagent with minimal scoped context, and route the verdict (FAIL/BLOCKED stops the line). Never commits.
---

# task-qa

**Purpose:** Gate the commit with an independent review. The `qa-reviewer` subagent is read-only; its verdict gates commits — `FAIL`/`BLOCKED` stops the line. This skill picks the right review level, feeds the reviewer minimal scoped context, and routes the verdict. It never substitutes for tests and never commits.

## Procedure

### 1. Preconditions and skip rules

Enter this skill only after `task-self-check` passed, with its criteria table and test output in hand.

**Do not invoke qa-reviewer at all** — proceed straight to close-out — for:

- trivial docs-only changes;
- pure formatting;
- an **unchanged diff qa-reviewer already reviewed**;
- mid-task work-in-progress (QA reviews finished task states, not WIP).

If the task's QA gate expectation is missing or ambiguous, fall back to the risk-based rules in `docs/agentic-workflow.md`: review is **mandatory** for auth/verification/token/session handling, DB schema/migrations/persistence/Compose/startup changes, server-side business rules (validation, delete restrictions, same-team constraint, state transitions, `modified_at`, comments), requirement/BR/traceability/QA-doc changes, and after fixing a Critical/Major finding.

### 2. Pick the review level

Read the **"QA gate expectation"** in `docs/current-task.md`:

- **Task-scoped (light)** — normal task commit → §3.
- **Full gate** — slice-closing task → §4.

### 3. Task-scoped review

Give `@qa-reviewer` **only**:

- the task goal (one sentence) and task number;
- the changed-file list (**paths, not contents** — it has Read/Grep);
- the BR/F/CHK IDs claimed as covered;
- a one-line summary of the test output.

Instruct it to:

- review **that delta** against requirements — not the whole project;
- **Grep each claimed BR/CHK ID and verify the rule's actual text** matches the behavior being claimed — a mis-cited ID is a finding, not a pass.

When the verdict is in, record the review per §5.

### 4. Full gate (slice-closing task)

Follow the "QA gate protocol" in `docs/implementation-plan.md`, before the slice-closing commit:

1. Run the smallest relevant test set for the slice; then the full suite if shared behavior changed.
2. **Manually run the slice's CHK items from `docs/qa/test-checklist.md` against the compose stack first**, and include the results in the review input.
3. Invoke `@qa-reviewer` with: the slice goal, changed files (paths), the BR/F/CHK IDs claimed as covered, and the CHK/test results. The same verify-claimed-IDs instruction as §3 applies.
4. Afterwards: record the review per §5 and update `docs/project-state.md` (§1 row, DoD scoreboard, §2 next action).

### 5. Record the review

For **every completed qa-reviewer review** (task-scoped and full gate alike):

1. Write the **full report** — verdict, scope reviewed, findings, decisions, open items — to a new file `docs/qa/reviews/YYYY-MM-DD-task-<N>-<slug>.md` (non-task reviews: `YYYY-MM-DD-<topic>.md`), starting with the banner:
   `> **Historical archive. Not part of normal runtime context unless explicitly requested.**`
   One file per review, immutable once written — a correction gets a new file and a new index row referencing the old one.
2. Append **one index row** to `docs/qa/qa-review-log.md`: date · task/scope · verdict · review-file link · open follow-ups (concise IDs/phrases). **Never append the full report to the log** — it is a lightweight navigation index only (`docs/context-management.md` §7).

### 6. Route the verdict

Report the verdict to the human, then:

- **`FAIL` / `BLOCKED`** — stops the line. Nothing gets committed. Continue with `task-fix`.
- **`PASS` / `PASS WITH RISKS`** — proceed to documentation update and commit via `task-finish`.

Severity convention (docs/qa/test-strategy.md): **Critical** = a DoD item fails or data is lost/corrupted · **Major** = BR-rule violation with no workaround · **Minor** = BR-rule violation with workaround, or degraded UX · **Cosmetic** = presentation only. Critical/Major findings must be addressed before commit.

**Do not commit in this skill** — commit belongs to close-out, after the verdict allows it.

## Out of scope for this skill

Fixing findings (`task-fix`), documentation updates beyond the review record (§5) and the full-gate state entries (§4), next-task preparation, and the commit itself (`task-finish`). qa-reviewer writes no production or test code — fixes are the main session's job.
