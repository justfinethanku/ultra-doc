Last Updated: 2025-11-19

# Ultra-Doc Command & Script Reference

## Slash Command

- **Command:** `/ultra-doc`
- **Source:** `commands/ultra-doc.md`
- **Skill Manifest:** `skills/ultra-doc/SKILL.md`

Running the command launches `index.js`, which spawns `skills/ultra-doc/scripts/orchestrator.mjs`. The orchestrator:

1. Checks installation/version by reading `.ultra-doc.config.json`.
2. Runs `analyze-doc-state.mjs` (and, when needed, `track-code-changes.mjs` + `validate-accuracy.mjs`).
3. Chooses the optimal workflow (sync, validation, or reporting).
4. Prints findings plus the next steps for the user.

## Decision Tree & Presets

- By default the orchestrator analyzes repo health, then either auto-runs the necessary fixes (when stale docs are detected) or prompts the user to choose an action.
- Hooks or CI flows can set `ULTRA_DOC_AUTO_ACTION` to skip the prompt.

| `ULTRA_DOC_AUTO_ACTION` | Behavior |
| --- | --- |
| _(unset)_ | Interactive menu (full sync recommended when issues exist). |
| `sync` | Run `sync-doc-metadata.mjs` end-to-end (metadata → translation → lint → reporting). |
| `quick` | Run timestamps + autofix + lint only. |
| `validate` | Run `track-code-changes.mjs` + `validate-accuracy.mjs`. |
| `summary` | Regenerate `reports/ultra-doc-summary.md` and print its path. |

Full sync automatically runs `track-code-changes.mjs`, `sync-doc-metadata.mjs`, and `validate-accuracy.mjs` in that order so overlays, timestamps, and validations stay current without extra commands.

## Automation Scripts

### Core
- **`orchestrator.mjs`** – Implements the decision tree and version check.
- **`sync-doc-metadata.mjs`** – Full pipeline wrapper (timestamps, overlays, translation, parity enforcement, lint, changelog, report).

### Generators (Overlays & Graphs)
- **`generate-section-index.mjs`** – Creates `SECTIONS.json`.
- **`generate-llm-index.mjs`** – Updates `llms.txt` + `context_for_llms/INDEX.md`.
- **`generate-code-pointers.mjs`** – Produces `CODE_POINTERS.json` with `doc.md#Section` → `["skills/..."]`.
- **`render-relationships.mjs`** – Maps script imports into `RELATIONSHIPS.json`.

### Content & Reporting
- **`generate-human-doc.mjs`** – Builds human-readable “Mike Dion” docs and enforces parity.
- **`generate-changelog.mjs`** – Writes daily entries in `changelog/docs-YYYY-MM-DD.md`.
- **`generate-report.mjs`** – Refreshes `reports/ultra-doc-summary.md`.

### Analysis & Validation
- **`analyze-doc-state.mjs`** – Generates `DOC_STATE.json` (freshness, completeness, priorities).
- **`track-code-changes.mjs`** – Inspects git history for files referenced in docs.
- **`validate-accuracy.mjs`** – Compares doc claims to real code via `CODE_POINTERS.json`.
- **`analyze-coverage.mjs`** – Locates undocumented source files.

### Utilities
- **`update-timestamps.mjs`** – Refreshes `Last Updated` headers.
- **`autofix-linting.mjs`** + **`lint-documentation.mjs`** – Fix/flag template issues and produce `LINT_WARNINGS.md`.
- **`check-external-links.mjs`** – Optional URL validation.

## Configuration & State Files

| File | Description |
| --- | --- |
| `.ultra-doc.config.json` | Installation answers + installed version. |
| `context_for_llms/SECTIONS.json` | Section metadata for token-efficient fetching. |
| `context_for_llms/CODE_POINTERS.json` | Maps doc sections to source files for validation. |
| `context_for_llms/RELATIONSHIPS.json` | Script dependency graph. |
| `context_for_llms/DOC_STATE.json` | Health metrics, stale flags, and priorities. |
| `context_for_llms/LINT_WARNINGS.md` | Top lint/validation warnings for Claude to cite. |
| `reports/ultra-doc-summary.md` | Human-readable status summary. |
| `changelog/docs-YYYY-MM-DD.md` | Append-only log of documentation changes. |

## Error Handling

- Scripts exit with non-zero codes on failure. The orchestrator captures errors and prints remediation steps.
- `generate-human-doc.mjs` throws if a human doc is missing or older than its machine counterpart.
- `sync-doc-metadata.mjs` halts immediately if parity or linting fails, preserving context so the user can inspect `LINT_WARNINGS.md` and rerun `/ultra-doc`.
