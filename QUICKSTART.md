# Quick Start Guide

Get your project up and running in 5 minutes with **Deno 2**!

## Prerequisites

- Deno 2.0+ installed ([Install Guide](https://deno.land/manual/getting_started/installation))
- Claude Code CLI configured
- VS Code with Deno extension (recommended)

## Step 1: Install Deno

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Or use package managers
brew install deno        # macOS
choco install deno       # Windows
snap install deno        # Linux
```

## Step 2: Clone and Configure

```bash
# Clone this repository (or use as template)
git clone <your-repo-url>
cd <your-project>

# No npm install needed! Deno handles dependencies automatically.

# Set up environment variables
cp .env.example .env
```

Edit `.env` with your configuration.

**Note**: Deno caches dependencies automatically on first run. No `node_modules` folder!

## Step 2: Start Development

### Recommended: Just Start Building! (90% of users)

```bash
/new-feature
```

That's it! On first run, the command will:
1. Ask 3 quick questions about your project (30 seconds)
2. Use the pre-defined architecture (Hono + Fresh + Deno KV)
3. Guide you through building your first feature

**Why this works:**
- No need to run `/requirements` separately
- 40-50% more token efficient
- Faster time to first feature
- Architecture already defined in template

### Alternative: Detailed Planning (Complex projects)

If you need comprehensive documentation for stakeholders or planning 10+ features:

```bash
# 1. Document project vision (optional)
/requirements

# 2. Customize architecture (optional)
/architect

# 3. Build features
/new-feature
```

**When to use this:**
- Large projects requiring detailed documentation
- Multiple stakeholders need alignment
- Complex integration requirements
- Many user personas to consider

## Step 3: See It in Action

```bash
# Start dev server
deno task dev
```

Visit `http://localhost:8000`

The server will start with the permissions defined in `deno.json`. You'll see output like:

```
🚀 Server starting on http://localhost:8000
```

## Example: Building a Todo App

Let's build a simple todo app as an example:

### Start Building Your First Feature

```bash
/new-feature
```

**First-run questions** (asked once):
1. **What are you building?**
   > "A todo app for managing tasks"

2. **Who will use this?**
   > "People who want to organize their daily tasks"

3. **What's the main problem this solves?**
   > "Helps users track and complete their tasks efficiently"

✅ Project context saved to `features/PROJECT_CONTEXT.md`

**Feature development** (happens every time):

The command asks:
> "What would you like to name this feature?"

You answer:
> "task-creation"

The agent will then:
1. Gather specific requirements for task creation
2. Design API endpoint (POST /api/tasks)
3. Design Deno KV key structure for tasks
4. Write tests (using in-memory KV)
5. Implement backend (Hono + Deno KV)
6. Implement frontend form (Fresh)

### 4. Verify It Works

```bash
# Run tests
deno test

# Should see all tests passing!

# Start dev server
deno task dev

# Try the API at http://localhost:8000/api/health
```

## What Just Happened?

The workflow created:

1. **Documentation** (feature-scoped):
   - `features/PROJECT_CONTEXT.md` - Lightweight project context (first run only)
   - `features/proposed/task-creation/requirements.md` - Feature requirements
   - `features/proposed/task-creation/api-spec.md` - API specification
   - `features/proposed/task-creation/data-models.md` - Data models

2. **Tests**:
   - `tests/unit/tasks_test.ts` - API tests with in-memory Deno KV

3. **Backend Code**:
   - `backend/routes/tasks.ts` - API routes (Hono)
   - `backend/services/tasks.ts` - Business logic with Deno KV
   - `backend/types/` - TypeScript type definitions

4. **Frontend** (optional with Fresh):
   - `frontend/routes/tasks/` - SSR pages
   - `frontend/islands/` - Interactive components

All following TDD - tests were written first, then implementation!

**Why feature-scoped?**
- 40-50% more token efficient than global docs
- Each feature is self-contained
- Easy to rollback (just delete the feature folder)
- Better for incremental development

**Deno Advantages You'll Notice**:
- ✅ No build step - TypeScript runs directly
- ✅ No `node_modules` folder - cleaner project
- ✅ Built-in database (Deno KV) - no setup needed
- ✅ Fast startup - efficient caching
- ✅ Secure - explicit permissions required
- ✅ Edge-ready - deploy to Deno Deploy in seconds

## Next Steps

### Add More Features

```bash
/new-feature
```

Examples:
- "Add ability to mark todo as complete"
- "Add ability to delete todos"
- "Add filtering by status"
- "Add user authentication"

### Review Your Code

```bash
/review
```

Get a comprehensive code review checklist.

### Customize

- Edit agents in `.claude/agents/` to customize behavior
- Edit commands in `.claude/commands/` to add new workflows
- Update tech stack in `docs/architecture.md`

## Common Commands

```bash
# Development (Deno)
deno task dev           # Start dev server (backend + frontend)
deno test               # Run tests (with in-memory KV)
deno task test:coverage # Check test coverage
deno lint               # Lint code
deno fmt                # Format code
deno task type-check    # Type checking

# Deployment
deno task deploy        # Deploy to Deno Deploy (production)
git push origin main    # Auto-deploy via GitHub Actions

# Claude Code Commands
/requirements           # Gather requirements
/architect              # Design architecture (recommends Deno KV + Deploy)
/new-feature           # Full feature workflow (recommended)
/review                # Code review
```

## Tips

1. **Start with `/new-feature`** - No need to run `/requirements` separately (it asks on first run)
2. **Let agents work sequentially** - Each agent builds on previous work
3. **Run tests frequently** - `deno test` after each implementation
4. **Architecture is pre-defined** - Hono + Fresh + Deno KV (customize only if needed)
5. **Use `/review` before merging** - Catch issues early
6. **Feature-scoped = efficient** - Each feature has its own folder, saving 40-50% tokens

## Troubleshooting

### Tests Not Found
- `/new-feature` handles the complete workflow including tests
- Check that test files use `_test.ts` suffix or are in `tests/` directory
- Deno automatically discovers test files

### Type Errors
- Run `deno check backend/**/*.ts` to see all errors
- Make sure file imports include `.ts` extensions
- Check that types match API spec in `docs/api-spec.md`

### Permission Denied Errors
- Deno requires explicit permissions
- Check `deno.json` tasks have correct `--allow-*` flags
- Common: `--allow-net`, `--allow-read`, `--allow-env`

### Import Errors
- Always include `.ts` extension in local imports
- Use `jsr:@scope/package` for JSR packages
- Use `npm:package` for npm packages
- Use full URLs for deno.land/x packages

### API Not Working
- Verify routes are defined in `backend/routes/`
- Check that server is running on port 8000
- Look for errors in console
- Test with: `curl http://localhost:8000/api/health`

## Deno-Specific Tips

### 1. No Build Step Needed
TypeScript runs directly - no compilation required!

### 2. Permissions Are Good
Deno's permission system protects you. If you get "permission denied":
```bash
deno run --allow-net --allow-read --allow-env backend/main.ts
```

### 3. Dependencies Are Cached
First run downloads dependencies. Subsequent runs are instant.

### 4. Use Deno Deploy (Recommended)
Deploy to global edge network in seconds:
```bash
# Install deployctl
deno install -A jsr:@deno/deployctl

# Deploy to production
deno task deploy

# Or use automatic GitHub deployment
git push origin main
```

Your Deno KV data is automatically distributed globally!

### 5. Compile to Binary (Optional)
For Docker/VPS deployment:
```bash
deno task build:backend
# Creates ./dist/backend executable
```

## Get Help

- Read the [README](./README.md) for detailed documentation
- Check [DENO_MIGRATION_GUIDE](./DENO_MIGRATION_GUIDE.md) for Deno-specific info
- Check [CONTRIBUTING](./CONTRIBUTING.md) for workflow details
- Review agent docs in `.claude/agents/`
- [Deno Manual](https://deno.land/manual)

## Ready to Build!

You now have everything you need to build a production-ready web application using **Deno 2**, TDD, and Claude Code agents.

Start with:
```bash
/new-feature
```

And tell it what you want to build! 🚀

**Enjoy the simplicity of Deno 2!**
