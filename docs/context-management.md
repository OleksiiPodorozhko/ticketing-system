# Context Management

What a Claude Code session reads at start, updates at end, and where each kind of information lives. At runtime this reading is done by the `task-*` Skills (`.claude/skills/`), which load documentation selectively — by section or by ID, only when the task requires it. This document is the human-readable map behind that behavior, not a runtime instruction set. Companion: [agentic-workflow.md](agentic-workflow.md) (the Skill pipeline).

---

## 1. What to read at session start

Performed by `task-start` when a session begins. The principle: minimal context — orientation costs two files, everything else is pulled on demand.

**Always (cheap, ~2 files):**

1. `CLAUDE.md` — auto-loaded by Claude Code; do not re-read manually.
2. [current-task.md](current-task.md) — the active task: scope, criteria, commands, next step.
3. [project-state.md](project-state.md) — §1 (status snapshot) and §2 (next action) only. Read §4–§6 only when a decision or blocker is relevant to the task.

**On demand (only when the task needs it):**

- [implementation-plan.md](implementation-plan.md) — only the active slice's section, when planning the next task or checking sequencing.
- [architecture.md](architecture.md) — only when the task touches a stack/topology/API-contract decision or a Q-item resolution (§6).
- `docs/business-rules.md`, `docs/user-flows.md`, `docs/qa/test-checklist.md` — **by ID**: Grep for the BR/F/CHK IDs the task cites; don't read whole files.
- `requirements/*.pdf` — only when a derived doc is suspected wrong; docs are the working truth, the PDF is the arbiter.
- A specific **historical archive** file (`docs/tasks/`, `docs/qa/reviews/`, `docs/qa/runs/`) — only under the read conditions in §7 (explicit human request, or a specific referenced review/run/task).
- Source code — only files inside the task's allowed scope, plus their direct call sites when changing shared behavior.

**Never at session start:** the whole `docs/` tree, the whole `docs/qa/` tree, the historical archives (`docs/tasks/`, `docs/qa/reviews/`, `docs/qa/runs/` — intentionally excluded from normal runtime context; see §7), or a full-repo scan "to get oriented". [current-task.md](current-task.md) exists precisely so orientation costs two files.

## 2. What to update at session end

Performed by `task-finish` at close-out or when parking work.

- **[current-task.md](current-task.md)** — always. Either: (a) task completed → overwrite with the next task's block, or (b) task in flight → append a short "Progress / resume here" note (what's done, what's left, any surprise found). Never leave it describing finished work with no pointer forward.
- **[project-state.md](project-state.md)** — only when something changed at its altitude: a QA gate passed (§1 row + DoD scoreboard + §2 next action), a decision was made (§4), a blocker appeared/cleared (§5). Not for intra-task progress.
- **QA review record** — for every completed `qa-reviewer` review (task-scoped or full gate): the **full report** goes to a new file in `docs/qa/reviews/` (historical archive, immutable), and **one index row** is appended to [qa/qa-review-log.md](qa/qa-review-log.md) (date · task/scope · verdict · review file · open follow-ups). The log stays a lightweight navigation index — never paste a full report into it. Written by `task-qa` at review time; `task-finish` verifies.
- **`docs/tasks/task-<N>-<slug>.md`** — only when a completed task is being committed: the task archive (approved Task Start Brief and Implementation Plan, what was implemented, changed files, test/QA evidence summary, final summary, follow-ups; the QA result as verdict + **link to the `docs/qa/reviews/` file**, not a copy of the report), written *before* the commit so it lands in it; commit hash "pending" in the file, printed in the close-out summary. Historical reference only — excluded from normal runtime context; supplements, never replaces, the three documents above.
- **Commit or explicitly park.** Committed work per [agentic-workflow.md](agentic-workflow.md); uncommitted work-in-progress is acceptable only if current-task.md's resume note says exactly where it stands.

## 3. When to update CLAUDE.md — and when not

CLAUDE.md is the contract every future session obeys blindly. Keep it small and stable.

**Update it only when:**

- A new **non-negotiable constraint** is agreed (e.g., the requirements owner answers a Q-item in a way that changes a hard rule).
- **Build/test/run commands change** in a way every future session must know.
- An existing instruction is discovered to be **wrong or ambiguous enough to cause a mistake** — fix the instruction, minimally.

**Never update it for:** project status or progress (→ [project-state.md](project-state.md)), the active task (→ [current-task.md](current-task.md)), architecture rationale (→ [architecture.md](architecture.md)), decisions and their history (→ decision log), QA results (→ [qa/qa-review-log.md](qa/qa-review-log.md)), or anything that changes weekly. If in doubt, it goes in a `docs/` file, not CLAUDE.md. CLAUDE.md edits are worth flagging to the human reviewer in the commit message.

## 4. project-state.md vs current-task.md

Two different altitudes; don't blur them.

| | [project-state.md](project-state.md) | [current-task.md](current-task.md) |
|---|---|---|
| Altitude | Slice-level truth: where the project stands | One task: what to do right now |
| Content | Status table, DoD scoreboard, next action, decision log, blockers, risk watch | Goal, allowed/forbidden scope, acceptance criteria, commands, QA expectation, next step |
| Lifetime | Grows (append decisions, update rows) | Overwritten per task |
| Updated | At QA gates and decisions | Every task transition; resume notes mid-task |
| Read by | Sessions orienting; human reviewer | The implementing session, every session |

The chain: [implementation-plan.md](implementation-plan.md) says what all the tasks are → [current-task.md](current-task.md) says which one is live and its exact contract → [project-state.md](project-state.md) says what's already done and what was decided along the way.

## 5. Session-start checklist

Human reference — this is what `task-start` does:

```
[ ] Read docs/current-task.md — is there an active task with a resume note?
[ ] Read docs/project-state.md §1–2 — does it agree with current-task.md?
[ ]   If they disagree: reconcile first (state doc wins on status; task doc wins on scope).
[ ] git status / git log --oneline -3 — any uncommitted or unexpected work?
[ ] State (in one or two sentences) what this session will do, then start.
[ ] Pull additional docs ONLY as the task requires (see §1 above).
```

## 6. Session-end checklist

Human reference — this is what `task-finish` does:

```
[ ] Tests for touched behavior ran; output captured (or task explicitly parked).
[ ] QA review done if this session commits implementation work (see agentic-workflow.md).
[ ] docs/current-task.md: overwritten for next task OR resume note appended.
[ ] docs/project-state.md updated IF a gate passed / decision made / blocker changed.
[ ] docs/qa/reviews/ report written + qa-review-log.md index row appended IF a qa-reviewer review ran.
[ ] docs/tasks/ archive written IF a completed task is being committed (before the commit).
[ ] Commit made (with task number) or work explicitly parked in the resume note.
[ ] No stray files: scratch/temp output not left in the repo.
```

## 7. Document context categories

Every project document belongs to exactly one category, and the category dictates when Claude Code may read it. This is what keeps runtime context small and scalable even after dozens of completed tasks: active state stays small, reference docs are read selectively, history stays durable but out of the way.

### Runtime state

Small files that may be read during normal orchestration. They must **stay small** — anything with unbounded growth gets split out (see Historical archives).

- [current-task.md](current-task.md) — overwritten per task.
- [project-state.md](project-state.md) — slice-level snapshot; §4 decision log grows slowly (one row per decision) — monitor, archive old rows if it ever exceeds ~40.
- [qa/qa-review-log.md](qa/qa-review-log.md) — **lightweight navigation index only**: one row per QA review (date, task, verdict, review file, open follow-ups). Full reports never live here.

### Reference docs

Stable project knowledge. Read **selectively** — by section, by task ID, or by BR/F/CHK/DoD ID (Grep for the ID, read the surrounding lines). Never read a whole large reference document unless targeted lookup genuinely can't answer the question.

- [implementation-plan.md](implementation-plan.md) (active slice's section only) · [architecture.md](architecture.md) · [business-rules.md](business-rules.md) · [user-flows.md](user-flows.md) · [entities.md](entities.md) · [requirements-analysis.md](requirements-analysis.md) · [implementation-risks.md](implementation-risks.md)
- [qa/test-strategy.md](qa/test-strategy.md) · [qa/test-checklist.md](qa/test-checklist.md) · [qa/traceability-matrix.md](qa/traceability-matrix.md)
- `requirements/` (the PDF is the arbiter when a derived doc is suspected wrong)

### Historical archives

Durable history — **not part of normal runtime context**. No normal run of `task-start`, `task-plan`, `task-implement`, `task-self-check`, or `task-qa` reads these. Files here are immutable once written; corrections get a new file.

- `docs/tasks/` — per-task close-out archives (written by `task-finish`).
- `docs/qa/reviews/` — one file per completed QA review, the full reports (written by `task-qa`); navigated via the [qa/qa-review-log.md](qa/qa-review-log.md) index.
- `docs/qa/runs/` — dated manual checklist runs.

Read a historical file **only** when: the human explicitly asks for historical investigation; a specific task/review/run is referenced (e.g. by an index row or a carried follow-up); or the task requires comparing against a specific previous implementation. Even then, open the specific file — never sweep the directory.

### Generated / local / temporary artifacts

Not durable project memory; generally not committed. `.env*` files, local logs, Claude telemetry logs, scratch files, temporary outputs. These are gitignored or cleaned up (`task-finish`'s git-status sweep) unless one demonstrably has long-term engineering value — in which case it gets promoted into one of the categories above, deliberately.
