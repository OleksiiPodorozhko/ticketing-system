# Prompt: Session start

Start a work session on the ticketing system. Follow docs/context-management.md §5 exactly:

1. Read `docs/current-task.md` and `docs/project-state.md` (§1–2 only). Do NOT read the rest of the docs tree or scan the repo.
2. Run `git status` and `git log --oneline -3`; flag anything uncommitted or unexpected.
3. If current-task.md and project-state.md disagree, reconcile before doing anything else (state doc wins on status, task doc wins on scope).
4. Tell me in 1–2 sentences: the active task, its status (fresh / resume-in-flight / stale), and what you will do this session.
5. Then wait for my go-ahead — or, if the task is unambiguous and fresh, proceed with prompts/implement-current-task.md behavior.

Pull additional documents only when the task actually requires them (context-management.md §1).
