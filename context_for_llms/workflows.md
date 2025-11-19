Last Updated: 2025-11-19

# Ultra-Doc Workflows

## Synchronization Pipeline (`/ultra-doc` full sync)

0. **Staleness Scan**
   - `track-code-changes.mjs` inspects git history + CODE_POINTERS to flag docs that drifted and updates `DOC_STATE.json`.
1. **Change Detection**
   - Uses `git diff --name-only HEAD` to find modified docs inside `context_for_llms/`.
2. **Timestamp Refresh**
   - Runs `update-timestamps.mjs` only on touched files so linting can compare accurate dates.
3. **Overlay Generation**
   - `generate-section-index.mjs` → `SECTIONS.json`
   - `generate-llm-index.mjs` → `llms.txt` + `INDEX.md`
   - `generate-code-pointers.mjs` → `CODE_POINTERS.json`
   - `render-relationships.mjs` → `RELATIONSHIPS.json`
4. **Translation & Parity**
   - `generate-human-doc.mjs` rewrites human docs and enforces parity (the script throws if a human doc is missing or older).
5. **Parity Verification**
   - `sync-doc-metadata.mjs` double-checks that every machine doc (excluding `INDEX.md`) has an up-to-date human twin.
6. **Lint & Autofix**
   - `autofix-linting.mjs` cleans predictable issues.
   - `lint-documentation.mjs` prints the top warnings and saves the digest to `LINT_WARNINGS.md`.
7. **Reporting**
   - `generate-changelog.mjs` records modified docs in `changelog/docs-YYYY-MM-DD.md`.
   - `generate-report.mjs` refreshes `reports/ultra-doc-summary.md`.
8. **Accuracy Validation**
   - `validate-accuracy.mjs` compares documentation claims to the referenced code paths and fails fast when mismatches remain (`context_for_llms/VALIDATION.json` captures the findings).

## Translation Workflow (`generate-human-doc.mjs`)

1. **Prompt Construction**
   - Reads machine doc content.
   - Assembles a deterministic prompt that explains tone, structure, and audience.
2. **Humanization**
   - Sections are summarized into conversational paragraphs.
   - Key files (inline code references) are surfaced as callouts.
3. **Output Controls**
   - Adds YAML front matter (source file, timestamp, translation engine).
   - Ensures text materially differs from the machine doc.
4. **Logging**
   - Writes the prompt into `skills/logs/prompt-<filename>.txt` for auditing.

## Validation Workflow

1. **Narrow Path Discovery**
   - `CODE_POINTERS.json` links `doc.md#Section` to actual source files (e.g., `skills/ultra-doc/scripts/sync-doc-metadata.mjs`).
2. **Code Change Detection**
   - `track-code-changes.mjs` reads git history to see if linked files changed after a doc was last updated.
3. **Accuracy Check**
   - `validate-accuracy.mjs` compares doc claims with actual code snippets.
   - Emits entries in `VALIDATION.json` when mismatches are found.
4. **Priorities**
   - `analyze-doc-state.mjs` marks affected docs with `validationNeeded: true`, ensuring the orchestrator recommends fixes first.

## Reporting & Visibility

| Artifact | Generator | Purpose |
| --- | --- | --- |
| `context_for_llms/LINT_WARNINGS.md` | `lint-documentation.mjs` | Machine-readable digest of issues for Claude/AI workflows. |
| `changelog/docs-YYYY-MM-DD.md` | `generate-changelog.mjs` | Human-friendly log of which docs changed and when. |
| `reports/ultra-doc-summary.md` | `generate-report.mjs` | Shareable summary (doc counts, lint status, latest changelog link). |

## Hooks-Initiated Runs

| Hook | Trigger | Command |
| --- | --- | --- |
| `PreCommit` | Before Claude stages or commits files. | `ULTRA_DOC_AUTO_ACTION=quick /ultra-doc` |
| `SessionStart` | User opens the repo in Claude Code. | Prints latest changelog entry. |
| `UserPromptSubmit` (`deploy|ship|release`) | High-risk prompts. | `ULTRA_DOC_AUTO_ACTION=quick /ultra-doc` |
| `PostToolUse` (`write_to_file` touching `context_for_llms`) | Manual doc edits. | `ULTRA_DOC_AUTO_ACTION=sync /ultra-doc` |
| `Idle` | User idle while docs pending. | `ULTRA_DOC_AUTO_ACTION=summary /ultra-doc` |

Hooks ensure that even if the human forgets to run `/ultra-doc`, automation still keeps docs aligned.
