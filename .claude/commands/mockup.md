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

### Step 4: Create Mockup Documentation

Create the mockup folder and documentation:

**Create directory:**
```bash
mkdir -p features/mockups/[mockup-name]
```

**Create `features/mockups/[mockup-name]/mockup-spec.md`:**
```markdown
# Mockup: [Mockup Name]

**Created:** [Date]
**Status:** Draft
**Route:** /mockups/[mockup-name]

## Purpose

[What this screen is for]

## Screen Description

[High-level description of the screen]

## Key Elements

- [Element 1]
- [Element 2]
- [Element 3]

## Layout

[Describe the layout structure]

## Components Needed

- [ ] [Component 1]
- [ ] [Component 2]
- [ ] [Component 3]

## Mock Data

[Define what fake data to display]

## Notes

- This is a non-functional mockup
- No backend integration
- No real interactions (buttons don't do anything)
- For visualization purposes only
```

### Step 5: Create Mockup Route

Launch the **mockup-agent** to create the frontend mockup:

```
I'm launching the mockup agent to create the UI.
This will create: frontend/routes/mockups/[mockup-name].tsx

The mockup will be accessible at: http://localhost:3000/mockups/[mockup-name]
```

Pass the mockup specification to the agent.

### Step 6: Start Dev Server (if needed)

Check if the dev server is running:

```bash
# If not running, suggest:
The mockup is ready! Start the dev server to view it:

deno task dev

Then visit: http://localhost:3000/mockups/[mockup-name]
```

### Step 7: Post-Creation Options

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
rm -rf features/mockups/[mockup-name]
rm -f frontend/routes/mockups/[mockup-name].tsx
```

**Option e) Done:**
```
Great! Review the mockup and run /mockup again when ready to iterate or convert to a feature.

Mockup location:
- Spec: features/mockups/[mockup-name]/mockup-spec.md
- Route: frontend/routes/mockups/[mockup-name].tsx
- URL: http://localhost:3000/mockups/[mockup-name]
```

## Example Usage

**User:** `/mockup`

**Assistant:**
```
Let's create a UI mockup!

What would you like to mockup?
a) New screen
b) Changes to existing screen

Describe what you want to see:
```

**User:** `A user profile page with avatar, name, email, bio, and edit button`

**Assistant:**
```
Let me understand the mockup better:

1. Main purpose: User profile display
2. Information: avatar, name, email, bio
3. Actions: edit button (non-functional for now)
4. Layout: Centered card
5. Components: Card, Avatar, Form fields

I'll create this mockup as: user-profile

Is this name OK?
```

**User:** `yes`

**Assistant:**
```
Creating mockup...

✅ Created: features/mockups/user-profile/mockup-spec.md
✅ Created: frontend/routes/mockups/user-profile.tsx

View at: http://localhost:3000/mockups/user-profile

What would you like to do next?
a) Create full feature from mockup
b) Make changes
c) Create another mockup
d) Delete mockup
e) Done
```

## Best Practices

### Keep Mockups Simple
- Use placeholder text (Lorem ipsum)
- Use mock data (fake user names, dates)
- Keep styling minimal (Tailwind classes)
- Focus on layout and structure

### Mock Data Examples

```typescript
// Example mock data in the route
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
};
```

### Non-Functional Interactions

```tsx
// Buttons that don't do anything (yet)
<button
  onClick={() => alert('This is a mockup - button not functional yet')}
  class="btn btn-primary"
>
  Edit Profile
</button>
```

### Mockup Index Page

Create a mockup index at `frontend/routes/mockups/index.tsx` that lists all mockups:

```tsx
export default function MockupsIndex() {
  return (
    <div>
      <h1>UI Mockups</h1>
      <ul>
        <li><a href="/mockups/user-profile">User Profile</a></li>
        <li><a href="/mockups/task-list">Task List</a></li>
      </ul>
    </div>
  );
}
```

## Token Efficiency

- Mockups are faster than full features (no backend, tests, API design)
- Iterate quickly on UI without backend work
- Get user approval before investing in full implementation
- Reuse mockup work when converting to feature

## Limitations

**Mockups are NOT:**
- ❌ Functional features
- ❌ Connected to backend
- ❌ Tested with TDD
- ❌ Production-ready

**Mockups ARE:**
- ✅ Visual prototypes
- ✅ Design explorations
- ✅ User feedback tools
- ✅ Starting points for features

## Integration with /new-feature

When converting a mockup to a feature:

1. **Requirements:** Use mockup spec as visual reference
2. **API Design:** Design endpoints to support the mockup UI
3. **Tests:** Write tests for the interactions
4. **Backend:** Implement API endpoints
5. **Frontend:** Enhance mockup with real data and interactions
6. **Move:** From `/mockups/[name]` to production route

## Notes

- Mockups stored separately from production code
- Easy to delete when no longer needed
- Can have multiple mockups simultaneously
- Mockups are git-committable (team can review)
