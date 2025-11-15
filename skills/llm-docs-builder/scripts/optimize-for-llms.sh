#!/bin/bash
set -euo pipefail

# LLM Documentation Pipeline Orchestrator
# Runs all documentation generation and optimization steps

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Starting LLM documentation optimization pipeline..."
echo ""

# Step 1: Update timestamps in documentation files
echo "📅 Updating timestamps..."
node "$SCRIPT_DIR/update-timestamps.mjs"
echo "✓ Timestamps updated"
echo ""

# Step 2: Generate section index from markdown files
echo "📑 Generating section index..."
node "$SCRIPT_DIR/generate-section-index.mjs"
echo "✓ Section index generated"
echo ""

# Step 3: Add code pointers mapping docs to source files
echo "🔗 Adding code pointers..."
node "$SCRIPT_DIR/add-code-pointers.mjs"
echo "✓ Code pointers added"
echo ""

# Step 4: Render relationship graph
echo "🕸️  Rendering relationships..."
node "$SCRIPT_DIR/render-relationships.mjs"
echo "✓ Relationships rendered"
echo ""

# Step 5: Generate LLM index (llms.txt and INDEX.md)
echo "🤖 Generating LLM index..."
node "$SCRIPT_DIR/generate-llm-index.mjs"
echo "✓ LLM index generated"
echo ""

# Step 6: Lint documentation for quality
echo "✨ Linting documentation..."
node "$SCRIPT_DIR/lint-documentation.mjs"
echo "✓ Documentation linted"
echo ""

# Step 7: Check external links
echo "🔍 Checking external links..."
node "$SCRIPT_DIR/check-external-links.mjs"
echo "✓ External links checked"
echo ""

echo "✨ Documentation optimization complete!"
echo ""
echo "📊 Generated files in context_for_llms/:"
echo "   - SECTIONS.json (token-optimized content sections)"
echo "   - CODE_POINTERS.json (docs → source mappings)"
echo "   - RELATIONSHIPS.json (dependency graph)"
echo "   - llms.txt (AI assistant navigation)"
echo "   - INDEX.md (file inventory)"
