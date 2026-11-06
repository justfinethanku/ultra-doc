Team page: [The Fleet](https://linear.app/contentionmedia/document/the-fleet-team-page-dfdfca27f908)
Fleet rules: [Fleet Handbook](https://linear.app/contentionmedia/document/the-fleet-handbook-f3713ba1f434)
Operating procedures: [Operating system index](https://linear.app/contentionmedia/document/the-operating-system-index-of-rules-templates-and-sops-3766418ca97b)

# Ultra-Doc repository guidance

This file holds the repository guidance. The root and documentation-folder
`CLAUDE.md` files import it.

## Start with current behavior

Read the [README](README.md) for installation and a runnable local example,
then [operations](docs/operations.md) for action side effects, configuration,
validation results, and recovery. These describe the current Node workflows.
The older architecture, API, and workflow documents in `context_for_llms/`
contain historical descriptions; compare them with the implementation before
using them to change behavior.

Ultra-Doc maintains source Markdown and JSON overlays in `context_for_llms/`
and generated human overviews in `context_for_humans/`. The humanizer is a
deterministic Markdown transformation. Validation checks references and simple
example patterns; review factual claims against the source code.

## Find the implementation

- `index.js` launches the Node orchestrator in `skills/ultra-doc/scripts/`.
- `orchestrator.mjs` selects actions; `sync-doc-metadata.mjs` orders the sync stages.
- `project-fs.mjs` provides project file containment for the scripts.
- `commands/ultra-doc.md` and `skills/ultra-doc/SKILL.md` describe the Claude entrypoints.
- `skills/ultra-doc/templates/` contains templates for consumer projects.
- `reports/` and `changelog/` hold generated summaries and change records.

Use `context_for_llms/SECTIONS.json` for selected sections,
`context_for_llms/CODE_POINTERS.json` to locate source references, and
`context_for_llms/RELATIONSHIPS.json` for documentation relationships.
`context_for_llms/INDEX.md` and `context_for_llms/llms.txt` provide navigation.
These are generated artifacts and can lag source changes.

## Change and verify the plugin

Run the dependency-free CLI fixtures from this checkout:

```bash
npm test
```

There is no build step. Execute documentation automation in a disposable target
project using the README example: scripts use the current working directory as
the target and can modify source Markdown and generated files. Run `.mjs` files
with Node.js. A Claude slash command is entered inside Claude Code.

Keep command and skill documentation aligned with workflow changes. If hook
registration or behavior changes, update the README's
[automatic hooks section](README.md#automatic-hooks). The current hook boundary
and its implementation issue are documented there.

Keep the nested `CLAUDE.md` files as imports of this file. The humanizer copies
the heading-free machine import into its human counterpart; verify that route
when changing the humanizer. Consumer templates remain project templates rather
than copies of this repository's Fleet guidance.
