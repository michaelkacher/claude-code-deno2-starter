---
description: Orchestrate full feature development workflow from requirements to implementation
---

You will guide the user through the complete **feature-scoped** development workflow using specialized sub-agents. This workflow uses **feature-specific documentation** for maximum token efficiency.

## Feature-Scoped Workflow (Token-Optimized)

This command creates documentation in `features/proposed/{feature-name}/` instead of global `docs/` files, reducing token usage by **40-50%**.

## Workflow Steps

1. **Get feature name**: Ask the user for a short, kebab-case feature name (e.g., "user-authentication", "workout-planner")
2. **Requirements Gathering**: Use `requirements-agent-feature` to gather lightweight, focused requirements
3. **Write Tests**: Use `test-writer-agent` to create tests (TDD Red phase) - reads from feature folder
4. **Implement Backend**: Use `backend-agent` to implement server-side logic - reads from feature folder
5. **Implement Frontend**: Use `frontend-agent` to build UI components - reads from feature folder
6. **Update Data Browser**: Automatically add new Deno KV models to the Data Browser
7. **Test for Runtime Errors**: Check frontend routes for common runtime errors and add safety checks
8. **Verify & Complete**: Run tests, offer to run `/feature-complete` to move to implemented

## Instructions

### Step 0: First-Run Detection and Project Context (IMPORTANT)

Before starting, detect if this is the user's first feature by checking for existing project context:

1. **Check for global requirements first:**
   
   Use the Read tool to check if `docs/requirements.md` exists and read its contents.

2. **If docs/requirements.md exists (user already ran /requirements):**

   Tell the user:
   ```
   ✅ Found existing project requirements in docs/requirements.md
   I'll extract project context from there to avoid asking duplicate questions.
   ```

   **Extract project context from docs/requirements.md:**
   - Read the file looking for sections like:
     - "Project Purpose" or "Overview" or "What we're building"
     - "Target Users" or "User Personas" or "Who will use this"
     - "Goals" or "Objectives" or "Key Problems"
     - "Tech Stack" or "Technology"

   **Create features/PROJECT_CONTEXT.md from extracted data:**
   ```markdown
   # Project Context

   **What we're building:** {extracted from requirements.md}

   **Primary users:** {extracted from requirements.md}

   **Key goal:** {extracted from requirements.md}

   **Tech stack:** {extracted from requirements.md, default to Fresh 1.7.3 + Deno KV if not specified}

   ---

   *Extracted from docs/requirements.md on {date}*
   This file provides lightweight project context for features. For comprehensive requirements, see `docs/requirements.md`.
   ```

   Say:
   ```
   ✅ Project context extracted from docs/requirements.md
   Proceeding with feature development...
   ```

   **Skip to Step 0.5** - no need to ask project questions.

3. **If docs/requirements.md does not exist, check for existing features:**
   
   Use the List Directory tool to check if any features exist in `features/proposed/` or `features/implemented/`.

4. **If no features exist AND docs/requirements.md does not exist (first run):**

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

   **Tech stack:** Fresh 1.7.3 (API routes + SSR + Islands), Deno KV (database)

   ---

   This file provides lightweight project context for features. For comprehensive requirements, use `/requirements` to create `docs/requirements.md`.
   ```

   Then say:
   ```
   ✅ Project context saved! Now let's build your first feature.
   ```

5. **If features exist (subsequent runs):**

   Skip the questions and proceed directly to feature development.

4. **Check architecture:**

   Use the Read tool to verify `docs/architecture.md` exists.

   **It should exist** (this template ships with a pre-defined architecture).

   If it exists, read it briefly to understand the tech stack:
   - Backend: Fresh 1.7.3 API routes
   - Frontend: Fresh + Preact Islands
   - Database: Deno KV
   - Deployment: Deno Deploy

   **If it doesn't exist (unusual)**, tell the user:
   ```
   Note: This template includes a pre-defined architecture in docs/architecture.md.

   I'll proceed with the default stack:
   - Backend: Fresh 1.7.3 API routes
   - Frontend: Fresh + Preact Islands
   - Database: Deno KV

   If you need a different stack, this template may not be suitable.
   ```

**Then proceed with feature development** - the architecture is already defined.

### Step 0.5: Check for Existing Mockups and Related Features (NEW)

Before asking for a feature name, use the File Search tool to check for existing mockups:

Search for files matching `frontend/routes/mockups/*.tsx` (excluding `index.tsx`).

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

Then read the mockup file to extract context using the Read tool.

Extract the header comment block and use it as:
- Visual reference for requirements
- Layout inspiration for API design
- UI structure for frontend implementation
- **Check for "RELATED MOCKUPS" section** in the header to identify related features

**Check for related mockups/features:**

If the mockup header mentions related mockups (e.g., "RELATED MOCKUPS: user-profile-view, user-settings"):
```
I noticed this mockup is related to: user-profile-view, user-settings

These features may share data models. I'll pass this information to the requirements agent to ensure data model consistency.
```

Store the list of related features to pass to requirements-agent-feature.

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

**If features/PROJECT_CONTEXT.md exists:**

Include this in the agent context:
```
Reading project context from features/PROJECT_CONTEXT.md...

Project context will be used to:
- Skip asking about overall project purpose
- Skip asking about target users
- Skip asking about tech stack
- Focus only on feature-specific requirements

The requirements agent will only ask about this specific feature's:
- User stories and acceptance criteria
- API endpoints and data models
- UI/UX requirements
- Edge cases and validation rules
```

**If related mockups/features were identified in Step 0.5:**

Include this in the agent prompt:
```
This feature is related to: {list of related mockups/features}

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

### Step 4: Launch Test Writer Agent

After requirements are complete, launch **test-writer-agent**:

```
Now I'll write tests for this feature (TDD Red phase).
This will create test files in tests/ directory.
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

### Step 6: Launch Backend Agent

Launch the **backend-agent**:

```
I'll implement the backend API routes and services.
The agent will read from: features/proposed/{feature-name}/api-spec.md
```

**Note**: The backend-agent will implement routes, services, and data models.

### Step 6.5: Security Review - Authenticated Routes (MANDATORY)

**After backend implementation, verify auth security for all authenticated endpoints:**

1. **Identify authenticated routes:**
   Check for routes that require authentication (user-specific data, protected resources).

2. **Security checklist for EACH authenticated route:**

   **❌ SECURITY VULNERABILITY - Check validation schemas:**
   ```typescript
   // Search in route files for: userId.*z\.string
   const Schema = z.object({
     userId: z.string(),  // ⚠️ RED FLAG - accepting userId from client!
   });
   ```

   **✅ CORRECT PATTERN:**
   ```typescript
   // Validation schema should NOT include userId
   const CreateSchema = z.object({
     name: z.string(),
     // ... other fields, but NO userId
   });

   export const handler: Handlers<unknown, AppState> = {
     POST: withErrorHandler(async (req, ctx) => {
       // Get userId from auth context
       const user = requireUser(ctx);
       const data = await parseJsonBody(req, CreateSchema);
       
       // CRITICAL: Use user.sub (NOT user.id - that doesn't exist!)
       await service.create({
         ...data,
         userId: user.sub,  // ✅ Correct - JWT 'sub' claim contains user ID
       });
     })
   };
   ```

3. **Automated security scan:**
   ```bash
   # Check for userId in validation schemas (potential security issue)
   grep -n "userId.*z\." frontend/routes/api/**/*.ts
   
   # Check for incorrect user.id usage (should be user.sub)
   grep -n "user\.id" frontend/routes/api/**/*.ts
   
   # All matches should be investigated
   ```

4. **Manual verification:**
   - [ ] No validation schemas accept `userId` from request body
   - [ ] All routes use `requireUser(ctx)` or `requireAdmin(ctx)` 
   - [ ] User identity comes from `user.sub` (NOT `user.id` which doesn't exist!)
   - [ ] No routes accept user IDs from query params or URL params for access control

5. **Common security violations:**
   - ❌ `userId` in Zod schema from request body
   - ❌ `ownerId` in Zod schema from request body
   - ❌ `createdBy` in Zod schema from request body
   - ❌ Using `user.id` instead of `user.sub` (causes undefined errors)
   - ✅ All user identity fields populated from `ctx.state.user.sub`

**Why this matters:** 
- Accepting user IDs from clients allows impersonation attacks
- Using `user.id` causes runtime errors (field doesn't exist in JWT payload)
- Always use `user.sub` for user ID (JWT standard "subject" claim)

### Step 7: Launch Frontend Agent

Launch the **frontend-agent**:

```
I'll implement the frontend UI components.
The agent will read from: features/proposed/{feature-name}/
```

### Step 8: Update Data Browser (If New Data Models)

After backend implementation, check if the feature added new Deno KV data models:

1. **Check backend code for KV key patterns:**
   - Check the "Deno KV Schema" section
   - Identify any new key prefixes (e.g., `['workout_category', ...]`)

3. **If new data models were added:**

   Read the Data Browser configuration:
   ```
   Read frontend/routes/api/admin/data/models.ts
   ```

   Find the `MODEL_PREFIXES` array and add the new model prefix(es):
   ```typescript
   const MODEL_PREFIXES = [
     'users',
     'users_by_email',
     // ... existing models ...
     'new_model_prefix',  // Add new prefix here
   ];
   ```

   Say:
   ```
   ✅ Updated Data Browser to support the new {model-name} data model.
   Admins can now browse this data at /admin/data
   ```

4. **If no new data models:**
   Skip this step.

### Step 10: Test for Runtime Errors (Frontend Routes)

After frontend implementation, **MANDATORY runtime safety verification**:

1. **Identify new routes and islands:**
   - Routes: `frontend/routes/**/*.tsx`
   - Islands: `frontend/islands/**/*.tsx`

2. **Type-check all files:**
   ```bash
   deno check frontend/routes/[new-route-path].tsx
   deno check frontend/islands/[new-island].tsx
   ```

3. **Automated Safety Scan - Check for these patterns:**

   **❌ UNSAFE Pattern 1: Array operations without null checks**
   ```typescript
   // Search for: \.map\(|\.filter\(|\.length
   {items.map(item => ...)}           // BAD
   {(items || []).map(item => ...)}  // GOOD
   ```

   **❌ UNSAFE Pattern 2: Nested property access**
   ```typescript
   // Search for: \.\w+\.\w+
   user.profile.name                  // BAD
   user.profile?.name                 // GOOD
   user?.profile?.name ?? 'Unknown'   // BETTER
   ```

   **❌ UNSAFE Pattern 3: Design system component usage**
   ```typescript
   // Check: Are all component interfaces understood?
   <Select options={data} />          // Does Select require options?
   <Select>{children}</Select>        // Does Select support children?
   // Solution: Read component interface first!
   ```

   **❌ UNSAFE Pattern 4: Controlled component event handlers**
   ```typescript
   // Search for: e\.target
   onChange={(e) => setState(e.target.value)}           // BAD
   onChange={(e) => setState(e.currentTarget.value)}    // GOOD
   ```

   **❌ UNSAFE Pattern 5: Controlled Select with children pattern**
   ```typescript
   // Check for: <Select.*value.*>.*<option
   <Select value={state}>                               // BAD - unreliable
     <option value="1">Item 1</option>
   </Select>
   
   <Select value={state} options={[...]} />            // GOOD - reliable
   ```

   **❌ UNSAFE Pattern 6: Direct localStorage access**
   ```typescript
   // Search for: localStorage\.
   localStorage.getItem('token')      // BAD
   TokenStorage.getAccessToken()      // GOOD
   ```

4. **Manual Code Review Checklist:**
   - [ ] Every `.map()` has `(array || [])` pattern
   - [ ] Every `.filter()` has `(array || [])` pattern
   - [ ] Every `.length` has null check or `?.`
   - [ ] Every nested property uses `?.` optional chaining
   - [ ] All design system components checked against their interfaces
   - [ ] All event handlers use `e.currentTarget` not `e.target`
   - [ ] All controlled `<Select>` components use `options` prop pattern
   - [ ] No direct `localStorage` calls (use `TokenStorage`)
   - [ ] No manual `fetch` calls (use `apiClient`)

5. **Fix any issues found:**
   ```typescript
   // Apply defensive patterns
   const safeItems = items || [];
   const safeName = user?.profile?.name ?? 'Unknown';
   {(abilities || []).map(ability => <Card>{ability.name}</Card>)}
   ```

6. **Test in browser (if dev server running):**
   - Navigate to new routes
   - Check browser console for errors
   - Test with missing/undefined data scenarios

7. **Document safety checks:**
   Add to feature's implementation notes:
   ```markdown
   ## Runtime Safety Checks Applied
   - ✅ All array operations use `(array || [])` pattern
   - ✅ All nested properties use optional chaining `?.`
   - ✅ Design system components verified against interfaces
   - ✅ TokenStorage used instead of localStorage
   - ✅ apiClient used instead of manual fetch
   ```

**This step prevents 90% of production runtime errors!**

Say:
```
✅ Verified all routes and islands for runtime safety.
   - Checked X array operations
   - Checked Y nested property accesses
   - Verified Z design system component usages
   All safety patterns applied.
```

### Step 11: Verify & Complete

Run tests:
```bash
deno task test
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

Step 2: Writing tests...
[Launches test-writer-agent]

Step 3: Implementing backend...
[Launches backend-agent]

Step 4: Implementing frontend...
[Launches frontend-agent]

✅ Done! Run /feature-complete when ready to finalize.
```

## Best Practices

- **Agents run sequentially**: Each agent reads outputs from previous agents
- **Feature-scoped first**: Always use requirements-agent-feature for gathering requirements
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
