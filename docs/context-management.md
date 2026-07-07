# Context Management

What a Claude Code session reads at start, updates at end, and where each kind of information lives. Companion: [agentic-workflow.md](agentic-workflow.md) (the execution loop).

---

## 1. What to read at session start

**Always (cheap, ~2 files):**

1. `CLAUDE.md` — auto-loaded by Claude Code; do not re-read manually.
2. [current-task.md](current-task.md) — the active task: scope, criteria, commands, next step.
3. [project-state.md](project-state.md) — §1 (status snapshot) and §2 (next action) only. Read §4–§6 only when a decision or blocker is relevant to the task.

**On demand (only when the task needs it):**

- [implementation-plan.md](implementation-plan.md) — only the active slice's section, when planning the next task or checking sequencing.
- [architecture.md](architecture.md) — only when the task touches a stack/topology/API-contract decision or a Q-item resolution (§6).
- `docs/business-rules.md`, `docs/user-flows.md`, `docs/qa/test-checklist.md` — **by ID**: Grep for the BR/F/CHK IDs the task cites; don't read whole files.
- `requirements/*.pdf` — only when a derived doc is suspected wrong; docs are the working truth, the PDF is the arbiter.
- Source code — only files inside the task's allowed scope, plus their direct call sites when changing shared behavior.

**Never at session start:** the whole `docs/` tree, the whole `docs/qa/` tree, or a full-repo scan "to get oriented". [current-task.md](current-task.md) exists precisely so orientation costs two files.

## 2. What to update at session end

- **[current-task.md](current-task.md)** — always. Either: (a) task completed → overwrite with the next task's block, or (b) task in flight → append a short "Progress / resume here" note (what's done, what's left, any surprise found). Never leave it describing finished work with no pointer forward.
- **[project-state.md](project-state.md)** — only when something changed at its altitude: a QA gate passed (§1 row + DoD scoreboard + §2 next action), a decision was made (§4), a blocker appeared/cleared (§5). Not for intra-task progress.
- **[qa/qa-review-log.md](qa/qa-review-log.md)** — append-only, at full QA gates and behavior-affecting reviews. Written per the gate protocol, not as a session ritual.
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

```
[ ] Read docs/current-task.md — is there an active task with a resume note?
[ ] Read docs/project-state.md §1–2 — does it agree with current-task.md?
[ ]   If they disagree: reconcile first (state doc wins on status; task doc wins on scope).
[ ] git status / git log --oneline -3 — any uncommitted or unexpected work?
[ ] State (in one or two sentences) what this session will do, then start.
[ ] Pull additional docs ONLY as the task requires (see §1 above).
```

## 6. Session-end checklist

```
[ ] Tests for touched behavior ran; output captured (or task explicitly parked).
[ ] QA review done if this session commits implementation work (see agentic-workflow.md).
[ ] docs/current-task.md: overwritten for next task OR resume note appended.
[ ] docs/project-state.md updated IF a gate passed / decision made / blocker changed.
[ ] docs/qa/qa-review-log.md appended IF a full gate ran.
[ ] Commit made (with task number) or work explicitly parked in the resume note.
[ ] No stray files: scratch/temp output not left in the repo.
```
