# Prompt: Session end

Close out this session. Follow docs/context-management.md §6 exactly:

1. Confirm tests for touched behavior ran this session and QA review happened if implementation work is being committed. If either is missing, do it now or explicitly park the work.
2. Update `docs/current-task.md`:
   - task complete → overwrite it with the next task's block (see prompts/plan-next-task.md),
   - task in flight → append a "Progress / resume here" note: what's done, what's left, surprises found.
3. Update `docs/project-state.md` only if a gate passed, a decision was made, or a blocker changed. Do not add intra-task noise.
4. Append to `docs/qa/qa-review-log.md` only if a full QA gate ran.
5. `git status` — remove stray/temp files; verify only in-scope files changed.
6. Commit with the task number in the message (docs-only commits don't need qa-reviewer), or state explicitly that work is parked and where the resume note is.
7. Give me a 3–5 sentence summary: what was done, evidence (tests/QA verdict), and the exact next step.
