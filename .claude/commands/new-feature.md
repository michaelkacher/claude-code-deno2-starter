---
description: Orchestrate full feature development workflow from requirements to implementation
---

You will guide the user through the complete **feature-scoped** development workflow using specialized sub-agents. This workflow uses **feature-specific documentation** for maximum token efficiency.

## Feature-Scoped Workflow (Token-Optimized)

This command creates documentation in `features/proposed/{feature-name}/` instead of global `docs/` files, reducing token usage by **40-50%**.

## Workflow Steps

0. **First-Run Detection**: Check if `docs/architecture.md` exists to determine if this is first feature
1. **Get feature name**: Ask the user for a short, kebab-case feature name (e.g., "user-authentication", "workout-planner")
2. **Requirements Gathering**: Use `requirements-agent-feature` to gather lightweight, focused requirements
3. **API Design**: Use `api-designer-agent-feature` to design endpoints and data models
4. **Write Tests**: Use `test-writer-agent` to create tests (TDD Red phase) - reads from feature folder
5. **Implement Backend**: Use `backend-agent` to implement server-side logic - reads from feature folder
6. **Implement Frontend**: Use `frontend-agent` to build UI components - reads from feature folder
7. **Verify & Complete**: Run tests, offer to run `/feature-complete` to move to implemented

## Instructions

### Step 0: First-Run Detection (IMPORTANT)

Before starting, check if architecture documentation exists:

Use the Read tool to check for `docs/architecture.md`. If it doesn't exist, inform the user:

```
⚠️  I noticed this might be your first feature!

For the best experience, I recommend setting up your project architecture first.
This ensures your features align with your vision and avoids rework.

Would you like to:
a) Run /requirements + /architect first (recommended - defines your tech stack)
b) Continue with default architecture (Hono + Fresh + Deno KV)
c) Skip architecture setup (I'll ask about architecture decisions as needed)
```

If the user chooses option (a), stop and suggest:
```
Great! Please run:
1. /requirements - Define what you're building
2. /architect - Design the system architecture
3. /new-feature - Build your first feature (come back here!)
```

If the user chooses option (b), continue but note that they're using defaults.
If the user chooses option (c), continue and ask about architecture during the workflow.

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

### Step 3: Launch Requirements Agent

Launch the **requirements-agent-feature** (NOT the regular requirements-agent):

```
I'm launching the requirements agent to gather focused requirements for the "{feature-name}" feature.
This will create: features/proposed/{feature-name}/requirements.md
```

**Important**: Pass the feature name to the agent so it knows where to write files.

### Step 4: Launch API Designer Agent

After requirements are complete, launch **api-designer-agent-feature**:

```
Now I'll design the API endpoints and data models for this feature.
This will create:
- features/proposed/{feature-name}/api-spec.md
- features/proposed/{feature-name}/data-models.md
```

### Step 5: Ask About Architecture Changes

Ask the user:
```
Does this feature require architectural changes? (new database tables, major new components, etc.)
- Yes: I'll update docs/architecture.md
- No: We'll proceed with tests
```

If yes, launch the **architect-agent** to update global architecture.
If no, skip this step (saves tokens).

### Step 6: Launch Test Writer

Launch the **test-writer-agent**:

```
I'll write tests for this feature following TDD principles (Red phase).
The agent will read from: features/proposed/{feature-name}/api-spec.md
```

**Note**: The test-writer-agent automatically checks feature folders first.

### Step 7: Launch Backend Agent

Launch the **backend-agent**:

```
I'll implement the backend to make the tests pass (Green phase).
The agent will read from: features/proposed/{feature-name}/
```

### Step 8: Launch Frontend Agent

Launch the **frontend-agent**:

```
I'll implement the frontend UI components.
The agent will read from: features/proposed/{feature-name}/
```

### Step 9: Verify & Complete

Run tests:
```bash
deno test
```

Then offer:
```
✅ Feature "{feature-name}" is complete!

Would you like to:
1. Run /feature-complete to move this to features/implemented/
2. Continue iterating on the feature
3. Test the feature manually first
```

## Example Usage

**User**: `/new-feature` or `/new-feature add user profile editing`

**Assistant**:
```
Great! Let's build a new feature using the optimized feature-scoped workflow.

What would you like to name this feature?
(Suggestion based on your description: "user-profile-editing")
```

**User**: `user-profile-editing`

**Assistant**:
```
Perfect! I'll create the feature in: features/proposed/user-profile-editing/

Step 1: Gathering requirements...
[Launches requirements-agent-feature]

Step 2: Designing API...
[Launches api-designer-agent-feature]

Step 3: Writing tests...
[Launches test-writer-agent]

Step 4: Implementing backend...
[Launches backend-agent]

Step 5: Implementing frontend...
[Launches frontend-agent]

✅ Done! Run /feature-complete when ready to finalize.
```

## Best Practices

- **Agents run sequentially**: Each agent reads outputs from previous agents
- **Feature-scoped first**: Always use feature agents (requirements-agent-feature, api-designer-agent-feature)
- **Skip unnecessary steps**: Don't update architecture for small features
- **Keep user informed**: Show progress between agent launches
- **Validate feature name**: Ensure kebab-case (e.g., "user-auth", not "User Auth")

## Token Efficiency Comparison

| Approach | Token Usage | Description |
|----------|-------------|-------------|
| **Global docs** | ~26-42K | Original approach, writes to docs/ |
| **Feature-scoped** | ~15-20K | New approach, writes to features/ ⭐ |

**Savings**: 40-50% reduction in tokens per feature

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

### Issue: Tests fail after implementation
**Solution**: Review the API spec in `features/proposed/{feature-name}/api-spec.md` and ensure implementation matches.

### Issue: Feature name conflicts
**Solution**: Use a unique, descriptive name. Check `features/proposed/` for existing features.

## Architecture Note

The feature-scoped approach:
- ✅ Reduces token usage by 40-50%
- ✅ Keeps features isolated and easy to rollback
- ✅ Preserves history in features/implemented/
- ✅ Allows parallel feature development
- ✅ Makes code review easier (one feature per folder)

Global architecture (docs/architecture.md) remains the source of truth for overall system design.

## Next Steps

After completing the feature:
- Run `/feature-complete {feature-name}` to finalize
- Or run `/review` for code quality check
- Or start another feature with `/new-feature`
