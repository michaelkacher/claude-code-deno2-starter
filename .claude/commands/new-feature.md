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

### Step 0: First-Run Detection and Project Context (IMPORTANT)

Before starting, detect if this is the user's first feature by checking for existing features:

1. **Check for existing features:**
   ```bash
   ls features/proposed/ features/implemented/
   ```

2. **If no features exist (first run):**

   Tell the user:
   ```
   Welcome! This looks like your first feature. Let me ask a few quick questions about your project.

   This will help me provide better guidance and won't require running /requirements separately.
   ```

   **Ask these 3 lightweight questions:**

   a) **Project Purpose** (1-2 sentences):
      ```
      What are you building? (Brief description)
      Example: "A workout tracking app for gym-goers"
      ```

   b) **Primary Users** (1 sentence):
      ```
      Who will use this?
      Example: "Fitness enthusiasts who want to track their progress"
      ```

   c) **Key Goal** (1 sentence):
      ```
      What's the main problem this solves?
      Example: "Makes it easy to log workouts and see progress over time"
      ```

   **Create lightweight project context file:**

   Create `features/PROJECT_CONTEXT.md`:
   ```markdown
   # Project Context

   **What we're building:** {answer a}

   **Primary users:** {answer b}

   **Key goal:** {answer c}

   **Tech stack:** Hono (backend), Fresh + Preact (frontend), Deno KV (database)

   ---

   This file provides lightweight project context for features. For comprehensive requirements, use `/requirements` to create `docs/requirements.md`.
   ```

   Then say:
   ```
   ✅ Project context saved! Now let's build your first feature.
   ```

3. **If features exist (subsequent runs):**

   Skip the questions and proceed directly to feature development.

4. **Check architecture:**

   Use the Read tool to verify `docs/architecture.md` exists.

   **It should exist** (this template ships with a pre-defined architecture).

   If it exists, read it briefly to understand the tech stack:
   - Backend: Hono
   - Frontend: Fresh + Preact (optional)
   - Database: Deno KV
   - Deployment: Deno Deploy

   **If it doesn't exist (unusual)**, tell the user:
   ```
   Note: This template includes a pre-defined architecture in docs/architecture.md.

   I'll proceed with the default stack:
   - Backend: Hono
   - Frontend: Fresh + Preact
   - Database: Deno KV

   If you need a different stack, this template may not be suitable.
   ```

**Then proceed with feature development** - the architecture is already defined.

### Step 0.5: Check for Existing Mockups (NEW)

Before asking for a feature name, check for existing mockups:

```bash
ls frontend/routes/mockups/*.tsx 2>/dev/null | grep -v "index.tsx"
```

**If mockups exist:**

List them for the user:
```
I found these UI mockups:
1. /mockups/user-profile
2. /mockups/task-list

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

Then read the mockup file to extract context:
```bash
cat frontend/routes/mockups/[mockup-name].tsx
```

Extract the header comment block and use it as:
- Visual reference for requirements
- Layout inspiration for API design
- UI structure for frontend implementation

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

**If this feature was converted from a mockup:**

Ask about mockup cleanup:
```
✅ Feature "{feature-name}" is complete!

This feature was based on the mockup at /mockups/{mockup-name}.

Would you like to delete the mockup file? (yes/no)
```

If yes:
```bash
rm -f frontend/routes/mockups/{mockup-name}.tsx
```

Then say:
```
✅ Mockup deleted. The full feature is now in production routes.
```

**Then offer next steps:**

```
Would you like to:
1. Run /feature-complete to move docs to features/implemented/
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
