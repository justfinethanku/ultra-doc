---
name: llm-docs-builder
description: Install and maintain an LLM-optimized documentation system with JSON overlays (SECTIONS.json, CODE_POINTERS.json, RELATIONSHIPS.json) for token-efficient context. Use when user mentions documentation, CLAUDE.md, context_for_llms, llms.txt, or runs /llm-docs command.
---

# LLM Documentation System Builder

This skill enables you to install and maintain a comprehensive, LLM-optimized documentation system in any repository with minimal user interaction.

## When to Use This Skill

Activate this skill when:
- User runs `/llm-docs` command
- User mentions setting up documentation for AI assistants
- User asks about CLAUDE.md, context_for_llms, or llms.txt
- User wants to optimize documentation for LLMs or AI tools
- User mentions documentation JSON overlays or SECTIONS.json

## Core Decision Tree

When the skill is triggered, follow this exact decision tree:

```
on /llm-docs or related request:
  if system_is_installed():
    run_docs_pipeline()
    report_status()
  else:
    answers = ask_installation_questions()   # max 3 questions
    install_docs_system(answers)
    run_docs_pipeline()
    report_status()
```

## Installation Detection

The system is considered "installed" if BOTH of these files exist:
- `context_for_llms/SECTIONS.json`
- `.llm-docs.config.json`

If either file is missing, proceed with first-time installation.

## Installation Questions

Ask these questions during first-time setup. Keep it simple and use defaults when user is unsure.

### Question 1: Setup Level (Required)

"What level of LLM documentation do you want?"

Options:
- **Minimal** - Just CLAUDE.md and basic structure
- **Standard** (DEFAULT) - CLAUDE.md + core context docs + JSON overlays
- **Comprehensive** - Full system with all overlays and scripts

If user is unsure, use **Standard**.

### Question 2: Audience Balance (Optional)

"Who is the primary audience for your documentation?"

Options:
- **Balanced** (DEFAULT) - Equal weight: humans, AI assistants, future maintainers
- **Human-first** - Optimized for human readers
- **AI-first** - Optimized for AI assistants
- **Maintainer-first** - Optimized for long-term maintenance

If user is unsure or doesn't care, use **Balanced**.

### Question 3: CI Integration (Optional)

"Add a basic docs validation step to your CI? (yes/no)"

Options:
- **No** (DEFAULT) - Skip CI wiring for now
- **Yes** - Add simple CI job for docs validation

If the project has no obvious CI system (no .github/workflows, .gitlab-ci.yml, etc.), default to **No**.

## Installation Process

After collecting answers, create these files and directories:

### Step 1: Create Configuration File

Create `.llm-docs.config.json` at repo root:

```json
{
  "setup_level": "minimal|standard|comprehensive",
  "audience": "balanced|human-first|ai-first|maintainer-first",
  "ci_integration": true|false,
  "installed_at": "ISO timestamp",
  "version": "1.0.0"
}
```

### Step 2: Create Directory Structure

```bash
mkdir -p context_for_llms
mkdir -p scripts/llm-docs
```

### Step 3: Copy Scripts

Copy ALL scripts from `.claude/skills/llm-docs-builder/scripts/` to `scripts/llm-docs/`:

- `optimize-for-llms.sh` (orchestrator)
- `generate-section-index.mjs`
- `add-code-pointers.mjs`
- `update-timestamps.mjs`
- `render-relationships.mjs`
- `generate-llm-index.mjs`
- `lint-documentation.mjs`
- `check-external-links.mjs`

Make the orchestrator executable:
```bash
chmod +x scripts/llm-docs/optimize-for-llms.sh
```

### Step 4: Create CLAUDE.md

Based on setup_level, copy the appropriate template to the repo root:

- **Minimal**: Use `templates/CLAUDE_minimal.md`
- **Standard**: Use `templates/CLAUDE_standard.md`
- **Comprehensive**: Use `templates/CLAUDE_comprehensive.md`

Replace all placeholders ({{VARIABLE}}) with appropriate values:
- Ask user for critical info (project name, description)
- Use sensible defaults or infer from repo for optional fields
- Keep it simple - don't ask for every placeholder

**Key Placeholders to Replace**:
- `{{DATE}}` - Current date (YYYY-MM-DD)
- `{{PROJECT_NAME}}` - Repo name or ask user
- `{{PROJECT_DESCRIPTION}}` - Brief description (ask user or use README)
- `{{REPO_URL}}` - Git remote URL (infer from .git/config)
- `{{LANGUAGE}}` - Primary language (infer from files)

For Standard/Comprehensive levels, you can leave some placeholders for user to fill in later.

### Step 5: Create Context Documentation

For **Standard** and **Comprehensive** levels only, copy context templates from `templates/context-templates/` to `context_for_llms/`:

- `architecture.md`
- `domains-and-modules.md`
- `api-overview.md`
- `development-workflows.md`

Add a note at the top of each file:
```markdown
> **Note**: This is a template. Fill in the {{PLACEHOLDERS}} with your project-specific information.
```

### Step 6: Wire Up Package Scripts (Optional)

If `package.json` exists, add this script:

```json
{
  "scripts": {
    "docs:generate": "bash scripts/llm-docs/optimize-for-llms.sh"
  }
}
```

This is optional - the orchestrator can be run directly.

### Step 7: Add to .gitignore (Optional)

Consider adding to .gitignore:
```
# LLM docs (optional - usually you want these committed)
# context_for_llms/*.json
```

Actually, DON'T add these to .gitignore by default. The JSON overlays should be committed so team members benefit from them.

## Running the Documentation Pipeline

Whether installing for the first time or refreshing an existing installation, run the pipeline:

```bash
bash scripts/llm-docs/optimize-for-llms.sh
```

This script will:
1. Update timestamps in markdown files
2. Generate SECTIONS.json from content
3. Add code pointers mapping docs → source
4. Render relationships and dependency graph
5. Generate llms.txt and INDEX.md
6. Lint documentation for quality
7. Check external links

### What Gets Generated

After running the pipeline, these files will be created/updated in `context_for_llms/`:

- **SECTIONS.json** - Token-optimized content sections with metadata
- **CODE_POINTERS.json** - Mappings from documentation to source files
- **RELATIONSHIPS.json** - Project dependencies and relationship graph
- **llms.txt** - AI assistant navigation guide
- **INDEX.md** - File inventory with statistics

## Post-Installation Guidance

After successful installation, tell the user:

1. **Review CLAUDE.md** - Fill in any remaining {{PLACEHOLDERS}}
2. **Customize context docs** - Edit files in `context_for_llms/` with project-specific information
3. **Run the pipeline** - Use `npm run docs:generate` or `bash scripts/llm-docs/optimize-for-llms.sh`
4. **Commit everything** - Add all generated files to git so team benefits
5. **Use JSON overlays** - Reference SECTIONS.json, CODE_POINTERS.json in future conversations

## Using the Documentation System

### For Future Conversations

When working on this project in future sessions, you should:

1. **Read CLAUDE.md first** - Get project overview and context
2. **Use SECTIONS.json for efficiency** - Query specific sections instead of reading entire files
3. **Check CODE_POINTERS.json** - Find relevant source files for any documentation topic
4. **Reference RELATIONSHIPS.json** - Understand dependencies and relationships
5. **Navigate with INDEX.md** - Quick file reference and statistics

### Token Optimization

**Always prefer SECTIONS.json over reading entire markdown files**:
- Query specific sections by heading or file
- Estimate token usage before reading
- Only read full files when necessary

Example approach:
```
1. Check SECTIONS.json for relevant sections
2. Read only the needed sections
3. Use CODE_POINTERS.json to find source files
4. Read source files as needed
```

### Progressive Disclosure

The documentation system uses progressive disclosure:
- CLAUDE.md provides overview and navigation
- SECTIONS.json enables selective content fetching
- CODE_POINTERS.json maps topics to implementation
- Full markdown files available when needed

## Tool-Neutral Design

IMPORTANT: All documentation created must be usable by ANY AI assistant, not just Claude.

**Guidelines**:
- `llms.txt` speaks to "your AI assistant" or "AI tools" generically
- CLAUDE.md explains usage for "AI assistants" in general
- JSON overlays are self-describing and tool-agnostic
- Only THIS skill file (SKILL.md) contains Claude-specific instructions

**What goes where**:
- **SKILL.md** (this file) - Claude Code-specific behavior
- **CLAUDE.md** - Generic AI assistant guidance
- **llms.txt** - Universal AI tool navigation
- **JSON overlays** - Tool-agnostic structured data

## Error Handling

### Pre-flight Checks

Before running the pipeline:
1. Verify repo is writable
2. Confirm Node.js is available (for .mjs scripts)
3. Check that context_for_llms directory exists

### Common Issues

**Node.js not found**:
- Error: "node: command not found"
- Solution: Inform user Node.js is required, ask if they want to install it or skip scripts

**Permission denied**:
- Error: "Permission denied" when running scripts
- Solution: Run `chmod +x scripts/llm-docs/*.sh`

**Script failures**:
- If any script fails, report which step failed
- Continue with remaining steps if possible
- Provide clear error message to user

### Recovery

If installation is partially complete:
- Check what files exist
- Complete missing steps
- Don't duplicate existing files

## Maintenance and Updates

### Refreshing Documentation

To refresh all documentation:
```bash
bash scripts/llm-docs/optimize-for-llms.sh
```

Run this:
- After significant code changes
- Before important commits/releases
- When documentation content is updated
- Weekly/monthly for active projects

### Updating Templates

If user wants to upgrade (minimal → standard → comprehensive):
1. Update `.llm-docs.config.json`
2. Copy additional templates
3. Run pipeline
4. Inform user of new files

## Validation Workflow

The pipeline includes automatic validation:

1. **Lint documentation** - Check structure, links, format
2. **Check external links** - Verify URLs are accessible
3. **Generate overlays** - Create/update JSON files

If validation fails:
- Report specific issues
- Suggest fixes
- Don't block pipeline completion

## CI Integration (if requested)

If user chose CI integration, create appropriate config:

### GitHub Actions

Create `.github/workflows/docs.yml`:

```yaml
name: Documentation

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'context_for_llms/**'
      - 'CLAUDE.md'
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run documentation pipeline
        run: bash scripts/llm-docs/optimize-for-llms.sh
      - name: Check for changes
        run: |
          if git diff --quiet; then
            echo "Documentation is up to date"
          else
            echo "Documentation needs regeneration"
            git diff
            exit 1
          fi
```

### GitLab CI

Create `.gitlab-ci.yml` or add to existing:

```yaml
docs:
  stage: test
  script:
    - bash scripts/llm-docs/optimize-for-llms.sh
    - git diff --exit-code || (echo "Docs need regeneration" && exit 1)
  only:
    changes:
      - context_for_llms/**
      - CLAUDE.md
```

## Best Practices

### For Installation

- Keep questions to minimum (max 3)
- Use sensible defaults
- Don't overwhelm user with choices
- Provide clear next steps

### For Templates

- Fill in obvious values automatically
- Leave complex placeholders for user
- Add helpful comments/notes
- Link to related documentation

### For Scripts

- All scripts should be standalone
- No external dependencies beyond Node.js
- Clear error messages
- Progress indicators

### For Documentation

- Start simple, expand as needed
- Prefer structure over length
- Link related concepts
- Keep JSON overlays updated

## Advanced Usage

### Custom Scripts

Users can add custom scripts to `scripts/llm-docs/` and call them from the orchestrator.

### Extended Templates

Users can create custom templates for their domain-specific needs.

### Integration with Other Tools

The JSON overlays can be consumed by:
- IDE extensions
- Documentation sites
- CI/CD pipelines
- Other AI tools

## Troubleshooting

### "System not detected as installed"

Check for:
- `context_for_llms/SECTIONS.json`
- `.llm-docs.config.json`

If missing, run installation.

### "Pipeline fails"

1. Check error message
2. Verify Node.js version (requires 16+)
3. Check file permissions
4. Run scripts individually to isolate issue

### "JSON overlay is empty"

Likely causes:
- No markdown files in context_for_llms
- Markdown files have no content
- Script error during generation

Solution: Check source files and re-run pipeline.

## Summary

This skill provides a single-command documentation system that:
- Installs with ≤3 questions
- Generates LLM-optimized artifacts
- Works with any AI assistant
- Maintains itself with automated scripts
- Scales from minimal to comprehensive

**Key files**:
- `.llm-docs.config.json` - Configuration
- `CLAUDE.md` - Main documentation entry point
- `context_for_llms/` - Structured documentation
- `scripts/llm-docs/` - Automation scripts
- JSON overlays - Token-efficient metadata

**Usage**:
- Install: `/llm-docs` (first time)
- Refresh: `/llm-docs` (subsequent runs)
- Manual: `bash scripts/llm-docs/optimize-for-llms.sh`
