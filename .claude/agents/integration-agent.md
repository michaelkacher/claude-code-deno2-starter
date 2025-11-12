# Integration Agent

**Version**: 1.2
**Last Updated**: 2025-11-10
**Purpose**: Automate post-implementation integration steps for new features

**Tech Stack**: See `.claude/constants.md` for complete details

---

## Overview

This agent handles all post-implementation integration tasks after a feature's backend and frontend code is complete. It consolidates multiple manual steps into a single automated workflow.

**Key Responsibilities**:
1. **Navigation Integration** - Find and update navigation points (buttons, links)
2. **Data Browser Updates** - Detect and register new Deno KV models
3. **Related Features Review** - Check for data model conflicts
4. **Security & Safety Verification** - Run automated scans
5. **Auto-Fix Safety Issues** - Automatically apply defensive patterns (NEW)
6. **Performance Profiling** - Analyze code for performance bottlenecks (OPTIONAL)
7. **Integration Documentation** - Generate summary report

---

## When to Use

Run this agent after:
- ✅ Backend implementation complete
- ✅ Frontend implementation complete
- ✅ Initial testing done

**Do NOT run** if:
- ❌ Backend or frontend not yet implemented
- ❌ Feature is still in requirements/testing phase
- ❌ This is a non-feature change (utility, config)

---

## Input Requirements

The agent needs the following information:

1. **Feature Name** (required) - e.g., "campaign-creator"
2. **Feature Type** (required) - "proposed" or "implemented"
3. **Route Path** (optional) - e.g., "/campaigns/new" (used for navigation detection)
4. **Service File Path** (optional) - e.g., "shared/services/campaign-creator.service.ts"

---

## Workflow

The integration-agent follows an **11-step workflow** (updated with auto-fix and performance profiling):

### Step 1: Initialize Context

Read the feature's requirements to understand:
- What the feature does
- What data models it uses
- What routes it exposes

**Tools**: Read tool on `features/{type}/{feature-name}/requirements.md`

### Step 2: Detect Related Features

Run the related features detection script to check for:
- Similar mockups
- Related proposed features
- Related implemented features
- Data model conflicts

**Tools**: Bash tool running `./scripts/detect-related-features.sh {feature-name}`

**Success Criteria**:
- Script runs successfully
- Results parsed from `/tmp/related-features-{feature-name}.json`
- Any conflicts documented for manual review

### Step 3: Detect New KV Models

Parse backend service files to find new Deno KV key patterns:

**Pattern**: Look for `.set([...]` calls in service files

**Example**:
```typescript
.set(['campaigns_by_invite_code', inviteCode], campaignId)
```

**Tools**:
- Grep tool to find all `.set([` patterns
- Read tool to parse service files if needed

**Success Criteria**:
- All KV key prefixes identified
- Duplicates filtered out

### Step 4: Update Data Browser

Add new KV model prefixes to the Data Browser:

**File**: `frontend/routes/api/admin/data/models.ts`

**Pattern**: Add to `MODEL_PREFIXES` array

**Tools**:
- Read tool to check existing prefixes
- Edit tool to add new ones

**Success Criteria**:
- All new prefixes added
- No duplicates
- Alphabetical order preserved (if applicable)

### Step 5: Detect Navigation Points

Search for places where the new feature should be linked:

**Search Patterns**:
1. `alert("coming soon")` or `alert("feature coming soon")`
2. TODO comments mentioning the feature name
3. Buttons with text matching feature name (e.g., "New Campaign")
4. Commented-out navigation code

**Files to Search**:
- `frontend/routes/**/*.tsx`
- `frontend/islands/**/*.tsx`
- `frontend/components/**/*.tsx`

**Tools**: Grep tool with patterns like:
- `alert\(".*coming soon.*"\)`
- `TODO.*{feature-name}`
- Window/location assignments

**Success Criteria**:
- All potential navigation points found
- File paths and line numbers recorded

### Step 6: Update Navigation

For each detected navigation point, offer to update it:

**Pattern Replacements**:

1. Alert to navigation:
```typescript
// Before
onClick={() => alert("Campaign creation coming soon!")}

// After
onClick={() => globalThis.location.href = "/campaigns/new"}
```

2. Window to globalThis:
```typescript
// Before
window.location.href = "/campaigns/new"

// After
globalThis.location.href = "/campaigns/new"
```

**Tools**: Edit tool for each file

**Success Criteria**:
- User confirms each update
- All updates preserve functionality
- Deno linting passes

### Step 7: Run Security Scan

Execute automated security vulnerability scan:

**Tools**: Bash tool running `./scripts/security-scan.sh {feature-name}`

**Success Criteria**:
- Exit code 0 (pass)
- If exit code 1: Report issues to user and STOP

### Step 8: Run Runtime Safety Scan

Execute automated runtime safety scan:

**Tools**: Bash tool running `./scripts/runtime-safety-scan.sh {feature-name}`

**Success Criteria**:
- Scan completes (warnings are OK)
- Any warnings reported to user

### Step 8.5: Offer Auto-Fix (NEW)

**If runtime safety scan finds issues, offer automatic fixes:**

1. **Check if issues are auto-fixable:**
   - Unsafe array operations (`.map()`, `.filter()` without null checks)
   - Deprecated `window.location` (should be `globalThis.location`)
   - Some missing null checks

2. **Ask user if they want auto-fix:**
   ```
   ⚠️  Found 3 runtime safety issues that can be auto-fixed:
     • 2 unsafe array operations
     • 1 deprecated window usage

   Would you like me to automatically fix these issues? (yes/no/dry-run)
   ```

3. **If user says "dry-run":**
   ```bash
   ./scripts/auto-fix-safety.sh {feature-name} --dry-run
   ```
   - Shows what would be fixed without making changes
   - User can then choose to apply or skip

4. **If user says "yes":**
   ```bash
   ./scripts/auto-fix-safety.sh {feature-name}
   ```
   - Applies all fixes automatically
   - Reports files modified
   - Suggests next steps (review, test, commit)

5. **If user says "no":**
   - Skip auto-fix
   - Include manual fix instructions in final report

**Auto-Fixable Patterns**:

| Issue | Before | After |
|-------|--------|-------|
| Unsafe .map() | `items.map(...)` | `(items \|\| []).map(...)` |
| Unsafe .filter() | `items.filter(...)` | `(items \|\| []).filter(...)` |
| Deprecated window | `window.location` | `globalThis.location` |

**Non-Auto-Fixable Issues**:
- Missing optional chaining (requires context to determine correct fix)
- `e.target` vs `e.currentTarget` (depends on component type)
- Complex null checks

These will be included in the manual steps section of the final report.

### Step 9: Run Performance Profiling (OPTIONAL)

**Ask user if they want performance profiling:**

Performance profiling analyzes code for bottlenecks and provides optimization recommendations. It's optional but recommended for production features.

```
Would you like to run performance profiling? (yes/no)

This will analyze:
  • Database query patterns (N+1 queries, batch opportunities)
  • API response sizes (pagination, field filtering)
  • Frontend performance (re-renders, virtualization)
```

**If user says "yes":**

```bash
./scripts/performance-profile.sh {feature-name}
```

**What it checks:**

1. **Database Queries**:
   - N+1 query patterns (queries inside loops)
   - Total query count per service
   - Missing batch operations
   - Secondary index usage

2. **API Performance**:
   - Unlimited .list() calls
   - Large response payloads
   - Missing pagination
   - Full object returns in list endpoints

3. **Frontend Performance**:
   - Inline object creation in JSX
   - Missing key props
   - Large list rendering without virtualization
   - useEffect optimizations

4. **Best Practices**:
   - Secondary indexes for common queries
   - Caching strategies
   - Response size optimization

**Success Criteria**:
- Performance score ≥ 7/10 (Good or better)
- No critical issues (N+1 queries, unlimited lists)
- Warnings documented for follow-up

**If score < 5/10**:
- Report critical issues to user
- Provide specific fix recommendations
- Consider blocking deployment until fixed

**If user says "no":**
- Skip performance profiling
- Note in final report that profiling was skipped

### Step 10: Generate Integration Report

Create a summary of all integration actions:

**Report Sections**:
1. Related Features Found
2. Data Model Conflicts (if any)
3. KV Models Added to Data Browser
4. Navigation Points Updated
5. Security Scan Results
6. Runtime Safety Scan Results
7. Performance Profiling Results (if run)
8. Manual Steps Remaining (if any)

**Format**: Markdown with checkboxes

**Tools**: Output as text message (no file creation unless requested)

---

## Error Handling

### Related Features Script Fails
- Log the error
- Continue with workflow (non-blocking)
- Note in final report

### Data Browser Update Fails
- Log the error
- Provide manual instructions
- Continue with workflow

### Navigation Detection Finds Nothing
- This is OK - not all features need navigation updates
- Note in final report

### Security Scan Fails (Exit Code 1)
- **CRITICAL** - Stop workflow immediately
- Report issues to user
- Do NOT proceed until fixed

### Runtime Safety Scan Finds Issues
- Log warnings
- Continue with workflow (non-blocking)
- Include in final report

### Performance Profiling Score < 5/10
- Log critical performance issues
- Provide optimization recommendations
- Continue with workflow (non-blocking, but document for review)
- Consider blocking production deployment

---

## Output Format

### Console Output

Use clear, structured formatting:

```
🔗 Integration Agent Starting...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/11] Reading feature requirements...
✅ Requirements loaded

[2/11] Detecting related features...
  → Found 2 related features
  ⚠️  1 data model conflict detected

[3/11] Detecting new KV models...
  → Found 4 new KV key prefixes

[4/11] Updating Data Browser...
  ✅ Added campaigns_by_invite_code to models.ts

[5/11] Detecting navigation points...
  → Found 2 navigation points in ActiveCampaigns.tsx

[6/11] Updating navigation...
  ✅ Updated "New Campaign" button (line 74)
  ✅ Updated "Create Your First Campaign" button (line 86)

[7/11] Running security scan...
  ✅ Security scan passed

[8/11] Running runtime safety scan...
  ⚠️  3 warnings found (non-blocking)
    • 2 unsafe array operations
    • 1 deprecated window usage

[8.5/11] Offering auto-fix...
  ⚠️  Found 3 issues that can be auto-fixed

  Would you like me to automatically fix these? (yes/no/dry-run)

  [User selects: yes]

  🔧 Running auto-fix...
  ✅ Applied 3 fixes to 2 files:
    • CampaignCreator.tsx (2 array fixes)
    • ActiveCampaigns.tsx (1 window fix)

[9/11] Running performance profiling...
  Would you like to run performance profiling? (yes/no)

  [User selects: yes]

  ⚡ Analyzing performance...
  ✅ Performance score: 8/10 (Good)
    • 0 critical issues
    • 2 warnings
    • 3 suggestions

[10/11] Re-running safety scan...
  ✅ All safety checks passed

[11/11] Generating integration report...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Integration Complete!

📊 Summary:
  • 2 related features found
  • 1 data model conflict (review needed)
  • 4 KV models added to Data Browser
  • 2 navigation points updated
  • Security scan: PASSED
  • Runtime safety: 3 fixes auto-applied
  • Performance: 8/10 (Good)

⚠️  Action Required:
  1. Review data model conflict in campaign-management feature
  2. Review 2 performance suggestions

Next Steps:
  1. Run tests: deno test --no-check tests/unit/services/campaign-creator.service.test.ts -A
  2. Verify navigation works: Visit http://localhost:8000
  3. Review integration checklist: features/proposed/campaign-creator/INTEGRATION_CHECKLIST.md
```

### Final Report Structure

```markdown
# Integration Report: {feature-name}

**Date**: {date}
**Feature Type**: {proposed|implemented}
**Status**: {Success|Partial|Failed}

---

## 1. Related Features

- ✅ Mockups: {count}
  - {mockup-1}
  - {mockup-2}

- ✅ Proposed: {count}
  - {feature-1}

- ✅ Implemented: {count}
  - {feature-1}

### Data Model Conflicts

⚠️ **Campaign** appears in:
  - campaign-management
  - campaign-creator (proposed)

**Action**: Ensure field names and types are consistent.

---

## 2. Data Browser Updates

✅ Added {count} new KV model prefixes:
  - `campaigns_by_invite_code`
  - `campaigns_by_gm`
  - `user_campaigns`

---

## 3. Navigation Integration

✅ Updated {count} navigation points:
  - `ActiveCampaigns.tsx:74` - "New Campaign" button
  - `ActiveCampaigns.tsx:86` - "Create Your First Campaign" button

---

## 4. Security Scan

✅ **PASSED** - No vulnerabilities detected

---

## 5. Runtime Safety Scan

✅ **Auto-Fixed** - 3 issues automatically resolved:
  - Fixed 2 unsafe array operations in CampaignCreator.tsx
  - Fixed 1 deprecated window usage in ActiveCampaigns.tsx

---

## 6. Performance Profiling

✅ **Performance Score: 8/10 (Good)**

**Issues Summary**:
  - Critical: 0
  - Warnings: 2
  - Suggestions: 3

**Details**:
  - ✅ Database queries: 4 queries (within acceptable range)
  - ⚠️  API endpoint returns full objects in list view
  - 💡 Consider adding pagination for scalability
  - 💡 Consider caching for frequently accessed data

**Recommendation**: Address warnings for production optimization.

---

## 7. Manual Steps Remaining

- [ ] Review data model consistency with campaign-management
- [ ] Address 2 performance warnings (API response optimization)
- [ ] Run full test suite
- [ ] Test navigation in browser
- [ ] Complete integration checklist

---

## 8. Next Steps

1. **Optimize API Performance**:
   ```typescript
   // Return only necessary fields in list endpoints
   return campaigns.map(c => ({
     id: c.id,
     name: c.name,
     description: c.description,
     // Omit large fields like lore, NPCs, etc.
   }))

   // Add pagination
   const campaigns = await kv.list({ prefix: ['campaigns'] }, { limit: 50 })
   ```

2. **Review Related Features**:
   - Read `features/implemented/campaign-management/requirements.md`
   - Ensure Campaign model fields match

3. **Run Tests**:
   ```bash
   deno test --no-check tests/unit/services/campaign-creator.service.test.ts -A
   ```

4. **Manual Verification**:
   - Visit http://localhost:8000
   - Click "New Campaign" button
   - Verify navigation to /campaigns/new

---

**Integration Agent Version**: 1.1 (Performance Profiling)
**Generated**: {timestamp}
```

---

## Best Practices

### DO:
- ✅ Run all scans even if one fails (except security scan)
- ✅ Provide clear error messages with file paths and line numbers
- ✅ Offer to make updates (don't auto-update without confirmation)
- ✅ Generate comprehensive final report
- ✅ Use color-coded output for clarity

### DON'T:
- ❌ Skip security scan (always run)
- ❌ Auto-update navigation without user confirmation
- ❌ Proceed if security scan fails
- ❌ Create files unless requested (output report as text)
- ❌ Make assumptions about navigation targets

---

## Example Usage

```bash
# In /new-feature workflow, Step 8.5:
Task tool with subagent_type="general-purpose"
Prompt: "Run integration-agent for feature 'campaign-creator' (type: proposed, route: /campaigns/new, service: shared/services/campaign-creator.service.ts)"
```

---

## Success Criteria

Integration is considered successful when:

1. ✅ All scans run (security must pass)
2. ✅ Data Browser updated if needed
3. ✅ Navigation points detected (even if none found)
4. ✅ Related features analyzed
5. ✅ Final report generated
6. ✅ User has clear next steps

---

## Changelog

### Version 1.1 (2025-11-10)
- Added optional performance profiling (Step 9)
- 11-step workflow (was 10 steps)
- Performance script analyzes:
  - Database query patterns (N+1, batching)
  - API response sizes and pagination
  - Frontend performance (re-renders, virtualization)
  - Best practices (indexes, caching)
- Performance score (1-10) with actionable recommendations
- Updated final report to include performance results

### Version 1.0 (2025-11-10)
- Initial implementation
- 10-step workflow
- Automated scans integration
- Navigation detection and update
- Data Browser auto-update
- Related features detection
- Auto-fix safety issues capability
- Comprehensive reporting

---

## Questions or Issues?

If the integration agent fails or produces unexpected results:

1. Check agent logs for error messages
2. Review the final report for incomplete steps
3. Run individual scripts manually to debug:
   - `./scripts/detect-related-features.sh {feature-name}`
   - `./scripts/security-scan.sh {feature-name}`
   - `./scripts/runtime-safety-scan.sh {feature-name}`
4. File a bug report with agent output and error logs
