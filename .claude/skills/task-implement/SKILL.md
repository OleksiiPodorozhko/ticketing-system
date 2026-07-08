---
name: task-implement
description: Implement exactly the task contract in docs/current-task.md for the ticketing system — inside its allowed files/areas, treating forbidden changes as hard boundaries, stopping on scope drift. Use only after the task is approved (normally reached via task-start). Presents an Implementation Plan and waits for explicit human approval before editing any file. Never commits.
---

# task-implement

**Purpose:** Execute exactly what `docs/current-task.md` describes — nothing more, nothing less. The main Claude Code session is the only writer of application code, tests, config, and migrations; reviewer/planner subagents never write code. Before any file is edited, this skill presents an **Implementation Plan** and waits for explicit human approval (§3). It ends with the task's commands run and a hand-off to self-check — **never with a commit**.

## Procedure

### 1. Load the task contract

Read `docs/current-task.md` (skip the re-read if it is already in context this session). From it, take:

- **Allowed files/areas** — a whitelist; touch nothing outside it.
- **Forbidden changes** — hard boundaries, even when a change there would be convenient.
- **Acceptance criteria** — the definition of done for this task.
- **Carried-over watch-items** (if present) — honor them where the task touches their area.
- **Commands to run** and **QA gate expectation** — needed for steps 3 and 6–7.

### 2. Pull supporting context by ID, not by file

- Grep for the **BR / F / CHK / R IDs** the task cites and read the surrounding lines — never whole rule, flow, or checklist files.
- Read `docs/architecture.md` only for the sections the task block references.
- Read source files only inside the allowed scope, plus their **direct call sites** when changing shared behavior.
- Do not re-read files already in context; do not re-derive settled stack/topology decisions.

### 3. Implementation Plan — before any file edit

Before touching any file, present an **Implementation Plan** containing:

- **Files expected to change** — within the allowed files/areas only.
- **High-level steps** — ordered, a few bullets.
- **Validation/test commands** — the task's "Commands to run" plus the smallest relevant test set.
- **Scope-drift stop conditions** — what discovery mid-implementation would trigger §5 (Scope drift → stop).
- **Risks** — anything that could break invariants, shared behavior, or the QA gate.

Then **stop and wait** for the human to approve the plan. Implementation-plan approval is a **separate explicit human message**: neither the earlier task approval, nor `/task-start`, nor this skill being invoked counts as plan approval. If the human corrects the plan, revise and re-present it. Only after plan approval do file edits begin.

### 4. Implement within scope

- Work only inside the allowed files/areas, in the existing code's conventions.
- **Enforce every business rule server-side** — validation of enum values, references, and invariants happens in the backend; client-side validation alone is never sufficient (CLAUDE.md).
- Keep the mandatory non-negotiables in force: no seed data in any startup path, no tokens/session ids in URLs, meaningful HTTP status codes.

### 5. Scope drift → stop

If mid-implementation the task turns out to need something outside its allowed scope (a file, a dependency, a behavior change elsewhere):

1. **STOP.** Do not make the out-of-scope change.
2. Describe the conflict: what the task needs, why it is outside scope.
3. Propose either a **scope amendment** to `docs/current-task.md` or a **follow-up task**.
4. Wait for the human decision. Never silently expand scope.

### 6. Run the task's commands

When the code is written, run the task's **"Commands to run" verbatim** and show the real output. If a command fails, investigate whether the application code is wrong before touching any test (CLAUDE.md testing rules). No completion claims without command output in hand.

### 7. Hand off — do not commit

Continue with `task-self-check` before any QA involvement. After the plan approval in §3, the pipeline auto-continues as before (`task-self-check → task-qa → task-fix` if needed → `task-finish`) — no further human gates in this skill beyond the ones those skills already define (scope drift here excepted, §5).

**Do not commit in this skill.** Commit happens only after self-check passes and the QA review required by the task's "QA gate expectation" is done (close-out: `task-finish`).

## Out of scope for this skill

Task planning (`task-plan`), the self-check walkthrough (`task-self-check`), QA review procedure (`task-qa`), fixing QA findings (`task-fix`), and documentation updates / commit (`task-finish`).
