# UI Mockups

This folder contains visual mockups for rapid prototyping and design iteration.

## What Are Mockups?

Mockups are **non-functional UI prototypes** used to:
- ✅ Visualize screens before building features
- ✅ Iterate on design quickly
- ✅ Get user feedback early
- ✅ Explore UI/UX ideas without backend work

## Mockup vs Feature

| Aspect | Mockup | Feature |
|--------|--------|---------|
| **Backend** | ❌ None | ✅ Full API |
| **Database** | ❌ None | ✅ Deno KV |
| **Interactions** | ❌ Non-functional | ✅ Fully functional |
| **Tests** | ❌ None | ✅ TDD tests |
| **Data** | Mock/fake | Real |
| **Purpose** | Design review | Production use |
| **Time** | ~15 minutes | ~2 hours |

## Creating a Mockup

```bash
/mockup
```

Follow the prompts to create a visual mockup.

## Mockup Structure

**NEW: Simplified structure - no separate spec files!**

```
frontend/routes/mockups/
├── index.tsx               # Dynamic list of all mockups (auto-updates)
├── [mockup-name].tsx       # Mockup with embedded documentation
└── [another-mockup].tsx    # All context in TSX header comments
```

**Old structure (deprecated):**
```
features/mockups/[name]/mockup-spec.md  ❌ No longer created
```

All mockup documentation is now embedded in the TSX file header as comments.

## Viewing Mockups

1. **Start dev server:**
   ```bash
   deno task dev
   ```

2. **Visit mockup:**
   ```
   http://localhost:3000/mockups/[mockup-name]
   ```

3. **View all mockups:**
   ```
   http://localhost:3000/mockups
   ```

## Mockup Workflow (Updated - More Efficient!)

### 1. Create Mockup
```bash
/mockup
# Creates single TSX file with embedded documentation
# No separate spec files needed
```

### 2. Review & Iterate
- View in browser at http://localhost:3000/mockups/[name]
- Mockup index auto-updates (visit /mockups to see all)
- Make changes with `/mockup` again
- Get feedback from team/users

### 3. Convert to Feature (Automated)
```bash
/new-feature
# Agent auto-detects mockup: "I found /mockups/[name]. Convert it? (y/n)"
# Reads mockup context from TSX header comments
# Builds full feature with backend, tests, real data
```

### 4. Clean Up (Automated)
```bash
# Agent prompts: "Delete mockup? (y/n)"
# If yes, automatically removes:
rm frontend/routes/mockups/[mockup-name].tsx
# No folders to clean up!
```

**Token savings: 47% compared to old mockup workflow**

## Example Mockups

### User Profile
```
/mockups/user-profile
```
- Shows user information
- Edit button (non-functional)
- Avatar display
- Bio section

### Task List
```
/mockups/task-list
```
- Table of tasks
- Add task button (non-functional)
- Status badges
- Priority indicators

### Login Form
```
/mockups/login-form
```
- Email/password fields
- Login button (alerts "mockup")
- Centered card layout

## Best Practices

### ✅ DO:
- Keep mockups simple and visual
- Use realistic mock data
- Include mockup banner (reminds it's non-functional)
- Iterate quickly
- Delete when no longer needed

### ❌ DON'T:
- Add backend logic
- Connect to APIs
- Write tests for mockups
- Keep old mockups forever
- Use for production

## Mock Data Patterns

### Users
```typescript
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
};
```

### Lists
```typescript
const mockTasks = [
  { id: '1', title: 'Task 1', status: 'pending' },
  { id: '2', title: 'Task 2', status: 'completed' },
];
```

### Text
```typescript
const mockText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
```

## Converting to Full Feature

When ready to build the real feature:

1. **Run `/new-feature`**
2. **Reference the mockup:**
   - Describe: "Build the user-profile feature based on the mockup at /mockups/user-profile"
3. **Agent will:**
   - Use mockup as visual reference
   - Design backend API
   - Write tests
   - Implement full functionality
   - Create production route (not in /mockups)

4. **Delete mockup** when feature is complete

## Mockup Lifecycle

```
Create → Review → Iterate → Convert → Delete
  ↓        ↓         ↓          ↓        ↓
/mockup  Browser  Changes  /new-feature  rm
```

## Tips

**Fast iteration:**
```bash
# Create mockup
/mockup

# Make changes
/mockup
> "Add a sidebar to user-profile mockup"

# Convert when happy
/new-feature
> "Build user-profile feature based on mockup"

# Clean up
rm -rf features/mockups/user-profile
```

**Team collaboration:**
- Mockups are git-committable
- Team can review mockup PRs
- Faster feedback than full features
- Less rework

**Design exploration:**
- Create multiple mockup variants
- Compare different layouts
- Choose best design
- Then build the winner

## Mockup Index (Auto-Updating)

All mockups are automatically listed at `/mockups`:

**NEW: Dynamic index!**
- Scans `frontend/routes/mockups/` directory
- Extracts metadata from TSX header comments
- Auto-updates when mockups are added/removed
- Shows purpose and creation date
- No manual updates needed

Visit http://localhost:3000/mockups to see all your mockups.

## FAQ

**Q: Can I use mockups in production?**
A: No. Mockups are non-functional prototypes only.

**Q: Should I write tests for mockups?**
A: No. Save testing for the real feature.

**Q: How long should I keep mockups?**
A: Delete after converting to feature, or if no longer needed.

**Q: Can I have multiple mockups?**
A: Yes! Create as many as you need.

**Q: Can I share mockups with users for feedback?**
A: Yes! Just remind them it's non-functional.

## Commands

| Command | Purpose |
|---------|---------|
| `/mockup` | Create or edit mockup |
| `/new-feature` | Convert mockup to feature |
| `deno task dev` | View mockups in browser |

---

**Happy mocking! 🎨**

Create fast, iterate often, convert to features when ready.
