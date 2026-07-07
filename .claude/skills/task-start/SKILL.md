# task-start

**Purpose:** Main pipeline entrypoint. Loads minimal context, detects the current workflow state (fresh, stale, or in-progress task), and orchestrates the other task-* skills with human approval at required checkpoints.

**Status:** draft

**Migrates from:** `prompts/session-start.md` (plus the orchestrator overview from `docs/agentic-workflow.md`)

> Do not use as active workflow until Step 5 orchestration is complete.
