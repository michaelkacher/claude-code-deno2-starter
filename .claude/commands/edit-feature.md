---
description: Modify an existing feature by updating tests, business logic, and frontend components
---

You will guide the user through modifying an existing feature. This workflow discovers current implementation details before making changes, ensuring consistency and preventing regressions.

**Tech Stack Reference**: See `.claude/constants.md` for architecture patterns and tech stack details.

**Available Tools**:
- `scripts/scaffold-feature.ts` - Auto-generate boilerplate if adding new models
- `implementation-agent.md` - Unified backend+frontend implementation
- `backend-agent.md` + `frontend-agent.md` - Separate implementation (legacy approach)

## Edit Feature Workflow

This command modifies features in `features/proposed/` or `features/implemented/`, updating tests, implementation, and documentation in a safe, systematic way.

## Workflow Steps

1. **Identify Feature**: Determine which feature to modify
2. **Discovery Phase**: Read existing implementation and documentation
3. **Understand Changes**: Get requirements for the modification
4. **Update Tests**: Modify existing tests and add new ones (TDD)
5. **Update Backend**: Modify services, routes, and data models
6. **Security Review**: Verify authentication patterns remain secure
7. **Update Frontend**: Modify components, islands, and routes
8. **Update Documentation**: Sync requirements.md and api-spec.md
9. **Regression Testing**: Verify related features still work
10. **Complete**: Run tests and summarize changes

## Instructions

### Step 1: Identify Feature to Edit

**First, list available features:**

Use the File Search tool to find features:
```
Search for: features/proposed/*/requirements.md
Search for: features/implemented/*/requirements.md
```

Extract feature names from the paths.

**Present options to user:**
```
I found these features in your project:

Implemented Features:
1. user-authentication (features/implemented/user-authentication/)
2. notifications (features/implemented/notifications/)

Proposed Features:
3. workout-planner (features/proposed/workout-planner/)

Which feature would you like to edit? (enter the name or number)
```

**Get feature name:**

If user provides a number, map it to the feature name.
Convert to kebab-case if needed.

**Determine feature path:**
```
Checking features/implemented/{feature-name}/
Checking features/proposed/{feature-name}/
```

Store the full path for later use (e.g., `features/implemented/user-authentication`).

Say:
```
✅ Found feature at: {full-path}
Starting discovery phase...
```

### Step 2: Discovery Phase - Read Existing Implementation

**Read all feature documentation:**

1. **Requirements document:**
   ```
   Read {feature-path}/requirements.md
   ```
   
   Extract:
   - User stories
   - Data models
   - Business rules
   - API endpoints

2. **API Specification (if exists):**
   ```
   Read {feature-path}/api-spec.md (if it exists)
   ```
   
   Extract:
   - Endpoint definitions
   - Request/response schemas
   - Authentication requirements

3. **Implementation notes (if exists):**
   ```
   Read {feature-path}/implementation.md (if it exists)
   ```

**Scan existing test files:**

Use grep to find related tests:
```bash
# Search for test files mentioning the feature
grep -r "describe.*{feature-name}" tests/
```

List the test files found and their locations.

**Scan implementation files:**

Based on requirements, search for:
- Routes: `frontend/routes/api/**/*.ts`
- Services: `shared/services/**/*.ts`
- Components: `frontend/components/**/*.tsx`
- Islands: `frontend/islands/**/*.tsx`

Use grep to find files that might implement this feature:
```bash
# Search for feature-related code
grep -r "class.*{FeatureName}Service" shared/
grep -r "export.*handler.*{feature-route}" frontend/routes/
```

**Summarize current state:**
```
📋 Current Implementation Summary:

**Feature:** {feature-name}
**Status:** {implemented|proposed}
**Location:** {feature-path}

**Documentation:**
- Requirements: {summary of user stories}
- Data Models: {list of models}
- API Endpoints: {list of endpoints}

**Current Implementation Files:**
Tests:
- tests/integration/{feature-name}.test.ts
- tests/unit/{feature-name}-service.test.ts

Backend:
- shared/services/{feature-name}.service.ts
- frontend/routes/api/{endpoints}/*.ts

Frontend:
- frontend/components/{components}/*.tsx
- frontend/islands/{islands}/*.tsx
- frontend/routes/{pages}/*.tsx

**Dependencies:**
- Related features: {list if any shared models}
- Shared data models: {list models used by other features}

Now, what changes would you like to make to this feature?
```

### Step 3: Understand Required Changes

Ask the user:
```
What would you like to change in this feature?

Examples:
- "Add a new field to the data model"
- "Change the validation rules for X"
- "Add a new API endpoint for Y"
- "Update the UI to support Z"
- "Fix a bug where..."

Please describe the changes you want to make:
```

**Clarifying questions (if needed):**

Based on the change description, ask targeted questions:

- **Data model changes**: "Will this affect existing data? Should we migrate?"
- **API changes**: "Is this a breaking change? Should we version the API?"
- **UI changes**: "Should this work with existing data, or only new records?"
- **Business logic changes**: "Are there edge cases we need to handle?"

**Document the change request:**

Create or update `{feature-path}/change-request.md`:
```markdown
# Change Request - {Date}

## Requested Changes
{user's description}

## Clarifications
{answers to clarifying questions}

## Impact Analysis
- Data model changes: {Yes/No - details}
- API changes: {Yes/No - breaking/non-breaking}
- UI changes: {Yes/No - components affected}
- Affects other features: {list of related features}

## Implementation Plan
1. Update tests for: {list areas}
2. Modify backend: {list files}
3. Modify frontend: {list files}
4. Update docs: {list docs}
```

### Step 4: Update Tests First (TDD Red Phase)

**Identify tests that need updating:**

Based on the change request, determine:
1. Which existing tests need modification
2. What new tests are needed

**For existing tests:**

Read each test file:
```
Read tests/{test-file}.test.ts
```

Ask:
```
I found these existing tests that may need updates:
1. {test-file-1}: {what it tests}
2. {test-file-2}: {what it tests}

Should I:
- Modify these tests to reflect the new behavior
- Keep them as-is (if not affected)
- Add new test cases alongside them

Your preference:
```

**Modify existing tests:**

Update test files to reflect new behavior:
- Change assertions for modified functionality
- Add new test cases for new scenarios
- Update mock data if models changed
- Fix any tests that would fail with new implementation

**Add new tests:**

Create new test files or add cases for:
- New API endpoints
- New validation rules
- New business logic
- New UI components

**Run tests to verify Red phase:**
```bash
deno task test
```

Confirm tests fail as expected (Red phase):
```
✅ Tests updated - Red phase complete
   - Modified {X} existing tests
   - Added {Y} new test cases
   - {Z} tests currently failing (expected)
```

### Step 5: Update Backend Implementation

**Modify existing backend files:**

1. **Services** (`shared/services/*.ts`):
   - Update methods with new logic
   - Add new methods if needed
   - Modify data model interfaces
   - Update validation logic

2. **API Routes** (`frontend/routes/api/**/*.ts`):
   - Modify existing endpoints
   - Add new endpoints
   - Update request/response schemas (Zod)
   - Update error handling

3. **Data models** (if changed):
   - Update TypeScript interfaces
   - Update Zod schemas
   - Document migration needs

**For each file modification:**

Read the current file:
```
Read {file-path}
```

Make precise edits using the replace_string_in_file tool.

**Document breaking changes:**

If any changes are breaking:
```
⚠️  BREAKING CHANGES DETECTED

The following changes may affect existing code:
1. {change description}
2. {change description}

Affected areas:
- Other features: {list}
- Frontend components: {list}
- Database: {migration needed}

Should I:
1. Implement with version bump (v2 endpoints)
2. Add backward compatibility layer
3. Proceed with breaking change and update all references

Your choice:
```

### Step 6: Security Review - Verify Authentication Patterns

**Mandatory security check for modified authenticated routes:**

1. **Identify modified authenticated endpoints:**
   List all API routes that were changed and require authentication.

2. **For each modified route, verify:**

   **❌ Check validation schemas don't accept user identity from client:**
   ```bash
   grep -n "userId.*z\." {modified-route-file}
   grep -n "ownerId.*z\." {modified-route-file}
   grep -n "createdBy.*z\." {modified-route-file}
   ```

   **✅ Verify user identity comes from auth context:**
   ```bash
   grep -n "requireUser\|requireAdmin" {modified-route-file}
   grep -n "user\.sub" {modified-route-file}
   ```

   **❌ Check for incorrect user.id usage (should be user.sub):**
   ```bash
   grep -n "user\.id[^a-zA-Z]" {modified-route-file}
   ```

3. **Security checklist:**
   - [ ] No validation schemas accept `userId`, `ownerId`, or `createdBy` from request
   - [ ] All routes use `requireUser(ctx)` or `requireAdmin(ctx)`
   - [ ] User identity uses `user.sub` (NOT `user.id`)
   - [ ] No user IDs accepted from query/URL params for access control
   - [ ] Authorization checks are present for user-specific data

4. **Fix any security issues found:**
   ```typescript
   // Before (VULNERABLE):
   const Schema = z.object({
     userId: z.string(),  // ❌ Client can impersonate!
     name: z.string(),
   });

   // After (SECURE):
   const Schema = z.object({
     name: z.string(),  // ✅ No userId in schema
   });

   export const handler: Handlers = {
     POST: withErrorHandler(async (req, ctx) => {
       const user = requireUser(ctx);
       const data = await parseJsonBody(req, Schema);
       await service.create({
         ...data,
         userId: user.sub,  // ✅ From auth context
       });
     })
   };
   ```

Say:
```
✅ Security review complete
   - Verified {X} authenticated endpoints
   - All user identity from auth context
   - No security issues found
```

### Step 7: Update Frontend Implementation

**Identify frontend files to modify:**

Based on the change request:
1. Components to update: `frontend/components/**/*.tsx`
2. Islands to update: `frontend/islands/**/*.tsx`
3. Pages to update: `frontend/routes/**/*.tsx`

**For each file:**

1. **Read current implementation:**
   ```
   Read {file-path}
   ```

2. **Understand component structure:**
   - What props does it accept?
   - What state does it manage?
   - What events does it handle?
   - What design system components does it use?

3. **Make modifications:**
   - Update props/interfaces
   - Modify rendering logic
   - Add new event handlers
   - Update API calls to use modified endpoints

4. **Verify design system component usage:**
   If using design system components, read their interfaces:
   ```
   Read frontend/components/design-system/{component}.tsx
   ```
   
   Ensure correct prop usage (especially Select, Input, Button patterns).

**Apply runtime safety patterns:**

For all modified/new code:

```typescript
// ✅ Safe array operations
{(items || []).map(item => <Card>{item.name}</Card>)}

// ✅ Safe nested access
{user?.profile?.name ?? 'Unknown'}

// ✅ Safe event handlers
onChange={(e) => setState(e.currentTarget.value)}

// ✅ Safe controlled Select
<Select value={state} options={options} />  // Not children pattern

// ✅ Use apiClient, not fetch
await apiClient.get('/api/endpoint')  // Not: fetch(...)

// ✅ Use TokenStorage, not localStorage
TokenStorage.getAccessToken()  // Not: localStorage.getItem(...)
```

### Step 8: Update Documentation

**Update requirements.md:**

Read current requirements:
```
Read {feature-path}/requirements.md
```

Update sections:
- Add new user stories (if any)
- Update data models section
- Update API endpoints section
- Add notes about changes in "Change Log" section

Add a changelog entry:
```markdown
## Change Log

### {Date} - {Change Summary}
- Added: {new features}
- Modified: {changed behavior}
- Fixed: {bug fixes}
- Breaking changes: {if any}
```

**Update api-spec.md (if exists):**

```
Read {feature-path}/api-spec.md
```

Update:
- Endpoint definitions
- Request/response schemas
- Add deprecation notices for old endpoints (if versioned)

**Create/update implementation.md:**

Document implementation details:
```markdown
# Implementation Notes - {feature-name}

## Recent Changes ({Date})

### Modified Files
**Backend:**
- {file}: {what changed}

**Frontend:**
- {file}: {what changed}

**Tests:**
- {file}: {what changed}

### Migration Notes
{any data migration needed}

### Breaking Changes
{if any, document here}

### Related Features Affected
{list features that might be impacted}
```

### Step 9: Regression Testing

**Check for related features:**

1. **Identify shared models:**
   From the discovery phase, list features that share data models.

2. **For each related feature:**
   ```
   Running tests for related feature: {feature-name}
   ```
   
   ```bash
   deno task test tests/**/{related-feature}*.test.ts
   ```

3. **If tests fail:**
   ```
   ⚠️  Related feature tests failing: {feature-name}
   
   This suggests the changes may have affected other features.
   
   Would you like me to:
   1. Review and fix the failing tests
   2. See the error details first
   3. Rollback the changes
   
   Your choice:
   ```

**Run full test suite:**
```bash
deno task test
```

### Step 10: Complete and Summarize

**Final verification:**

1. **All tests pass:**
   ```
   ✅ All tests passing
      - Unit tests: {X} passing
      - Integration tests: {Y} passing
      - Related features: {Z} verified
   ```

2. **Type check:**
   ```bash
   deno check frontend/**/*.tsx
   deno check shared/**/*.ts
   ```

**Summarize changes:**
```
✅ Feature "{feature-name}" successfully updated!

📝 Summary of Changes:

**Modified Files:**
Backend:
- {file-1}: {description}
- {file-2}: {description}

Frontend:
- {file-1}: {description}
- {file-2}: {description}

Tests:
- {file-1}: {description}
- {file-2}: {description}

**Documentation Updated:**
- {feature-path}/requirements.md
- {feature-path}/api-spec.md
- {feature-path}/implementation.md

**Breaking Changes:** {Yes/No}
{if yes, list them}

**Migration Required:** {Yes/No}
{if yes, describe steps}

**Related Features Verified:**
{list features tested for regressions}

**Security Review:** ✅ Passed
- All authenticated endpoints verified
- User identity from auth context only

**Next Steps:**
- Feature is ready to use
- Consider running `/review` for code quality check
- Update any related documentation in docs/
- If this was in proposed/, consider `/feature-complete` to move to implemented/
```

**Offer next actions:**
```
Would you like to:
1. Make additional changes to this feature
2. Test the changes manually (I can provide test instructions)
3. Move to implemented/ with `/feature-complete` (if in proposed/)
4. Edit another feature
5. Done

Your choice:
```

## Error Handling

**If feature not found:**
```
❌ Feature "{feature-name}" not found.

I checked:
- features/proposed/{feature-name}/
- features/implemented/{feature-name}/

Available features:
{list all features}

Would you like to:
1. Create a new feature with `/new-feature`
2. Try a different feature name
```

**If no changes specified:**
```
I need to know what changes you'd like to make.

Please describe:
- What behavior should change
- What new functionality to add
- What bugs to fix
- What to improve

Example: "Add email notifications when a new workout is created"
```

**If breaking changes detected:**

Always warn and get confirmation before proceeding with breaking changes.

## Best Practices

1. **Always read before modifying** - Understand current implementation
2. **Update tests first** - Follow TDD even for modifications
3. **Security review** - Verify auth patterns after backend changes
4. **Document changes** - Update all relevant docs
5. **Test related features** - Check for regressions
6. **Summarize clearly** - Help user understand impact of changes

## Example Usage

```
User: /edit-feature
Assistant: [Lists available features]

User: notifications
Assistant: [Discovery phase - reads all existing code and docs]
          [Summarizes current implementation]
          What changes would you like to make?

User: Add support for email notifications, not just in-app