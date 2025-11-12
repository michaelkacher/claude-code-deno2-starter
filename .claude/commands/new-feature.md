---
description: Orchestrate full feature development workflow from requirements to implementation
---

You will guide the user through the complete **feature-scoped** development workflow using specialized sub-agents. This workflow uses **feature-specific documentation**.

## Feature-Scoped Workflow (Token-Optimized)

This command creates documentation in `features/proposed/{feature-name}/` instead of global `docs/` files.

## Workflow Steps

1. **Get feature name**: Ask the user for a short, kebab-case feature name (e.g., "user-authentication", "workout-planner")
2. **Requirements Gathering**: Use `requirements-agent-feature` to gather lightweight, focused requirements
3. **Write Tests**: Use `test-writer-agent` to create tests (TDD Red phase) - reads from feature folder
   - **NEW**: Steps 2 & 3 can run in parallel if user requests ("run in parallel") - 30-40% faster
4. **Implement Backend**: Use `backend-agent` to implement server-side logic - reads from feature folder
5. **Implement Frontend**: Use `frontend-agent` to build UI components - reads from feature folder
6. **Launch Integration Agent**: Automated post-implementation integration (Data Browser, Navigation, Security, Safety, Auto-Fix)
7. **Verify & Complete**: Run tests, offer to run `/feature-complete` to move to implemented

## Instructions

**Tech Stack Reference**: See `.claude/constants.md` for complete tech stack, architecture, and patterns.

### Step 0: Project Context Setup

**Check for project context** (only if `features/PROJECT_CONTEXT.md` doesn't exist):

1. Check if `features/PROJECT_CONTEXT.md` exists
2. If NO:
   - Show this message:
   ```
   ⚠️  No project context found
   
   I can help you create features right away, but defining project requirements first will help me generate higher quality, more aligned features.
   
   Setting up project context takes about 5-10 minutes and covers:
   - Your project vision and goals
   - Target users and their needs
   - Core features you envision
   - Success criteria
   
   Would you like to gather project requirements now? (Yes/No)
   
   If you choose 'No', I'll create the feature with general best practices.
   ```
   
3. **If user says YES**:
   - Launch `requirements-agent` to gather comprehensive project context
   - After PROJECT_CONTEXT.md is created, continue to Step 0.5
   
4. **If user says NO**:
   - Continue to Step 0.5 without project context
   - Features will still be created, just without project-specific alignment
   
5. If YES (PROJECT_CONTEXT.md exists): Skip to Step 0.5

**Note**: Architecture is pre-defined. See `.claude/constants.md`.

### Step 0.5: Check Mockups & Related Features

**Check for mockups**: Search `frontend/routes/mockups/*.tsx` (exclude `index.tsx`)

**If mockups exist**:
- List them: "Found mockups: /mockups/user-profile, /mockups/task-list"
- Ask: "Convert one of these to a full feature? (yes/no)"
- If yes: Use mockup name as feature name, extract design context

**Auto-detect related features**:
Run: `./scripts/detect-related-features.sh {feature-name}`
- Reports: Related mockups, proposed/implemented features, data model conflicts
- If conflicts found: Pass to requirements-agent-feature for consistency

**If no mockups**: Proceed to Step 1

Would you like to convert one of these mockups to a full feature?
- Yes: I'll use the mockup as a design reference
- No: I'll create a new feature from scratch

Your choice (yes/no):
```

**If user says yes:**

Ask which mockup:
```
Which mockup would you like to convert? (enter the name, e.g., "user-profile")
```

Then read the mockup file to extract context using the Read tool.

Extract the header comment block and use it as:
- Visual reference for requirements
- Layout inspiration for API design
- UI structure for frontend implementation
- **Check for "RELATED MOCKUPS" section** in the header to identify related features

**Check for related mockups/features (ENHANCED):**

If the mockup header mentions related mockups (e.g., "RELATED MOCKUPS: user-profile-view, user-settings"):
```
I noticed this mockup is related to: user-profile-view, user-settings

These features may share data models. I'll pass this information to the requirements agent to ensure data model consistency.
```

**Auto-detect related features (AUTOMATED):**

Run the automated detection script:
```bash
./scripts/detect-related-features.sh {feature-name}
```

This script will:
1. Search for mockups with similar name patterns (e.g., `campaign-*`)
2. Search `features/proposed/` and `features/implemented/` for related features
3. Extract data models from related features' requirements.md
4. Detect data model conflicts (same model name in multiple features)
5. Generate a summary report with warnings

**Example output**:
```
🔍 Detecting Related Features for: campaign-creator

[1/4] Searching for related mockups...
  → Found mockup: campaign-view
  ℹ  Declares relationships: campaign-settings

[2/4] Searching for related proposed features...
  ✓ No related proposed features found

[3/4] Searching for related implemented features...
  → Found implemented: campaign-management
  ℹ  Has requirements documentation
  ℹ  Data models: Campaign, CampaignMember

[4/4] Analyzing data model conflicts...
  ⚠  Model Campaign appears in 2 features:
      → campaign-management
      → campaign-creator (proposed)
      Action: Ensure model definitions are consistent

📊 Summary
Related Mockups (1):
  • campaign-view

Related Implemented Features (1):
  • campaign-management

⚠️  Data Model Warnings: 1

Recommendations:
  1. Review shared data model definitions
  2. Ensure field names and types are consistent
  3. Document shared models in 'Shared Models' section
  4. Consider creating a shared types file
```

**If conflicts found**:
Pass this information to requirements-agent-feature to ensure consistency.

Proceed to Step 2 (skip Step 1 - use mockup name as feature name basis).

**If user says no or no mockups exist:**

Proceed to Step 1 normally.

### Step 1: Get Feature Name

Ask the user:
```
What would you like to name this feature?
(Use kebab-case, e.g., "user-authentication", "workout-planner", "profile-settings")
```

Convert to kebab-case if needed (e.g., "User Auth" → "user-authentication").

### Step 2: Create Feature Directory

Create the directory structure:
```bash
mkdir -p features/proposed/{feature-name}
```

### Step 2.5: Auto-Detect Related Features

**After creating the feature directory, automatically detect related features:**

Run the detection script:
```bash
./scripts/detect-related-features.sh {feature-name}
```
### Step 1: Get Feature Name

Ask: "What would you like to name this feature? (kebab-case, e.g., 'user-authentication')"

Convert to kebab-case if needed.

### Step 2: Create Feature Directory

```bash
mkdir -p features/proposed/{feature-name}
```

### Step 2.5: Auto-Detect Related Features

Run: `./scripts/detect-related-features.sh {feature-name}`
- Report findings: related mockups, features, data model conflicts
- Ask user if they want to review related requirements (optional)
- Pass related feature info to requirements-agent-feature

### Step 3: Requirements & Tests (PARALLEL BY DEFAULT)

**Prepare project context** (if exists):
1. Check if `features/PROJECT_CONTEXT.md` exists
2. If YES: Read the file content to pass to requirements-agent-feature
3. This provides essential context about project vision, users, and goals

**Default: Parallel Execution** (30-40% faster):
- Launch requirements-agent-feature AND test-writer-agent together
- Test-writer waits for requirements.md to be created
- Both complete around same time

**Sequential option**: Only if user is first-time or requests it

**Pass to requirements-agent-feature**:
- Feature name and location
- **Project context from `features/PROJECT_CONTEXT.md`** (full content if exists)
- Related feature info from Step 2.5
- Mockup context (if converting a mockup)

**Example launch:**
```
Launching requirements-agent-feature with:
- Feature: {feature-name}
- Location: features/proposed/{feature-name}/
- Project Context: [content from PROJECT_CONTEXT.md]
- Related Features: [list from detection script]
```

### Step 4: Skip Architecture Check

**Auto-skip**: Architecture rarely changes for new features
**Only ask if**: Requirements mention new database tables, major components, or tech changes

Please ensure:
- Data models are consistent with related features
- Document shared models in the "Shared Models" section
- Analyze impact of data model changes in "Model Impact Analysis" section
- List related features with their status (mockup/proposed/implemented)
```

**Also suggest checking existing feature requirements:**

If related features are already implemented or proposed, use the File Search and Read tools to check for:
- `features/proposed/{related-feature-name}/requirements.md`
- `features/implemented/{related-feature-name}/requirements.md`

Read any existing requirements to understand shared data models.

### Step 4: Launch Test Writer Agent (ENHANCED)

After requirements are complete, launch **test-writer-agent** with environment handling:

```
Now I'll write tests for this feature (TDD Red phase).
This will create test files in tests/ directory.

Note: Tests will use --no-check flag to avoid pre-existing type errors.
```

**Pass these instructions to test-writer-agent:**
```
IMPORTANT - Test Environment Handling:

1. Use --no-check flag when running tests to avoid type errors
2. If Deno.openKv(':memory:') is not available, use mock KV implementation
3. Tests may fail with environment issues - this doesn't mean implementation is wrong
4. Focus on functional correctness over type perfection

Example test command:
deno test --no-check tests/unit/services/feature.service.test.ts -A
```

### Step 5: Ask About Architecture Changes

Ask the user:
```
Does this feature require architectural changes? (new database tables, major new components, etc.)
- Yes: I'll update docs/architecture.md
- No: We'll proceed with implementation
```

If yes, launch the **architect-agent** to update global architecture.
If no, skip this step (saves tokens).

### Step 5: Backend Implementation

**Option A (Recommended): Use unified implementation-agent**
- Single agent handles both backend + frontend
- Fewer handoffs, better context preservation
- Faster execution (20-30% time savings)

Launch **implementation-agent**: Implements full stack
- Reads from: `features/proposed/{feature-name}/requirements.md`
- Creates: Services, routes, repositories, islands, components, UI routes
- See `.claude/constants.md` for patterns

**Option B (Legacy): Separate backend + frontend agents**

Launch **backend-agent**: Implements services, routes, repositories
- Reads from: `features/proposed/{feature-name}/requirements.md`
- Creates: Service layer, API routes, repositories
- See `.claude/constants.md` for patterns

### Step 6: Frontend Implementation (Option B only)

Launch **frontend-agent**: Implements UI components
- Reads from: `features/proposed/{feature-name}/requirements.md`
- Creates: Routes, islands, components
- If from mockup: Use mockup as design reference

### Step 7: Integration & Validation

Launch **integration-agent**: Automates all post-implementation steps
- Updates Data Browser with new KV models
- Finds and updates navigation points
- Runs security scan (blocks if vulnerabilities found)
- Runs runtime safety scan (warns if issues found)
- Generates integration summary

**If integration-agent not available**: Run manual steps (security scan, navigation update)

**Integration agent actions**:
1. Detects related features & data conflicts
2. Updates Data Browser with KV models
3. Finds & updates navigation points
4. Runs security scan (blocks if fails)
5. Runs runtime safety scan (warns)
6. Generates integration report

### Step 8: Verify & Complete

**Run tests**:
```bash
deno test --no-check tests/unit/services/{feature-name}.service.test.ts -A
```
Focus on test pass/fail, not type errors.

**If from mockup**: Offer to delete mockup files

**Offer next steps**:
1. Run `/feature-complete` to move to implemented
2. Continue iterating
3. Manual testing

## Example Usage

**User**: `/new-feature campaign-creator`

**Flow**:
1. Create `features/proposed/campaign-creator/`
2. Launch requirements + tests (parallel)
3. Launch backend agent
4. Launch frontend agent
5. Launch integration agent
6. Run tests
7. Offer `/feature-complete`

**Time**: ~15-25 minutes (vs 45-60 sequential)
  • 2 KV models added to Data Browser
  • 1 navigation point updated
  • Security scan: PASSED
  • Runtime safety: PASSED

✅ Done! Run /feature-complete when ready to finalize.
```

### Example 2: Parallel Execution Mode (Faster)

**User**: `/new-feature implement campaign-creator in parallel mode`

**Assistant**:
```
I'll use parallel execution for maximum speed!

Step 1: Creating feature directory...
✅ Created features/proposed/campaign-creator/

Step 2 & 3: Launching requirements and test agents in parallel...
[Launches both requirements-agent-feature and test-writer-agent in single message]

⏱️ Both agents working simultaneously...
⏱️ Expected completion: ~7 minutes (vs 11 minutes sequential)

[Both agents complete]
✅ Requirements complete: features/proposed/campaign-creator/requirements.md
✅ Tests complete: tests/unit/services/campaign-creator.service.test.ts

Step 4: Implementing backend...
[Launches backend-agent]

Step 5: Implementing frontend...
[Launches frontend-agent]

Step 6: Running integration agent...
[Launches integration-agent]

✅ Done! Completed in 36% less time thanks to parallel execution.
```

## Best Practices

- **Agents run sequentially**: Each agent reads outputs from previous agents
- **Feature-scoped first**: Always use requirements-agent-feature for gathering requirements
- **Skip unnecessary steps**: Don't update architecture for small features
- **Keep user informed**: Show progress between agent launches
- **Validate feature name**: Ensure kebab-case (e.g., "user-auth", not "User Auth")
- **Use automation**: Let scripts handle security and safety scanning
- **Focus on functionality**: Type errors don't prevent runtime correctness

## Token Efficiency Comparison

| Approach | Token Usage | Description |
|----------|-------------|-------------|
| **Global docs** | ~26-42K | Original approach, writes to docs/ |
| **Feature-scoped** | ~15-20K | New approach, writes to features/ ⭐ |
| **With automation** | ~12-15K | Enhanced with automated scans/updates 🚀 |

**Savings**: 40-60% reduction in tokens per feature with automation

## When to Use Global vs Feature Workflow

### Use Feature-Scoped (This Command) ✅
- Adding new API endpoints
- Building new user-facing features
- Incremental improvements
- Experimental features
- Most development work (80% of cases)

### Use Global Workflow
- Initial project setup
- Architecture decisions affecting entire system
- Technology stack changes
- Project-wide refactoring

## Troubleshooting

### Issue: Agent can't find requirements
**Solution**: Ensure the feature name is consistent (kebab-case) and the requirements-agent-feature wrote to the correct path.

### Issue: Tests fail with type errors
**Solution**: This is expected with pre-existing type errors. Use `--no-check` flag. Focus on functional test results.

### Issue: Tests fail with "Deno.openKv is not a function"
**Solution**: This is an environment issue, not implementation issue. The production code will work correctly.

### Issue: Feature name conflicts
**Solution**: Use a unique, descriptive name. Check `features/proposed/` for existing features.

### Issue: Security scan reports false positives
**Solution**: Manually review the flagged code. If it's safe, document why in comments.

## Architecture Note

The enhanced feature-scoped approach:
- ✅ Reduces token usage by 40-60%
- ✅ Automated security and safety scanning
- ✅ Auto-detects and integrates navigation
- ✅ Auto-updates Data Browser
- ✅ Keeps features isolated and easy to rollback
- ✅ Preserves history in features/implemented/
- ✅ Allows parallel feature development
- ✅ Makes code review easier (one feature per folder)

Global architecture (docs/architecture.md) remains the source of truth for overall system design.

## Next Steps

After completing the feature:
- Run `/feature-complete {feature-name}` to finalize
- Or run `/review` for code quality check
## Best Practices

- **Parallel by default**: Faster execution (30-40% time savings)
- **Skip architecture updates**: Rarely needed for features
- **Use scaffolding**: Run `deno run -A scripts/scaffold-feature.ts {name} {Model}` to auto-generate boilerplate
- **Reference patterns**: See `.claude/constants.md` for tech stack and patterns
- **Focus on functionality**: Type errors don't prevent runtime correctness

## When to Use

**Use /new-feature for** (80% of work):
- New API endpoints
- New user-facing features
- Incremental improvements

**Use /requirements for**:
- Initial project setup
- Architecture changes
- Technology stack decisions

## Automation

**Available scripts**:
- `scaffold-feature.ts` - Generate boilerplate code
- `security-scan.sh` - Detect vulnerabilities
- `runtime-safety-scan.sh` - Check runtime safety  
- `detect-related-features.sh` - Find related features
- `update-data-browser.sh` - Auto-update Data Browser

**Integration agent**: Automates post-implementation steps (v2.1+)

## Next Steps

After `/new-feature`:
- `/feature-complete` - Move to implemented/
- `/review` - Code quality check
- `/new-feature` - Start another feature