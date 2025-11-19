---
source_file: api-overview.md
generated_at: 2025-11-19T08:09:20.103Z
translation_engine: ultra-doc-v2-humanizer
---

# Ultra-Doc Command & Script Reference – Human Overview

> This document explains how Ultra-Doc operates.

## Slash Command

Command: /ultra-doc Source: commands/ultra-doc.md Skill Manifest: skills/ultra-doc/SKILL.md Running the command launches index.js, which spawns skills/ultra-doc/scripts/orchestrator.mjs. The orchestrator: Checks installation/version by reading .ultra-doc.config.json. Runs analyze-doc-state.mjs (and, when needed, track-code-changes.mjs + validate-accuracy.mjs). Chooses the optimal workflow (sync, validation, or reporting). Prints findings plus the next steps for the user.

**Key files referenced:** `commands/ultra-doc.md`, `skills/ultra-doc/SKILL.md`, `index.js`, `skills/ultra-doc/scripts/orchestrator.mjs`, `.ultra-doc.config.json`, `analyze-doc-state.mjs`, `track-code-changes.mjs`, `validate-accuracy.mjs`

## Decision Tree & Presets

By default the orchestrator analyzes repo health, then either auto-runs the necessary fixes (when stale docs are detected) or prompts the user to choose an action. Hooks or CI flows can set ULTRADOCAUTOACTION to skip the prompt. | ULTRADOCAUTOACTION | Behavior | | | | | (unset) | Interactive menu (full sync recommended when issues exist). | | sync | Run sync-doc-metadata.mjs end-to-end (metadata → translation → lint → reporting). | | quick | Run timestamps + autofix + lint only. | | validate | Run track-code-changes.mjs + validate-accuracy.mjs. | | summary | Regenerate reports/ultra-doc-summary.md and print its path. | Full sync automatically runs track-code-changes.mjs, sync-doc-metadata.mjs, and validate-accuracy.mjs in that order so overlays, timestamps, and validations stay current without extra commands.

**Key files referenced:** `sync-doc-metadata.mjs`, `track-code-changes.mjs`, `validate-accuracy.mjs`, `reports/ultra-doc-summary.md`

## Automation Scripts

This section summarizes the underlying automation without extra context.

## Core

orchestrator.mjs – Implements the decision tree and version check. sync-doc-metadata.mjs – Full pipeline wrapper (timestamps, overlays, translation, parity enforcement, lint, changelog, report).

**Key files referenced:** `orchestrator.mjs`, `sync-doc-metadata.mjs`

## Generators (Overlays & Graphs)

generate-section-index.mjs – Creates SECTIONS.json. generate-llm-index.mjs – Updates llms.txt + contextforllms/INDEX.md. generate-code-pointers.mjs – Produces CODEPOINTERS.json with doc.md#Section → ["skills/..."]. render-relationships.mjs – Maps script imports into RELATIONSHIPS.json.

**Key files referenced:** `generate-section-index.mjs`, `SECTIONS.json`, `generate-llm-index.mjs`, `context_for_llms/INDEX.md`, `generate-code-pointers.mjs`, `CODE_POINTERS.json`, `render-relationships.mjs`, `RELATIONSHIPS.json`

## Content & Reporting

generate-human-doc.mjs – Builds human-readable “Mike Dion” docs and enforces parity. generate-changelog.mjs – Writes daily entries in changelog/docs-YYYY-MM-DD.md. generate-report.mjs – Refreshes reports/ultra-doc-summary.md.

**Key files referenced:** `generate-human-doc.mjs`, `generate-changelog.mjs`, `changelog/docs-YYYY-MM-DD.md`, `generate-report.mjs`, `reports/ultra-doc-summary.md`

## Analysis & Validation

analyze-doc-state.mjs – Generates DOCSTATE.json (freshness, completeness, priorities). track-code-changes.mjs – Inspects git history for files referenced in docs. validate-accuracy.mjs – Compares doc claims to real code via CODEPOINTERS.json. analyze-coverage.mjs – Locates undocumented source files.

**Key files referenced:** `analyze-doc-state.mjs`, `DOC_STATE.json`, `track-code-changes.mjs`, `validate-accuracy.mjs`, `CODE_POINTERS.json`, `analyze-coverage.mjs`

## Utilities

update-timestamps.mjs – Refreshes Last Updated headers. autofix-linting.mjs + lint-documentation.mjs – Fix/flag template issues and produce LINTWARNINGS.md. check-external-links.mjs – Optional URL validation.

**Key files referenced:** `update-timestamps.mjs`, `autofix-linting.mjs`, `lint-documentation.mjs`, `LINT_WARNINGS.md`, `check-external-links.mjs`

## Configuration & State Files

| File | Description | | | | | .ultra-doc.config.json | Installation answers + installed version. | | contextforllms/SECTIONS.json | Section metadata for token-efficient fetching. | | contextforllms/CODEPOINTERS.json | Maps doc sections to source files for validation. | | contextforllms/RELATIONSHIPS.json | Script dependency graph. | | contextforllms/DOCSTATE.json | Health metrics, stale flags, and priorities. | | contextforllms/LINTWARNINGS.md | Top lint/validation warnings for Claude to cite. | | reports/ultra-doc-summary.md | Human-readable status summary. | | changelog/docs-YYYY-MM-DD.md | Append-only log of documentation changes. |

**Key files referenced:** `.ultra-doc.config.json`, `context_for_llms/SECTIONS.json`, `context_for_llms/CODE_POINTERS.json`, `context_for_llms/RELATIONSHIPS.json`, `context_for_llms/DOC_STATE.json`, `context_for_llms/LINT_WARNINGS.md`, `reports/ultra-doc-summary.md`, `changelog/docs-YYYY-MM-DD.md`

## Error Handling

Scripts exit with non-zero codes on failure. The orchestrator captures errors and prints remediation steps. generate-human-doc.mjs throws if a human doc is missing or older than its machine counterpart. sync-doc-metadata.mjs halts immediately if parity or linting fails, preserving context so the user can inspect LINTWARNINGS.md and rerun /ultra-doc.

**Key files referenced:** `generate-human-doc.mjs`, `sync-doc-metadata.mjs`, `LINT_WARNINGS.md`
