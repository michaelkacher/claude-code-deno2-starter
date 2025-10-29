---
description: Create UI mockup to visualize screens before building features
---

You will help the user create a visual UI mockup to experiment with design ideas before implementing a full feature.

## Purpose

The mockup command allows rapid UI prototyping without backend logic:
- ✅ Visualize new screens quickly
- ✅ Iterate on design without backend work
- ✅ Get user feedback before full implementation
- ✅ Convert approved mockups to full features

## Workflow

### Step 1: Determine Mockup Type

Ask the user:
```
What would you like to mockup?

a) New screen (create from scratch)
b) Changes to existing screen (modify current UI)

Please describe what you want to see:
```

**Capture:**
- Screen purpose (e.g., "User profile page", "Task list view")
- Key elements (e.g., "form with email/password", "table of tasks")
- Rough layout (e.g., "sidebar navigation", "centered card")

### Step 2: Gather Mockup Details

Based on their description, ask clarifying questions:

```
Let me understand the mockup better:

1. What's the main purpose of this screen?
2. What information should be displayed?
3. Are there any user actions? (buttons, forms, etc.)
4. What's the rough layout? (sidebar, grid, centered, etc.)
5. Any specific components? (tables, cards, modals, etc.)
```

**Note:** Keep it high-level. We're creating a visual mockup, not a full specification.

### Step 3: Generate Mockup Name

Convert the description to a kebab-case name:
- "User Profile Page" → `user-profile`
- "Task List View" → `task-list`
- "Login Form" → `login-form`

Ask for confirmation:
```
I'll create this mockup as: [mockup-name]

Is this name OK? (or suggest a different name)
```

### Step 4: Create Mockup Route

Launch the **mockup-agent** to create the frontend mockup with embedded documentation:

```
I'm creating the mockup route with all context embedded.
This will create: frontend/routes/mockups/[mockup-name].tsx

The mockup will be accessible at: http://localhost:3000/mockups/[mockup-name]
```

Pass the mockup details to the agent:
- Mockup name
- Purpose/description
- Key elements
- Layout type
- Mock data needed
- Any specific notes

The agent will create a single TSX file with:
- Documentation in header comments
- Mock data inline
- Visual UI components

### Step 5: Start Dev Server (if needed)

Check if the dev server is running:

```bash
# If not running, suggest:
The mockup is ready! Start the dev server to view it:

deno task dev

Then visit: http://localhost:3000/mockups/[mockup-name]
```

### Step 6: Post-Creation Options

After the mockup is created, present options:

```
✅ Mockup created successfully!

View it at: http://localhost:3000/mockups/[mockup-name]

What would you like to do next?

a) Create a full feature from this mockup (/new-feature)
b) Make changes to the mockup (iterate on design)
c) Create another mockup
d) Delete this mockup
e) Done (I'll review it first)
```

**Handle user choice:**

**Option a) Create full feature:**
```
Great! I'll help you convert this mockup to a full feature.

This will:
1. Use the mockup as a design reference
2. Add backend logic and API endpoints
3. Add real data and interactions
4. Write tests following TDD
5. Move from /mockups to production routes

Ready to start? This will run /new-feature
```

Then suggest running `/new-feature` with the mockup context.

**Option b) Make changes:**
```
What changes would you like to make to the mockup?

Describe the changes:
```

Re-launch the mockup-agent with the changes.

**Option c) Create another mockup:**
Start the workflow over.

**Option d) Delete mockup:**
```
Are you sure you want to delete this mockup? (yes/no)
```

If yes:
```bash
rm -f frontend/routes/mockups/[mockup-name].tsx
```

**Option e) Done:**
```
Great! Review the mockup and run /mockup again when ready to iterate or convert to a feature.

Mockup location:
- Route: frontend/routes/mockups/[mockup-name].tsx
- URL: http://localhost:3000/mockups/[mockup-name]

All mockup documentation is embedded in the TSX file header comments.
```

## Key Points

**Mockups are:**
- ✅ Visual prototypes for quick iteration
- ✅ Non-functional (buttons/forms don't work yet)
- ✅ Converted to full features with `/new-feature`

## Integration with /new-feature

When you run `/new-feature`, it will automatically detect existing mockups and offer to convert them to full features with backend logic, tests, and real data.
