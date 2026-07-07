# Prompt: Self-check before QA

The current task's implementation is done. Before invoking qa-reviewer:

1. Walk `docs/current-task.md` acceptance criteria one by one. For each: state PASS/FAIL and the concrete evidence (command output, curl response, observed behavior) — not "should work".
2. Run the smallest relevant test set; run the full backend suite only if shared behavior changed. Paste the output.
3. Spot-check every domain invariant the task touches (CLAUDE.md "Domain model & invariants") — especially: server-side validation, 409 conflict rules, `modified_at` semantics, token lifecycle, fresh-DB rule, no secrets in the repo.
4. Check `git status`: only files inside the allowed scope changed; no stray/temp files.
5. Fix anything you found yourself, re-run affected checks, and show the final state.

Output: a short criteria table (criterion → PASS/FAIL → evidence) + test output. If everything passes, proceed to prompts/qa-review.md behavior. qa-reviewer is not a substitute for this step.
