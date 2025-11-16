# Ultra-Doc: AI-Driven Documentation Maintenance System for Claude Code

<div align="center">
  <img src="./ultradoc-cover.png" alt="Ultra-Doc Cover" width="100%">
</div>

![Version](https://img.shields.io/badge/version-1.0.0-teal?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-gold?style=for-the-badge)
![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-teal?style=for-the-badge)
![Token Savings](https://img.shields.io/badge/Token_Savings-60--90%25-gold?style=for-the-badge)

**Self-healing documentation powered by AI: automatic validation, staleness detection, error fixing, and gap finding**
<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Table of Contents

- [What is Ultra-Doc?](#what-is-ultra-doc)
- [Quick Start](#quick-start)
- [Visual Overview](#visual-overview)
- [Automatic Documentation Maintenance](#automatic-documentation-maintenance)
- [AI-Driven Validation](#ai-driven-validation)
- [What Ultra-Doc Catches](#what-ultra-doc-catches)
- [Examples](#examples)
- [How It Works](#how-it-works)
- [Token Economics](#token-economics)
- [Key Benefits](#key-benefits)
- [Plugin Structure](#plugin-structure)
- [Support](#support)



<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## What is Ultra-Doc?

Ultra-Doc is a Claude Code plugin that **actively maintains** your documentation. Unlike traditional doc generators that create static files, Ultra-Doc continuously monitors your codebase for changes, validates documentation accuracy against actual code, automatically fixes errors, and identifies undocumented code.

**This is a self-healing documentation system powered by AI.**

The `/ultra-doc` command transforms your repository into a living documentation system that:
- **Detects when docs become stale** after code changes
- **Validates accuracy** by reading actual source code and detecting contradictions
- **Auto-fixes errors** including formatting issues, broken links, and factual errors
- **Finds gaps** in documentation coverage and writes missing docs
- **Prevents hallucinations** by requiring AI to cite sources and validate claims
- **Optimizes for tokens** with JSON overlays that reduce AI context usage by 60-90%

> [!TIP]
> Run `/ultra-doc` after major code changes to detect staleness, validate accuracy, and auto-fix any issues

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Quick Start

### Make Claude Code install Ultra-Doc


**Copy this entire prompt and paste it into Claude Code:**

```
Install the ultra-doc plugin from GitHub:

/plugin marketplace add justfinethanku/ultra-doc
/plugin install ultra-doc@ultra-doc-marketplace

This plugin creates a self-healing documentation system that automatically detects when docs
become stale, validates accuracy against actual code, fixes errors automatically, and finds
undocumented code. It also uses JSON overlays to reduce AI context usage by 60-90%.

After you install it, tell me how it works and what the /ultra-doc command does.
```

### Do it manually (if you hate yourself)

**Method 1: Install from GitHub (Recommended)**

```bash
# Add the marketplace
/plugin marketplace add justfinethanku/ultra-doc

# Install the plugin
/plugin install ultra-doc@ultra-doc-marketplace
```

**Method 2: Local Marketplace**

```bash
/plugin install ultra-doc@local-plugins
```

### Usage

**First run (installs documentation system):**

```bash
/ultra-doc
```

**Subsequent runs (analyzes and presents interactive menu):**

```bash
/ultra-doc
```

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Visual Overview

### Documentation Architecture

### Token Flow Comparison

**❌ Without Ultra-Doc**

```
Query 1: "Explain authentication"
├─ Read 15 files
└─ 8,000 tokens

Query 2: "Show API endpoints"
├─ Read 12 more files
└─ 6,000 tokens

Query 3: "Database connection?"
├─ Read 8 more files
└─ 4,000 tokens

Total: 18,000 tokens
```

**Problems:**
- Reads entire files each time
- No context reuse
- Context window filled quickly
- No staleness detection
- No accuracy validation

---

**✅ With Ultra-Doc**

```
Query 1: "Explain authentication"
├─ Query SECTIONS.json
└─ 2,400 tokens (targeted sections)

Query 2: "Show API endpoints"
├─ Query cached sections
└─ 800 tokens (reuse context)

Query 3: "Database connection?"
├─ Already in context
└─ 0 additional tokens

Total: 3,200 tokens
```

**Benefits:**
- Selective section retrieval
- Context reuse across queries
- **82% token reduction**
- Auto-detects stale docs
- Validates accuracy

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Automatic Documentation Maintenance

### The 5-Script Pipeline

Ultra-Doc uses a sophisticated pipeline of AI and deterministic scripts to maintain documentation health:

**1. Code Change Tracking**
- Monitors git history for file modifications
- Maps changed files to documentation via CODE_POINTERS.json
- Marks affected docs as "needs validation"
- Estimates impact (low/medium/high)

**2. Documentation State Analysis**
- Generates health metrics and completeness scores
- Assesses staleness risk based on code changes
- Creates priority list of what needs attention
- Outputs DOC_STATE.json

**3. Coverage Analysis**
- Identifies undocumented functions, classes, and modules
- Analyzes export patterns and usage counts
- Prioritizes what should be documented first
- Outputs COVERAGE.json

**4. Accuracy Validation**
- AI reads actual source code
- Compares code behavior to documentation claims
- Validates file paths, examples, and behavioral descriptions
- Detects contradictions and outdated information
- Outputs VALIDATION.json

**5. Automatic Fixing**
- Deterministically fixes linting issues (structure, formatting, links)
- AI fixes factual errors by reading code and updating docs
- AI updates documentation to reflect code changes
- AI writes missing documentation for gaps
- All changes validated before committing

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## AI-Driven Validation

### Narrow Path Validation Strategy

Ultra-Doc uses an innovative **narrow path validation** approach that makes accuracy checking "pretty easy":

**Why This Works:**
- No blind searching - follows explicit links
- No guessing - CODE_POINTERS.json knows exactly what relates to what
- Narrow, specific paths to validate
- Makes contradiction detection deterministic

### Hallucination Prevention

**CRITICAL RULES:**
1. **Always read source code** before writing documentation
2. **Every claim must cite source** (file:line references required)
3. **Validate AI-written content** before committing
4. **Report confidence scores** for each section
5. **Flag for human review** if confidence < 95%

**Example Citation:**
```markdown
The `authenticate()` function returns a JWT token on success.
Source: src/auth/authenticator.js:45-52
```

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## What Ultra-Doc Catches

### Staleness Detection

**Before (Stale Documentation):**

```markdown
# Authentication

The system uses session cookies
for authentication.

Sessions expire after 1 hour.
```

**Code Changed:**
```javascript
// auth.js
- sessionTimeout: 3600  // 1 hour
+ tokenExpiry: 86400    // 24 hours
+ useJWT: true
```

---

**After (Auto-Updated):**

```markdown
# Authentication

The system uses JWT tokens
for authentication.

Tokens expire after 24 hours.

Source: src/auth/config.js:12-14
Last Validated: 2025-11-15
```

**Changes Detected:**
- Session → JWT switch detected
- Timeout value corrected
- Source citation added

### Coverage Gap Detection

**COVERAGE.json Output:**

```json
{
  "undocumented": [
    {
      "file": "src/utils/validator.js",
      "exports": ["validateEmail", "sanitize"],
      "usage_count": 47,
      "priority": "high"
    }
  ],
  "stats": {
    "total_files": 120,
    "documented": 95,
    "coverage_percent": 79.2
  }
}
```

---

**AI Action:**

```markdown
# Utility Functions

## Email Validation

`validateEmail(email: string): boolean`

Validates email addresses using RFC 5322
standard. Returns true if valid.

**Example:**
```js
validateEmail('user@example.com') // true
validateEmail('invalid') // false
```

Source: src/utils/validator.js:12-28
```

**Result:** Coverage → 80.8%

### Accuracy Validation

**Documentation Claim:**

```markdown
The API supports pagination with
`limit` and `offset` parameters.

Maximum limit is 50 items.
```

**Actual Code:**

```javascript
const MAX_LIMIT = 100;

function paginate(limit, offset) {
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }
  // ...
}
```

---

**VALIDATION.json:**

```json
{
  "errors": [{
    "file": "docs/api-overview.md",
    "line": 45,
    "type": "factual_error",
    "claim": "Maximum limit is 50 items",
    "actual": "Maximum limit is 100 items",
    "source": "src/api/paginate.js:3",
    "auto_fixable": true,
    "confidence": 100
  }]
}
```

**Auto-Fixed:** ✅
Maximum limit is ~~50~~ **100** items.

### Auto-Fix Capabilities

**Linting Errors Detected:**

```markdown
# Broken Structure

### Wrong heading level (should be ##)

```javascript  ← missing language tag
code here
```  ← extra spaces

-  Mixed list markers
*  In same list
```

---

**Auto-Fixed:**

```markdown
# Fixed Structure

## Correct heading level

```javascript
code here
```

- Consistent list markers
- In same list
```

**Fixes Applied:**
- Heading hierarchy corrected
- Language tag added
- Trailing whitespace removed
- List markers standardized

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Examples

### Example 1: Small Project (Minimal Setup)

**Task Input:**
```bash
/ultra-doc
```

**Complexity:** Low (personal project, <20 files)
**Setup Time:** 2-3 minutes
**Questions Asked:** 1 (setup level only)

**Output Directory:**
```
your-project/
├── CLAUDE.md                       # 79-line overview
├── .ultra-doc.config.json           # Configuration
└── context_for_llms/
    ├── llms.txt                    # Navigation guide
    ├── INDEX.md                    # File inventory
    ├── SECTIONS.json               # Token-optimized sections
    ├── DOC_STATE.json              # Health tracking
    ├── COVERAGE.json               # Gap analysis
    └── VALIDATION.json             # Accuracy results
```

**Key Results:**
- Basic project documentation created
- AI can navigate project with llms.txt
- Sections queryable via SECTIONS.json
- Automatic staleness detection active
- Validation runs on demand

**Token Usage:**
- Traditional: 2,400 tokens
- Ultra-Doc Optimized: 600 tokens
- **Savings: 75%**

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

### Example 2: Production App (Standard Setup)

**Task Input:**
```bash
/ultra-doc
```

**Complexity:** Medium (team project, 100+ files, multiple modules)
**Setup Time:** 4-5 minutes
**Questions Asked:** 2 (setup level + audience)

**Output Directory:**
```
production-app/
├── CLAUDE.md                       # 234-line comprehensive guide
├── .ultra-doc.config.json           # Configuration
├── context_for_llms/
│   ├── llms.txt                    # AI navigation
│   ├── INDEX.md                    # File inventory with stats
│   ├── SECTIONS.json               # 847 sections, ~12,000 tokens
│   ├── CODE_POINTERS.json          # Maps docs → 47 source files
│   ├── RELATIONSHIPS.json          # Dependency graph (23 packages)
│   ├── DOC_STATE.json              # Comprehensive health metrics
│   ├── COVERAGE.json               # Detailed gap analysis
│   ├── VALIDATION.json             # Full accuracy tracking
│   ├── architecture.md             # System design
│   ├── api-overview.md             # Endpoint documentation
│   ├── domains-and-modules.md      # Module breakdown
│   └── development-workflows.md    # Team processes
└── scripts/ultra-doc/               # 13 automation scripts
```

**Key Results:**
- Complete documentation system installed
- JSON overlays enable selective retrieval
- Code pointers enable narrow path validation
- Auto-refresh pipeline keeps docs current
- Staleness detection active
- Coverage analysis identifies gaps
- Accuracy validation catches errors

**Execution Sequence:**
1. Detect
2. Configure
3. Copy Templates
4. Track Changes
5. Analyze State
6. Analyze Coverage
7. Validate Accuracy
8. Auto-Fix Errors
9. Complete

**Token Usage:**
- Without Ultra-Doc: ~45,000 tokens (reading all docs + source)
- With Ultra-Doc: ~8,500 tokens (targeted section retrieval)
- **Savings: 81%** 🚀

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

### Example 3: Enterprise Monorepo (Comprehensive Setup)

**Task Input:**
```bash
/ultra-doc
```

**Complexity:** High (500+ files, multiple services, complex architecture)
**Setup Time:** 6-7 minutes
**Questions Asked:** 3 (all questions)

**Output Directory:**
```
enterprise-monorepo/
├── CLAUDE.md                       # 350+ line detailed documentation
├── .ultra-doc.config.json           # Full configuration
├── context_for_llms/
│   ├── llms.txt                    # Service-aware navigation
│   ├── INDEX.md                    # Comprehensive inventory
│   ├── SECTIONS.json               # 2,341 sections, ~78,000 tokens
│   ├── CODE_POINTERS.json          # Maps to 287 source files
│   ├── RELATIONSHIPS.json          # Complex dependency graph
│   ├── DOC_STATE.json              # Enterprise health tracking
│   ├── COVERAGE.json               # Cross-service gap analysis
│   ├── VALIDATION.json             # Multi-service validation
│   ├── architecture.md             # Detailed system design
│   ├── api-overview.md             # Full API documentation
│   ├── domains-and-modules.md      # Service boundaries
│   └── development-workflows.md    # CI/CD integration
├── scripts/ultra-doc/               # All 13 scripts + CI hooks
└── .github/workflows/docs.yml      # CI validation
```

**Key Results:**
- Industrial-strength documentation system
- Service boundaries clearly defined
- CI integration validates docs on commit
- Token counting prevents context overflow
- Automatic staleness detection across services
- Cross-service coverage analysis
- Comprehensive accuracy validation

**Complexity vs Token Savings:**

| Project Complexity | Token Savings |
|-------------------|---------------|
| Small Project (< 20 files) | 75% Savings (600 tokens/query) |
| Medium Project (20-200 files) | 81% Savings (8,500 tokens/query) |
| Large Project (200+ files) | 87.5% Savings (15,000 tokens/query) |

**Token Usage:**
- Without Ultra-Doc: ~120,000 tokens (impossible in single context)
- With Ultra-Doc: ~15,000 tokens (intelligent section selection)
- **Savings: 87.5%** 💎

> [!IMPORTANT]
> Ultra-Doc makes enterprise-scale projects manageable within Claude's context window while maintaining perfect accuracy

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## How Ultra-Doc Works: The Two-Layer Architecture

Ultra-Doc uses a **clever hybrid architecture** that combines deterministic scripts with AI orchestration to create a self-healing documentation system. This isn't just another doc generator - it's a continuous maintenance system that keeps your docs accurate, complete, and optimized.

### The Core Insight: Two Layers Working Together

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: AI ORCHESTRATION                │
│  (Claude analyzes, decides, coordinates, validates)         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Read DOC_STATE.json → Understand current health    │    │
│  │ Read COVERAGE.json → Find documentation gaps       │    │
│  │ Read VALIDATION.json → See accuracy issues         │    │
│  │ Decide what to do → Execute appropriate scripts    │    │
│  │ Validate results → Ensure changes are correct      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: DETERMINISTIC SCRIPTS                 │
│  (Fast, reliable, no hallucinations)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Track code changes → Mark docs as stale           │    │
│  │ Analyze structure → Generate health metrics       │    │
│  │ Find exports → Identify gaps                      │    │
│  │ Fix formatting → Repair linting errors            │    │
│  │ Generate JSON → Create optimized indexes          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Why This Matters:**

1. **Deterministic scripts do what they're good at** - Fast, reliable analysis with zero hallucinations
2. **AI does what it's good at** - Understanding context, making decisions, writing prose
3. **JSON files bridge the gap** - Scripts output structured data, AI reads and acts on it
4. **Result: Self-healing system** - Automatically detects problems and fixes them

### The Three-File Feedback Loop

Ultra-Doc's intelligence comes from three continuously-updated JSON files that create a feedback loop:

```
DOC_STATE.json              COVERAGE.json              VALIDATION.json
    ↓                           ↓                          ↓
"3 docs are stale"      "12 functions need docs"    "5 claims are wrong"
    ↓                           ↓                          ↓
    └───────────────────────────┴──────────────────────────┘
                                ↓
                    AI reads all three and decides:
                    "Fix validation errors first,
                     then update stale docs,
                     then fill gaps"
                                ↓
                    Executes scripts in priority order
                                ↓
                    Scripts update the JSON files
                                ↓
                         Loop continues
```

### Interactive Decision Tree

When you run `/ultra-doc`, here's what happens:

**1. Initial Check**
```
Run /ultra-doc
    ↓
Does system exist?
    ├─ NO → Install System
    │        ├─ Ask 1-3 questions (smart defaults)
    │        ├─ Copy templates (based on project size)
    │        ├─ Run initial analysis
    │        └─ Create JSON files
    │
    └─ YES → Analyze Current State
             ├─ Read DOC_STATE.json
             ├─ Read COVERAGE.json
             ├─ Read VALIDATION.json
             └─ Check for code changes
```

**2. Present Findings**
```
Show Health Status
    ├─ Errors found: 8
    ├─ Stale docs: 3
    ├─ Coverage gaps: 12
    └─ Overall health: 78%
```

**3. Choose Action** (AI presents menu, user picks or AI auto-chooses)
```
Options:
    ├─ Fix Errors → autofix-linting.mjs + AI fixes factual errors
    ├─ Update Stale → AI reads code changes, updates docs
    ├─ Document Gaps → AI writes missing docs for exports
    ├─ Full Refresh → Run complete pipeline
    └─ Show Details → Display full metrics
```

**4. Execute & Validate**
```
Execute chosen action
    ↓
Run appropriate scripts
    ↓
AI validates changes
    ↓
Update JSON files
    ↓
Report results
```

### Project Size-Based Setup

Ultra-Doc adapts to your project's complexity:

**Small Project (< 20 files)**

**Minimal Setup:**
- Basic CLAUDE.md (79 lines)
- SECTIONS.json
- Navigation files
- Health tracking

**Scripts Included:**
- Core analysis (4)
- Basic auto-fix (1)
- JSON generation (2)

**Questions Asked:** 1
**Setup Time:** 2-3 min
**Token Savings:** 75%

---

**Medium Project (20-200 files)**

**Standard Setup:**
- Comprehensive CLAUDE.md (234 lines)
- All JSON overlays
- Context docs (4)
- Full automation

**Scripts Included:**
- All analysis (4)
- All auto-fix (1)
- All enhancement (8)

**Questions Asked:** 2
**Setup Time:** 4-5 min
**Token Savings:** 81%

---

**Large Project (200+ files)**

**Comprehensive Setup:**
- Extended CLAUDE.md (350+ lines)
- Service boundaries
- CI integration
- Enterprise validation

**Scripts Included:**
- All scripts (13)
- CI hooks
- Custom workflows

**Questions Asked:** 3
**Setup Time:** 6-7 min
**Token Savings:** 87.5%

### The Complete Pipeline

Here's what happens during a full refresh:

```
┌──────────────────────────────────────────────────────────┐
│                    FULL REFRESH PIPELINE                  │
└──────────────────────────────────────────────────────────┘

1. Track Code Changes
   ├─ Read git log since last validation
   ├─ Map changed files to docs via CODE_POINTERS.json
   ├─ Mark affected docs as "needs validation"
   └─ Estimate impact (low/medium/high)
        ↓
2. Analyze Doc State
   ├─ Calculate health metrics
   ├─ Assess staleness risk
   ├─ Check completeness scores
   └─ Output → DOC_STATE.json
        ↓
3. Analyze Coverage
   ├─ Find all exports in codebase
   ├─ Check which are documented
   ├─ Track usage counts
   └─ Output → COVERAGE.json
        ↓
4. Validate Accuracy
   ├─ AI reads source code
   ├─ Compares to documentation claims
   ├─ Validates examples and file paths
   └─ Output → VALIDATION.json
        ↓
5. Auto-Fix Errors
   ├─ Deterministic: Fix linting (headings, whitespace, links)
   ├─ AI: Fix factual errors (reads code, updates docs)
   └─ Output → Updated markdown files
        ↓
6. Update Timestamps
   ├─ Add "Last Updated" fields
   └─ Mark validation dates
        ↓
7. Generate SECTIONS.json
   ├─ Extract all markdown sections
   ├─ Count tokens per section
   └─ Create queryable index
        ↓
8. Create CODE_POINTERS
   ├─ Map documentation to source files
   ├─ Enable narrow path validation
   └─ Output → CODE_POINTERS.json
        ↓
9. Build RELATIONSHIPS
   ├─ Analyze dependencies
   ├─ Generate graph data
   └─ Output → RELATIONSHIPS.json
        ↓
10. Generate Navigation
    ├─ Create llms.txt (AI navigation)
    ├─ Build INDEX.md (file inventory)
    └─ Update all cross-references
        ↓
11. Complete
    └─ Report results with metrics
```

### The Scripts: What Each One Does

<details>
<summary><strong>📋 Complete Script Reference</strong></summary>

### Analysis Scripts (Intelligence Gathering)

| Script | Role | Output | How It Works |
|--------|------|--------|--------------|
| `track-code-changes.mjs` | Code change monitor | Updates DOC_STATE.json | Reads git log, maps changes to docs via CODE_POINTERS, estimates impact |
| `analyze-doc-state.mjs` | Health calculator | DOC_STATE.json | Generates health metrics, staleness risk, completeness scores |
| `analyze-coverage.mjs` | Gap finder | COVERAGE.json | Identifies undocumented exports, tracks usage, prioritizes work |
| `validate-accuracy.mjs` | Truth checker | VALIDATION.json | AI reads code, validates claims, detects contradictions |

### Auto-Fix Scripts (Self-Healing)

| Script | Role | Output | How It Works |
|--------|------|--------|--------------|
| `autofix-linting.mjs` | Format fixer | Fixed markdown | Deterministically fixes structure, whitespace, links |

### Enhancement Scripts (Optimization)

| Script | Role | Output | How It Works |
|--------|------|--------|--------------|
| `generate-section-index.mjs` | Token optimizer | SECTIONS.json | Extracts sections, counts tokens, enables selective retrieval |
| `add-code-pointers.mjs` | Code mapper | CODE_POINTERS.json | Creates explicit doc→code links for validation |
| `render-relationships.mjs` | Dependency analyzer | RELATIONSHIPS.json | Generates dependency graphs and relationship maps |
| `generate-llm-index.mjs` | Navigation builder | llms.txt, INDEX.md | Creates AI-readable navigation for fast orientation |
| `update-timestamps.mjs` | Freshness tracker | Updated docs | Adds "Last Updated" and validation dates |
| `lint-documentation.mjs` | Quality checker | Error reports | Validates structure and consistency (non-destructive) |
| `check-external-links.mjs` | Link validator | Broken link reports | Validates external URLs, prevents dead links |

### Orchestrator (Pipeline Manager)

| Script | Role | Output | How It Works |
|--------|------|--------|--------------|
| `optimize-docs.sh` | Pipeline coordinator | Runs all scripts | Executes complete pipeline in correct dependency order |

</details>

### Why This Architecture Works

**1. Separation of Concerns**
- Scripts handle mechanical tasks (no hallucinations)
- AI handles creative tasks (understanding, writing, deciding)
- JSON files provide clean interface between them

**2. Continuous Feedback Loop**
- Scripts detect problems → output JSON
- AI reads JSON → makes decisions
- AI executes fixes → scripts validate
- Scripts update JSON → cycle continues

**3. Narrow Path Validation**
- CODE_POINTERS.json maps docs to specific source files
- AI only needs to read relevant code (not entire codebase)
- Makes accuracy validation "pretty easy"
- Prevents context overflow

**4. Token Optimization by Design**
- SECTIONS.json enables selective retrieval
- AI only loads what it needs
- 60-90% reduction in token usage
- Scales to enterprise codebases

**5. Self-Healing System**
- Automatically detects when docs go stale
- Validates accuracy against actual code
- Fixes errors without human intervention
- Identifies and fills documentation gaps

**The Result:** A documentation system that stays accurate, complete, and optimized - automatically.

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Token Economics

### Investment vs Returns

### Detailed Breakdown

| Setup Level | Installation Cost | Per Query Cost | Total After 5 Queries | Traditional Cost | Savings |
|------------|-------------------|----------------|----------------------|------------------|---------|
| **Minimal** | 400 tokens | 200-400 tokens | 1,400-2,400 tokens | 12,000 tokens | **60-70%** |
| **Standard** | 600 tokens | 400-800 tokens | 2,600-4,600 tokens | 45,000 tokens | **70-80%** |
| **Comprehensive** | 800 tokens | 600-1,200 tokens | 3,800-6,800 tokens | 120,000 tokens | **80-90%** |

> [!IMPORTANT]
> ROI is positive after just 2-3 queries and compounds with every subsequent use. Token optimization is a byproduct of the real value: always-accurate, self-healing documentation.

### Token Savings Over Time

**Progressive Savings:**
- Query 1: Break-even
- Query 2: Positive ROI
- Query 3: 2x savings
- Query 5: 5x savings
- Query 10: 10x+ savings

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Key Benefits

✅ **Self-Healing** - Automatically detects and fixes documentation errors

✅ **Staleness Detection** - Tracks code changes and marks affected docs for validation

✅ **Accuracy Validation** - AI reads actual code to verify documentation claims

✅ **Gap Finding** - Identifies undocumented code and generates missing docs

✅ **Auto-Fixing** - Repairs linting issues, factual errors, and broken links automatically

✅ **Token Efficient** - JSON overlays reduce context usage by 60-90%

✅ **Hallucination Prevention** - Requires AI to cite sources and validate all claims

✅ **Progressive Disclosure** - Start with overview, dive deep when needed

✅ **Tool Neutral** - Works with any AI assistant, not just Claude

✅ **Zero Code Generation** - All scripts pre-written and tested

✅ **Smart Defaults** - ≤3 questions with intelligent defaults

✅ **Persistent Context** - Survives session restarts

✅ **Scalable** - From personal projects to enterprise monorepos

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>



## Plugin Structure

```
ultra-doc/
├── .claude-plugin/
│   └── plugin.json                 # Plugin metadata
├── commands/
│   └── ultra-doc.md                 # Slash command definition
├── skills/
│   └── ultra-doc/
│       ├── SKILL.md                # Core implementation logic
│       ├── scripts/                # 13 automation scripts
│       │   # Analysis Scripts
│       │   ├── analyze-doc-state.mjs
│       │   ├── analyze-coverage.mjs
│       │   ├── validate-accuracy.mjs
│       │   ├── track-code-changes.mjs
│       │   # Auto-Fix Scripts
│       │   ├── autofix-linting.mjs
│       │   # Enhancement Scripts
│       │   ├── generate-section-index.mjs
│       │   ├── add-code-pointers.mjs
│       │   ├── render-relationships.mjs
│       │   ├── generate-llm-index.mjs
│       │   ├── update-timestamps.mjs
│       │   ├── lint-documentation.mjs
│       │   ├── check-external-links.mjs
│       │   # Orchestrator
│       │   └── optimize-docs.sh
│       └── templates/              # 7 documentation templates
│           ├── CLAUDE_minimal.md
│           ├── CLAUDE_standard.md
│           ├── CLAUDE_comprehensive.md
│           └── context-templates/
│               ├── architecture.md
│               ├── api-overview.md
│               ├── domains-and-modules.md
│               └── development-workflows.md
├── LICENSE                         # MIT License
├── README.md                       # This file
└── package.json                    # NPM metadata
```

<details>
<summary><strong>🔍 What Gets Generated in Your Repository</strong></summary>

When you run `/ultra-doc`, Ultra-Doc creates this structure in **your** repository:

```
your-project/
├── CLAUDE.md                       # Main AI documentation
├── .ultra-doc.config.json           # Configuration
├── context_for_llms/               # Documentation directory
│   ├── llms.txt                    # AI navigation guide
│   ├── INDEX.md                    # File inventory
│   # Token Optimization Layer
│   ├── SECTIONS.json               # Token-optimized sections
│   ├── CODE_POINTERS.json          # Doc→source mappings
│   ├── RELATIONSHIPS.json          # Dependency graph
│   # Health Tracking Layer
│   ├── DOC_STATE.json              # Health metrics & staleness
│   ├── COVERAGE.json               # Gap analysis
│   ├── VALIDATION.json             # Accuracy results
│   # Context Documents (Standard/Comprehensive)
│   ├── architecture.md
│   ├── api-overview.md
│   ├── domains-and-modules.md
│   └── development-workflows.md
└── scripts/ultra-doc/               # Automation scripts
    └── [13 scripts copied from plugin]
```

</details>


<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Origin & Community

Created by **Jonathan Edwards** as part of the Claude Code plugin ecosystem initiative.

This is v1.0.0 of what aims to become the standard AI-driven documentation maintenance system for development. Community contributions welcome to improve validation strategies, accuracy detection, and auto-fix capabilities.

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Support

- **Author:** [Jonathan Edwards](https://limitededitionjonathan.substack.com/)

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

<div align="center">

**Made for the Claude Code community**

*Self-healing documentation powered by AI: automatic validation, staleness detection, error fixing, and gap finding*

![Teal Wave](https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat)

</div>
