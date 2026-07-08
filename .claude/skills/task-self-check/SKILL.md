---
name: task-self-check
description: Verify a completed task implementation for the ticketing system before any QA review — walk docs/current-task.md acceptance criteria with PASS/FAIL evidence, run the smallest relevant tests, spot-check touched invariants, sweep git status, and fix self-found issues. Runs after task-implement; never commits.
---

# task-self-check

**Purpose:** Prove — with evidence, not assertions — that the finished implementation meets the task contract in `docs/current-task.md`, and fix self-found issues before QA ever sees the work. qa-reviewer is not a linter and not a substitute for this step.

## Procedure

### 1. Walk the acceptance criteria one by one

For **each** acceptance criterion in `docs/current-task.md`, state:

- **PASS or FAIL** — no third option, no "mostly".
- **Concrete evidence** — command output, curl response, or observed behavior. "Should work" is not evidence.

### 2. Run the tests

- Run the **smallest relevant test set** for the touched behavior first.
- Run the **full suite only if shared behavior changed**.
- Paste the real output.

On any failure, CLAUDE.md testing rules apply: first investigate whether the application code is wrong; never weaken, delete, or rewrite tests just to make them pass; explain the root cause before changing production code or tests.

### 3. Spot-check touched invariants

Spot-check every domain invariant the task touches (CLAUDE.md "Domain model & invariants") — especially:

- server-side validation (enums, references, non-empty-after-trim);
- the 409 delete-conflict rules (team/epic with contents);
- `modified_at` semantics (advances only on real change; comments never advance it);
- verification-token lifecycle (24 h, single-use, resend supersedes);
- fresh-DB rule (no seed data in any startup path);
- no secrets in the repo.

Check by the BR IDs the task cites (Grep) — do not re-read whole rule files.

### 4. Sweep git status

Run `git status`. Confirm:

- only files inside the task's **allowed files/areas** changed;
- no stray, temp, or scratch files landed in the repo.

Anything out of scope is a finding — resolve or explain it before QA.

### 5. Fix what you found

Fix self-found issues yourself, re-run the affected checks, and show the final state. If a fix would require changes **outside the task's allowed scope**, that is scope drift: stop and follow the `task-implement` drift rule (describe, propose amendment or follow-up, wait for the human) instead of fixing silently.

## Output

- A short **criteria table**: criterion → PASS/FAIL → evidence.
- The **test output** from step 2 (final state, after any fixes).

## Hand-off — do not commit

If everything passes, continue per the task's **"QA gate expectation"** to `task-qa` (until migrated: `prompts/qa-review.md`). **Do not commit in this skill** — commit happens only after the required QA review, at close-out (`task-finish`; until migrated: `prompts/session-end.md`).

## Out of scope for this skill

QA review procedure (`task-qa`), fixing QA findings (`task-fix`), documentation updates and commit (`task-finish`), and any new implementation beyond fixing self-found in-scope issues (`task-implement`). Until those skills are migrated, their behavior lives in the matching `prompts/*.md` templates.
