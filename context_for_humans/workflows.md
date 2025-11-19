---
source_file: workflows.md
generated_at: 2025-11-19T08:09:20.104Z
translation_engine: ultra-doc-v2-humanizer
---

# Ultra-Doc Workflows – Human Overview

> This document explains how Ultra-Doc operates.

## Synchronization Pipeline (`/ultra-doc` full sync)

Staleness Scan track-code-changes.mjs inspects git history + CODEPOINTERS to flag docs that drifted and updates DOCSTATE.json. Change Detection Uses git diff --name-only HEAD to find modified docs inside contextforllms/. Timestamp Refresh Runs update-timestamps.mjs only on touched files so linting can compare accurate dates. Overlay Generation generate-section-index.mjs → SECTIONS.json generate-llm-index.mjs → llms.txt + INDEX.md generate-code-pointers.mjs → CODEPOINTERS.json render-relationships.mjs → RELATIONSHIPS.json Translation & Parity generate-human-doc.mjs rewrites human docs and enforces parity (the script throws if a human doc is missing or older). Parity Verification sync-doc-metadata.mjs double-checks that every machine doc (excluding INDEX.md) has an up-to-date human twin. Lint & Autofix autofix-linting.mjs cleans predictable issues. lint-documentation.mjs prints the top warnings and saves the digest to LINTWARNINGS.md. Reporting generate-changelog.mjs records modified docs in changelog/docs-YYYY-MM-DD.md. generate-report.mjs refreshes reports/ultra-doc-summary.md. Accuracy Validation validate-accuracy.mjs compares documentation claims to the referenced code paths and fails fast when mismatches remain (contextforllms/VALIDATION.json captures the findings).

**Key files referenced:** `track-code-changes.mjs`, `DOC_STATE.json`, `update-timestamps.mjs`, `generate-section-index.mjs`, `SECTIONS.json`, `generate-llm-index.mjs`, `INDEX.md`, `generate-code-pointers.mjs`, `CODE_POINTERS.json`, `render-relationships.mjs`, `RELATIONSHIPS.json`, `generate-human-doc.mjs`, `sync-doc-metadata.mjs`, `autofix-linting.mjs`, `lint-documentation.mjs`, `LINT_WARNINGS.md`, `generate-changelog.mjs`, `changelog/docs-YYYY-MM-DD.md`, `generate-report.mjs`, `reports/ultra-doc-summary.md`, `validate-accuracy.mjs`, `context_for_llms/VALIDATION.json`

## Translation Workflow (`generate-human-doc.mjs`)

Prompt Construction Reads machine doc content. Assembles a deterministic prompt that explains tone, structure, and audience. Humanization Sections are summarized into conversational paragraphs. Key files (inline code references) are surfaced as callouts. Output Controls Adds YAML front matter (source file, timestamp, translation engine). Ensures text materially differs from the machine doc. Logging Writes the prompt into skills/logs/prompt-<filename>.txt for auditing.

## Validation Workflow

Narrow Path Discovery CODEPOINTERS.json links doc.md#Section to actual source files (e.g., skills/ultra-doc/scripts/sync-doc-metadata.mjs). Code Change Detection track-code-changes.mjs reads git history to see if linked files changed after a doc was last updated. Accuracy Check validate-accuracy.mjs compares doc claims with actual code snippets. Emits entries in VALIDATION.json when mismatches are found. Priorities analyze-doc-state.mjs marks affected docs with validationNeeded: true, ensuring the orchestrator recommends fixes first.

**Key files referenced:** `CODE_POINTERS.json`, `skills/ultra-doc/scripts/sync-doc-metadata.mjs`, `track-code-changes.mjs`, `validate-accuracy.mjs`, `VALIDATION.json`, `analyze-doc-state.mjs`

## Reporting & Visibility

| Artifact | Generator | Purpose | | | | | | contextforllms/LINTWARNINGS.md | lint-documentation.mjs | Machine-readable digest of issues for Claude/AI workflows. | | changelog/docs-YYYY-MM-DD.md | generate-changelog.mjs | Human-friendly log of which docs changed and when. | | reports/ultra-doc-summary.md | generate-report.mjs | Shareable summary (doc counts, lint status, latest changelog link). |

**Key files referenced:** `context_for_llms/LINT_WARNINGS.md`, `lint-documentation.mjs`, `changelog/docs-YYYY-MM-DD.md`, `generate-changelog.mjs`, `reports/ultra-doc-summary.md`, `generate-report.mjs`

## Hooks-Initiated Runs

| Hook | Trigger | Command | | | | | | PreCommit | Before Claude stages or commits files. | ULTRADOCAUTOACTION=quick /ultra-doc | | SessionStart | User opens the repo in Claude Code. | Prints latest changelog entry. | | UserPromptSubmit (deploy|ship|release) | High-risk prompts. | ULTRADOCAUTOACTION=quick /ultra-doc | | PostToolUse (writetofile touching contextforllms) | Manual doc edits. | ULTRADOCAUTOACTION=sync /ultra-doc | | Idle | User idle while docs pending. | ULTRADOCAUTOACTION=summary /ultra-doc | Hooks ensure that even if the human forgets to run /ultra-doc, automation still keeps docs aligned.
