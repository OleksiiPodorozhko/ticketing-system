# Prompt: Implement the current task

Implement exactly what `docs/current-task.md` describes. Rules:

1. Read `docs/current-task.md`. Work only inside its "Allowed files/areas"; treat "Forbidden changes" as hard boundaries.
2. Pull supporting context by ID, not by file: Grep for the BR/CHK IDs the task cites (docs/agentic-workflow.md, token discipline).
3. If mid-implementation you discover the task needs something outside its scope: STOP, describe the conflict, and propose either a scope amendment to current-task.md or a follow-up task. Do not silently expand scope.
4. Enforce business rules server-side; never rely on client validation alone (CLAUDE.md).
5. When the code is written, run the task's "Commands to run" and show me the output.
6. Then continue with prompts/self-check.md behavior before any QA review.

Do not commit yet — commit happens after self-check and the QA review required by the task's "QA gate expectation".
