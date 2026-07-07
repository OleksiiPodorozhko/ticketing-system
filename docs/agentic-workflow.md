# Agentic Workflow

How Claude Code sessions execute this project. Companion docs: [context-management.md](context-management.md) (what to read/update when) · [implementation-plan.md](implementation-plan.md) (the task list) · [current-task.md](current-task.md) (the active task) · prompt templates in `prompts/`.

---

## The loop

Every unit of work follows the same cycle. One task ([implementation-plan.md](implementation-plan.md) numbering) per cycle; never two tasks in flight.

1. **Session start** — run the [context-management.md](context-management.md) session-start checklist (template: `prompts/session-start.md`). Confirm what [current-task.md](current-task.md) says before touching anything.
2. **Task planning** — if [current-task.md](current-task.md) is stale or empty, plan the next task (template: `prompts/plan-next-task.md`). Optionally invoke the `implementation-planner` subagent; either way, the result is written into [current-task.md](current-task.md) before implementation starts.
3. **Implementation** — execute exactly the scope in [current-task.md](current-task.md) (template: `prompts/implement-current-task.md`). Scope drift = stop, update the task doc or split a new task; don't improvise extra scope.
4. **Self-check** — before any QA involvement: walk the acceptance criteria one by one, run the smallest relevant test set, spot-check touched invariants (template: `prompts/self-check.md`). Fix what you find yourself — qa-reviewer is not a linter.
5. **QA review** — invoke `@qa-reviewer` per the rules below (template: `prompts/qa-review.md`).
6. **Fixes** — address Critical/Major findings, re-run affected tests, re-review if behavior changed (template: `prompts/fix-qa-findings.md`).
7. **Documentation update** — [current-task.md](current-task.md) rewritten for the next task; [project-state.md](project-state.md) at gates/decisions; [qa/qa-review-log.md](qa/qa-review-log.md) at full gates.
8. **Commit** — with test output in hand. Message states the task number and what it delivers. Never claim completion without command output.

Session end (any time, even mid-task): run the session-end checklist (template: `prompts/session-end.md`) so the next session can resume cold.

## Roles

| Role | Does | Does not |
|---|---|---|
| **Main Claude Code session** | The only writer of application code, tests, config, and migrations. Runs commands, drives the loop, owns commits. | Skip gates; expand scope; mark CHK items passed without evidence. |
| **`implementation-planner` subagent** | Optional read-only planner: turns the next plan item into a concrete task block (scope, criteria, commands, risks). Useful when the next task is ambiguous or the plan drifted from reality. | Write any file; make scope decisions the plan doesn't already sanction. |
| **`qa-reviewer` subagent** | Read-only reviewer against requirements/BR/CHK/traceability. Its verdict gates commits: `FAIL`/`BLOCKED` stops the line. | Write production/test code; approve scope creep; substitute for running tests. |
| **Human reviewer** | Approves plans and architecture changes, resolves open Q-items with the requirements owner, owns descope decisions, reviews commits at their own pace. | — |

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
- **Prefer targeted test runs.** Smallest relevant test file first; the full suite only when shared behavior changed or at gates.
