# prompts/ — legacy prompt templates (historical reference)

This folder contains the prompt templates that drove the project's workflow before the migration to Claude Code Skills. **They are no longer the active workflow.**

The runtime workflow now lives in `.claude/skills/` — start sessions with `/task-start`, which routes through the `task-*` skill pipeline (plan → implement → self-check → qa → fix → finish). The migration mapping is recorded in `docs/claude-code-upgrade-plan.md`.

The folder is retained temporarily for reference and comparison against the migrated Skills. After sufficient validation of the Skill-based workflow, it may be archived or removed.

Do not follow these templates or link to them from workflow documents.
