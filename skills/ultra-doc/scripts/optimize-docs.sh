#!/bin/bash

#
# optimize-docs.sh
#
# Ultra-Doc v1.0 Pipeline Orchestrator
# Runs complete analysis, validation, and generation pipeline
#

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 Ultra-Doc Pipeline Starting...${NC}\n"

# Step 1: Track code changes
echo -e "${BLUE}Step 1/10:${NC} Tracking code changes..."
node "$SCRIPT_DIR/track-code-changes.mjs"
echo ""

# Step 2: Analyze documentation state
echo -e "${BLUE}Step 2/10:${NC} Analyzing documentation state..."
node "$SCRIPT_DIR/analyze-doc-state.mjs"
echo ""

# Step 3: Analyze code coverage
echo -e "${BLUE}Step 3/10:${NC} Analyzing code coverage..."
node "$SCRIPT_DIR/analyze-coverage.mjs"
echo ""

# Step 4: Validate accuracy
echo -e "${BLUE}Step 4/10:${NC} Validating documentation accuracy..."
node "$SCRIPT_DIR/validate-accuracy.mjs"
echo ""

# Step 5: Auto-fix linting issues
echo -e "${BLUE}Step 5/10:${NC} Auto-fixing linting issues..."
node "$SCRIPT_DIR/autofix-linting.mjs"
echo ""

# Step 6: Update timestamps
echo -e "${BLUE}Step 6/10:${NC} Updating timestamps..."
node "$SCRIPT_DIR/update-timestamps.mjs"
echo ""

# Step 7: Generate section index
echo -e "${BLUE}Step 7/10:${NC} Generating section index..."
node "$SCRIPT_DIR/generate-section-index.mjs"
echo ""

# Step 8: Add code pointers
echo -e "${BLUE}Step 8/10:${NC} Adding code pointers..."
node "$SCRIPT_DIR/add-code-pointers.mjs"
echo ""

# Step 9: Render relationships
echo -e "${BLUE}Step 9/10:${NC} Rendering relationships..."
node "$SCRIPT_DIR/render-relationships.mjs"
echo ""

# Step 10: Generate LLM index
echo -e "${BLUE}Step 10/10:${NC} Generating LLM index..."
node "$SCRIPT_DIR/generate-llm-index.mjs"
echo ""

echo -e "${GREEN}✓ Ultra-Doc Pipeline Complete!${NC}\n"

# Show summary
echo -e "${BLUE}Summary:${NC}"
echo "  Documentation analysis files generated:"
echo "    - DOC_STATE.json (documentation health)"
echo "    - COVERAGE.json (code coverage)"
echo "    - VALIDATION.json (accuracy validation)"
echo "    - SECTIONS.json (section index)"
echo "    - CODE_POINTERS.json (code mappings)"
echo "    - RELATIONSHIPS.json (dependency graph)"
echo ""
echo "  Run ${YELLOW}/ultra-doc${NC} to see analysis and choose actions."
