---
source_file: architecture.md
generated_at: 2025-11-19T08:09:20.103Z
translation_engine: ultra-doc-v2-humanizer
---

# Ultra-Doc Architecture – Human Overview

> This document explains how Ultra-Doc operates.

## Core Components

Command Surface (commands/ultra-doc.md, skills/ultra-doc/SKILL.md) Defines the /ultra-doc command, interactive prompts, and capability hints Claude relies on. Entry Point (index.js, skills/ultra-doc/scripts/orchestrator.mjs) Runs whenever /ultra-doc is invoked. Handles version checks, reads documentation state, and chooses the next workflow. Automation Scripts (skills/ultra-doc/scripts/.mjs) Deterministic jobs that cover sync, overlays, translation, validation, linting, and reporting. Artifacts (contextforllms/, contextforhumans/, changelog/, reports/) Machine docs, human translations, metadata overlays, changelog history, and shareable reports.

**Key files referenced:** `commands/ultra-doc.md`, `skills/ultra-doc/SKILL.md`, `index.js`, `skills/ultra-doc/scripts/orchestrator.mjs`, `skills/ultra-doc/scripts/*.mjs`

## Execution Flow

Command Invocation – /ultra-doc routes to index.js, which spawns node skills/ultra-doc/scripts/orchestrator.mjs. Version Gate – The orchestrator compares package.json / .claude-plugin/plugin.json with .ultra-doc.config.json. If the installed version is behind, it blocks automation and asks for a reinstall. State Gathering – Runs analyze-doc-state.mjs, optionally track-code-changes.mjs and validate-accuracy.mjs. The results populate contextforllms/DOCSTATE.json. Decision Tree – Chooses the next action: Execute sync-doc-metadata.mjs if metadata or translations are stale. Execute validate-accuracy.mjs if validation items exist but metadata is current. Skip to reporting if everything is healthy. Reporting – Regardless of action, generate-changelog.mjs and generate-report.mjs run so humans have the same visibility as Claude.

**Key files referenced:** `index.js`, `node skills/ultra-doc/scripts/orchestrator.mjs`, `package.json`, `.claude-plugin/plugin.json`, `.ultra-doc.config.json`, `analyze-doc-state.mjs`, `track-code-changes.mjs`, `validate-accuracy.mjs`, `context_for_llms/DOC_STATE.json`, `sync-doc-metadata.mjs`, `generate-changelog.mjs`, `generate-report.mjs`

## Automation Scripts

This section summarizes the underlying automation without extra context.

## Metadata Pipeline

update-timestamps.mjs – Adds/refreshes Last Updated headers on files detected via git. generate-section-index.mjs – Builds SECTIONS.json with token counts per section. generate-llm-index.mjs – Creates llms.txt plus INDEX.md. generate-code-pointers.mjs – Scans docs for inline file references and produces CODEPOINTERS.json in the format doc.md#Section → ["skills/..."]. render-relationships.mjs – Crawls imports in skills/ultra-doc/scripts/.mjs to map script dependencies inside RELATIONSHIPS.json. sync-doc-metadata.mjs – Wraps everything above, then triggers translation, parity enforcement, lint + autofix, changelog, and reporting.

**Key files referenced:** `update-timestamps.mjs`, `generate-section-index.mjs`, `SECTIONS.json`, `generate-llm-index.mjs`, `INDEX.md`, `generate-code-pointers.mjs`, `CODE_POINTERS.json`, `render-relationships.mjs`, `skills/ultra-doc/scripts/*.mjs`, `RELATIONSHIPS.json`, `sync-doc-metadata.mjs`

## Translation

generate-human-doc.mjs – Builds human-readable “Mike Dion” files from machine docs, adds context about why each section matters, and fails if parity drifts.

**Key files referenced:** `generate-human-doc.mjs`

## Validation & Reporting

track-code-changes.mjs – Looks at git history to determine which docs map to changed source files via CODEPOINTERS.json. validate-accuracy.mjs – Checks doc claims against linked source code and marks stale sections. generate-changelog.mjs – Appends touched docs to changelog/docs-YYYY-MM-DD.md. generate-report.mjs – Refreshes reports/ultra-doc-summary.md with doc counts, lint status, and the latest changelog excerpt.

**Key files referenced:** `track-code-changes.mjs`, `CODE_POINTERS.json`, `validate-accuracy.mjs`, `generate-changelog.mjs`, `changelog/docs-YYYY-MM-DD.md`, `generate-report.mjs`, `reports/ultra-doc-summary.md`

## Data Artifacts

SECTIONS.json – Section metadata for token-efficient streaming into Claude. CODEPOINTERS.json – Links documentation sections to source files with lastValidated timestamps. RELATIONSHIPS.json – Directed graph (nodes + edges) describing which scripts import which helpers. DOCSTATE.json – Completeness, staleness, and priority queue for every machine doc. LINTWARNINGS.md / AUTOFIXREPORT.json – Output from deterministic linting. reports/ultra-doc-summary.md – Metrics summary for humans. changelog/docs-YYYY-MM-DD.md – Append-only log of changed docs per run.

**Key files referenced:** `SECTIONS.json`, `CODE_POINTERS.json`, `RELATIONSHIPS.json`, `DOC_STATE.json`, `LINT_WARNINGS.md`, `AUTOFIX_REPORT.json`, `reports/ultra-doc-summary.md`, `changelog/docs-YYYY-MM-DD.md`

## Dual-Track Model

Machine docs in contextforllms/ are canonical and must always be lint-clean. Human docs in contextforhumans/ are regenerated from machine docs through generate-human-doc.mjs. sync-doc-metadata.mjs enforces parity; if a human doc is missing or older, the script fails with instructions to re-run /ultra-doc.

**Key files referenced:** `generate-human-doc.mjs`, `sync-doc-metadata.mjs`

## Deployment

Ultra-Doc is self-contained; it ships as part of this repo and runs locally inside Claude Code. Installation just copies files and writes .ultra-doc.config.json. Hooks listed in hooks.json keep the automation active (PreCommit, SessionStart, UserPromptSubmit, PostToolUse, Idle). There is no server component—everything is deterministic and auditable inside the repository.

**Key files referenced:** `.ultra-doc.config.json`, `hooks.json`
