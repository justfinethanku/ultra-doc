# Project Documentation

Last Updated: {{DATE}}

## Table of Contents

- [Welcome](#welcome)
- [For AI Assistants](#for-ai-assistants)
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Documentation Structure](#documentation-structure)
- [Key Concepts](#key-concepts)
- [Development Guide](#development-guide)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Welcome

This comprehensive documentation provides everything you need to understand, develop, and maintain this project. It's designed to serve both human developers and AI assistants with structured, queryable information.

## For AI Assistants

If you're an AI assistant helping with this project, here's your optimal workflow:

### Quick Start for AI

1. **Read this file first** - Get the complete project context
2. **Use JSON overlays** for efficient, token-optimized access:
   - `context_for_llms/SECTIONS.json` - Query specific content sections
   - `context_for_llms/CODE_POINTERS.json` - Find source files for any topic
   - `context_for_llms/RELATIONSHIPS.json` - Understand dependencies and relationships
3. **Navigate efficiently** using `llms.txt` and `INDEX.md`
4. **Reference topic-specific docs** as needed from `context_for_llms/`

### AI Assistant Best Practices

**Token Optimization:**
- Always prefer SECTIONS.json over reading entire markdown files
- Query specific sections by heading or topic
- Use CODE_POINTERS.json to locate relevant source files

**Context Building:**
- Start with RELATIONSHIPS.json to understand dependencies
- Check INDEX.md for file statistics and modification dates
- Read topic-specific docs only when needed for the current task

**Code Navigation:**
- Use CODE_POINTERS.json to map documentation topics to source code
- Follow the relationship graph to understand module dependencies
- Consult architecture.md for design decisions and patterns

### JSON Overlay Schema

**SECTIONS.json Structure:**
```json
{
  "generated": "ISO timestamp",
  "total_sections": "number",
  "total_tokens": "estimated tokens",
  "sections": [
    {
      "file": "filename.md",
      "heading": "Section Title",
      "level": 1-6,
      "line": "line number",
      "content": "section text",
      "tokens": "estimated tokens",
      "lines": "line count"
    }
  ]
}
```

**CODE_POINTERS.json Structure:**
```json
{
  "generated": "ISO timestamp",
  "total_source_files": "number",
  "total_mappings": "number",
  "mappings": {
    "doc-file.md": {
      "source-file.js": ["reason 1", "reason 2"]
    }
  }
}
```

**RELATIONSHIPS.json Structure:**
```json
{
  "generated": "ISO timestamp",
  "project_type": "nodejs|python|etc",
  "dependencies": {
    "total": "number",
    "production": "number",
    "development": "number",
    "list": [...]
  },
  "documentation_relationships": {...},
  "dependency_graph": {...}
}
```

## Project Overview

{{PROJECT_DESCRIPTION}}

### Mission Statement

{{MISSION_STATEMENT}}

### What This Project Does

{{PROJECT_PURPOSE}}

### Target Users

- {{USER_TYPE_1}}
- {{USER_TYPE_2}}
- {{USER_TYPE_3}}

### Key Features

1. **{{FEATURE_1}}** - {{FEATURE_1_DESCRIPTION}}
2. **{{FEATURE_2}}** - {{FEATURE_2_DESCRIPTION}}
3. **{{FEATURE_3}}** - {{FEATURE_3_DESCRIPTION}}
4. **{{FEATURE_4}}** - {{FEATURE_4_DESCRIPTION}}

### Design Philosophy

{{DESIGN_PHILOSOPHY}}

## Architecture

For comprehensive architecture documentation, see [`context_for_llms/architecture.md`](context_for_llms/architecture.md).

### System Architecture

{{ARCHITECTURE_OVERVIEW}}

### Core Components

#### {{COMPONENT_1}}

**Purpose**: {{COMPONENT_1_PURPOSE}}

**Responsibilities**:
- {{RESPONSIBILITY_1}}
- {{RESPONSIBILITY_2}}

**Key Files**: See CODE_POINTERS.json for mappings

#### {{COMPONENT_2}}

**Purpose**: {{COMPONENT_2_PURPOSE}}

**Responsibilities**:
- {{RESPONSIBILITY_1}}
- {{RESPONSIBILITY_2}}

#### {{COMPONENT_3}}

**Purpose**: {{COMPONENT_3_PURPOSE}}

### Technology Stack

**Core Technologies:**
- **Language**: {{LANGUAGE}} ({{VERSION}})
- **Runtime**: {{RUNTIME}}
- **Framework**: {{FRAMEWORK}}
- **Database**: {{DATABASE}}
- **Cache**: {{CACHE}}

**Build Tools:**
- {{BUILD_TOOL_1}}
- {{BUILD_TOOL_2}}

**Testing:**
- {{TEST_FRAMEWORK}}
- {{TEST_RUNNER}}

**Dependencies:**
See `context_for_llms/RELATIONSHIPS.json` for complete dependency graph.

### Data Flow

{{DATA_FLOW_DESCRIPTION}}

### Design Patterns

- **{{PATTERN_1}}**: {{PATTERN_1_USAGE}}
- **{{PATTERN_2}}**: {{PATTERN_2_USAGE}}
- **{{PATTERN_3}}**: {{PATTERN_3_USAGE}}

## Getting Started

### Prerequisites

**Required:**
- {{PREREQUISITE_1}} (version {{VERSION_1}}+)
- {{PREREQUISITE_2}} (version {{VERSION_2}}+)
- {{PREREQUISITE_3}}

**Optional:**
- {{OPTIONAL_1}}
- {{OPTIONAL_2}}

### Installation

```bash
# Clone the repository
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Install dependencies
{{INSTALL_COMMAND}}

# Set up environment
cp .env.example .env

# Configure environment variables
# Edit .env with:
# - {{ENV_VAR_1}}
# - {{ENV_VAR_2}}
# - {{ENV_VAR_3}}

# Run initial setup
{{SETUP_COMMAND}}

# Verify installation
{{VERIFY_COMMAND}}
```

### Quick Start

```bash
# Start development server
{{DEV_COMMAND}}

# In another terminal, run tests
{{TEST_COMMAND}}

# Access the application at {{DEV_URL}}
```

### First Steps

1. **Understand the architecture** - Read [architecture.md](context_for_llms/architecture.md)
2. **Explore the codebase** - Check [domains-and-modules.md](context_for_llms/domains-and-modules.md)
3. **Learn the API** - Review [api-overview.md](context_for_llms/api-overview.md)
4. **Follow workflows** - Read [development-workflows.md](context_for_llms/development-workflows.md)

## Documentation Structure

### Core Documentation

- **CLAUDE.md** (this file) - Comprehensive project guide
- **README.md** - Quick project introduction
- **CONTRIBUTING.md** - Contribution guidelines
- **CHANGELOG.md** - Version history

### Context Documentation (`context_for_llms/`)

**Navigation Files:**
- **llms.txt** - AI assistant navigation guide
- **INDEX.md** - File inventory with statistics and metadata

**Topic Documentation:**
- **architecture.md** - System architecture and design decisions
- **domains-and-modules.md** - Domain models and module organization
- **api-overview.md** - API endpoints, parameters, and examples
- **development-workflows.md** - Development processes and best practices

**JSON Overlays:**
- **SECTIONS.json** - Token-optimized content sections
- **CODE_POINTERS.json** - Documentation → source code mappings
- **RELATIONSHIPS.json** - Dependencies and relationship graph

### Source Code Structure

```
{{PROJECT_STRUCTURE}}
```

## Key Concepts

### {{CONCEPT_1}}

**Overview**: {{CONCEPT_1_OVERVIEW}}

**Key Points:**
- {{KEY_POINT_1}}
- {{KEY_POINT_2}}
- {{KEY_POINT_3}}

**Implementation Details:**
{{CONCEPT_1_DETAILS}}

**Related Concepts**: {{CONCEPT_1_RELATED}}

**Source Code**: See CODE_POINTERS.json for relevant files

### {{CONCEPT_2}}

**Overview**: {{CONCEPT_2_OVERVIEW}}

**Key Points:**
- {{KEY_POINT_1}}
- {{KEY_POINT_2}}

### {{CONCEPT_3}}

**Overview**: {{CONCEPT_3_OVERVIEW}}

## Development Guide

For detailed development workflows, see [`context_for_llms/development-workflows.md`](context_for_llms/development-workflows.md).

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/{{FEATURE_NAME}}
   ```

2. **Make changes**
   - Follow coding standards
   - Write tests
   - Update documentation

3. **Run quality checks**
   ```bash
   {{LINT_COMMAND}}
   {{TEST_COMMAND}}
   {{TYPE_CHECK_COMMAND}}
   ```

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: {{DESCRIPTION}}"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/{{FEATURE_NAME}}
   ```

### Coding Standards

- {{STANDARD_1}}
- {{STANDARD_2}}
- {{STANDARD_3}}

### Code Organization

- {{ORG_PRINCIPLE_1}}
- {{ORG_PRINCIPLE_2}}

### Git Workflow

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

**Commit Messages:**
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring

## API Reference

For complete API documentation, see [`context_for_llms/api-overview.md`](context_for_llms/api-overview.md).

### API Overview

**Base URL**: {{API_BASE_URL}}

**Authentication**: {{AUTH_METHOD}}

**Rate Limiting**: {{RATE_LIMIT}}

### Quick Examples

**{{ENDPOINT_1}}**
```{{LANGUAGE}}
{{API_EXAMPLE_1}}
```

**{{ENDPOINT_2}}**
```{{LANGUAGE}}
{{API_EXAMPLE_2}}
```

## Testing

### Test Organization

- **Unit tests**: `{{UNIT_TEST_PATH}}`
- **Integration tests**: `{{INTEGRATION_TEST_PATH}}`
- **E2E tests**: `{{E2E_TEST_PATH}}`

### Running Tests

```bash
# All tests
{{TEST_COMMAND}}

# Unit tests only
{{UNIT_TEST_COMMAND}}

# Integration tests
{{INTEGRATION_TEST_COMMAND}}

# E2E tests
{{E2E_TEST_COMMAND}}

# With coverage
{{COVERAGE_COMMAND}}

# Watch mode
{{WATCH_COMMAND}}
```

### Writing Tests

{{TEST_GUIDELINES}}

## Deployment

### Environments

- **Development**: {{DEV_ENV_URL}}
- **Staging**: {{STAGING_ENV_URL}}
- **Production**: {{PROD_ENV_URL}}

### Deployment Process

{{DEPLOYMENT_PROCESS}}

### Configuration

{{DEPLOYMENT_CONFIG}}

## Troubleshooting

### Common Issues

#### {{ISSUE_1}}

**Symptoms**: {{ISSUE_1_SYMPTOMS}}

**Cause**: {{ISSUE_1_CAUSE}}

**Solution**:
```bash
{{ISSUE_1_SOLUTION}}
```

#### {{ISSUE_2}}

**Symptoms**: {{ISSUE_2_SYMPTOMS}}

**Solution**: {{ISSUE_2_SOLUTION}}

#### {{ISSUE_3}}

**Symptoms**: {{ISSUE_3_SYMPTOMS}}

**Solution**: {{ISSUE_3_SOLUTION}}

### Debug Mode

```bash
{{DEBUG_COMMAND}}
```

### Getting Help

- Check [Issue Tracker]({{ISSUES_URL}})
- Review [Discussions]({{DISCUSSIONS_URL}})
- Contact: {{CONTACT_EMAIL}}

## Resources

### Links

- [Project Repository]({{REPO_URL}})
- [Documentation]({{DOCS_URL}})
- [Issue Tracker]({{ISSUES_URL}})
- [Contributing Guidelines]({{CONTRIBUTING_URL}})
- [Code of Conduct]({{CODE_OF_CONDUCT_URL}})
- [Security Policy]({{SECURITY_URL}})

### Related Projects

- {{RELATED_PROJECT_1}}
- {{RELATED_PROJECT_2}}

### Learning Resources

- {{LEARNING_RESOURCE_1}}
- {{LEARNING_RESOURCE_2}}

## Contributing

We welcome contributions! Here's how to get involved:

1. **Read the guides**:
   - [Development workflows](context_for_llms/development-workflows.md)
   - [Contributing guidelines]({{CONTRIBUTING_URL}})
   - [Code of conduct]({{CODE_OF_CONDUCT_URL}})

2. **Find an issue**:
   - Check [good first issues]({{ISSUES_URL}}?labels=good-first-issue)
   - Look for [help wanted]({{ISSUES_URL}}?labels=help-wanted)

3. **Make your contribution**:
   - Follow the development workflow
   - Write tests
   - Update documentation
   - Submit a pull request

## License

{{LICENSE}}

See [LICENSE](LICENSE) for full details.

---

*This comprehensive documentation is maintained automatically using LLM-optimized scripts.*

*Last updated: {{DATE}}*

*For AI assistants: This documentation uses JSON overlays for efficient context retrieval. Always prefer querying SECTIONS.json over reading entire files to minimize token usage.*
