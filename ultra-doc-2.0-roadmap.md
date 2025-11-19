# Ultra-Doc 2.0 Roadmap

## Executive Summary

Ultra-Doc 2.0 expands the “self-healing” documentation idea into a dual-track system: machine-perfect docs that optimize AI context usage and human-readable translations that stay in lockstep. The release also adds automatic syncing (timestamps, code pointers, changelog), richer warning surfacing, and built-in version awareness—all still orchestrated from a single `/ultra-doc` command. The goal is to let Claude maintain documentation end-to-end with minimal prompts, while humans and AI both trust the same source of truth.

## Current System Review

### Key Observations
1. **Template-driven structure is solid.** Docs in `context_for_llms/` consistently follow `_TEMPLATE.md`, so Claude sees predictable sections (`## Overview`, `## Key Concepts`, etc.). The existing linter enforces these anchors, reducing hallucinations.
2. **JSON overlays enable token savings.** Metadata files (`TIMESTAMPS.json`, `SECTIONS.json`, `CODE_POINTERS.json`, `RELATIONSHIPS.json`) act like machine-readable “lenses,” letting Ultra-Doc stream only relevant slices of docs and cutting prompt size by 60‑90%.
3. **Anti-pattern checks work but require follow-through.** The linter catches TODOs, placeholder text, tabs, missing headings, and absent code blocks. Recent runs found one blocking error (`backend-database-schema.md` missing `## File Structure`) and 19 warnings, showing the guardrails are effective yet still rely on human cleanup.
4. **Warnings are hard to notice.** Console output only shows pass/fail, while warnings hide in `context_for_llms/LINT_REPORT.json`, so contributors often miss them.
5. **Metadata freshness is manual.** `TIMESTAMPS.json` and `CODE_POINTERS.json` stay accurate only when humans run extra scripts; otherwise drift creeps in and erodes trust.

### Immediate Suggestions (Deployable Anywhere)
1. **Self-healing section headings.** Extend `autofix-linting.mjs` to detect near-miss headings (e.g., `**File Structure:**`, `### File Structure`) and auto-convert them to the canonical `## File Structure` before linting fails.
2. **Surface warnings where users look.** After linting, print a digest of top warnings (file + reason) to stdout and optionally `lint.log`, plus drop a Markdown summary (`context_for_llms/LINT_WARNINGS.md`) so Claude can cite them directly.
3. **Auto-sync metadata before linting.** Combine `track-code-changes.mjs`, `update-timestamps.mjs`, and the section/pointer generation scripts into a `sync-doc-metadata` step that updates only the files touched in the current diff.

### Recommended Implementation Steps
1. **Normalize headings in `autofix-linting.mjs`.** Scan for regex patterns like `^\*\*([A-Za-z ]+):\*\*$` or `^###\s+(.*File Structure.*)$`, rewrite to the proper `##` header, and log a short message (“Auto-added ## File Structure to backend-database-schema.md”).
2. **Emit warning digests from `lint-documentation.mjs`.** After collecting results, print up to five actionable warnings (e.g., `⚠️ deployment-checklist.md: Found TODO/FIXME comments (line 19)`) and save them to a Markdown summary for Claude to quote.
3. **Introduce `sync-doc-metadata.mjs`.** Before linting, detect changed files via `git diff --name-only HEAD`, refresh timestamps, sections, and code pointers for those files, then run the linter so metadata never lags behind edits.

### Command Model & Update Strategy
- **Single slash command stays.** `/ultra-doc` remains the only entry point; the decision tree decides which sub-flow to run so non-technical users never juggle extra commands.
- **Built-in upgrade reminder.** Starting in v1.1.0 and beyond, the decision tree should run a lightweight version check and offer “Update Ultra-Doc before continuing?” so everyone benefits from the latest automation without manual steps.

## Feature List

### Feature: Dual Documentation Folders (`context_for_llms` + `context_for_humans`)
- **Why it matters:** Machine-friendly docs need rigid formatting, dense metadata, and token efficiency. Human readers need narrative, examples, and screenshots. Separating the two lets you optimize each audience without diluting the other, while still keeping them synchronized.
- **Implementation suggestions:**  
  1. Treat `context_for_llms` as the canonical source: lint it, regenerate overlays, and enforce strict templates.  
  2. For every machine doc, create a mirrored file in `context_for_humans`. Maintain a mapping (shared filename or JSON manifest) so scripts can pair them automatically.  
  3. When the machine doc changes, invoke a “translate for humans” script (Claude prompt template) that rewrites the content with friendlier language, additional context, and optional visuals.  
  4. Enforce parity via lint checks: missing human counterpart, mismatched timestamps, or outdated translations should fail or warn clearly.

### Feature: Automated Translation Pipeline
- **Why it matters:** Without automation, human-facing docs drift behind the machine versions. A deterministic translation pipeline ensures every machine update creates a corresponding human-readable update, keeping support and stakeholders informed.
- **Implementation suggestions:**  
  1. Add a script (e.g., `scripts/generate-human-doc.mjs`) that reads the machine doc, applies a prompt template, and writes the result to `context_for_humans`.  
  2. Include metadata (source file, timestamp, Claude model used) at the top of the human doc for auditing.  
  3. Run the translator whenever git diff shows a machine doc change. If the translation fails, raise a blocking warning so the user fixes it before finishing the run.

### Feature: Cross-Folder Lint & Freshness Sync
- **Why it matters:** Keeping two folders synchronized is only valuable if automation guarantees they stay aligned. Freshness mismatches erode trust and reintroduce “context rot.”
- **Implementation suggestions:**  
  1. Extend `lint-documentation.mjs` (or add a companion script) to iterate through both folders and compare: existence, `**Last Updated:**` values, section counts, and key metadata.  
  2. When a machine doc passes lint but lacks a human twin, emit an error; when both exist but timestamps differ, auto-run `update-timestamps.mjs` for the human doc and regenerate if necessary.  
  3. Summarize sync issues in the terminal output so users see them immediately.

### Feature: Integrated Changelog Workflow
- **Why it matters:** Your current repo-level changelog process gives historical context and makes it obvious when docs changed. Folding that into Ultra-Doc ensures every documentation update is logged automatically, giving humans a digest and helping AIs cite the latest change.
- **Implementation suggestions:**  
  1. After a successful lint/translation cycle, write a changelog entry (e.g., `changelog/docs-YYYY-MM-DD.md`) describing which machine and human files changed and why.  
  2. Include links or references to commit hashes, affected sections, and whether the change was prompted by code edits, lint auto-fix, or translation sync.  
  3. Let the decision tree surface “View latest doc changelog” as an option so users can read updates directly inside Claude Code.

### Feature: Metadata & Pointer Auto-Sync
- **Why it matters:** `TIMESTAMPS.json`, `SECTIONS.json`, `CODE_POINTERS.json`, and `RELATIONSHIPS.json` power the token savings claim. Manually updating them is error-prone; automation keeps them trustworthy.
- **Implementation suggestions:**  
  1. Create a `sync-doc-metadata.mjs` helper that inspects `git diff --name-only` and refreshes only the files that changed.  
  2. Chain existing scripts (`update-timestamps.mjs`, `generate-section-index.mjs`, `generate-llm-index.mjs`, `render-relationships.mjs`) so they run incrementally within `/ultra-doc`.  
  3. If metadata generation fails, stop the run with a clear message so stale pointers never ship.

### Feature: Warning & Error Surfacing
- **Why it matters:** Currently warnings hide in `LINT_REPORT.json`. Users miss them, so TODOs, missing props sections, or tab characters linger. Visible warnings keep the system clean and reduce future errors.
- **Implementation suggestions:**  
  1. Enhance lint output with a “Top warnings” digest printed to the terminal and saved to a Markdown summary (`context_for_llms/LINT_WARNINGS.md`).  
  2. Include file path, line reference, and actionable text (e.g., “deployment-checklist.md: TODO references inside content”).  
  3. Have Claude cite this digest in its chat summary so users know what to fix.

### Feature: Built-in Version Awareness & Update Prompt
- **Why it matters:** Users should always benefit from the latest automation. Without reminders, they stay on older plugin builds and miss fixes. Version prompts keep installations healthy without introducing extra commands.
- **Implementation suggestions:**  
  1. At the start of `/ultra-doc`, check the plugin’s current version against the repo’s latest tag (GitHub, local manifest, or embedded VERSION file).  
  2. If an update is available, prompt: “Ultra-Doc v2.0.0 is available (current: v1.1.0). Update now before continuing?”  
  3. If the user agrees, run the reinstall/update flow, then resume the decision tree automatically.

### Feature: Decision-Tree Enhancements
- **Why it matters:** The single-command philosophy relies on a smart decision tree. As capabilities grow (translation, changelog, metadata sync), the tree needs better heuristics so users aren’t overwhelmed.
- **Implementation suggestions:**  
  1. Detect repo state upfront (e.g., files changed, lint failures, pending translations) and highlight the most relevant actions first.  
  2. Allow “quick actions” for common tasks (“Just lint both folders,” “Only regenerate human docs”).  
  3. Persist lightweight state (maybe a `.ultra-doc/state.json`) so rerunning `/ultra-doc` within the same session resumes pending tasks instead of re-asking questions.  
  4. When Claude needs user input, trigger the `askquestion` tool (per `Claude-Code-Best-Practices.md`) so choices are presented via structured prompts rather than ad-hoc text. This keeps interactions consistent and accessible.

### Feature: Human-Friendly Reporting Pack
- **Why it matters:** Stakeholders often need a shareable summary (what changed, which docs are stale, token savings achieved). Generating this package automatically saves time and keeps communication consistent.
- **Implementation suggestions:**  
  1. After each run, produce a Markdown summary (e.g., `reports/ultra-doc-summary.md`) covering key metrics: number of docs updated, warnings resolved, translation sync status, last changelog entries.  
  2. Provide a command-tree option to open or export that summary so users can paste it into Slack, emails, or tickets.  
  3. Optionally include token usage estimates before/after the run to reinforce the value proposition.

### Feature: Hook-Driven Automation Suite
- **Why it matters:** Claude Code hooks let the plugin react at the right moments—before commits, on session start, or when users go idle—without adding more commands. This reinforces the single-entry-point philosophy while making automation proactive.
- **Implementation suggestions:**  
  1. **PreCommit hooks:** Register a hook that runs `/ultra-doc` (in quick mode) whenever Claude prepares to stage/commit code. This ensures linting, translations, metadata updates, and changelog entries happen before any push.  
  2. **SessionStart hook:** Print recent doc changelog entries or pending warnings into Claude’s context at session launch so users see doc health instantly.  
  3. **UserPromptSubmit guard:** When prompts mention “deploy,” “ship,” or “release,” either auto-run `/ultra-doc` or remind the user to do so first.  
  4. **PostToolUse watcher:** Detect manual edits in `context_for_llms` and automatically queue `/ultra-doc` so human changes don’t bypass automation.  
  5. **Idle notification hook:** On idle prompts, gently nudge users with “Need to sync docs? Run /ultra-doc.” All hooks live in the plugin’s `hooks.json`, keeping configuration automatic upon install/update.

### Feature: Feature Suggestion Backlog (Future Ideas)
- **Why it matters:** Capturing new automation ideas in the same roadmap document keeps innovation visible and prevents ad hoc experiments from diluting the core philosophy.
- **Implementation suggestions:**  
  1. Maintain a section (like this one) where new feature concepts can be logged with a brief rationale.  
  2. When one graduates into active development, promote it to the main list with detailed implementation notes.

Potential future ideas:
- **Doc-specific testing hooks:** Let docs declare validation scripts (e.g., run `npm test docs:auth` whenever `auth-*` docs change).  
- **AI accuracy regression checks:** Compare doc statements against live API responses or schema definitions to catch factual drift automatically.  
- **Interactive human-doc review mode:** Offer a “read-only tour” where Claude walks a user through the human docs that changed since their last visit.

---

This roadmap keeps the single-command, automation-first ethos intact while making Ultra-Doc far more powerful for both AI agents and human collaborators. Use it as the checklist for designing, prioritizing, and validating 2.0 work.
