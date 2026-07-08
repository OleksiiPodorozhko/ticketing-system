---
name: task-start
description: Main entrypoint for starting or resuming work on the ticketing system. Loads minimal context, checks git state, reconciles current-task.md with project-state.md, classifies the task (fresh / in-flight / stale), and stops for human approval before implementation. Use at the start of every work session.
---

# task-start

**Purpose:** The one command a human normally runs to start a session. It orients the session from `docs/current-task.md` and `docs/project-state.md`, detects whether the active task is fresh, in flight, or stale, and decides the next step — without starting implementation unless that is clearly safe. Later pipeline stages will be delegated to the other `task-*` skills once they are migrated (see "Later stages" below).

**Status:** active for session start only. Everything after the stop gate still follows `prompts/*.md` until the corresponding skills are migrated.

## Procedure

### 1. Load minimal context

Read exactly:

1. `docs/current-task.md` — the active task: scope, criteria, commands, resume note if any.
2. `docs/project-state.md` — §1 (status snapshot) and §2 (next action) **only**.

`CLAUDE.md` is auto-loaded; do not re-read it. Do **not** read the rest of the `docs/` tree, the `docs/qa/` tree, or scan the repo "to get oriented" — orientation costs two files by design.

### 2. Check repo state

Run `git status` and `git log --oneline -3`. Flag anything uncommitted or unexpected (stray files, commits current-task.md doesn't know about). Unexpected repo state must be explained or surfaced to the human before any other action.

### 3. Reconcile task vs project state

If `current-task.md` and `project-state.md` disagree, reconcile **before doing anything else**:

- **project-state.md wins on status** (what is done, what gate passed).
- **current-task.md wins on scope** (what the task allows and forbids).

Record the reconciliation in the session summary (step 5); if reconciliation would change either doc's content, propose the edit to the human rather than silently rewriting history.

### 4. Classify the task

Classify the active task as exactly one of:

- **Fresh** — a planned task block, no work started, scope and criteria unambiguous.
- **In-flight** — a "Progress / resume here" note exists; work is partially done.
- **Stale or empty** — current-task.md describes finished work with no pointer forward, is empty, or contradicts repo/git reality in a way reconciliation can't resolve.

### 5. Decide and report

Tell the human in 1–2 sentences: the active task, its classification, and what this session will do. Then:

- **In-flight** → summarize the resume point and continue from it after go-ahead.
- **Stale or empty** → plan the next task (target skill: `task-plan`; until migrated, follow `prompts/plan-next-task.md`).
- **Ambiguous** (classification unclear, scope conflict, plan drifted from reality) → ask the human; do not guess.

### 6. Stop gate — before implementation

Do **not** start implementation unless the task is **fresh, unambiguous, and approved** (explicit go-ahead, or a standing approval recorded in the task block). In every other case, stop after the step-5 report and wait. One task in flight at a time — never two.

## Later stages (delegated, not yet migrated)

After the stop gate, the pipeline continues through these skills. Until each is migrated (upgrade plan Steps 4–5), the matching `prompts/*.md` template remains the source of behavior:

| Stage | Skill | Interim source |
|---|---|---|
| Plan next task | `task-plan` | `prompts/plan-next-task.md` |
| Implement in scope | `task-implement` | `prompts/implement-current-task.md` |
| Self-check | `task-self-check` | `prompts/self-check.md` |
| QA review gate | `task-qa` | `prompts/qa-review.md` |
| Fix QA findings | `task-fix` | `prompts/fix-qa-findings.md` |
| Close out / commit | `task-finish` | `prompts/session-end.md` |

This skill orchestrates; it must not absorb their content.

## Token discipline

- **Start narrow.** Session start reads only the two files in step 1; everything else is on demand per `docs/context-management.md` §1.
- **Read by ID.** When the task cites BR/F/CHK IDs, Grep for the ID and read the surrounding lines — never whole rule/checklist files.
- **Don't re-read** files already in context this session, including after your own edits.
- **Don't re-derive** settled decisions (stack, topology, Q-items — `docs/architecture.md`); reopening one is a conversation with the human, not a research task.
