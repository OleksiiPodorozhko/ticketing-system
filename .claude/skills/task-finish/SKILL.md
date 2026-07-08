---
name: task-finish
description: Close out a ticketing-system task or session after implementation, self-check, QA, and fixes are complete — verify the gates ran, update current-task.md / project-state.md per their rules, verify the QA review record (docs/qa/reviews/ file + qa-review-log.md index row), write the task archive to docs/tasks/ for completed tasks, sweep git status, then commit with the task number or explicitly park the work. The only pipeline skill that commits; never pushes unless asked.
---

# task-finish

**Purpose:** Leave the repo and docs in a state the next session can resume cold — even if the session ends mid-task. This is the only pipeline skill that commits; everything before it (implement, self-check, QA, fix) hands evidence forward and this skill turns it into a commit or an explicitly parked state.

## Procedure

### 1. Verify the gates

Confirm, with evidence in hand:

- **tests for touched behavior ran this session** (output captured), and
- **the QA review required by the task's "QA gate expectation" happened**, if implementation work is being committed.

If either is missing: do it now (`task-self-check` / `task-qa`) — or explicitly park the work (step 7).

### 2. Update `docs/current-task.md` — always

- **Task complete** → overwrite the file with the next task's block (plan it via `task-plan`).
- **Task in flight** → append a **"Progress / resume here"** note: what's done, what's left, any surprises found. If an Implementation Plan was already approved this session, include its approved text in the note — the eventual task archive (step 5) captures it verbatim from there.

Never leave the file describing finished work with no pointer forward.

### 3. Update `docs/project-state.md` — only at its altitude

Update only if something changed at slice level:

- a **QA gate passed** → §1 status row, DoD scoreboard, §2 next action;
- a **decision was made** → §4 decision log;
- a **blocker appeared or cleared** → §5.

Do not add intra-task progress noise — that belongs in the current-task resume note.

### 4. Verify the QA review record — for any qa-reviewer review this session

If a qa-reviewer review ran this session, `task-qa` §5 already wrote the **full report** to `docs/qa/reviews/<date>-task-<N>-<slug>.md` and appended **one index row** to `docs/qa/qa-review-log.md`. Verify both exist; write them now if missing — never duplicate them. **Never append a full QA report to the log** (it is a lightweight navigation index only) and never copy the report into any other document — link the review file instead.

(CLAUDE.md itself changes only for new non-negotiable constraints, changed build/test/run commands, or a wrong instruction — per `docs/context-management.md` §3 — and any such edit is flagged in the commit message.)

### 5. Write the task archive — `docs/tasks/` (task completions only)

When a **completed task** is about to be committed, create its archive **before the commit** so the archive rides in the same commit. Parked/mid-task sessions do **not** write archives — the resume note (step 2) is their record.

- **File:** `docs/tasks/task-<N>-<kebab-case-slug>.md` (e.g. `docs/tasks/task-0.3-compose-stack-test-harness-clean-checkout-proof.md`).
- **Top banner:** `> **Historical archive. Not part of normal runtime context unless explicitly requested.**`
- **Sections:** task title/ID and slice · branch · status · **Commits: pending** at archive time · **Task Start Brief as approved** · **Implementation Plan as approved** (including any approved scope deviations) · what was implemented · changed-files summary · validation/test evidence summary · QA result if a review ran (verdict + one-line summary + **link to the `docs/qa/reviews/` file** — do not copy the full report) · final task summary · decisions · risks / follow-ups carried forward.
- **Commit hash:** unknown before the commit — write "pending", commit the archive, then **print the actual hash in the step-8 summary**. Backfill the hash into the archive only if a later commit is happening anyway; **never create a hash-only second commit** (the hash stays recoverable via `git log --grep "<task number>"`).
- **Source material:** this session's context — the approved Brief and Plan, self-check and QA output. If the task spanned sessions and the verbatim approved text is no longer in context, reconstruct from `docs/current-task.md`, the resume notes, `project-state.md` §4, and the task's `docs/qa/reviews/` file (located via the `qa-review-log.md` index), and mark those sections "(reconstructed — approved text not in session context)".
- **Boundaries:** the archive is write-only history. It supplements — never replaces — `current-task.md`, `project-state.md`, and `qa-review-log.md`. No pipeline stage reads the historical archives (`docs/tasks/`, `docs/qa/reviews/`, `docs/qa/runs/`) unless the human explicitly asks for historical investigation or a specific file is referenced (`docs/context-management.md` §7).

### 6. Sweep git status

Run `git status`:

- remove stray/temp/scratch files (flag anything unexpected to the human before deleting it);
- verify only in-scope files changed — an out-of-scope change must be explained or reverted before committing.

### 7. Commit — or explicitly park

- **Commit** with the **task number** in the message, stating what it delivers. No completion claims without test output in hand. Docs-only commits don't require qa-reviewer.
- **Park** (any time, even mid-task): state explicitly that the work is parked and where the resume note is (step 2). Uncommitted work-in-progress is acceptable only with that resume note in place.
- **Never push unless explicitly asked.**

### 8. Summary

Give the human a **3–5 sentence summary**: what was done, the evidence (test output / QA verdict), the **commit hash** (if a commit was made — the archive says "pending"), and the exact next step.

## Out of scope for this skill

Planning the next task's content (`task-plan` — step 2 only triggers it), implementation (`task-implement`), the self-check walkthrough (`task-self-check`), the QA review procedure (`task-qa`), and fixing findings (`task-fix`).
