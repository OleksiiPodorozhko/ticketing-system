---
name: task-start
description: Main entrypoint and orchestrator for the ticketing-system task pipeline. Gathers minimal evidence (current-task.md, project-state.md §1–2, git state), classifies the workflow state, routes to the appropriate task-* skill, and enforces human approval gates. The one command a human normally runs. Use at the start of every work session and between pipeline stages.
---

# task-start

**Purpose:** The one command a human normally needs to remember. It decides *where the pipeline stands* and *which skill runs next* — it never performs the planning, implementation, self-check, QA, fix, or finish procedures itself. Those live in the other `task-*` skills; this skill routes, gates, and hands off.

## Procedure

### 1. Gather evidence (minimal context)

Collect exactly this evidence, nothing more:

1. `docs/current-task.md` — status, scope, resume notes.
2. `docs/project-state.md` — §1 (status snapshot) and §2 (next action) **only**.
3. `git status` and `git log --oneline -3` — uncommitted work, unexpected commits.
4. Explicit user instruction in the current turn, if any.
5. Self-check / QA summaries already visible in this session's context, if any.

`CLAUDE.md` is auto-loaded; do not re-read it. Do **not** read the rest of `docs/` or scan the repo "to get oriented". `docs/tasks/` in particular is historical task archive, intentionally excluded from normal runtime context — never read it during orientation or routing unless the human explicitly asks for historical investigation. Pull additional docs only **by ID/section** (Grep) when classification genuinely requires it — a broad docs/repo read is itself an approval gate (§5).

### 2. Reconcile task vs project state

If `current-task.md` and `project-state.md` disagree: **project-state.md wins on status** (what is done, what gate passed); **current-task.md wins on scope** (what the task allows and forbids). If reconciliation would change either doc, propose the edit to the human — never silently rewrite. If the disagreement can't be reconciled from evidence, the state is **unclear** (§3) and requires the human.

### 3. Classify the state

From the evidence, classify as exactly one of:

| State | Typical evidence |
|---|---|
| No current task | current-task.md missing or empty |
| Fresh task | status "not started", clean tree, scope and criteria unambiguous |
| In-flight task | "Progress / resume here" note, or in-scope uncommitted changes |
| Stale task | describes finished work with no pointer forward, or contradicts git reality |
| Implemented, unchecked | work appears complete (resume note / diff) but no self-check evidence |
| Self-check failed | FAIL rows in a self-check criteria table |
| Self-check passed / QA needed | criteria all PASS; the task's QA gate expectation not yet satisfied |
| QA failed / fixes needed | qa-reviewer verdict FAIL/BLOCKED, or open Critical/Major findings |
| QA passed / ready to finish | verdict PASS / PASS WITH RISKS; not yet committed |
| Finished / next task needed | task committed; current-task.md needs its next block |
| Unclear | evidence insufficient or contradictory |

Prefer concrete evidence over assumption. If the evidence doesn't clearly support one state, classify as **unclear** and ask the human — do not guess.

### 4. Route to the next stage

| State | Next stage |
|---|---|
| No current task · Stale task · Finished | `task-plan` |
| Fresh task | present the **Task Start Brief** (§6), then **stop** for approval (§5); only after explicit approval → `task-implement` |
| In-flight task | summarize the resume point; ask whether to continue → `task-implement` |
| Implemented, unchecked | `task-self-check` |
| Self-check failed | `task-implement` (in-scope work missing/wrong) or `task-fix` (finding-shaped defect) |
| Self-check passed / QA needed | `task-qa` |
| QA failed / fixes needed | `task-fix` |
| QA passed / ready to finish | `task-finish` |
| Unclear | **stop** — ask the human |

One task in flight at a time — never two.

### 5. Human approval gates

Require explicit human approval:

- **before first implementation of a fresh task — always, no exceptions.** `/task-start` is an **orchestration request, not implementation approval**; never infer approval from the `/task-start` invocation itself, from a clean state classification, or from prior sessions. Implementation approval must be a **separate explicit human message** sent *after* the Task Start Brief (§6) is shown. The human has two valid responses: **approve the task as-is** (e.g. "approved", "proceed as-is") → route to `task-implement`; or **correct the task** → apply/propose the correction to `docs/current-task.md` via the normal proposal path (§2), re-present the brief, and wait again;
- when **current-task.md and project-state.md disagree**;
- when **scope drift** is detected;
- before **architecture, requirements, or business-rule changes**;
- **before committing**;
- before **broad repo reads or broad docs reads**;
- before **escalating to a higher-cost model**.

### 6. Task Start Brief

Every run ends with a report before any hand-off. For a **fresh task**, the full **Task Start Brief** is mandatory:

- **Task:** detected task name/number and status
- **Goal:** one/two-sentence goal of the task
- **Allowed files/areas:** summary from current-task.md
- **Forbidden changes:** summary
- **Acceptance criteria:** summarized list
- **Commands / QA gate:** commands to run and the QA gate expectation
- **Risks / ambiguities:** anything detected from the evidence (contradictions, vague criteria, carried-over watch-items)
- **Selected next stage:** the skill that would run on approval (`task-implement`)
- **Approval:** explicit statement that the pipeline is **stopped** awaiting a separate human approval message (approve as-is, or correct the task — §5)

For all other states, the shorter report block suffices:

- **Detected state:** …
- **Evidence used:** …
- **Selected next stage:** …
- **Human approval required:** yes/no (which gate)
- **Next action:** the exact skill/stage to run and the input it should use

### 7. Hand off

Delegate by naming the skill and its input (e.g. "run `task-qa` with the self-check criteria table and test output"). Do not perform the child procedure here. Continue into the next stage automatically **only** when it is safe, unambiguous, and already approved (explicit go-ahead this turn, or a standing approval recorded in the task block); otherwise stop after the §6 report and wait.

**Exception — the fresh-task gate cannot be pre-approved.** Automatic continuation into `task-implement` for a fresh task is **never** allowed: not by a standing approval, not by the `/task-start` invocation, not by momentum from a prior task. After the human's explicit approval message, the rest of the pipeline (`task-implement → task-self-check → task-qa → task-fix` if needed → `task-finish`) auto-chains as before — still subject to `task-implement`'s own implementation-plan approval gate.

## Stop conditions

Stop and ask the human — no routing, no hand-off — if any of:

- dirty working tree contains **unexpected** changes;
- current-task.md is **missing or contradictory**;
- current-task.md and project-state.md **disagree** beyond reconciliation;
- task **scope is missing or ambiguous**;
- the next action would touch files **outside the task's allowed files/areas**;
- **tests or QA evidence are missing** before finish;
- the next step implies **architecture or requirements changes**;
- a **broad repo/docs scan** seems necessary.

## Model guidance

- **Sonnet** — routine orchestration, implementation, task-scoped QA.
- **Fable / Opus** — complex planning, architecture review, full slice gates, difficult recovery.
- **Haiku / Sonnet** — simple docs updates and mechanical checks.

Never switch models silently. When a stage would benefit from escalation, recommend it in the §6 report and ask before requiring it.

## Token discipline

- **Start narrow.** A run reads only the §1 evidence; everything else on demand per `docs/context-management.md` §1.
- **Read by ID.** When the task cites BR/F/CHK IDs, Grep for the ID and read the surrounding lines — never whole rule/checklist files.
- **Don't re-read** files already in context this session, including after your own edits.
- **Don't re-derive** settled decisions (stack, topology, Q-items — `docs/architecture.md`); reopening one is a conversation with the human, not a research task.
