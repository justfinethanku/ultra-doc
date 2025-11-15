# Project Documentation

Last Updated: {{DATE}}

## Welcome

This documentation provides comprehensive guidance for understanding and working with this project. It's designed to be useful for both human developers and AI assistants.

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

{{PROJECT_DESCRIPTION}}

### What This Project Does

{{PROJECT_PURPOSE}}

### Key Features

- {{FEATURE_1}}
- {{FEATURE_2}}
- {{FEATURE_3}}

## Architecture

For detailed architecture information, see [`context_for_llms/architecture.md`](context_for_llms/architecture.md).

### High-Level Components

{{COMPONENT_OVERVIEW}}

### Technology Stack

- **Language**: {{LANGUAGE}}
- **Framework**: {{FRAMEWORK}}
- **Database**: {{DATABASE}}
- **Key Dependencies**: See `context_for_llms/RELATIONSHIPS.json`

## Getting Started

### Prerequisites

- {{PREREQUISITE_1}}
- {{PREREQUISITE_2}}
- {{PREREQUISITE_3}}

### Installation

```bash
# Clone the repository
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Install dependencies
{{INSTALL_COMMAND}}

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run setup
{{SETUP_COMMAND}}
```

### First Steps

1. Review the [architecture documentation](context_for_llms/architecture.md)
2. Explore [domains and modules](context_for_llms/domains-and-modules.md)
3. Check the [API overview](context_for_llms/api-overview.md)
4. Read [development workflows](context_for_llms/development-workflows.md)

## Documentation Structure

### Core Files

- **CLAUDE.md** (this file) - Main entry point and project overview
- **context_for_llms/** - AI-optimized documentation directory

### Context Documentation

- **llms.txt** - AI assistant navigation guide
- **INDEX.md** - File inventory with statistics
- **architecture.md** - System architecture and design decisions
- **domains-and-modules.md** - Domain models and module breakdown
- **api-overview.md** - API endpoints and usage
- **development-workflows.md** - Development processes and workflows

### JSON Overlays

These files provide structured, queryable metadata:

- **SECTIONS.json** - Token-optimized content sections with metadata
- **CODE_POINTERS.json** - Mappings from documentation to source code
- **RELATIONSHIPS.json** - Dependencies and relationship graph

## Key Concepts

### {{CONCEPT_1}}

Detailed explanation of the first key concept, including:
- What it is
- Why it matters
- How it works
- Related concepts

See also: [{{RELATED_DOC}}](context_for_llms/{{RELATED_DOC}}.md)

### {{CONCEPT_2}}

Detailed explanation of the second key concept.

### {{CONCEPT_3}}

Detailed explanation of the third key concept.

## Common Tasks

### {{TASK_1}}

Step-by-step guide for the first common task:

```bash
# Example command
{{EXAMPLE_COMMAND_1}}
```

### {{TASK_2}}

Step-by-step guide for the second common task:

```bash
# Example command
{{EXAMPLE_COMMAND_2}}
```

### {{TASK_3}}

Step-by-step guide for the third common task.

## Development Workflow

For detailed workflows, see [`context_for_llms/development-workflows.md`](context_for_llms/development-workflows.md).

### Quick Reference

1. Create a feature branch
2. Make your changes
3. Run tests: `{{TEST_COMMAND}}`
4. Commit with descriptive message
5. Push and create pull request

## API Reference

For complete API documentation, see [`context_for_llms/api-overview.md`](context_for_llms/api-overview.md).

### Quick Examples

```{{LANGUAGE}}
// Example API usage
{{API_EXAMPLE}}
```

## Testing

```bash
# Run all tests
{{TEST_COMMAND}}

# Run specific test suite
{{TEST_SUITE_COMMAND}}

# Generate coverage report
{{COVERAGE_COMMAND}}
```

## Deployment

{{DEPLOYMENT_OVERVIEW}}

## Troubleshooting

### Common Issues

**Issue**: {{COMMON_ISSUE_1}}
**Solution**: {{SOLUTION_1}}

**Issue**: {{COMMON_ISSUE_2}}
**Solution**: {{SOLUTION_2}}

## Resources

- [Project Repository]({{REPO_URL}})
- [Documentation]({{DOCS_URL}})
- [Issue Tracker]({{ISSUES_URL}})
- [Contributing Guidelines]({{CONTRIBUTING_URL}})

## Contributing

We welcome contributions! Please:

1. Read the [development workflows](context_for_llms/development-workflows.md)
2. Check existing issues and PRs
3. Follow the coding standards
4. Write tests for new features
5. Update documentation as needed

## License

{{LICENSE}}

---

*This documentation is maintained automatically using LLM-optimized scripts. Last updated: {{DATE}}*

*For AI assistants: Use the JSON overlays in `context_for_llms/` for efficient context retrieval.*
