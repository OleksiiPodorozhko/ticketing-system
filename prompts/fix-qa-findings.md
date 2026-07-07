# Prompt: Fix QA findings

qa-reviewer returned findings. Handle them:

1. Address every **Critical** and **Major** finding. For each: state the root cause first, then the fix (CLAUDE.md: explain root cause before changing production code or tests).
2. Never weaken, delete, or rewrite a test just to make it pass. If a test seems wrong, argue the case to me before touching it.
3. **Minor/Cosmetic** findings: fix if under ~5 minutes each and inside the task's allowed scope; otherwise list them for me to triage (log or defer — deferred items go in the project-state blockers/notes, not silently dropped).
4. Re-run the affected tests, plus the full suite if shared behavior changed. Show output.
5. If any fix changed behavior (not just formatting/messages), re-invoke qa-reviewer scoped to the fix diff.
6. Stay inside the current task's scope — a finding that requires out-of-scope work becomes a new task proposal, not an inline expansion.

Output: findings → resolution table, test output, and the final QA verdict. Then proceed to commit per prompts/session-end.md.
