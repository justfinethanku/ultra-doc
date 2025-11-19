# Ultra-Doc Documentation

Last Updated: 2025-11-19

## Welcome

This documentation provides comprehensive guidance for understanding and working with Ultra-Doc. It's designed to be useful for both human developers and AI assistants.

## For AI Assistants

If you're an AI assistant helping with this project, follow this workflow:

1. **Read this file first** - Understand the project structure and goals
2. **Use JSON overlays for efficiency**:
   - `context_for_llms/SECTIONS.json` - Token-optimized content sections
   - `context_for_llms/CODE_POINTERS.json` - Documentation → source code mappings
   - `context_for_llms/RELATIONSHIPS.json` - Dependency graph and relationships
3. **Navigate with INDEX.md** - Quick file reference and statistics
4. **Read llms.txt** - AI assistant navigation guide

### Best Practices for AI Context

- **Prefer SECTIONS.json** over reading entire files (saves tokens)
- **Use CODE_POINTERS.json** to find relevant source files
- **Check RELATIONSHIPS.json** to understand dependencies
- **Follow the documentation structure** outlined below

## Project Overview

Ultra-Doc is an AI-driven documentation system that analyzes, writes, maintains, and validates documentation automatically. It detects code changes, finds errors, and keeps docs perfectly synced with your codebase.

### What This Project Does

It solves the "Context Rot" problem by maintaining two synchronized sets of documentation:
1. **Machine-Optimized**: Token-efficient, structured data for AI.
2. **Human-Readable**: Narrative-driven "Mike Dion" files for people.

### Key Features

- **Dual-Track Documentation**: Machine specs + Human narratives.
- **Automated Sync**: Detects changes and updates metadata/content.
- **Narrow Path Validation**: Validates accuracy using explicit code pointers.
- **Self-Healing**: Auto-fixes linting and factual errors.

## Architecture

For detailed architecture information, see [`context_for_llms/architecture.md`](context_for_llms/architecture.md).

### High-Level Components

- **Orchestrator**: Manages the interactive decision tree.
- **Sync Engine**: Updates metadata and generates overlays.
- **Analyzers**: Assess documentation health and coverage.
- **Generators**: Create human docs, changelogs, and reports.

### Technology Stack

- **Language**: Node.js (ES Modules)
- **Format**: Markdown + JSON Overlays
- **Runtime**: Claude Code / Bash

## Getting Started

### Installation

```bash
/plugin marketplace add justfinethanku/ultra-doc
/plugin install ultra-doc@ultra-doc-marketplace
```

### Usage

Run the main command to analyze and fix documentation:

```bash
/ultra-doc
```

## Documentation Structure

### Core Files

- **CLAUDE.md** (this file) - Main entry point and project overview
- **context_for_llms/** - AI-optimized documentation directory

### Context Documentation

- **llms.txt** - AI assistant navigation guide
- **INDEX.md** - File inventory with statistics
- **architecture.md** - System architecture and design decisions
- **api-overview.md** - Script reference and command usage
- **workflows.md** - Sync and translation workflows

### JSON Overlays

These files provide structured, queryable metadata:

- **SECTIONS.json** - Token-optimized content sections with metadata
- **CODE_POINTERS.json** - Mappings from documentation to source code
- **RELATIONSHIPS.json** - Dependencies and relationship graph

## Contributing

We welcome contributions! Please:

1. Read the [workflows](context_for_llms/workflows.md)
2. Run `/ultra-doc` to validate your changes
3. Update documentation as needed

## License

MIT
