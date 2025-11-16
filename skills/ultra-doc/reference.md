# Ultra-Doc Technical Reference

This document contains detailed technical specifications, JSON schemas, example outputs, and comprehensive implementation details for the Ultra-Doc system.

## Table of Contents
1. [JSON Data Structures](#json-data-structures)
2. [Validation Prompt Templates](#validation-prompt-templates)
3. [Detailed Report Formats](#detailed-report-formats)
4. [Code Pointer Structure](#code-pointer-structure)
5. [Documentation Templates](#documentation-templates)
6. [Example Fixes and Outputs](#example-fixes-and-outputs)

---

## JSON Data Structures

### DOC_STATE.json
```json
{
  "generated": "2025-11-15T10:30:00Z",
  "version": "1.0.0",
  "files": {
    "context_for_llms/architecture.md": {
      "status": "current|stale|error",
      "completeness": 0.95,
      "lastUpdated": "2025-11-14T15:00:00Z",
      "linkedFiles": ["src/app.js"],
      "lastCodeChange": "2025-11-14T15:00:00Z",
      "validationNeeded": false
    }
  },
  "metrics": {
    "accuracy": 0.92,
    "coverage": 0.78,
    "freshness": 0.88
  }
}
```

### COVERAGE.json
```json
{
  "generated": "2025-11-15T10:30:00Z",
  "documented": ["src/db/", "src/api/"],
  "undocumented": [
    {
      "file": "src/utils/validator.js",
      "exports": ["validateEmail", "validatePassword"],
      "usageCount": 12,
      "priority": "high"
    }
  ],
  "coverage": 0.72
}
```

### VALIDATION.json
```json
{
  "generated": "2025-11-15T10:30:00Z",
  "errors": [
    {
      "docFile": "api-overview.md",
      "section": "Authentication",
      "claim": "JWT tokens expire after 24 hours",
      "actual": "1 hour (src/auth/config.js:12)",
      "autoFixable": true,
      "confidence": 0.98
    }
  ]
}
```

### CODE_POINTERS.json Structure
```json
{
  "architecture.md#database-layer": {
    "files": ["src/db/connection.js", "src/db/models.js"],
    "lastValidated": "2025-11-15T10:30:00Z",
    "sections": ["Connection pooling", "Schema definitions"]
  },
  "api-overview.md#authentication": {
    "files": ["src/auth/middleware.js", "src/auth/config.js"],
    "lastValidated": "2025-11-15T09:00:00Z",
    "sections": ["JWT configuration", "Auth flow"]
  }
}
```

---

## Validation Prompt Templates

### Semantic Validation Template
```
TASK: Validate documentation accuracy

DOCUMENTATION CLAIM:
File: {doc_file}
Section: {section_name}
Claim: {claim_text}

RELATED CODE:
{source_code}

VALIDATE:
1. Read the code carefully
2. Determine if documentation claim is accurate
3. If inaccurate, explain discrepancy and provide correct information

OUTPUT (JSON):
{
  "accurate": true|false,
  "confidence": 0.0-1.0,
  "explanation": "...",
  "correct_information": "..." // if inaccurate,
  "suggested_fix": "..." // if inaccurate
}
```

---

## Detailed Report Formats

### Full Analysis Report Format
```
📊 DETAILED DOCUMENTATION ANALYSIS

=== OVERVIEW ===
Total Documentation Files: 15
Total Code Files: 147
Documentation Coverage: 72%
Overall Health Score: 85/100

=== ACCURACY ===
Validations Passed: 41/47 (87%)
Factual Errors: 2
Semantic Issues: 4
Broken Examples: 0

Critical Errors:
1. api-overview.md line 45: JWT expiration time incorrect
   Expected: 1 hour (src/auth/config.js:12)
   Found: 24 hours

2. getting-started.md line 23: references deleted function
   Function: app.start()
   Deleted in: commit abc123 (7 days ago)
   Should use: app.listen(port)

=== FRESHNESS ===
Up-to-Date: 12 files
Stale: 3 files

Stale Files:
1. architecture.md (last updated 14 days ago)
   Referenced code changed 4 days ago:
   - src/auth/middleware.js (breaking change)

2. api-overview.md (last updated 7 days ago)
   Referenced code changed 2 days ago:
   - src/api/users.js (new endpoints added)

=== COVERAGE ===
Documented Files: 106/147 (72%)
Undocumented Files: 41

High-Priority Undocumented (by usage):
1. src/utils/validator.js (used in 12 files)
   - validateEmail, validatePassword, sanitizeInput

2. src/utils/date-helper.js (used in 8 files)
   - formatDate, parseDate, isValidDate

=== RECOMMENDATIONS ===
1. Fix 2 critical errors immediately (auto-fixable)
2. Update 3 stale documentation files
3. Document high-priority utilities (validator, date-helper)
4. Consider enhancing sparse sections in domains.md

Run /ultra-doc and choose an action to address these items.
```

### Findings Presentation Format
```
📊 DOCUMENTATION ANALYSIS

Status: [Healthy | Needs Attention | Critical Issues]

✓ GOOD:
  • 15 documentation files up to date
  • No structural errors
  • 85% code coverage

⚠ ISSUES FOUND:
  • 3 files changed but docs not updated
    - src/auth/middleware.js (changed 4 days ago)
    - src/api/users.js (changed 2 days ago)
    - src/utils/validator.js (changed 1 day ago)

  • 2 accuracy errors detected
    - api-overview.md: JWT expiration wrong (says 24h, actually 1h)
    - getting-started.md: code example uses deleted function

  • 5 functions undocumented
    - src/utils/date-helper.js: formatDate, parseDate
    - src/api/users.js: createUser, updateUser, deleteUser

METRICS:
  Accuracy: 87% (↓ 3% from last check)
  Coverage: 72%
  Freshness: 84% (3 stale files)
```

### Action Completion Report Format
```
✓ COMPLETED: Fix Critical Errors

CHANGES MADE:
  • Fixed 2 accuracy errors
    - api-overview.md: Corrected JWT expiration (24h → 1h)
    - getting-started.md: Updated code example (app.start → app.listen)

  • Fixed 5 linting issues
    - Added missing code block languages (3 files)
    - Fixed heading structure (2 files)

VALIDATION:
  Accuracy: 87% → 100% ✓
  All tests passing

COMMITTED:
  fix(docs): correct 2 critical documentation errors

  - JWT expiration time (src/auth/config.js:12)
  - Getting started code example (app.listen)

Documentation is now healthy!
```

---

## Documentation Templates

### Function Documentation Template
```markdown
### `functionName(param1, param2)`

[One-line description of what it does]

**Location:** `src/path/to/file.js`

**Parameters:**
- `param1` (type): Description
- `param2` (type): Description

**Returns:** (type) Description

**Example:**
\`\`\`javascript
// Example usage from actual codebase
const result = functionName('value1', 'value2');
\`\`\`

**Notes:**
- [Any edge cases, gotchas, or important details]

**Used by:** [List files that import this, if high usage]
```

---

## Example Fixes and Outputs

### Example Fix Workflow

**VALIDATION.json Input:**
```json
{
  "doc_file": "api-overview.md",
  "section": "Authentication",
  "claim": "JWT tokens expire after 24 hours",
  "actual": "JWT tokens expire after 1 hour (src/auth/config.js:12)",
  "auto_fixable": true,
  "confidence": 0.98
}
```

**AI Actions:**
1. Read api-overview.md
2. Find: "JWT tokens are valid for 24 hours before requiring refresh"
3. Read src/auth/config.js:12 → `const JWT_EXPIRY = '1h';`
4. Update: "JWT tokens are valid for 1 hour before requiring refresh"
5. Commit: "fix(docs): correct JWT expiration time from 24h to 1h (src/auth/config.js:12)"

### Example Code Change Update

**Git Diff:**
```diff
- function login(username, password) {
+ function login(credentials) {
+   const { username, password, twoFactorCode } = credentials;
```

**AI Actions:**
1. CODE_POINTERS shows authentication.md references auth/login.js
2. Read authentication.md
3. Find function signature documentation
4. Update signature to show new parameter structure
5. Add 2FA parameter documentation
6. Update code examples
7. Commit: "docs: update authentication to reflect 2FA support"

---

## Commit Message Formats

### Fix Errors
```
fix(docs): correct JWT expiration time from 24h to 1h

Source: src/auth/config.js:12
```

### Update for Code Changes
```
docs: update authentication to reflect 2FA support

Code changes in src/auth/middleware.js required updating
the authentication flow documentation.
```

### Add New Documentation
```
docs: add documentation for date helper utilities

Documented formatDate, parseDate, isValidDate functions
from src/utils/date-helper.js (used in 8 files).
```

### Full Refresh
```
docs: refresh all documentation and regenerate overlays

- Updated 3 stale files
- Fixed 2 accuracy errors
- Regenerated all JSON overlays
- Validation now 100% passing
```

---

## Scripts Reference Details

### Analysis Scripts
- `analyze-doc-state.mjs` → Generates DOC_STATE.json
- `analyze-coverage.mjs` → Generates COVERAGE.json
- `validate-accuracy.mjs` → Generates VALIDATION.json
- `track-code-changes.mjs` → Updates DOC_STATE.json with git changes

### Auto-Fix Scripts
- `autofix-linting.mjs` → Fixes structure, formatting

### Existing Scripts (Enhanced)
- `generate-section-index.mjs` → SECTIONS.json (with validation metadata)
- `add-code-pointers.mjs` → CODE_POINTERS.json (with staleness tracking)
- `render-relationships.mjs` → RELATIONSHIPS.json
- `lint-documentation.mjs` → Lint results (reports to AI)

### Orchestrator
- `optimize-docs.sh` → Runs full pipeline

---

## Citation Format Examples

**Example Citations in Documentation:**
```markdown
The API rate limit is 100 requests per hour (src/middleware/rate-limit.js:15).

Configuration timeout is 5 seconds (config/defaults.json:23).
```

**Why Citations Matter:**
- Prevents hallucination
- Enables validation
- Provides auditability
- Maintains accuracy over time
