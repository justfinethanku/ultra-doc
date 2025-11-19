Last Updated: 2025-11-19

# Ultra-Doc 2.0 – CLAUDE Guide

## Overview

Ultra-Doc is a Claude Code plugin that keeps documentation and code in sync with **one `/ultra-doc` command**. The repo bundles:

- A public command description (`commands/ultra-doc.md`) so users can install the skill.
- Automation scripts inside `skills/ultra-doc/scripts/` that handle analysis, linting, translation, metadata generation, and validation.
- Machine-facing docs in `context_for_llms/` (this folder) with JSON overlays for token-efficient retrieval.
- Human translations in `context_for_humans/` so people can read the same information without digging through rigid templates.

When someone runs `/ultra-doc`, Claude shells into `index.js` and launches `skills/ultra-doc/scripts/orchestrator.mjs`.
From there the orchestrator picks the next workflow (sync, translation, validation, or reporting).

## Directory Map

### Repo Root
- `commands/` – Describes the slash command surface.
- `context_for_llms/` – Machine-perfect docs + overlays (`SECTIONS.json`, `CODE_POINTERS.json`, `RELATIONSHIPS.json`, `DOC_STATE.json`).
- `context_for_humans/` – Generated “Mike Dion” docs for humans.
- `skills/ultra-doc/` – Skill manifest, reference, and automation scripts.
- `reports/` – Human-friendly summaries; `reports/ultra-doc-summary.md` is regenerated after each run.
- `changelog/` – Daily doc-change files created by `generate-changelog.mjs`.
- `.ultra-doc.config.json` – Installer answers plus the currently installed version.

### Key Scripts (`skills/ultra-doc/scripts/`)
- `sync-doc-metadata.mjs` – Primary pipeline: timestamps → overlays → translation → parity check → lint → changelog → report.
- `generate-human-doc.mjs` – Converts machine docs into narrative form using deterministic prompt templates (and enforces parity).
- `generate-code-pointers.mjs` – Builds `CODE_POINTERS.json` by scanning docs for file references.
- `render-relationships.mjs` – Creates a dependency graph of automation scripts for AIs.
- `analyze-doc-state.mjs`, `track-code-changes.mjs`, `validate-accuracy.mjs` – Consume overlays and flag stale or inaccurate docs.
- `orchestrator.mjs` – Implements the decision tree that chooses which workflow to run when `/ultra-doc` starts.

## Running `/ultra-doc`

1. **Entry Point** – `index.js` simply spawns `node skills/ultra-doc/scripts/orchestrator.mjs`.
2. **Version Check** – The orchestrator compares `package.json` / `.claude-plugin/plugin.json` versions against `.ultra-doc.config.json`.
   If the config lags, it prints a reminder to reinstall before automation runs.
3. **State Collection** – Runs `analyze-doc-state.mjs` so DOC_STATE.json and the priorities list reflect current code + docs.
4. **Decision Tree** – Based on the state:
   - If docs are stale/misaligned → Ultra-Doc auto-runs the full remediation chain (`track-code-changes.mjs` → `sync-doc-metadata.mjs` → `validate-accuracy.mjs`) before showing new health metrics.
   - If only validations are pending → run the validation workflow only.
   - If everything is healthy → skip straight to reporting or whatever action the user selects.
5. **Reporting** – Every successful run ends with `generate-changelog.mjs` and `generate-report.mjs`, so humans and AIs get the same health snapshot.

## Automation Stack

- **Metadata** – `update-timestamps.mjs`, `generate-section-index.mjs`, `generate-llm-index.mjs`
  Keeps Markdown headings and overlay data aligned.
- **Pointers & Graphs** – `generate-code-pointers.mjs`, `render-relationships.mjs`
  Maps documentation claims back to actual source files and shows script dependencies.
- **Translation** – `generate-human-doc.mjs`
  Converts machine docs into human narratives and enforces parity.
- **Linting & Autofix** – `autofix-linting.mjs`, `lint-documentation.mjs`
  Clears formatting issues and summarizes warnings in `context_for_llms/LINT_WARNINGS.md`.
- **Validation** – `track-code-changes.mjs`, `validate-accuracy.mjs`
  Marks docs for updates when code moves.
- **Reporting** – `generate-changelog.mjs`, `generate-report.mjs`
  Produces `changelog/docs-YYYY-MM-DD.md` and `reports/ultra-doc-summary.md`.

## Hook Behavior

`hooks.json` wires Ultra-Doc into Claude Code’s lifecycle. Hooks now set `ULTRA_DOC_AUTO_ACTION` so a single `/ultra-doc` command can run in non-interactive mode:

- **PreCommit** – `ULTRA_DOC_AUTO_ACTION=quick /ultra-doc` so no one commits stale docs.
- **SessionStart** – Prints the most recent `changelog/docs-*.md` entry into Claude’s context.
- **UserPromptSubmit (deploy/ship/release)** – `ULTRA_DOC_AUTO_ACTION=quick /ultra-doc` before risky operations.
- **PostToolUse (write_to_file)** – `ULTRA_DOC_AUTO_ACTION=sync /ultra-doc` when someone edits `context_for_llms`.
- **Idle** – `ULTRA_DOC_AUTO_ACTION=summary /ultra-doc` if the repo sits idle with pending work.

Update the README section **“Automated Hooks”** if you change this file so humans know what will fire unexpectedly.

## Troubleshooting

1. **Docs missing or out of sync** – Run `/ultra-doc` (or `ULTRA_DOC_AUTO_ACTION=sync /ultra-doc`) to rebuild overlays, regenerate human docs, and re-run linting in one go.
2. **Parity errors** – `generate-human-doc.mjs` now fails when a machine doc is newer than its human twin. Re-run `/ultra-doc` to regenerate translations.
3. **Missing file references** – The linter now flags inline references (like `` `skills/ultra-doc/scripts/generate-report.mjs` ``) that point to non-existent paths. If you see this warning, either fix the reference or create the missing file.
4. **Validation noise** – Inspect `context_for_llms/DOC_STATE.json` and `context_for_llms/LINT_WARNINGS.md` for root causes.
5. **Version drift** – If `.ultra-doc.config.json` shows an older version than `package.json`, rerun the installer via `/ultra-doc install`.
Keep this document up to date; Claude reads it first before touching anything else in the repo.
