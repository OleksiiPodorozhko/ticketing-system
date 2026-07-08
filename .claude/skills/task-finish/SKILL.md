---
name: task-finish
description: Close out a ticketing-system task or session after implementation, self-check, QA, and fixes are complete — verify the gates ran, update current-task.md / project-state.md / qa-review-log.md per their rules, sweep git status, then commit with the task number or explicitly park the work. The only pipeline skill that commits; never pushes unless asked.
---

# task-finish

**Purpose:** Leave the repo and docs in a state the next session can resume cold — even if the session ends mid-task. This is the only pipeline skill that commits; everything before it (implement, self-check, QA, fix) hands evidence forward and this skill turns it into a commit or an explicitly parked state.

## Procedure

### 1. Verify the gates

Confirm, with evidence in hand:

- **tests for touched behavior ran this session** (output captured), and
- **the QA review required by the task's "QA gate expectation" happened**, if implementation work is being committed.

If either is missing: do it now (`task-self-check` / `task-qa`) — or explicitly park the work (step 6).

### 2. Update `docs/current-task.md` — always

- **Task complete** → overwrite the file with the next task's block (plan it via `task-plan`).
- **Task in flight** → append a **"Progress / resume here"** note: what's done, what's left, any surprises found.

Never leave the file describing finished work with no pointer forward.

### 3. Update `docs/project-state.md` — only at its altitude

Update only if something changed at slice level:

- a **QA gate passed** → §1 status row, DoD scoreboard, §2 next action;
- a **decision was made** → §4 decision log;
- a **blocker appeared or cleared** → §5.

Do not add intra-task progress noise — that belongs in the current-task resume note.

### 4. Append `docs/qa/qa-review-log.md` — only for full QA gates

Append-only, and only if a **full QA gate** ran this session. If `task-qa` already wrote the entry during the gate, verify it is there — do not duplicate it.

(CLAUDE.md itself changes only for new non-negotiable constraints, changed build/test/run commands, or a wrong instruction — per `docs/context-management.md` §3 — and any such edit is flagged in the commit message.)

### 5. Sweep git status

Run `git status`:

- remove stray/temp/scratch files (flag anything unexpected to the human before deleting it);
- verify only in-scope files changed — an out-of-scope change must be explained or reverted before committing.

### 6. Commit — or explicitly park

- **Commit** with the **task number** in the message, stating what it delivers. No completion claims without test output in hand. Docs-only commits don't require qa-reviewer.
- **Park** (any time, even mid-task): state explicitly that the work is parked and where the resume note is (step 2). Uncommitted work-in-progress is acceptable only with that resume note in place.
- **Never push unless explicitly asked.**

### 7. Summary

Give the human a **3–5 sentence summary**: what was done, the evidence (test output / QA verdict), and the exact next step.

## Out of scope for this skill

Planning the next task's content (`task-plan` — step 2 only triggers it), implementation (`task-implement`), the self-check walkthrough (`task-self-check`), the QA review procedure (`task-qa`), and fixing findings (`task-fix`).
