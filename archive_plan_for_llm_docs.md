---
**ARCHIVED**: This was the v0 design doc for the original /llm-docs concept.
Current implementation: /ultra-doc - see skills/ultra-doc/SKILL.md
---

# Plan: LLM Documentation System Builder – Claude Code Skill + Slash Command

**Created:** 2025-11-15
**Purpose:** Provide a simple, implementation-ready plan for a Claude Code skill and single slash command that installs and runs an LLM-optimized documentation system in any repo with minimal questions and maximum automation.

---

## 1. Goal and Principles

**Primary Goal:**  
From inside Claude Code, a user runs a single slash command (for example `/llm-docs`), and Claude:
- Detects whether the LLM documentation system is already installed.
- If not installed, asks a few focused questions, installs, and configures everything.
- If installed, runs the documentation pipeline to refresh all artifacts.

**Design Principles:**
- Single entrypoint: one skill, one slash command.
- Claude does the work; user does not have to run shell commands manually.
- Minimal questions (max 3), with smart defaults.
- No extra dashboards, registries, plugins, or enforcement engines in v1.
- Zero “code generation” for core logic: scripts and templates are pre-written; Claude only copies, configures, and runs them.

---

## 2. Existing System (What We’re Packaging)

We already have a working, LLM-optimized documentation system in this repo. At a high level:

**Documentation Artifacts (in `context_for_llms/`):**
- `CLAUDE.md` – main guide and entrypoint for LLMs and humans.
- `llms.txt` – navigation entrypoint for AI tools.
- `INDEX.md` – file inventory and quick reference.
- JSON overlays:
  - `SECTIONS.json` – token-optimized sections for selective fetching.
  - `CODE_POINTERS.json` – mappings from docs to source files.
  - `RELATIONSHIPS.json` – dependency/relationship information.

**Automation Scripts (in `scripts/` today):**
- `generate-section-index.mjs`
- `add-code-pointers.mjs`
- `update-timestamps.mjs`
- `render-relationships.mjs`
- `generate-llm-index.mjs`
- `lint-documentation.mjs`
- `check-external-links.mjs`
- `optimize-for-llms.sh` – orchestrator that runs the full pipeline.

This plan focuses on packaging a minimal, stable subset of these into a Claude Code skill that can be applied to any repository.

---

### 2.1 Tool-Neutral Design

Although Claude Code is responsible for installing and running the system via the skill, **all artifacts created in the repository must be usable by any LLM or AI assistant**.

Guidelines:
- Treat `llms.txt` as the **universal AI onboarding file**:
  - It should explain where an AI assistant should start (`CLAUDE.md`, `INDEX.md`) and how to use the JSON overlays.
  - It should speak to “your AI assistant” or “any LLM-based tool,” not just Claude.
- `CLAUDE.md` should:
  - Introduce the project and documentation layout for both humans and AI assistants.
  - Explicitly tell any AI assistant to:
    - Read `CLAUDE.md` first.
    - Use `llms.txt` and `INDEX.md` for navigation.
    - Prefer `SECTIONS.json`, `CODE_POINTERS.json`, and `RELATIONSHIPS.json` when fetching context instead of arbitrary file scanning.
- JSON overlays (`SECTIONS.json`, `CODE_POINTERS.json`, `RELATIONSHIPS.json`) must be:
  - Self-describing (clear keys and structure).
  - Documented briefly in `CLAUDE.md` or a small schema section so any LLM can infer how to consume them.
- Keep all Claude-specific behavior and instructions in `.claude/skills/llm-docs-builder/SKILL.md`:
  - The repository documentation itself should avoid assuming Claude; it should be framed for “any AI coding assistant.”

This ensures Claude Code can set everything up automatically, while any other LLM can immediately onboard using the same documentation and overlays.

---

## 3. Target Behavior Inside Claude Code

### 3.1 Single Slash Command

We assume a single command, conceptually:

```text
/llm-docs
```

The exact name can change later, but the behavior is:
- User runs `/llm-docs` once.
- Claude follows a fixed decision tree (below) to either:
  - Install and configure the system, then run the pipeline, or
  - Just run the pipeline if already installed.

### 3.2 Decision Tree (Core Logic)

Claude’s high-level logic when `/llm-docs` is invoked:

```pseudo
on /llm-docs:
  if llm_docs_system_is_installed():
    run_docs_pipeline()
    report_status()
  else:
    answers = ask_installation_questions()   # max 3 questions
    install_docs_system(answers)
    run_docs_pipeline()
    report_status()
```

**Installation detection (`llm_docs_system_is_installed`)**:
- Consider the system “installed” if both exist:
  - `context_for_llms/SECTIONS.json`
  - `.llm-docs.config.json`

If either is missing, treat as “not installed” and run the first-time setup path.

---

## 4. Question Flow (Maximum 3 Questions)

The wizard should ask **at most 3 questions** on first-time setup. All have sensible defaults so Claude can proceed quickly.

### Question 1: Setup Level (Required)

> “What level of LLM documentation do you want?”

Options:
- **Minimal** – Just `CLAUDE.md` and basic structure.
- **Standard** – `CLAUDE.md` + core context docs + JSON overlays.
- **Comprehensive** – Full system with all overlays and scripts.

Default: **Standard**

### Question 2: Audience Balance (Optional)

> “Who is the primary audience for your documentation?”

Options:
- **Balanced** – Equal weight: humans, AI assistants, future maintainers.
- **Human-first**
- **AI-first**
- **Maintainer-first**

Default: **Balanced**

If the user is unsure, Claude should pick **Balanced** automatically.

### Question 3: CI Integration (Optional)

> “Add a basic docs validation step to your CI? (yes/no)”

Options:
- **Yes** – Add a simple CI job that runs the docs pipeline or a validation script.
- **No** – Skip CI wiring for now.

Default: **No**

If the project has no obvious CI system, Claude should default to **No**.

---

## 5. What the Skill Creates in the User Repo

When `/llm-docs` is run on a repo that has not yet been set up, Claude should:

1. **Create a config file**
   - `.llm-docs.config.json` with:
     - `setup_level` (minimal/standard/comprehensive)
     - `audience` (balanced/human-first/ai-first/maintainer-first)
     - `ci_integration` (true/false)

2. **Create or update `CLAUDE.md`**
   - Use a template based on the chosen setup level.
   - Include:
     - Project overview.
     - How to navigate docs.
     - How LLMs should use `context_for_llms/` and JSON overlays.

3. **Create `context_for_llms/` structure**

   At minimum:
   - `context_for_llms/llms.txt` – navigation entrypoint for AI tools.
   - `context_for_llms/INDEX.md` – inventory of context files.

   For **Standard/Comprehensive**, also create starter docs (names can be adjusted later, but conceptually):
   - `context_for_llms/architecture.md`
   - `context_for_llms/domains-and-modules.md`
   - `context_for_llms/api-overview.md`
   - `context_for_llms/development-workflows.md`

4. **Create JSON overlays (initial versions)**

   - `context_for_llms/SECTIONS.json` – generated from markdown docs.
   - `context_for_llms/CODE_POINTERS.json` – maps docs to source files (initially may be partial).
   - `context_for_llms/RELATIONSHIPS.json` – dependency/relationship graph (initially simple).

5. **Create automation scripts**

   Place them in a dedicated subdirectory, for example:

   ```
   scripts/llm-docs/
   ├── optimize-for-llms.sh
   ├── generate-section-index.mjs
   ├── add-code-pointers.mjs
   ├── update-timestamps.mjs
   ├── render-relationships.mjs
   ├── generate-llm-index.mjs
   ├── lint-documentation.mjs
   └── check-external-links.mjs
   ```

   These scripts are **not** written by Claude; they are pre-defined in the skill package and copied into the user’s repo.

6. **Wire up basic npm scripts (optional but helpful)**

   If `package.json` exists, Claude can add:

   ```json
   {
     "scripts": {
       "docs:generate": "bash scripts/llm-docs/optimize-for-llms.sh"
     }
   }
   ```

   This is optional; it simply gives humans a convenience command. Claude can still call the bash script directly.

---

## 6. Documentation Pipeline (What `run_docs_pipeline` Does)

The documentation pipeline is a simple, linear sequence of steps. In v1, we keep this as straightforward as possible.

### Orchestrator Script (Conceptual Behavior)

File: `scripts/llm-docs/optimize-for-llms.sh`

Behavior (simplified):

```bash
#!/bin/bash
set -euo pipefail

echo "🔍 Validating documentation setup..."

node scripts/llm-docs/update-timestamps.mjs
node scripts/llm-docs/generate-section-index.mjs
node scripts/llm-docs/add-code-pointers.mjs
node scripts/llm-docs/render-relationships.mjs
node scripts/llm-docs/generate-llm-index.mjs
node scripts/llm-docs/lint-documentation.mjs
node scripts/llm-docs/check-external-links.mjs

echo "✨ Documentation optimization complete."
```

Claude will:
- Ensure the orchestrator script is present and executable.
- Run it in the repo root after installation, and on subsequent `/llm-docs` invocations.

---

## 7. Skill Package Structure (Inside `.claude/skills/`)

The skill package itself lives in the user’s repo and provides Claude with:
- Clear instructions (`SKILL.md`).
- Templates to copy.
- Scripts to copy.

Suggested structure:

```text
.claude/skills/llm-docs-builder/
├── SKILL.md
├── templates/
│   ├── CLAUDE_minimal.md
│   ├── CLAUDE_standard.md
│   ├── CLAUDE_comprehensive.md
│   └── context-templates/
│       ├── architecture.md
│       ├── domains-and-modules.md
│       ├── api-overview.md
│       └── development-workflows.md
└── scripts/
    ├── optimize-for-llms.sh
    ├── generate-section-index.mjs
    ├── add-code-pointers.mjs
    ├── update-timestamps.mjs
    ├── render-relationships.mjs
    ├── generate-llm-index.mjs
    ├── lint-documentation.mjs
    └── check-external-links.mjs
```

**SKILL.md** responsibilities:
- Describe when to trigger this skill (e.g., when user mentions documentation, CLAUDE.md, context_for_llms, or runs `/llm-docs`).
- Describe the decision tree in section 3.
- Explain how to:
  - Check for installation (presence of `context_for_llms/SECTIONS.json` and `.llm-docs.config.json`).
  - Ask the 3 questions.
  - Copy templates and scripts from `.claude/skills/llm-docs-builder/` into the user repo.
  - Run `scripts/llm-docs/optimize-for-llms.sh`.
- Instruct Claude to prefer using `SECTIONS.json`, `CODE_POINTERS.json`, and `RELATIONSHIPS.json` when it needs context in future coding sessions.

---

## 8. Error Handling (Minimal, Practical)

We keep error handling simple and focused:

**Pre-flight checks (within the orchestrator or scripts):**
- Confirm the repo is writable.
- Confirm Node.js is available (for `.mjs` scripts).

**On failure:**
- The script prints a clear error message.
- Claude reports which step failed (e.g., “generate-section-index failed”).
- If git is present, Claude may suggest:
  - `git restore` or `git checkout` for specific files if something looks broken.

No dashboards, enforcement levels, caching, or advanced recovery logic in v1.

---

## 9. Implementation Phases (Focused, Short)

These phases are about building the skill package itself in **this** repo. They are intentionally small and concrete.

### Phase 1: Extract and Stabilize Scripts (1 day)
- Move/duplicate the existing working scripts into `scripts/llm-docs/` with the names listed above.
- Confirm they run correctly against this repo using the orchestrator.

### Phase 2: Create Templates (1 day)
- Write `templates/CLAUDE_minimal.md`, `CLAUDE_standard.md`, `CLAUDE_comprehensive.md`.
- Write a small set of core context templates in `templates/context-templates/`.

### Phase 3: Write SKILL.md (1 day)
- Encode the decision tree and question flow from this plan into `SKILL.md`.
- Document exactly how Claude should:
  - Detect installation.
  - Ask questions.
  - Copy templates/scripts.
  - Run the pipeline.

### Phase 4: Test in a Fresh Repo (1 day)
- Create a new test repo with minimal code.
- Manually simulate what Claude would do:
  - Copy `.claude/skills/llm-docs-builder/` into it.
  - Pretend to run `/llm-docs` by following SKILL.md instructions.
- Adjust anything confusing or fragile.

---

## 10. What This Gives Us

With this plan implemented:
- A single `/llm-docs` command in Claude Code:
  - Installs the documentation system on first run with at most 3 questions.
  - Refreshes all documentation and overlays on subsequent runs.
- Documentation becomes a reliable **source of truth**:
  - JSON overlays keep token usage efficient.
  - Scripts maintain freshness and link validity.
- Claude Code gets **amazing context** automatically:
  - It knows to rely on `CLAUDE.md`, `SECTIONS.json`, `CODE_POINTERS.json`, and `RELATIONSHIPS.json` when working on the project.

This keeps v1 strictly focused, easy to build, and ready to extend later without distracting roadmap complexity.
