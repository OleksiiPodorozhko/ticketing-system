# Claude Code Upgrade Plan

Purpose: upgrade this repository from a Markdown-driven manual prompt workflow into a Claude Code-native, semi-automated delivery pipeline.

The goal is not to remove documentation. The goal is to separate responsibilities clearly:

* `docs/` stores project knowledge and project state.
* `.claude/skills/` stores reusable workflow procedures.
* `.claude/agents/` stores specialized reviewers and planners.
* `.claude/hooks/` stores deterministic guardrails.
* `prompts/` is legacy and will be migrated into Skills.

---

## 1. Current problem

The current workflow is mostly encoded in Markdown files and prompt templates.

This works, but it has several problems:

1. The human must remember which prompt to run and when.
2. Claude Code does not automatically execute most documents in `docs/`.
3. Important workflow rules depend on the model remembering instructions.
4. There is no single automated pipeline entrypoint.
5. Guardrails such as allowed scope, QA-before-commit, and dangerous command prevention are not enforced deterministically.

The current documentation is valuable, but much of the procedural logic should move into Claude Code-native mechanisms.

---

## 2. Target architecture

### 2.1 `docs/` — project knowledge and state

`docs/` should contain information about the product, requirements, architecture, planning, QA strategy, and current project state.

Examples:

* `requirements-analysis.md`
* `business-rules.md`
* `entities.md`
* `user-flows.md`
* `architecture.md`
* `implementation-risks.md`
* `implementation-plan.md`
* `current-task.md`
* `project-state.md`
* `qa/test-strategy.md`
* `qa/test-checklist.md`
* `qa/traceability-matrix.md`
* `qa/qa-review-log.md`

Claude Code should read these files selectively, based on the active task.

It should not read the whole `docs/` tree at the start of every session.

---

### 2.2 `.claude/skills/` — reusable workflow procedures

Skills should replace the current manual prompt templates.

Planned skills:

```text
.claude/skills/
  task-start/
    SKILL.md
  task-plan/
    SKILL.md
  task-implement/
    SKILL.md
  task-self-check/
    SKILL.md
  task-qa/
    SKILL.md
  task-fix/
    SKILL.md
  task-finish/
    SKILL.md
```

Main rule:

* The human should normally invoke only `/task-start`.
* Internal skills should remain modular and reusable.
* `/task-start` should orchestrate the workflow rather than contain all details itself.

---

### 2.3 `.claude/agents/` — specialized roles

Existing agents:

* `implementation-planner`
* `qa-reviewer`

Planned additional agents:

* `architecture-reviewer`
* `test-plan-writer`
* `documentation-updater`

Agents should be specialized and mostly read-only unless their role explicitly requires writing documentation.

Application code should still be written by the main Claude Code session, not by reviewer agents.

---

### 2.4 `.claude/hooks/` — deterministic guardrails

Hooks should enforce rules that must not depend on model memory.

Planned hooks:

1. `scope-guard`

   * Prevent editing files outside `docs/current-task.md` allowed files/areas.
   * Warn or block forbidden path edits.

2. `commit-guard`

   * Prevent `git commit` unless required self-check and QA evidence exists.
   * Allow docs-only commits when QA is not required.

3. `dangerous-command-guard`

   * Block destructive shell commands unless explicitly approved.
   * Examples: unsafe `rm -rf`, force push, deleting volumes outside approved QA flows.

4. Optional later:

   * stale-task guard
   * secrets scan guard
   * documentation-update reminder
   * QA-log consistency checker

---

## 3. File classification

### Keep as knowledge/state

These files remain in `docs/`:

```text
docs/requirements-analysis.md
docs/business-rules.md
docs/entities.md
docs/user-flows.md
docs/architecture.md
docs/implementation-risks.md
docs/implementation-plan.md
docs/project-state.md
docs/current-task.md
docs/qa/test-strategy.md
docs/qa/test-checklist.md
docs/qa/traceability-matrix.md
docs/qa/qa-review-log.md
```

### Convert mostly into Skills

These files currently describe workflow behavior and should be migrated:

```text
docs/agentic-workflow.md
docs/context-management.md
prompts/session-start.md
prompts/plan-next-task.md
prompts/implement-current-task.md
prompts/self-check.md
prompts/qa-review.md
prompts/fix-qa-findings.md
prompts/session-end.md
```

After migration, `agentic-workflow.md` and `context-management.md` may remain as short human-readable overviews, but the executable workflow should live in Skills and Hooks.

---

## 4. Target workflow

The desired high-level pipeline:

```text
/task-start
  -> read current task and project state
  -> detect whether task is fresh, stale, or in progress
  -> plan or reconcile task if needed
  -> ask for human approval before implementation
  -> implement within allowed scope
  -> run self-check
  -> invoke QA review when required
  -> fix Critical/Major findings
  -> update documentation
  -> prepare next task
  -> propose commit
```

The pipeline must preserve human control at important decision points:

* before implementation starts;
* when scope drift is detected;
* when architecture or requirements changes are proposed;
* before committing;
* before moving to the next task if the current state is ambiguous.

---

## 5. Skill migration map

| Current file                        | Target skill                                 |
| ----------------------------------- | -------------------------------------------- |
| `prompts/session-start.md`          | `task-start`                                 |
| `prompts/plan-next-task.md`         | `task-plan`                                  |
| `prompts/implement-current-task.md` | `task-implement`                             |
| `prompts/self-check.md`             | `task-self-check`                            |
| `prompts/qa-review.md`              | `task-qa`                                    |
| `prompts/fix-qa-findings.md`        | `task-fix`                                   |
| `prompts/session-end.md`            | `task-finish`                                |
| `docs/agentic-workflow.md`          | `task-start` orchestrator overview           |
| `docs/context-management.md`        | task-start/task-finish context rules + hooks |

---

## 6. Model strategy

Initial model guidance:

| Stage                         | Recommended model |
| ----------------------------- | ----------------- |
| Normal implementation         | Sonnet            |
| Complex architecture/planning | Fable             |
| Full slice QA gate            | Fable or Opus     |
| Task-scoped QA review         | Sonnet            |
| Simple documentation updates  | Haiku or Sonnet   |
| Complex QA finding recovery   | Fable or Opus     |
| Routine orchestration         | Sonnet            |
| High-risk orchestration       | Fable             |

Model choice should be documented as guidance, not hidden inside unclear workflow assumptions.

Where supported, subagents may define their preferred model explicitly.

---

## 7. Upgrade sequence

Implement the upgrade in small, reviewable steps.

### Step 1 — Add this upgrade plan

Create:

```text
docs/claude-code-upgrade-plan.md
```

No behavior changes yet.

---

### Step 2 — Refactor `CLAUDE.md`

Goal:

* keep only non-negotiable project rules;
* remove stale project status;
* add pointer to `/task-start`;
* clarify that `prompts/` is legacy until migrated.

---

### Step 3 — Create Skills structure

Create empty/skeletal skills:

```text
.claude/skills/task-start/SKILL.md
.claude/skills/task-plan/SKILL.md
.claude/skills/task-implement/SKILL.md
.claude/skills/task-self-check/SKILL.md
.claude/skills/task-qa/SKILL.md
.claude/skills/task-fix/SKILL.md
.claude/skills/task-finish/SKILL.md
```

---

### Step 4 — Migrate prompt templates into Skills

Move the behavior from `prompts/*.md` into the matching Skills.

Keep behavior equivalent first.

Do not introduce too many changes at once.

---

### Step 5 — Implement `/task-start` orchestration

`task-start` becomes the main entrypoint.

It should:

1. load minimal context;
2. detect the current workflow state;
3. call or apply the appropriate next skill;
4. stop for human approval at required checkpoints;
5. continue through QA/fix/finish when appropriate.

---

### Step 6 — Add or improve Subagents

Add:

```text
.claude/agents/architecture-reviewer.md
.claude/agents/test-plan-writer.md
.claude/agents/documentation-updater.md
```

Review and update:

```text
.claude/agents/implementation-planner.md
.claude/agents/qa-reviewer.md
```

---

### Step 7 — Add Hooks

Start with:

```text
scope-guard
dangerous-command-guard
commit-guard
```

Hooks should enforce deterministic safety boundaries without replacing human judgment.

---

### Step 8 — Archive or deprecate `prompts/`

After Skills are verified:

* either delete `prompts/`;
* or move it to `prompts/archive/`;
* or leave a README saying the files are deprecated and replaced by Skills.

---

### Step 9 — Dry run on current task

Run the upgraded pipeline against:

```text
Task 0.1 — Backend & frontend scaffolding
```

Success criteria:

1. `/task-start` finds the task.
2. It reads only minimal context.
3. It asks for approval before implementation.
4. It respects allowed and forbidden scope.
5. It runs self-check.
6. It invokes QA if required.
7. It prepares the next task.
8. It proposes a commit with evidence.

---

## 8. Non-goals

This upgrade should not:

* rewrite the application requirements;
* change the selected stack;
* remove QA discipline;
* make Claude Code fully autonomous without human approvals;
* collapse all behavior into one huge unmaintainable master prompt;
* force all documents to be read every session;
* bypass tests or QA gates to speed up implementation.

---

## 9. Success criteria

The upgrade is successful when:

1. The human normally starts work with one command: `/task-start`.
2. Claude Code knows how to continue from current project state.
3. Claude Code reads documentation selectively.
4. Task implementation stays inside explicit scope.
5. QA and self-check happen consistently before commit.
6. Project documentation is updated at the right time.
7. The next task is prepared automatically.
8. Hooks enforce critical safety rules.
9. Subagents provide focused review instead of bloating the main context.
10. The workflow feels like a delivery pipeline, not a pile of copy-pasted prompts.
