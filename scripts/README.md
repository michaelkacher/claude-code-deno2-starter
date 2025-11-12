# Automation Scripts

This directory contains automation scripts that enhance the `/new-feature` workflow.

## Quick Start

**Generate feature boilerplate** (saves 10-15 minutes):
```bash
deno run -A scripts/scaffold-feature.ts campaign-creator Campaign
```

**Detect related features**:
```bash
./scripts/detect-related-features.sh campaign-creator
```

## Available Scripts

### Feature Scaffolding (`scaffold-feature.ts`) ⭐ NEW

**Auto-generates boilerplate code** for a new feature, saving 10-15 minutes of manual coding.

**Usage**:
```bash
deno run -A scripts/scaffold-feature.ts <feature-name> <ModelName>

# Examples:
deno run -A scripts/scaffold-feature.ts campaign-creator Campaign
deno run -A scripts/scaffold-feature.ts user-profile UserProfile
```

**What it generates**:
- ✅ `shared/types/{feature-name}.types.ts` - TypeScript interfaces
- ✅ `shared/repositories/{model}.repository.ts` - Data access layer (Deno KV)
- ✅ `shared/services/{feature-name}.service.ts` - Business logic layer
- ✅ `frontend/routes/api/{feature-name}/index.ts` - API routes (POST, GET)
- ✅ `frontend/routes/api/{feature-name}/[id].ts` - API routes (GET, PUT, DELETE by ID)
- ✅ `tests/unit/services/{feature-name}.service.test.ts` - Complete test suite

**Generated code includes**:
- Complete CRUD operations (create, read, update, delete, list)
- Proper authentication checks (`requireUser`)
- Zod validation schemas
- Error handling
- Deno KV repository pattern
- Three-tier architecture (Routes → Services → Repositories)
- Full test coverage

**Next steps after scaffolding**:
1. Customize types in `shared/types/{feature-name}.types.ts`
2. Add custom business logic to service
3. Run tests: `deno test --no-check tests/unit/services/{feature-name}.service.test.ts -A`
4. Build frontend UI components

### Related Features Detection (`detect-related-features.sh`)

Automatically detects features that might share data models or functionality.

**Usage**:
```bash
# Detect related features
./scripts/detect-related-features.sh campaign-creator
```

**What it does**:
- 🔍 Searches for mockups with similar name patterns
- 🔍 Searches proposed features with similar names
- 🔍 Searches implemented features with similar names
- 📊 Extracts data models from related features' requirements
- ⚠️ Detects data model conflicts (same model in multiple features)
- 📝 Generates summary report with recommendations

**Output**:
- Console report with color-coded findings
- JSON file at `/tmp/related-features-{feature-name}.json`

**Example output**:
```
🔍 Detecting Related Features for: campaign-creator

[1/4] Searching for related mockups...
  → Found mockup: campaign-view

[2/4] Searching for related proposed features...
  ✓ No related proposed features found

[3/4] Searching for related implemented features...
  → Found implemented: campaign-management
  ℹ  Data models: Campaign, CampaignMember

[4/4] Analyzing data model conflicts...
  ⚠  Model Campaign appears in 2 features
      Action: Ensure model definitions are consistent

📊 Summary
Related Features: 2
Data Model Warnings: 1
```

**When to use**:
- Before starting a new feature (automated in `/new-feature` Step 2.5)
- When refactoring existing features
- When planning feature architecture
- When reviewing data model consistency

---

### Security Scan (`security-scan.sh`)

Automatically detects common security vulnerabilities in API routes.

**Usage**:
```bash
# Scan specific feature
./scripts/security-scan.sh campaign-creator

# Scan all API routes
./scripts/security-scan.sh
```

**What it checks**:
- ❌ `userId` in Zod validation schemas (CRITICAL - allows impersonation attacks)
- ❌ `user.id` usage (should be `user.sub` - JWT standard)
- ❌ `ownerId`, `createdBy` in validation schemas (CRITICAL - security vulnerability)
- ✅ Proper authentication middleware usage (`requireUser`, `requireAdmin`)

**Exit codes**:
- `0` - Security scan passed
- `1` - Critical security issues found

**Example output**:
```
🔍 Security Scan Starting...

[1/4] Checking for userId in validation schemas...
✅ No userId in validation schemas

[2/4] Checking for incorrect user.id usage...
✅ No incorrect user.id usage

[3/4] Checking for authentication middleware...
✅ All routes use authentication middleware

[4/4] Checking for owner/creator IDs in request body...
✅ No owner/creator IDs in validation schemas

✅ Security scan passed! No vulnerabilities detected.
```

---

### Runtime Safety Scan (`runtime-safety-scan.sh`)

Detects common runtime errors and unsafe patterns in frontend code.

**Usage**:
```bash
# Scan specific feature
./scripts/runtime-safety-scan.sh campaign-creator

# Scan all frontend files
./scripts/runtime-safety-scan.sh
```

**What it checks**:
- ⚠️ Unsafe array operations (`.map()`, `.filter()`, `.length` without null checks)
- ⚠️ Unsafe nested property access (missing `?.` optional chaining)
- ⚠️ Incorrect event handlers (`e.target` instead of `e.currentTarget`)
- ⚠️ Deprecated APIs:
  - `window.location` instead of `globalThis.location` (Deno best practice)
  - `localStorage` instead of `TokenStorage` wrapper
  - Manual `fetch` instead of `apiClient` utility

**Exit codes**:
- `0` - Always (warnings don't fail the build)

**Example output**:
```
🔍 Runtime Safety Scan Starting...

[1/6] Checking for unsafe array operations...
⚠️  Found potential unsafe array operations:
  → 2 .map() calls without null checks
  Recommended: Use (array || []).map() pattern

[2/6] Checking for unsafe nested property access...
✅ Nested property access uses optional chaining

...

⚠️  Runtime safety scan found 2 potential issue(s)

These are recommendations, not critical errors.
Review the warnings above to improve code robustness.
```

---

### Auto-Fix Safety (`auto-fix-safety.sh`)

Automatically fixes common runtime safety issues detected by the runtime safety scan.

**Usage**:
```bash
# Preview changes (dry-run mode)
./scripts/auto-fix-safety.sh campaign-creator --dry-run

# Apply fixes
./scripts/auto-fix-safety.sh campaign-creator
```

**What it fixes**:
- ✅ Unsafe array operations (adds `|| []` null checks)
  - Before: `items.map(x => x.id)`
  - After: `(items || []).map(x => x.id)`
- ✅ Deprecated `window.location` (converts to `globalThis.location`)
  - Before: `window.location.href = "/home"`
  - After: `globalThis.location.href = "/home"`

**What it reports (but doesn't auto-fix)**:
- ℹ️ `e.target.value` usage (review manually - may need `e.currentTarget`)
- ℹ️ Missing optional chaining (requires context to determine correct fix)

**Exit codes**:
- `0` - Always (fixes applied or no issues found)

**Example output**:
```
🔧 Auto-Fix Safety Issues

[1/4] Fixing unsafe array operations...
  → Found unsafe .map() in: CampaignCreator.tsx
    Line 145: campaigns.map(...)
    Fix: (campaigns || []).map(...)

[2/4] Fixing deprecated window usage...
  → Found window.location in: ActiveCampaigns.tsx
    Line 74: window.location → globalThis.location

[3/4] Fixing e.target to e.currentTarget...
  → Found e.target.value in: CampaignForm.tsx
    Note: Review manually - only fix if in controlled component

[4/4] Cleaning up backup files...
  ✓ Removed 2 backup files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Auto-Fix Complete!

Applied 3 fixes to 2 files:
  • CampaignCreator.tsx (2 array fixes)
  • ActiveCampaigns.tsx (1 window fix)

Next Steps:
  1. Review the changes: git diff
  2. Run tests: deno test --no-check -A
  3. Run linter: deno lint
  4. Commit changes if tests pass
```

**When to use**:
- After runtime safety scan finds issues (automated in integration-agent Step 8.5)
- When refactoring code
- Before code review to clean up safety issues

---

### Performance Profiling (`performance-profile.sh`)

Analyzes code for performance bottlenecks and provides optimization recommendations.

**Usage**:
```bash
# Analyze specific feature
./scripts/performance-profile.sh campaign-creator
```

**What it analyzes**:

**1. Database Queries** (Service files):
- 🔍 N+1 query patterns (queries inside loops)
- 🔍 Total query count per service file
- 🔍 Missing batch operations
- 🔍 Secondary index usage

**2. API Performance** (API route files):
- 🔍 Unlimited `.list()` calls without limit parameter
- 🔍 Large response payloads (full objects in list endpoints)
- 🔍 Missing pagination
- 🔍 Missing field filtering

**3. Frontend Performance** (Islands & Routes):
- 🔍 Inline object creation in JSX (causes re-renders)
- 🔍 Missing key props in `.map()` renders
- 🔍 Large list rendering without virtualization
- 🔍 useEffect optimizations

**4. Best Practices**:
- 🔍 Secondary indexes for common queries
- 🔍 Caching strategies
- 🔍 Response size optimization

**Performance Benchmarks**:

| Category | Excellent | Good | Warning | Critical |
|----------|-----------|------|---------|----------|
| DB Queries/Route | < 3 | 3-5 | 5-10 | > 10 or N+1 |
| Response Size | < 100KB | 100-500KB | 500KB-2MB | > 2MB |
| Performance Score | 9-10 | 7-8 | 5-6 | < 5 |

**Exit codes**:
- `0` - Performance acceptable (score ≥ 5/10)
- `1` - Critical performance issues (score < 5/10)

**Example output**:
```
⚡ Performance Profiling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: campaign-creator

[1/5] Analyzing database query patterns...
  ✓ Good query count in: campaign-creator.service.ts (4 queries)

[2/5] Analyzing API response sizes...
  ⚠  Returning full objects in list endpoint: api/campaigns/index.ts
    Recommendation: Return only necessary fields for list views

[3/5] Analyzing frontend performance...
  ✓ useEffect optimizations present: CampaignCreator.tsx

[4/5] Checking for performance best practices...
  ✓ Secondary indexes found: 3 indexes
  → No caching detected
    Suggestion: Consider caching for frequently accessed data

[5/5] Calculating performance score...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Performance Report

Performance Score: 8/10 - B (Good)

Issues Summary:
  Critical: 0
  Warnings: 2
  Suggestions: 3

⚠️  Recommendations:
  Performance is acceptable but could be improved.

Suggested improvements:
  1. Review query patterns for optimization opportunities
  2. Consider adding pagination
  3. Implement caching for frequently accessed data
```

**When to use**:
- Optional in integration-agent workflow (Step 9)
- Before deploying to production
- When optimizing existing features
- When investigating performance issues

---

## When to Use

### Automated (Built into `/new-feature`)

All scripts are integrated into the `/new-feature` workflow via the integration-agent:

- **Related Features Detection**: Step 2.5 (after feature directory creation)
- **Security Scan**: Step 7 (via integration-agent)
- **Runtime Safety Scan**: Step 8 (via integration-agent)
- **Auto-Fix Safety**: Step 8.5 (via integration-agent, if user accepts)
- **Performance Profiling**: Step 9 (via integration-agent, optional)

### Manual

Run manually when:
- Refactoring existing features
- Reviewing pull requests
- Auditing codebase for vulnerabilities
- Troubleshooting runtime errors

---

## Best Practices

### Security Scan

✅ **DO**:
- Run after every backend change
- Fix all critical issues before deploying
- Review authentication patterns regularly
- Use JWT tokens for user identity

❌ **DON'T**:
- Ignore CRITICAL warnings (fix immediately)
- Accept user IDs from request body
- Use `user.id` (doesn't exist in JWT - use `user.sub`)
- Skip authentication middleware

### Runtime Safety Scan

✅ **DO**:
- Run after every frontend change
- Fix unsafe array operations
- Use optional chaining for nested properties
- Follow Deno best practices

❌ **DON'T**:
- Ignore warnings in production code
- Use `e.target` in controlled components
- Use deprecated APIs (`window`, `localStorage`)
- Skip null checks on arrays

---

## Troubleshooting

### "Permission denied" error

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### False positives

**Security Scan**:
- If a route genuinely doesn't need auth, add a comment explaining why
- If `user.id` is used in non-auth context (e.g., display), it's safe

**Safety Scan**:
- Warnings are recommendations, not requirements
- Some patterns may be intentionally optimized
- Review each warning and decide if fix is needed

### Script doesn't find issues you know exist

- Check file paths (scripts scan `frontend/` directory)
- Verify file extensions (looks for `.ts` and `.tsx`)
- Check if files are in `.gitignore` or `node_modules`

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security & Safety Checks

on: [pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Security Scan
        run: ./scripts/security-scan.sh

  safety-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Runtime Safety Scan
        run: ./scripts/runtime-safety-scan.sh
```

### Pre-commit Hook Example

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running security scan..."
./scripts/security-scan.sh

if [ $? -ne 0 ]; then
  echo "❌ Security scan failed! Fix issues before committing."
  exit 1
fi

echo "✅ Security scan passed"
exit 0
```

---

## Performance

All scripts are designed to be fast:

- **Related Features Detection**: ~1-2 seconds (searches feature directories)
- **Security Scan**: ~1-2 seconds (scans only `frontend/routes/api/`)
- **Runtime Safety Scan**: ~2-3 seconds (scans `frontend/routes/` and `frontend/islands/`)
- **Auto-Fix Safety**: ~1-2 seconds (applies sed transformations)
- **Performance Profiling**: ~2-4 seconds (analyzes service, API, and frontend files)

Total automation overhead: **~7-13 seconds** per feature (when all scripts run)

---

## Future Enhancements

Completed:
- ✅ **Auto-fix capability** - Implemented in `auto-fix-safety.sh` (v2.1)
- ✅ **Performance profiling** - Implemented in `performance-profile.sh` (v2.1)

Planned improvements:
1. **Custom rule configuration** - Allow project-specific rules via config file
2. **HTML report generation** - Better visualization of results with charts
3. **IDE integration** - VS Code extension for real-time scanning
4. **Advanced performance metrics** - Lighthouse-style scoring with bundle size analysis
5. **Automated refactoring suggestions** - AI-powered code improvement recommendations

---

## Questions or Issues?

If you encounter problems:

1. Check this README for troubleshooting steps
2. Review examples in `docs/WORKFLOW_IMPROVEMENTS.md`
3. Open an issue with:
   - Script name and command used
   - Full error output
   - File/line that caused the issue

---

## License

These scripts are part of the Daggerheart Game Night Companion project.
