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

Two options:

### Option A: Complete New Project

Start from scratch with full workflow:

```bash
# 1. Gather requirements
/requirements
```

Describe your project, answer questions from the agent.

```bash
# 2. Design architecture
/architect
```

Reviews requirements and creates architecture.

```bash
# 3. Continue with feature development
/new-feature
```

Describe your first feature.

### Option B: Quick Feature Addition

If you already have requirements and architecture:

```bash
/new-feature
```

Describe the feature you want to build.

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

### 1. Requirements

```bash
/requirements
```

Tell the agent:
> "I want to build a todo app where users can create, read, update, and delete todos. Each todo has a title, description, status (pending/completed), and timestamp."

### 2. Architecture

```bash
/architect
```

The agent will design:
- Tech stack (Deno 2 + Hono + Fresh)
- Database design (Deno KV key patterns)
- API endpoints
- Project structure
- Deployment strategy (Deno Deploy)

### 3. First Feature: Create Todo

```bash
/new-feature
```

Tell the agent:
> "Add functionality to create a new todo"

The agent will:
1. Gather specific requirements
2. Design API endpoint (POST /api/todos)
3. Design Deno KV key structure for todos
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

1. **Documentation**:
   - `docs/requirements.md` - Project requirements
   - `docs/architecture.md` - System architecture
   - `docs/api-spec.md` - API specification
   - `docs/adr/` - Architecture decisions

2. **Tests**:
   - `tests/todos_test.ts` - API tests with in-memory Deno KV

3. **Backend Code**:
   - `backend/routes/todos.ts` - API routes (Hono)
   - `backend/services/todos.ts` - Business logic with Deno KV
   - `backend/types/` - TypeScript type definitions

4. **Frontend** (optional with Fresh):
   - `frontend/routes/` - SSR pages
   - `frontend/islands/` - Interactive components

All following TDD - tests were written first, then implementation!

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
/design-database       # Design Deno KV schema or PostgreSQL
/design-api            # Design API contracts
/write-tests           # Write tests with in-memory KV
/implement-backend     # Implement backend (Hono + Deno KV)
/implement-frontend    # Implement frontend (Fresh + Preact)
/new-feature           # Full feature workflow (recommended)
/review                # Code review
```

## Tips

1. **Always start with requirements** - Don't skip `/requirements`
2. **Let agents work sequentially** - Each agent builds on previous work
3. **Run tests frequently** - `npm test` after each implementation
4. **Keep architecture updated** - Update docs when making changes
5. **Use `/review` before merging** - Catch issues early

## Troubleshooting

### Tests Not Found
- Make sure you ran `/write-tests` before implementation
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
