---
name: ultra-doc
description: AI-driven documentation system that analyzes, writes, maintains, and validates documentation automatically. Detects code changes, finds errors, and keeps docs perfectly synced with your codebase. Use when user runs /ultra-doc command.
---

# Ultra-Doc: AI Documentation System v1.0

This skill enables you to intelligently manage documentation through analysis, validation, and automated fixes.

## When to Use This Skill

Activate this skill when:
- User runs `/ultra-doc` command
- User mentions ultra-doc or documentation maintenance
- User asks about documentation errors or gaps
- User wants to validate or update documentation

## Core Philosophy

**Single Command, Interactive Flow:**
1. User runs `/ultra-doc`
2. System analyzes current state
3. AI presents findings clearly
4. AI asks user what they want to do
5. AI presents contextual menu (only relevant options)
6. User chooses action
7. AI executes and reports results

**Hybrid Approach:**
- Deterministic scripts handle mechanical work (linting, file operations, link checking)
- AI handles cognitive work (writing, understanding, semantic validation)

## Main Decision Tree

```
on /ultra-doc:
  check_version()
  analyze_current_state()

  if not_installed:
    present_installation_offer()
    if user_accepts:
      install_system()
    else:
      exit

  else:
    findings = gather_findings()
    present_findings(findings)
    menu = generate_contextual_menu(findings)
    choice = ask_user_choice(menu)
    execute_action(choice)
    generate_changelog_and_report()
    report_results()
```

## Installation Detection

System is "installed" if these exist:
- `context_for_llms/SECTIONS.json`
- `.ultra-doc.config.json`

If either is missing → offer installation.

## Installation Flow

When system is not installed:

**Message to user:**
```
Ultra-Doc is not installed in this repository.

Would you like to install it? I'll ask 3 quick questions to set it up.

(yes/no)
```

If yes, ask these questions:

### Installation Questions (Max 3)

**Question 1: Setup Level**
```
What level of documentation do you want?

1. Minimal - Just CLAUDE.md and basic structure
2. Standard - CLAUDE.md + core docs + JSON overlays (recommended)
3. Comprehensive - Full system with all scripts

Choose (1-3) or press Enter for Standard:
```

**Question 2: Audience Balance**
```
Who is the primary audience?

1. Balanced - Humans, AI, maintainers equally (recommended)
2. Human-first - Optimized for human readers
3. AI-first - Optimized for AI assistants
4. Maintainer-first - Long-term maintenance focus

Choose (1-4) or press Enter for Balanced:
```

**Question 3: CI Integration**
```
Add documentation validation to CI?

(yes/no) or press Enter for no:
```

Default to "no" if no CI system detected (.github/workflows, .gitlab-ci.yml).

### Installation Actions

After collecting answers:

**1. Create config file** `.ultra-doc.config.json`:
```json
{
  "setup_level": "minimal|standard|comprehensive",
  "audience": "balanced|human-first|ai-first|maintainer-first",
  "ci_integration": true|false,
  "installed_at": "2025-11-15T10:30:00Z",
  "version": "1.0.0"
}
```

**2. Create directory structure:**
```
context_for_llms/
  SECTIONS.json
  CODE_POINTERS.json
  RELATIONSHIPS.json

scripts/ultra-doc/
  (all scripts copied from skill)
```

**3. Create CLAUDE.md** at repo root (use appropriate template)

**4. Run initial analysis:**
```bash
bash scripts/ultra-doc/analyze-doc-state.mjs
bash scripts/ultra-doc/analyze-coverage.mjs
```

**5. Report completion:**
```
✓ Ultra-Doc installed successfully!

Created:
- CLAUDE.md (main documentation entry point)
- context_for_llms/ (documentation directory)
- scripts/ultra-doc/ (automation scripts)

Run /ultra-doc again to see analysis and choose actions.
```

## Main Flow: Analysis & Interactive Menu

When system IS installed:

### Step 1: Analyze Current State

Run these checks:
1. **Read DOC_STATE.json** (if exists) - documentation health
2. **Read COVERAGE.json** (if exists) - code coverage
3. **Read VALIDATION.json** (if exists) - accuracy validation
4. **Check git status** - detect uncommitted changes
5. **Scan for code changes** - files modified since last doc update

If JSON files don't exist yet, generate them:
```bash
node scripts/ultra-doc/analyze-doc-state.mjs
node scripts/ultra-doc/analyze-coverage.mjs
node scripts/ultra-doc/validate-accuracy.mjs
```

### Step 2: Present Findings

Format findings clearly (see [reference.md - Findings Presentation Format](reference.md#detailed-report-formats) for detailed format).

### Step 3: Generate Contextual Menu

Based on findings, present ONLY relevant options:

**If critical errors found:**
```
What would you like me to do?

1. Fix critical errors automatically
2. Update docs for changed code files
3. Document undocumented functions
4. Run full refresh (all updates)
5. Just show detailed analysis

Choose (1-5):
```

**If no errors but gaps exist:**
```
Documentation is healthy! Optional improvements:

1. Document undocumented functions (5 found)
2. Enhance incomplete sections
3. Run full refresh
4. Show detailed analysis

Choose (1-4):
```

**If everything is perfect:**
```
✓ Documentation is 100% healthy!

No errors, no gaps, everything current.

Optional actions:
1. Run validation anyway
2. Generate coverage report
3. Exit

Choose (1-3):
```

### Step 4: Execute Chosen Action

Based on user's choice, execute the corresponding workflow.

## Action Workflows

### Action 1: Fix Critical Errors

**What it does:**
- Runs deterministic auto-fixes (linting, links, formatting)
- AI fixes factual errors by reading code
- Validates all fixes
- Commits changes

**Process:**
1. Run `autofix-linting.mjs` for deterministic fixes
2. Read VALIDATION.json for accuracy errors
3. For each error marked `auto_fixable: true`:
   - Locate exact text in documentation
   - Read actual code to get correct value
   - Replace incorrect with correct
   - Verify change makes sense
4. Run validation again to confirm fixes
5. Commit with message: "fix(docs): correct [X] documentation errors"

**AI Safety Rules:**
- ALWAYS read source code before changing docs
- NEVER assume or guess
- EVERY change must cite source (file:line)
- If confidence < 95%, ask user to review
- Validate after every change

See [reference.md - Example Fixes](reference.md#example-fixes-and-outputs) for detailed fix workflows.

### Action 2: Update Docs for Changed Code

**What it does:**
- Detects which docs reference changed code (via CODE_POINTERS.json)
- AI reads code changes
- AI updates documentation to match
- Validates and commits

**Process:**
1. Run `track-code-changes.mjs` to get list of changed files
2. Read CODE_POINTERS.json to find which docs reference them
3. For each affected doc:
   - Read git diff of code changes
   - Read current documentation section
   - Determine what's now incorrect or incomplete
   - Update documentation to reflect new code
   - Add examples if new features added
4. Validate all updates
5. Commit: "docs: update [files] to reflect code changes"

See [reference.md - Code Change Update Example](reference.md#example-fixes-and-outputs) for detailed workflow.

### Action 3: Document Undocumented Functions

**What it does:**
- Finds code with no documentation (from COVERAGE.json)
- AI analyzes the code
- AI writes documentation
- Integrates into existing docs or creates new sections
- Validates and commits

**Process:**
1. Read COVERAGE.json for undocumented items
2. Sort by priority (usage count, importance)
3. For each undocumented item:
   - Read source code
   - Understand purpose, parameters, return values
   - Find appropriate doc file (or create section)
   - Write documentation (see template in reference.md)
   - Update CODE_POINTERS.json with new mapping
4. Validate written docs against code
5. Commit: "docs: add documentation for [items]"

See [reference.md - Function Documentation Template](reference.md#documentation-templates) for detailed template.

### Action 4: Run Full Refresh

**What it does:**
- Runs complete analysis pipeline
- Syncs metadata and timestamps
- Generates human-readable docs
- Fixes all auto-fixable issues
- Updates all stale documentation
- Validates everything
- Reports final state

**Process:**
1. Run `sync-doc-metadata.mjs` (updates timestamps, indexes, linter)
2. Run `generate-human-doc.mjs` (translates/updates human docs)
3. Execute deterministic fixes
4. Execute AI fixes for errors
5. Update stale docs
6. Validate all changes
7. Commit all updates
8. Run `generate-changelog.mjs` and `generate-report.mjs`

### Action 5: Show Detailed Analysis

**What it does:**
- Presents detailed breakdown of documentation state
- Shows metrics and trends
- Lists all issues with severity
- Provides recommendations
- Doesn't make any changes

See [reference.md - Full Analysis Report Format](reference.md#detailed-report-formats) for complete output format.

## Validation Strategy

### Narrow Path Validation (Key Innovation)

Validation follows explicit links in CODE_POINTERS.json rather than searching blindly.

**Validation Process:**
1. Read CODE_POINTERS.json (knows exactly what links to what)
2. For each doc → code link:
   - Check if file still exists
   - Check if file changed since lastValidated
   - If changed, mark doc as "needs validation"
3. For docs needing validation:
   - AI reads doc section
   - AI reads linked code files
   - AI determines if doc still accurately describes code
   - If mismatch: add to VALIDATION.json
   - If accurate: update lastValidated timestamp

**Why This Works:**
- No guessing which code relates to which docs
- No searching entire codebase
- Explicit, narrow paths to follow
- Makes contradiction detection "pretty easy"

See [reference.md - CODE_POINTERS Structure](reference.md#code-pointer-structure) for detailed JSON schema.

### Semantic Validation (AI-Driven)

For claims requiring understanding, use the validation prompt template.

If validation fails (accurate: false), add to VALIDATION.json for fixing.

See [reference.md - Validation Prompt Templates](reference.md#validation-prompt-templates) for detailed prompt format.

## Error Detection Categories

**Type 1: Factual Errors** (Deterministic)
- Wrong values, paths, counts
- Detection: Script comparison
- Fix: Auto-replaceable

**Type 2: Semantic Errors** (AI)
- Wrong behavior descriptions
- Detection: AI code understanding
- Fix: AI rewrites

**Type 3: Completeness Errors** (Hybrid)
- Missing sections, sparse docs
- Detection: Template comparison
- Fix: AI writes missing content

**Type 4: Staleness** (Deterministic)
- Code changed, docs didn't
- Detection: Git history + timestamps
- Fix: AI updates based on changes

**Type 5: Broken Examples** (Hybrid)
- Code examples with errors
- Detection: Syntax parsing
- Fix: Scripts fix syntax, AI fixes logic

## Hallucination Prevention (CRITICAL)

**NEVER write documentation without reading code first.**

**Rules:**
1. Always read source code before writing docs
2. Every factual claim must cite source (file:line)
3. Validate AI-written content before committing
4. Report confidence score for each section
5. If confidence < 95%, flag for human review

See [reference.md - Citation Format](reference.md#citation-format-examples) for examples.

**Validation After Writing:**
After AI writes documentation:
1. Extract all factual claims from draft
2. Run validation script on draft
3. AI reads validation results
4. AI fixes any errors found
5. Repeat until validation passes
6. Only then commit

## Scripts Reference

**Analysis Scripts:**
- `analyze-doc-state.mjs` → DOC_STATE.json
- `analyze-coverage.mjs` → COVERAGE.json
- `validate-accuracy.mjs` → VALIDATION.json
- `track-code-changes.mjs` → Updates DOC_STATE.json

**Auto-Fix Scripts:**
- `autofix-linting.mjs` → Fixes structure, formatting

**Orchestrator:**
- `optimize-docs.sh` → Runs full pipeline

See [reference.md - Scripts Reference](reference.md#scripts-reference-details) for complete details.

## Commit Message Format

Use conventional commits for all documentation changes.

See [reference.md - Commit Message Formats](reference.md#commit-message-formats) for examples.

## Reporting Results

After executing action, report clearly with changes made, validation results, and commit message.

See [reference.md - Action Completion Report](reference.md#detailed-report-formats) for format.

## JSON Data Structures

The system uses three main JSON files for tracking documentation state:
- **DOC_STATE.json** - Documentation health and freshness
- **COVERAGE.json** - Code coverage and undocumented items
- **VALIDATION.json** - Accuracy errors and fixes needed

See [reference.md - JSON Data Structures](reference.md#json-data-structures) for complete schemas.

## Summary

**Single command:** `/ultra-doc`
**Interactive flow:** Analyze → Present → Ask → Execute → Report
**Hybrid approach:** Scripts for mechanics, AI for cognition
**Narrow validation:** Follow CODE_POINTERS links
**Hallucination prevention:** Always read code, cite sources, validate
**Contextual menus:** Only show relevant options

This skill transforms documentation from a manual task into an automated, validated, always-current system.
