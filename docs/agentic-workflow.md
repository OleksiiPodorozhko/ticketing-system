# Agentic Workflow

How Claude Code sessions execute this project. The executable procedures live in the Skills under `.claude/skills/`; this document is the human-oriented overview. Companion docs: [context-management.md](context-management.md) (what to read/update when) · [implementation-plan.md](implementation-plan.md) (the task list) · [current-task.md](current-task.md) (the active task).

---

## Where things live

- **`.claude/skills/`** — executable workflow procedures (the `task-*` pipeline below).
- **`docs/`** — project knowledge and project state; Skills read it selectively per the document categories in [context-management.md](context-management.md) §7 (runtime state · reference docs · historical archives · generated/local/temporary). Historical archives live in `docs/tasks/`, `docs/qa/reviews/`, and `docs/qa/runs/`.
- **`.claude/hooks/`** — deterministic guardrails, enforced regardless of what a session decides.
- **`.claude/agents/`** — specialized read-only assistance (`qa-reviewer`, `implementation-planner`).

## The pipeline

Every unit of work follows the same Skill pipeline. One task ([implementation-plan.md](implementation-plan.md) numbering) per cycle; never two tasks in flight. `/task-start` is the one command a human normally runs — it classifies where the pipeline stands and routes to the right stage.

1. **`/task-start`** — gathers minimal evidence ([current-task.md](current-task.md), [project-state.md](project-state.md) §1–2, git state), classifies the workflow state, enforces human approval gates, and hands off to the stage below. For a **fresh task** it presents a **Task Start Brief** (goal, scope, criteria, QA gate, risks) and **always stops** for explicit human approval — `/task-start` itself is an orchestration request, not implementation approval.
2. **`task-plan`** — if [current-task.md](current-task.md) is stale or empty, selects the next task block from the active slice and overwrites [current-task.md](current-task.md) with the task contract. May invoke the `implementation-planner` subagent on plan drift.
3. **`task-implement`** — first writes an **Implementation Plan** (expected files, steps, validation commands, stop conditions, risks) and waits for a separate explicit human approval before editing any file; then executes exactly the scope in [current-task.md](current-task.md). After plan approval the pipeline auto-continues through self-check/QA/fix/finish as before. Scope drift = stop, propose an amendment or follow-up task; don't improvise extra scope.
4. **`task-self-check`** — before any QA involvement: walks the acceptance criteria one by one, runs the smallest relevant test set, spot-checks touched invariants. Fixes self-found issues — qa-reviewer is not a linter.
5. **`task-qa`** — invokes `@qa-reviewer` per the rules below; its verdict gates the commit (`FAIL`/`BLOCKED` stops the line). Records every completed review: the **full report** as a new file in `docs/qa/reviews/`, plus **one index row** in [qa/qa-review-log.md](qa/qa-review-log.md).
6. **`task-fix`** (if needed) — addresses Critical/Major findings root-cause-first, re-runs affected tests, re-reviews if behavior changed.
7. **`task-finish`** — updates [current-task.md](current-task.md) for the next task, [project-state.md](project-state.md) at gates/decisions, and verifies the QA review record (`docs/qa/reviews/` file + [qa/qa-review-log.md](qa/qa-review-log.md) index row) exists for any review this session; for a completed task, writes the **task archive** to `docs/tasks/` *before* the final commit (so the archive lands in that commit) — the approved Task Start Brief and Implementation Plan, what was implemented, test evidence, follow-ups, and the QA result as a verdict plus a **link to the review file** (never a copy of the full report); the commit hash is printed in the close-out summary. Then commits with the task number (the only skill that commits) — and the cycle restarts at `/task-start` for the next task.

Session end (any time, even mid-task): `task-finish` also handles parking — a "Progress / resume here" note in [current-task.md](current-task.md) so the next session can resume cold.

## Roles

| Role | Does | Does not |
|---|---|---|
| **Main Claude Code session** | The only writer of application code, tests, config, and migrations. Runs commands, drives the loop, owns commits. | Skip gates; expand scope; mark CHK items passed without evidence. |
| **`implementation-planner` subagent** | Optional read-only planner: turns the next plan item into a concrete task block (scope, criteria, commands, risks). Useful when the next task is ambiguous or the plan drifted from reality. | Write any file; make scope decisions the plan doesn't already sanction. |
| **`qa-reviewer` subagent** | Read-only reviewer against requirements/BR/CHK/traceability. Its verdict gates commits: `FAIL`/`BLOCKED` stops the line. | Write production/test code; approve scope creep; substitute for running tests. |
| **Human reviewer** | Approves Task Start Briefs, Implementation Plans, and architecture changes; resolves open Q-items with the requirements owner; owns descope decisions; reviews commits at their own pace. | — |

## When to invoke qa-reviewer

Invoke `@qa-reviewer` using risk-based rules, not after every task.

### Mandatory

- At the full QA gate at the end of every slice.
- Before final demo-readiness claims.
- For authentication, authorization, email verification, token/session handling.
- For database schema, migrations, persistence, Docker Compose, or startup changes.
- For server-side business rules: validation, delete restrictions, same-team constraints, ticket state transitions, `modified_at`, comments.
- For requirement, business-rule, traceability, or QA documentation changes.
- After fixing a critical or major QA finding.

### Optional

- Simple UI-only work.
- Styling.
- README wording.
- Small non-behavioral refactoring.

### Do not invoke

- Trivial docs-only commits.
- Pure formatting.
- Mid-task work-in-progress.
- Questions that can be answered from existing docs.

## Token discipline

The failure mode to avoid is re-reading the whole docs tree every session. Rules:

- **Start narrow.** Session start reads only [current-task.md](current-task.md) and [project-state.md](project-state.md) §1–2 (CLAUDE.md is auto-loaded). Everything else is pulled on demand — see [context-management.md](context-management.md).
- **Read by ID, not by file.** When a task cites BR-K11 or CHK-TKT-06, Grep for that ID and read the surrounding lines — not the whole business-rules or checklist file.
- **Don't re-read what's in context.** Files already read this session don't need re-reading after your own edits.
- **Scope subagent prompts.** Give qa-reviewer/implementation-planner the task block and file *paths* — they have Read/Grep; never paste file bodies into their prompts.
- **Don't re-derive.** Stack, topology, and Q-decisions are settled in [architecture.md](architecture.md) §1–§6. If tempted to reconsider one, that's a decision-log conversation with the human, not a research session.
- **Historical archives are write-only.** `docs/tasks/` (per-task archives, written by `task-finish`), `docs/qa/reviews/` (full QA reports, written by `task-qa`), and `docs/qa/runs/` (dated checklist runs) are durable history, intentionally excluded from normal runtime context to avoid context bloat — no pipeline stage reads them unless the human explicitly asks for historical investigation or a specific file is referenced (e.g. by an index row or a carried follow-up). They never replace [current-task.md](current-task.md), [project-state.md](project-state.md), or [qa/qa-review-log.md](qa/qa-review-log.md), which remain the active lightweight state documents — the last strictly a **navigation index** (one row per review; the full report lives in `docs/qa/reviews/`). Category definitions: [context-management.md](context-management.md) §7.
- **Prefer targeted test runs.** Smallest relevant test file first; the full suite only when shared behavior changed or at gates.
