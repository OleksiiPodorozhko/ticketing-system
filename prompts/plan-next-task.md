# Prompt: Plan the next task

The previous task is complete (or docs/current-task.md is stale). Plan the next one:

1. Read `docs/project-state.md` §1–2 and the active slice's section in `docs/implementation-plan.md`.
2. The next task is the next numbered task block in the plan. If it still fits reality, use it as-is.
3. If the plan has drifted (task already partially done, wrong assumptions, new blocker), invoke the `implementation-planner` subagent with: current slice, what changed, and the candidate task — and use its output.
4. Overwrite `docs/current-task.md` with the task using its existing structure: current slice · current task · goal · allowed files/areas · forbidden changes · acceptance criteria · commands to run · QA gate expectation · next step after completion.
5. Show me the resulting current-task.md content and stop — do not start implementing in this turn.

Constraints: stay inside mandatory scope (CLAUDE.md); do not reorder slices; do not merge tasks to "save time"; a task must stay in the 30–90 minute range.
