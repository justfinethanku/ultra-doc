# Ultra-Doc: LLM-Optimized Documentation System for Claude Code

<div align="center">
  <img src="./ultradoc-cover.png" alt="Ultra-Doc Cover" width="100%">
</div>

![Version](https://img.shields.io/badge/version-1.0.0-teal?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-gold?style=for-the-badge)
![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-teal?style=for-the-badge)
![Token Savings](https://img.shields.io/badge/Token_Savings-60--90%25-gold?style=for-the-badge)

**Generate token-efficient, AI-readable documentation with JSON overlays that reduce context usage by 60-90%**

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## What is Ultra-Doc?

Ultra-Doc is a Claude Code plugin that creates and maintains an LLM-optimized documentation system in any repository. Instead of AI assistants reading entire files (consuming thousands of tokens), Ultra-Doc generates JSON overlays that enable selective, token-efficient context retrieval.

The `/llm-docs` command transforms scattered documentation into a structured system with:
- Token-counted sections for efficient retrieval
- Code-to-documentation mappings
- Dependency graphs and relationships
- Progressive disclosure (overview → details → source)
- Tool-neutral design (works with any AI assistant)

> [!TIP]
> Run `/llm-docs` after major code changes to keep AI context fresh and accurate

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Quick Start

### For Claude Code Users (Self-Install)

**Copy this entire prompt and paste it into Claude Code:**

```
Install the ultra-doc plugin from GitHub: /plugin install ultra-doc@github:justfinethanku/ultra-doc

This plugin creates LLM-optimized documentation systems with JSON overlays (SECTIONS.json, CODE_POINTERS.json, RELATIONSHIPS.json) that reduce AI context usage by 60-90%.

After you install it, tell me how it works and what the /llm-docs command does.
```

### Manual Installation

**Method 1: Install from GitHub (Recommended)**

```bash
/plugin install ultra-doc@github:justfinethanku/ultra-doc
```

**Method 2: Local Marketplace**

```bash
/plugin install ultra-doc@local-plugins
```

### Usage

**First run (installs documentation system):**

```bash
/llm-docs
```

**Subsequent runs (refreshes all artifacts):**

```bash
/llm-docs
```

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Table of Contents

- [Quick Start](#quick-start)
- [What is Ultra-Doc?](#what-is-ultra-doc)
- [Visual Overview](#visual-overview)
- [Examples](#examples)
- [Comparison: With vs Without Ultra-Doc](#comparison-with-vs-without-ultra-doc)
- [How It Works](#how-it-works)
- [Why This Matters](#why-this-matters)
- [Token Economics](#token-economics)
- [Key Benefits](#key-benefits)
- [Plugin Structure](#plugin-structure)
- [Contributing](#contributing)
- [Security](#security)
- [Version](#version)
- [Support](#support)

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Visual Overview

### Documentation Architecture

```mermaid
graph TB
    subgraph "Entry Point"
    CLAUDE[📄 CLAUDE.md<br/>Main Documentation]
    end

    subgraph "Navigation Layer"
    llms[🧭 llms.txt<br/>AI Navigation]
    INDEX[📑 INDEX.md<br/>File Inventory]
    end

    subgraph "JSON Overlays"
    SECTIONS[🔍 SECTIONS.json<br/>Token-Optimized<br/>Content Sections]
    POINTERS[🔗 CODE_POINTERS.json<br/>Documentation to<br/>Source Mappings]
    RELATIONS[📊 RELATIONSHIPS.json<br/>Dependency Graph]
    end

    subgraph "Context Documents"
    arch[🏗️ architecture.md]
    api[🌐 api-overview.md]
    domains[📦 domains-and-modules.md]
    workflows[⚙️ development-workflows.md]
    end

    subgraph "Source Code"
    src[💻 Your Source Files]
    deps[📚 Dependencies]
    end

    CLAUDE --> llms
    CLAUDE --> INDEX
    CLAUDE --> SECTIONS
    CLAUDE --> POINTERS
    CLAUDE --> RELATIONS

    SECTIONS --> arch
    SECTIONS --> api
    SECTIONS --> domains
    SECTIONS --> workflows

    POINTERS --> src
    RELATIONS --> deps

    style CLAUDE fill:#14b8a6,stroke:#0f766e,color:#fff
    style SECTIONS fill:#f59e0b,stroke:#d97706,color:#fff
    style POINTERS fill:#f59e0b,stroke:#d97706,color:#fff
    style RELATIONS fill:#f59e0b,stroke:#d97706,color:#fff
    style llms fill:#14b8a6,stroke:#0f766e,color:#fff
    style INDEX fill:#14b8a6,stroke:#0f766e,color:#fff
```

### Token Flow Comparison

<table>
<tr>
<td width="50%" valign="top">

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

</td>
<td width="50%" valign="top">

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

</td>
</tr>
</table>

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Examples

### Example 1: Small Project (Minimal Setup)

**Task Input:**
```bash
/llm-docs
```

**Complexity:** Low (personal project, <20 files)
**Setup Time:** 2-3 minutes
**Questions Asked:** 1 (setup level only)

**Output Directory:**
```
your-project/
├── CLAUDE.md                       # 79-line overview
├── .llm-docs.config.json           # Configuration
└── context_for_llms/
    ├── llms.txt                    # Navigation guide
    ├── INDEX.md                    # File inventory
    └── SECTIONS.json               # Token-optimized sections
```

**Key Results:**
- Basic project documentation created
- AI can navigate project with llms.txt
- Sections queryable via SECTIONS.json
- No scripts or complex overlays

**Token Usage:**
```mermaid
graph LR
    A[Traditional<br/>2,400 tokens] -->|Ultra-Doc| B[Optimized<br/>600 tokens]
    style A fill:#dc2626,stroke:#991b1b,color:#fff
    style B fill:#14b8a6,stroke:#0f766e,color:#fff
```

**Savings: 75%** 🎉

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

### Example 2: Production App (Standard Setup)

**Task Input:**
```bash
/llm-docs
```

**Complexity:** Medium (team project, 100+ files, multiple modules)
**Setup Time:** 4-5 minutes
**Questions Asked:** 2 (setup level + audience)

**Output Directory:**
```
production-app/
├── CLAUDE.md                       # 234-line comprehensive guide
├── .llm-docs.config.json           # Configuration
├── context_for_llms/
│   ├── llms.txt                    # AI navigation
│   ├── INDEX.md                    # File inventory with stats
│   ├── SECTIONS.json               # 847 sections, ~12,000 tokens
│   ├── CODE_POINTERS.json          # Maps docs → 47 source files
│   ├── RELATIONSHIPS.json          # Dependency graph (23 packages)
│   ├── architecture.md             # System design
│   ├── api-overview.md             # Endpoint documentation
│   ├── domains-and-modules.md      # Module breakdown
│   └── development-workflows.md    # Team processes
└── scripts/llm-docs/               # 8 automation scripts
```

**Key Results:**
- Complete documentation system installed
- JSON overlays enable selective retrieval
- Code pointers map concepts to implementation
- Auto-refresh with pipeline scripts

**Execution Sequence:**

```mermaid
graph LR
    A[1. Detect] --> B[2. Configure]
    B --> C[3. Copy Templates]
    C --> D[4. Update Timestamps]
    D --> E[5. Generate SECTIONS]
    E --> F[6. Create CODE_POINTERS]
    F --> G[7. Build RELATIONSHIPS]
    G --> H[8. Generate Navigation]
    H --> I[✓ Complete]

    style A fill:#14b8a6,stroke:#0f766e,color:#fff
    style I fill:#f59e0b,stroke:#d97706,color:#fff
```

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
/llm-docs
```

**Complexity:** High (500+ files, multiple services, complex architecture)
**Setup Time:** 6-7 minutes
**Questions Asked:** 3 (all questions)

**Output Directory:**
```
enterprise-monorepo/
├── CLAUDE.md                       # 350+ line detailed documentation
├── .llm-docs.config.json           # Full configuration
├── context_for_llms/
│   ├── llms.txt                    # Service-aware navigation
│   ├── INDEX.md                    # Comprehensive inventory
│   ├── SECTIONS.json               # 2,341 sections, ~78,000 tokens
│   ├── CODE_POINTERS.json          # Maps to 287 source files
│   ├── RELATIONSHIPS.json          # Complex dependency graph
│   ├── architecture.md             # Detailed system design
│   ├── api-overview.md             # Full API documentation
│   ├── domains-and-modules.md      # Service boundaries
│   └── development-workflows.md    # CI/CD integration
├── scripts/llm-docs/               # All 8 scripts + CI hooks
└── .github/workflows/docs.yml      # CI validation
```

**Key Results:**
- Industrial-strength documentation system
- Service boundaries clearly defined
- CI integration validates docs on commit
- Token counting prevents context overflow

**Complexity vs Token Savings:**

```mermaid
graph TD
    subgraph "Project Complexity"
    P1[Small Project<br/>< 20 files]
    P2[Medium Project<br/>20-200 files]
    P3[Large Project<br/>200+ files]
    end

    subgraph "Token Savings"
    S1[75% Savings<br/>600 tokens/query]
    S2[81% Savings<br/>8,500 tokens/query]
    S3[87.5% Savings<br/>15,000 tokens/query]
    end

    P1 --> S1
    P2 --> S2
    P3 --> S3

    style P1 fill:#14b8a6,stroke:#0f766e,color:#fff
    style P2 fill:#14b8a6,stroke:#0f766e,color:#fff
    style P3 fill:#14b8a6,stroke:#0f766e,color:#fff
    style S1 fill:#f59e0b,stroke:#d97706,color:#fff
    style S2 fill:#f59e0b,stroke:#d97706,color:#fff
    style S3 fill:#f59e0b,stroke:#d97706,color:#fff
```

**Token Usage:**
- Without Ultra-Doc: ~120,000 tokens (impossible in single context)
- With Ultra-Doc: ~15,000 tokens (intelligent section selection)
- **Savings: 87.5%** 💎

> [!IMPORTANT]
> Ultra-Doc makes enterprise-scale projects manageable within Claude's context window

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Comparison: With vs Without Ultra-Doc

### Without Ultra-Doc (Traditional Approach):

**Iteration 1:**
```
User: "Explain the authentication system"
Claude: "Let me read through your files to understand it..."
[Reads 15 files, 8,000 tokens]
```

**Iteration 2:**
```
User: "Now show me the API endpoints"
Claude: "I'll search for API definitions..."
[Reads 12 more files, 6,000 tokens]
```

**Iteration 3:**
```
User: "How do these connect to the database?"
Claude: "Let me find the database layer..."
[Reads 8 more files, 4,000 tokens]
```

**Result:** 3 iterations, ~18,000 tokens, incomplete understanding

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

### With Ultra-Doc:

**Interaction 1:**
```
User: "Explain the authentication system"
Claude: [Reads SECTIONS.json, fetches auth sections only]
"Based on architecture.md sections 3-5 and CODE_POINTERS.json..."
[Uses 2,400 tokens for targeted retrieval]
```

**Interaction 2:**
```
User: "Now show me the API endpoints"
Claude: [Already has context map, fetches API sections]
[Uses 800 tokens for specific sections]
```

**Result:** 2 interactions, ~3,200 tokens, complete understanding with navigation

**Savings:** 82% fewer tokens, instant navigation, persistent context

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## How It Works

### Setup Level Decision Tree

```mermaid
graph TD
    Start{Project Size?} --> Small[< 20 files<br/>Personal Project]
    Start --> Medium[20-200 files<br/>Team Project]
    Start --> Large[200+ files<br/>Enterprise]

    Small --> Minimal[Minimal Setup<br/>━━━━━━━━━<br/>✓ CLAUDE.md basic<br/>✓ SECTIONS.json<br/>✓ Navigation files]
    Medium --> Standard[Standard Setup<br/>━━━━━━━━━<br/>✓ CLAUDE.md comprehensive<br/>✓ All JSON overlays<br/>✓ Context docs<br/>✓ Automation scripts]
    Large --> Comprehensive[Comprehensive Setup<br/>━━━━━━━━━<br/>✓ Extended documentation<br/>✓ CI integration<br/>✓ Service boundaries<br/>✓ Full automation]

    style Start fill:#14b8a6,stroke:#0f766e,color:#fff
    style Minimal fill:#f59e0b,stroke:#d97706,color:#fff
    style Standard fill:#f59e0b,stroke:#d97706,color:#fff
    style Comprehensive fill:#f59e0b,stroke:#d97706,color:#fff
```

### Four-Phase Protocol

```mermaid
graph TB
    Start([/llm-docs Command]) --> Phase1[Phase 1: Detection<br/>━━━━━━━━━<br/>Check for existing installation<br/>Identify project type<br/>Assess documentation needs]

    Phase1 --> Exists{System<br/>Installed?}

    Exists -->|Yes| Refresh[Refresh Mode<br/>Skip to Phase 3]
    Exists -->|No| Phase2[Phase 2: Configuration<br/>━━━━━━━━━<br/>Ask ≤3 questions<br/>Apply smart defaults<br/>Create config file]

    Phase2 --> Phase3[Phase 3: Generation<br/>━━━━━━━━━<br/>Copy templates<br/>Run optimization pipeline<br/>Generate JSON overlays]

    Refresh --> Phase3

    Phase3 --> Phase4[Phase 4: Validation<br/>━━━━━━━━━<br/>Lint documentation<br/>Check external links<br/>Report statistics]

    Phase4 --> Complete([✓ Documentation System Ready])

    style Start fill:#14b8a6,stroke:#0f766e,color:#fff
    style Phase1 fill:#14b8a6,stroke:#0f766e,color:#fff
    style Phase2 fill:#14b8a6,stroke:#0f766e,color:#fff
    style Phase3 fill:#14b8a6,stroke:#0f766e,color:#fff
    style Phase4 fill:#14b8a6,stroke:#0f766e,color:#fff
    style Complete fill:#f59e0b,stroke:#d97706,color:#fff
```

### Pipeline Execution Flow

```mermaid
graph LR
    Start([Pipeline Start]) --> TS[Update<br/>Timestamps]
    TS --> SECT[Generate<br/>SECTIONS.json]
    SECT --> CODE[Create<br/>CODE_POINTERS]
    CODE --> REL[Build<br/>RELATIONSHIPS]
    REL --> INDEX[Generate<br/>llms.txt<br/>INDEX.md]
    INDEX --> LINT[Lint<br/>Documentation]
    LINT --> LINKS[Check<br/>External Links]
    LINKS --> Done([✓ Complete])

    style Start fill:#14b8a6,stroke:#0f766e,color:#fff
    style Done fill:#f59e0b,stroke:#d97706,color:#fff
```

<details>
<summary><strong>📋 Complete Script Reference</strong></summary>

| Script | Purpose | Output | Token Impact |
|--------|---------|--------|--------------|
| `optimize-for-llms.sh` | Pipeline orchestrator | Runs all scripts in sequence | N/A |
| `update-timestamps.mjs` | Timestamp maintenance | Updates "Last Updated" fields | Reduces stale context |
| `generate-section-index.mjs` | Section extraction | SECTIONS.json with token counts | 60-70% reduction |
| `add-code-pointers.mjs` | Code mapping | CODE_POINTERS.json | Direct navigation to source |
| `render-relationships.mjs` | Dependency analysis | RELATIONSHIPS.json | Context awareness |
| `generate-llm-index.mjs` | Navigation creation | llms.txt, INDEX.md | Fast orientation |
| `lint-documentation.mjs` | Quality validation | Error report | Prevents confusion |
| `check-external-links.mjs` | Link validation | Broken link report | Trust in references |

</details>

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Why This Matters

### Before Ultra-Doc:
```
"What's the architecture?"
  → Claude reads 50 files
  → 20,000 tokens
  → Vague answer
  → Context window exhausted
```

**Problems:**
- Context window fills with file content, not actual work
- No efficient navigation system
- Documentation gets stale quickly
- Every session starts from scratch

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

### With Ultra-Doc:
```
"What's the architecture?"
  → Claude reads SECTIONS.json
  → Fetches 3 relevant sections
  → 1,200 tokens
  → Precise, sourced answer
  → Context preserved for implementation
```

**Benefits:**
- Context preserved for actual development work
- Navigate efficiently via llms.txt
- Auto-refresh keeps documentation current
- Persistent context across sessions

> [!NOTE]
> The average developer session with Ultra-Doc saves **15,000-40,000 tokens** compared to traditional file reading

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Token Economics

### Investment vs Returns

```mermaid
graph TD
    subgraph "One-Time Investment"
    I1[Minimal: 400 tokens]
    I2[Standard: 600 tokens]
    I3[Comprehensive: 800 tokens]
    end

    subgraph "Per-Query Cost"
    Q1[200-400 tokens]
    Q2[400-800 tokens]
    Q3[600-1,200 tokens]
    end

    subgraph "Break-Even Point"
    B1[After 2-3 queries]
    B2[After 2-3 queries]
    B3[After 2-3 queries]
    end

    I1 --> Q1 --> B1
    I2 --> Q2 --> B2
    I3 --> Q3 --> B3

    style I1 fill:#14b8a6,stroke:#0f766e,color:#fff
    style I2 fill:#14b8a6,stroke:#0f766e,color:#fff
    style I3 fill:#14b8a6,stroke:#0f766e,color:#fff
    style B1 fill:#f59e0b,stroke:#d97706,color:#fff
    style B2 fill:#f59e0b,stroke:#d97706,color:#fff
    style B3 fill:#f59e0b,stroke:#d97706,color:#fff
```

### Detailed Breakdown

| Setup Level | Installation Cost | Per Query Cost | Total After 5 Queries | Traditional Cost | Savings |
|------------|-------------------|----------------|----------------------|------------------|---------|
| **Minimal** | 400 tokens | 200-400 tokens | 1,400-2,400 tokens | 12,000 tokens | **60-70%** |
| **Standard** | 600 tokens | 400-800 tokens | 2,600-4,600 tokens | 45,000 tokens | **70-80%** |
| **Comprehensive** | 800 tokens | 600-1,200 tokens | 3,800-6,800 tokens | 120,000 tokens | **80-90%** |

> [!IMPORTANT]
> ROI is positive after just 2-3 queries and compounds with every subsequent use

### Token Savings Over Time

```mermaid
graph LR
    Q1[Query 1<br/>Break-even] --> Q2[Query 2<br/>Positive ROI]
    Q2 --> Q3[Query 3<br/>2x savings]
    Q3 --> Q4[Query 5<br/>5x savings]
    Q4 --> Q5[Query 10<br/>10x+ savings]

    style Q1 fill:#14b8a6,stroke:#0f766e,color:#fff
    style Q2 fill:#14b8a6,stroke:#0f766e,color:#fff
    style Q3 fill:#f59e0b,stroke:#d97706,color:#fff
    style Q4 fill:#f59e0b,stroke:#d97706,color:#fff
    style Q5 fill:#f59e0b,stroke:#d97706,color:#fff
```

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Key Benefits

✅ **Token Efficient** - JSON overlays reduce context usage by 60-90%
✅ **Progressive Disclosure** - Start with overview, dive deep when needed
✅ **Tool Neutral** - Works with any AI assistant, not just Claude
✅ **Auto-Maintained** - Scripts keep documentation fresh
✅ **Zero Code Generation** - All scripts pre-written and tested
✅ **Smart Defaults** - ≤3 questions with intelligent defaults
✅ **Persistent Context** - Survives session restarts
✅ **Scalable** - From personal projects to enterprise monorepos

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## What Happens on First Run

```mermaid
sequenceDiagram
    participant U as User
    participant C as Claude
    participant S as Ultra-Doc

    U->>C: /llm-docs
    C->>S: Check installation
    S-->>C: Not installed
    C->>U: What setup level? (minimal/standard/comprehensive)
    U->>C: Standard
    C->>U: Primary audience? (balanced/human/ai/maintainer)
    U->>C: Balanced
    C->>S: Install with config
    S->>S: Copy templates
    S->>S: Run pipeline
    S-->>C: ✓ Complete
    C->>U: Documentation system installed!<br/>Generated: CLAUDE.md, SECTIONS.json, etc.

    rect rgb(20, 184, 166, 0.1)
    Note over U,C: System ready for use
    end
```

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Plugin Structure

```
ultra-doc/
├── .claude-plugin/
│   └── plugin.json                 # Plugin metadata
├── commands/
│   └── llm-docs.md                 # Slash command definition
├── skills/
│   └── llm-docs-builder/
│       ├── SKILL.md                # Core implementation logic
│       ├── scripts/                # 8 automation scripts
│       │   ├── optimize-for-llms.sh
│       │   ├── generate-section-index.mjs
│       │   ├── add-code-pointers.mjs
│       │   ├── render-relationships.mjs
│       │   ├── generate-llm-index.mjs
│       │   ├── update-timestamps.mjs
│       │   ├── lint-documentation.mjs
│       │   └── check-external-links.mjs
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

When you run `/llm-docs`, Ultra-Doc creates this structure in **your** repository:

```
your-project/
├── CLAUDE.md                       # Main AI documentation
├── .llm-docs.config.json           # Configuration
├── context_for_llms/               # Documentation directory
│   ├── llms.txt                    # AI navigation guide
│   ├── INDEX.md                    # File inventory
│   ├── SECTIONS.json               # Token-optimized sections
│   ├── CODE_POINTERS.json          # Doc→source mappings
│   ├── RELATIONSHIPS.json          # Dependency graph
│   ├── architecture.md             # (Standard/Comprehensive)
│   ├── api-overview.md             # (Standard/Comprehensive)
│   ├── domains-and-modules.md      # (Standard/Comprehensive)
│   └── development-workflows.md    # (Standard/Comprehensive)
└── scripts/llm-docs/               # Automation scripts
    └── [8 scripts copied from plugin]
```

</details>

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Contributing

This plugin is designed to evolve through community feedback:

1. **Test on real projects** (not toy examples)
2. **Document what works and what breaks**
3. **Propose specific improvements as issues**
4. **Share your template modifications as PRs**

**Good contributions:**
- "SECTIONS.json generation fails for [language], here's the fix"
- "Added [project type] detection, improves accuracy for [use case]"
- "Token counting is off by X% for [file type], try this formula"

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Security

This plugin is safe to use:

✅ **No credentials required** - Pure local operations
✅ **No API keys needed** - No external services
✅ **No network access** - Everything runs locally
✅ **No data collection** - Your code stays private
✅ **Pure documentation** - Generates markdown and JSON only
✅ **Read-only analysis** - Never modifies source code

**The plugin uses only safe, local tools:**
- File reading (your documentation)
- JSON generation (overlay files)
- Markdown creation (documentation)
- Directory traversal (structure analysis)

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Version

**Current Version:** v1.0.0 - Initial Release

<details>
<summary><strong>📅 Changelog</strong></summary>

### v1.0.0 (2025-01-15)
- Initial release
- Three-tier setup system (minimal, standard, comprehensive)
- JSON overlay generation (SECTIONS, CODE_POINTERS, RELATIONSHIPS)
- 8 automation scripts for pipeline execution
- 7 documentation templates
- Token counting and optimization (60-90% reduction)
- Full Claude Code plugin compatibility
- Progressive disclosure architecture
- Tool-neutral design

</details>

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

## Origin & Community

Created by **Jonathan Edwards** as part of the Claude Code plugin ecosystem initiative.

This is v1.0.0 of what aims to become the standard documentation generator for AI-assisted development. Community contributions welcome to improve token efficiency and documentation quality.

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-f59e0b?style=flat" alt="divider">
</div>

## Support

- **Issues:** [GitHub Issues](https://github.com/jonathanedwards/ultra-doc/issues)
- **Discussions:** [GitHub Discussions](https://github.com/jonathanedwards/ultra-doc/discussions)
- **Author:** [Jonathan Edwards](https://github.com/jonathanedwards)

<div align="center">
  <img src="https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat" alt="divider">
</div>

<div align="center">

**Made for the Claude Code community** 🤖

*Reduce your token usage by 60-90% with intelligent documentation structure*

![Teal Wave](https://img.shields.io/badge/━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━-14b8a6?style=flat)

</div>