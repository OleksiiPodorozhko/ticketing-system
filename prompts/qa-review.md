# Prompt: QA review

Self-check passed. Invoke the `@qa-reviewer` subagent per docs/agentic-workflow.md. Pick the level from docs/current-task.md "QA gate expectation":

**Task-scoped (light) — normal task commit.** Give qa-reviewer ONLY:
- the task goal (one sentence) and task number,
- the changed-file list (paths, not contents — it has Read/Grep),
- the BR/F/CHK IDs claimed as covered,
- a one-line summary of test output.
Ask it to review that delta against requirements, not the whole project — and to Grep each claimed BR/CHK ID and verify the rule's actual text matches the behavior being claimed (a mis-cited ID is a finding, not a pass).

**Full gate — slice-closing task.** Additionally:
- run the slice's manual CHK items against the compose stack first and include results,
- ask for the full gate review per docs/implementation-plan.md "QA gate protocol",
- afterwards append the verdict to docs/qa/qa-review-log.md and update docs/project-state.md.

Then report the verdict to me. `FAIL`/`BLOCKED` stops the line → prompts/fix-qa-findings.md. `PASS`/`PASS WITH RISKS` → proceed to documentation update + commit (prompts/session-end.md covers the checklist).

Do not invoke qa-reviewer for docs-only changes or an unchanged diff it already reviewed.
