---
name: task-fix
description: Handle qa-reviewer findings for the ticketing system after a FAIL/BLOCKED verdict or any Critical/Major finding — root cause first, fix inside task scope, re-run tests, re-invoke qa-reviewer scoped to the fix diff when behavior changed. The main session writes the fixes; never commits.
---

# task-fix

**Purpose:** Get the line moving again after qa-reviewer stops it. Every Critical/Major finding gets a stated root cause and a fix (or an explicit human decision), the evidence is re-run, and the verdict is refreshed. Fixes are written by the main session — qa-reviewer never writes code.

## Procedure

### 1. Triage by severity

Severity convention (docs/qa/test-strategy.md): **Critical** = a DoD item fails or data is lost/corrupted · **Major** = BR-rule violation with no workaround · **Minor** = BR-rule violation with workaround, or degraded UX · **Cosmetic** = presentation only.

- **Critical and Major: address every one.** Non-negotiable — none may be waved through or deferred without an explicit human decision.
- **Minor / Cosmetic:** fix if under ~5 minutes each **and** inside the task's allowed scope; otherwise list them for the human to triage (fix now, log, or defer). **Deferred items go into `docs/project-state.md` blockers/notes — never silently dropped.**

### 2. Root cause first, then fix

For each Critical/Major finding: **state the root cause before changing anything**, then apply the fix (CLAUDE.md: explain the root cause before changing production code or tests).

**Never weaken, delete, or rewrite a test just to make it pass.** If a test itself seems wrong, argue the case to the human before touching it — a test only changes when the requirement or intended behavior has changed.

### 3. Stay inside the task's scope

Fixes live inside the current task's allowed files/areas. A finding that requires out-of-scope work becomes a **new task proposal** (or a scope amendment for the human to approve) — not an inline expansion. Same drift discipline as `task-implement`.

### 4. Re-run the evidence

- Re-run the **affected tests** first.
- Run the **full suite if shared behavior changed**.
- Show the real output — no resolution claims without it.

### 5. Re-review when behavior changed

If any fix changed behavior (not just formatting or messages), **re-invoke qa-reviewer scoped to the fix diff** — use the task-scoped procedure from `task-qa` (until migrated: `prompts/qa-review.md`), with the findings addressed and the fix diff's changed files as the input. If the re-review returns new Critical/Major findings, loop back to step 1.

## Output

- **Findings → resolution table**: finding · severity · root cause · resolution (fixed / deferred-with-log-location / disputed-awaiting-human).
- The **test output** from step 4.
- The **final QA verdict** after any re-review.

## Hand-off — do not commit

With a passing final verdict (`PASS` / `PASS WITH RISKS`), proceed to documentation update and commit via `task-finish` (until migrated: `prompts/session-end.md`). **Do not commit in this skill.**

## Out of scope for this skill

The QA review procedure itself (`task-qa`), documentation updates / next-task prep / commit (`task-finish`), and any new feature work beyond fixing the findings (`task-implement`). Until the remaining skills are migrated, their behavior lives in the matching `prompts/*.md` templates.
