---
name: task-plan
description: Plan the next implementation task for the ticketing system when the previous task is complete or docs/current-task.md is stale or empty. Selects the next task block from the active slice of docs/implementation-plan.md, checks for plan drift, and overwrites docs/current-task.md with the task contract. Planning only — never implements. Normally invoked from task-start.
---

# task-plan

**Purpose:** Turn the next item in `docs/implementation-plan.md` into a concrete, self-contained task contract in `docs/current-task.md`, so the implementing session can work from two files without re-deriving scope. This skill plans; it never writes application code. Implementation is handed off to `task-implement`.

## Procedure

### 1. Load planning context

Read exactly:

1. `docs/project-state.md` — §1 (status snapshot) and §2 (next action).
2. `docs/implementation-plan.md` — the **active slice's section only**, plus its "Task protocol" rules. Do not read other slices or the whole file.

Pull `docs/business-rules.md` / `docs/qa/test-checklist.md` lines **by ID** (Grep) only if the candidate task block cites IDs that need clarifying. Nothing else.

### 2. Select the candidate task

The next task is the **next numbered task block** in the active slice. Tasks execute in numeric order unless a task's block says otherwise; one task at a time — never two in flight. No slice starts until the previous slice's QA gate passed. If the block still fits reality, use it as-is.

### 3. Check for plan drift

Drift signals: the task is already partially done, its assumptions no longer hold, a new blocker exists, or the plan disagrees with repo/git reality.

If drifted, invoke the **`implementation-planner`** subagent with: the current slice, what changed, and the candidate task — pass file *paths*, not pasted file bodies — and use its output as the task block. The planner is read-only; it must not make scope decisions the plan doesn't already sanction. If drift requires reordering, descoping, or an architecture change, that is a human decision — stop and ask instead of planning around it.

### 4. Draft the task block

Write the task using the existing `docs/current-task.md` structure:

> current slice · current task · goal · allowed files/areas · forbidden changes · acceptance criteria · commands to run · QA gate expectation · next step after completion

Set the **QA gate expectation** per the risk-based rules in the Task protocol: task-scoped `@qa-reviewer` for high-risk changes (auth, schema/migrations, compose, persistence rules, delete restrictions, state transitions, comments, requirement/QA doc changes); the **full QA gate** for the last task of a slice; none for trivial docs-only work.

### 5. Show and stop

Overwrite `docs/current-task.md` with the drafted block, show the human the resulting content, and **stop — do not start implementing in this turn**. The next step is the human's go-ahead (via `task-start` / `task-implement`).

## Constraints

- **Stay inside mandatory scope** (AGENTS.md); the out-of-scope list is a hard deny-list.
- **Do not reorder slices**; do not start a slice before the previous slice's gate passed.
- **Do not merge tasks to "save time".**
- **Task size stays in the 30–90 minute range.** If reconciled scope grows beyond that, split it into numbered sub-tasks and plan only the first.

## Out of scope for this skill

Implementation (`task-implement`), self-check (`task-self-check`), QA review (`task-qa`), fixing findings (`task-fix`), and close-out/commit (`task-finish`).
