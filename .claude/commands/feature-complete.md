---
description: Finalize a feature by moving it from proposed to implemented
---

You will finalize a completed feature by moving it from `features/proposed/` to `features/implemented/`, creating an implementation summary, and optionally updating global architecture documentation.

## Purpose

This command:
1. Moves feature documentation from proposed → implemented
2. Creates an implementation summary
3. Optionally updates global architecture docs with high-level changes
4. Preserves feature history for future reference

## Instructions

### Step 1: Get Feature Name

If not provided, ask the user:
```
Which feature would you like to mark as complete?

Available features in proposed/:
- {list features from features/proposed/}
```

### Step 2: Verify Feature Exists

Check that `features/proposed/{feature-name}/` exists:
- ✅ Exists: Continue
- ❌ Not found: Show available features and ask again

### Step 3: Verify Tests Pass

Run tests to ensure the feature is working:
```bash
deno test
```

If tests fail:
```
⚠️ Tests are failing. Would you like to:
1. Fix the tests first
2. Mark as complete anyway (not recommended)
3. Cancel
```

### Step 4: Create Implementation Summary

Create `features/proposed/{feature-name}/implementation.md` by:

1. Reading the existing feature docs to understand what was built
2. Listing all files created/modified
3. Summarizing what was implemented
4. Documenting any deviations from the original plan

Use this template:

```markdown
# Implementation Summary: {Feature Name}

**Status**: Implemented ✅
**Completed**: {Current Date}

## What Was Built

{High-level summary of what was implemented}

## Files Created/Modified

### Backend
- `backend/routes/{resource}.ts` - API endpoints
- `backend/services/{resource}.ts` - Business logic
- `tests/integration/api/{resource}.test.ts` - API tests

### Frontend
- `frontend/routes/{path}/index.tsx` - {Description}
- `frontend/islands/{Component}.tsx` - {Description}
- `frontend/components/{Component}.tsx` - {Description}

### Other
- {Any other files}

## API Endpoints Implemented

- ✅ `{METHOD} /api/v1/{path}` - {Description}
- ✅ `{METHOD} /api/v1/{path}` - {Description}

## Test Coverage

- **Backend Tests**: {Number} tests passing
- **Frontend Tests**: {Number} tests passing
- **Integration Tests**: {Number} tests passing

### Key Test Cases
- ✅ {Test case 1}
- ✅ {Test case 2}
- ✅ {Test case 3}

## Deviations from Original Plan

### What Changed
{List any changes from the original requirements/API spec}

### Why
{Explanation of why changes were made}

## Known Issues / Technical Debt

- {Issue 1} - {Plan to address}
- {Issue 2} - {Plan to address}

## Next Steps / Future Enhancements

- {Enhancement 1}
- {Enhancement 2}
```

### Step 5: Move to Implemented

Move the feature folder:
```bash
mv features/proposed/{feature-name} features/implemented/{feature-name}
```

### Step 6: Ask About Architecture Update

Ask the user:
```
Should I update the global architecture documentation (docs/architecture.md) with this feature?

This is recommended if the feature:
- Added new database tables/schemas
- Introduced new major components
- Changed system-wide patterns
- Affects other features

Update architecture docs? (yes/no)
```

If yes:
1. Read `docs/architecture.md`
2. Add a brief section about this feature under appropriate heading
3. Keep it high-level (1-2 paragraphs)
4. Link to the feature docs for details

Example addition:
```markdown
### User Authentication (Added: 2025-01-15)

The user authentication feature provides email/password login with JWT tokens.
Users can register, login, and access protected routes. Sessions are managed
using HTTP-only cookies for security.

Details: See `features/implemented/user-authentication/`
```

### Step 7: Create Git Commit (Optional)

Ask the user:
```
Would you like me to create a git commit for this feature? (yes/no)
```

If yes:
```bash
git add features/implemented/{feature-name}
git add {list of backend/frontend files}
git commit -m "feat: implement {feature-name}

- {Key change 1}
- {Key change 2}
- {Key change 3}

Closes #{issue-number if applicable}

🤖 Generated with Claude Code"
```

### Step 8: Summary

Show completion message:
```
✅ Feature "{feature-name}" marked as complete!

📁 Location: features/implemented/{feature-name}/
📝 Documentation:
   - requirements.md - Original requirements
   - api-spec.md - API specification
   - data-models.md - Data models
   - implementation.md - What was built

{If architecture updated:}
📚 Architecture docs updated: docs/architecture.md

{If commit created:}
💾 Git commit created

Next steps:
- Deploy the feature: deno task deploy
- Review code: /review
- Start next feature: /new-feature
```

## Example Usage

**User**: `/feature-complete user-authentication`

**Assistant**:
```
Finalizing feature "user-authentication"...

✅ All tests passing (23 tests)

Creating implementation summary...
✅ Created features/proposed/user-authentication/implementation.md

Moving to implemented...
✅ Moved to features/implemented/user-authentication/

Should I update the global architecture documentation?
(Recommended for features with new database schemas or major components)
```

**User**: `yes`

**Assistant**:
```
✅ Updated docs/architecture.md with authentication feature summary

Would you like me to create a git commit? (yes/no)
```

**User**: `yes`

**Assistant**:
```
✅ Created git commit

✅ Feature "user-authentication" marked as complete!

📁 Location: features/implemented/user-authentication/
📝 Implementation summary created
📚 Architecture docs updated
💾 Git commit created

Next steps:
- Deploy: deno task deploy
- Review: /review
- New feature: /new-feature
```

## Best Practices

1. **Always run tests first**: Ensure the feature works before marking complete
2. **Document deviations**: If implementation differs from plan, explain why
3. **Update architecture selectively**: Only for major features
4. **Keep summaries concise**: Focus on what's useful for future reference
5. **Commit logically**: One feature per commit

## Rollback

If you need to move a feature back to proposed:
```bash
mv features/implemented/{feature-name} features/proposed/{feature-name}
rm features/proposed/{feature-name}/implementation.md
```

## Token Efficiency

This command:
- Reads only the specific feature docs (not entire project)
- Creates a concise implementation summary
- Updates global docs only when necessary
- Minimal context loading (~2-5K tokens)

## Integration with Other Commands

- **After**: `/new-feature` - Complete features created with /new-feature
- **Before**: `/review` - Review code before marking complete
- **Related**: `/requirements`, `/architect` - For initial project setup

## File Structure After Completion

```
features/
├── proposed/
│   └── {other-features}/
└── implemented/
    └── {feature-name}/
        ├── requirements.md      # Original requirements
        ├── api-spec.md         # API specification
        ├── data-models.md      # Data models
        ├── notes.md            # Development notes (if any)
        └── implementation.md   # ✨ NEW: What was actually built
```

## Notes

- The feature folder becomes a historical record
- Future developers can see why decisions were made
- Easy to reference when building related features
- Can compare requirements vs. implementation
