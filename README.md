# Web Project Starter with Claude Code + Deno 2

This template has the following goals: 
* Go from idea to deployed project quickly
* Leverage Claude Code for new feature development
* Have a solid foundation to reduce the number of tokens used to create new applications
* Be robust enough and follow Test Driven Development (TDD) that if the project matures, you lesson the risks of new features breaking existing features due to tests

This template leverages **Deno 2** and **Fresh**.

## Overview

This template helps you build web applications efficiently by providing:

- **7 Specialized Sub-Agents** for different development phases
- **8 Slash Commands** for common workflows
- **3 Levels of Automation** - from full control to intelligent orchestration
- **TDD-First Approach** with automated testing workflows
- **Token-Efficient Design** that minimizes context usage
- **Simple & Maintainable** code practices

## Quick Start

### 1. Install Deno 2

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Or use package managers
# macOS: brew install deno
# Windows: choco install deno
# Linux: snap install deno
```

### 2. Use This Template

Click "Use this template" on GitHub or:

```bash
git clone <your-repo-url>
cd <your-project>
```

No `npm install` needed - Deno manages dependencies automatically!

### 3. Start Your Project

```bash
# Start both backend and frontend servers
deno task dev
# Backend: http://localhost:8000
# Frontend: http://localhost:3000

# Or start them individually
deno task dev:backend   # Backend API only
deno task dev:frontend  # Frontend only

# Or jump right into development with Claude Code
/requirements
/architect
/new-feature
```

## Architecture

### Development Workflow

```
Requirements → Architecture → API Design → Tests → Implementation → Review
     ↓             ↓              ↓          ↓           ↓            ↓
  (agent)      (agent)        (agent)   (agent)     (agents)      (command)
```

### Sub-Agents

Each agent is a specialized Claude Code agent with a specific purpose:

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **requirements-agent** | Gather and document requirements | User conversation | `docs/requirements.md` |
| **architect-agent** | Design system architecture | `requirements.md` | `docs/architecture.md`, `docs/adr/*.md` |
| **api-designer-agent** | Design API contracts | `requirements.md`, `architecture.md` | `docs/api-spec.md`, `docs/data-models.md` |
| **test-writer-agent** | Write tests (TDD Red phase) | `api-spec.md` | `tests/**/*.test.ts` |
| **backend-agent** | Implement backend (TDD Green) | `api-spec.md`, tests | Backend code |
| **frontend-agent** | Implement frontend (TDD Green) | `api-spec.md`, tests | Frontend components |
| **orchestrator-agent** ⚡ | Intelligent workflow automation (Advanced) | Project state | Automated execution |

### Slash Commands

Quick workflows for common tasks:

| Command | Level | Description | When to Use |
|---------|-------|-------------|-------------|
| `/requirements` | Manual | Gather requirements | Starting new project or feature |
| `/architect` | Manual | Design architecture | Initial setup or major changes |
| `/design-api` | Manual | Design API contracts | Before implementation |
| `/write-tests` | Manual | Write tests (TDD) | Before coding (Red phase) |
| `/implement-backend` | Manual | Implement backend | After tests are written |
| `/implement-frontend` | Manual | Implement UI | After backend is ready |
| `/new-feature` | **Recommended** | Full feature workflow (semi-automated) | Adding a complete new feature |
| `/auto-feature` ⚡ | Advanced | Intelligent orchestration (fully automated) | Complex projects, max automation |
| `/review` | Utility | Code review checklist | Before merging or deploying |

## Automation Levels

This template provides **3 levels of automation** to match your needs:

### 🔧 Level 1: Manual (Full Control)

Run each agent individually for maximum control and learning.

```bash
/requirements → /architect → /design-api → /write-tests → /implement-backend → /implement-frontend
```

**Best for:** Learning, small projects, experimentation, custom workflows

**Token usage:** ~20K per feature | **Time:** ~15 min | **Control:** ⭐⭐⭐

---

### ⚙️ Level 2: Command Orchestration (Recommended)

Semi-automated workflow with guided steps and user approval.

```bash
/new-feature
> "Add user authentication"
```

**Best for:** Most projects (80% of use cases), production work, teams

**Token usage:** ~25K per feature | **Time:** ~10 min | **Control:** ⭐⭐

---

### ⚡ Level 3: Intelligent Orchestration (Advanced)

Fully automated with smart decisions, validation, and error recovery.

```bash
/auto-feature
> "Add user authentication"
```

**Best for:** Complex projects, many similar features, maximum automation

**Token usage:** ~35K per feature | **Time:** ~5 min | **Control:** ⭐

**See [Orchestration Guide](docs/ORCHESTRATION_GUIDE.md) for detailed comparison.**

---

## How to Use

### Starting a New Project

1. **Gather Requirements**
   ```bash
   /requirements
   ```
   Describe your project. The agent will ask clarifying questions and create `docs/requirements.md`.

2. **Design Architecture**
   ```bash
   /architect
   ```
   The agent will design the system architecture and create:
   - `docs/architecture.md` - System overview
   - `docs/adr/` - Architecture Decision Records

3. **Design API**
   ```bash
   /design-api
   ```
   Creates API specification and data models.

4. **Write Tests** (TDD Red Phase)
   ```bash
   /write-tests
   ```
   Creates tests that will initially fail.

5. **Implement Backend** (TDD Green Phase)
   ```bash
   /implement-backend
   ```
   Implements code to make backend tests pass.

6. **Implement Frontend**
   ```bash
   /implement-frontend
   ```
   Builds UI components to make frontend tests pass.

7. **Review**
   ```bash
   /review
   ```
   Comprehensive code review checklist.

### Adding a New Feature

**Recommended approach** - use the feature-scoped workflow (40-50% token savings):

```bash
/new-feature
```

This creates documentation in `features/proposed/{feature-name}/` instead of global `docs/` files, making development faster and more efficient. The command will:
1. Ask for a feature name (e.g., "user-authentication")
2. Gather lightweight requirements
3. Design API endpoints and data models
4. Write tests following TDD
5. Implement backend and frontend
6. Guide you to `/feature-complete` when done

**For complex projects** - use intelligent orchestration:

```bash
/auto-feature
```

The orchestrator will analyze your project state and automatically execute the workflow with validation at each step.

**For learning/customization** - run agents manually:

```bash
/requirements
/architect
/design-api
# etc...
```

**New: Feature-Scoped Workflow**

Features are now organized in a dedicated folder structure:
```
features/
├── proposed/           # Features being developed
│   └── user-auth/
│       ├── requirements.md
│       ├── api-spec.md
│       └── data-models.md
└── implemented/        # Completed features
    └── user-profile/
        ├── requirements.md
        ├── api-spec.md
        ├── data-models.md
        └── implementation.md
```

Benefits:
- **40-50% token reduction** per feature
- **Better organization** - each feature self-contained
- **Easy rollback** - delete feature folder to remove
- **Preserved history** - all features documented in implemented/

See `features/README.md` for detailed documentation.

## Test-Driven Development (TDD)

This template enforces TDD workflow:

1. **Red**: Write failing tests first (`/write-tests`)
2. **Green**: Write minimal code to pass (`/implement-backend` or `/implement-frontend`)
3. **Refactor**: Improve code while keeping tests green

### Running Tests

```bash
# Run all tests
deno test

# Run with coverage
deno task test:coverage
deno task coverage

# Watch mode
deno task test:watch

# Specific file
deno test tests/users_test.ts
```

## Project Structure

```
.
├── .claude/
│   ├── agents/              # Sub-agent definitions
│   │   ├── requirements-agent.md
│   │   ├── requirements-agent-feature.md  # ⭐ Feature-scoped (lightweight)
│   │   ├── architect-agent.md
│   │   ├── api-designer-agent.md
│   │   ├── api-designer-agent-feature.md  # ⭐ Feature-scoped (lightweight)
│   │   ├── test-writer-agent.md
│   │   ├── backend-agent.md
│   │   ├── frontend-agent.md
│   │   └── orchestrator-agent.md     # Advanced: Intelligent orchestration
│   └── commands/            # Slash command definitions
│       ├── new-feature.md            # ⭐ Recommended workflow (uses feature-scoped agents)
│       ├── feature-complete.md       # ⭐ Finalize and move to implemented
│       ├── auto-feature.md           # Advanced: Full automation
│       ├── requirements.md
│       ├── architect.md
│       ├── design-api.md
│       ├── write-tests.md
│       ├── implement-backend.md
│       ├── implement-frontend.md
│       └── review.md
├── features/                # ⭐ Feature-scoped documentation (NEW)
│   ├── README.md           # Guide to feature-scoped workflow
│   ├── _templates/         # Templates for feature docs
│   ├── proposed/           # Features being developed
│   │   └── {feature-name}/
│   │       ├── requirements.md
│   │       ├── api-spec.md
│   │       ├── data-models.md
│   │       └── notes.md
│   └── implemented/        # Completed features
│       └── {feature-name}/
│           ├── requirements.md
│           ├── api-spec.md
│           ├── data-models.md
│           └── implementation.md
├── docs/                    # Project-wide documentation
│   ├── requirements.md      # Overall project requirements
│   ├── architecture.md      # System architecture
│   ├── api-spec.md         # Global API specification (optional)
│   ├── data-models.md      # Shared data models (optional)
│   ├── adr/                # Architecture Decision Records
│   └── ORCHESTRATION_GUIDE.md  # Guide to automation levels
├── backend/                 # Backend source code
│   ├── main.ts             # Backend entry point (Hono server)
│   ├── routes/             # API routes
│   ├── lib/                # Utilities and API client
│   └── types/              # TypeScript types
├── frontend/                # Frontend Fresh 2 application
│   ├── routes/             # Fresh file-based routes
│   ├── islands/            # Interactive client components
│   ├── components/         # Shared UI components
│   └── static/             # Static assets
└── tests/                   # Test files
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── helpers/            # Test utilities
```

## Available Commands

### Development
```bash
deno task dev              # Start both backend + frontend
deno task dev:backend      # Backend only (port 8000)
deno task dev:frontend     # Frontend only (port 3000)
```

### Production & Deployment
```bash
deno task build            # Build both backend + frontend (for Docker/VPS)
deno task build:backend    # Compile backend to executable
deno task build:frontend   # Build frontend for production
deno task preview          # Preview production backend build

# Deno Deploy (Recommended)
deno task deploy           # Deploy to Deno Deploy (production)
deno task deploy:preview   # Deploy preview environment
```

### Testing
```bash
deno task test             # Run all tests
deno task test:watch       # Run tests in watch mode
deno task test:coverage    # Generate test coverage report
deno task coverage         # Generate LCOV coverage report
```

### Code Quality
```bash
deno task check            # Run lint + format check + type check
deno task lint             # Run linter
deno task lint:fix         # Fix linting issues automatically
deno task fmt              # Format code
deno task fmt:check        # Check code formatting
deno task type-check       # Type check all TypeScript files
```

### Utilities
```bash
deno task clean            # Remove build artifacts and cache
```

### Deno KV Management
```bash
deno task kv:seed          # Populate local KV database with sample data
deno task kv:reset         # Delete local KV database (fresh start)
deno task kv:inspect       # List all entries in local KV database

# With options
deno task kv:inspect -- --prefix=users  # Show only 'users' keys
deno task kv:inspect -- --limit=10      # Limit to 10 entries
```

## Token Efficiency

This template is designed to be token-efficient:

1. **Feature-scoped documentation** ⭐ NEW: Features documented separately, reducing context by 40-50%
2. **Agents read files, not chat history**: Each agent reads output files from previous agents
3. **Narrow agent scope**: Each agent has a specific, limited responsibility
4. **Structured outputs**: Agents produce markdown files with clear structure
5. **No redundancy**: Information is stored once in files, not repeated in context
6. **Progressive refinement**: Start with high-level docs, add details as needed
7. **Flexible automation**: Choose the level that balances speed vs token usage

| Approach | Token Usage | Speed | Best For |
|----------|-------------|-------|----------|
| **Feature-scoped** ⭐ | **~15-20K** | **Fast** | **New features (recommended)** |
| Manual (Level 1) | ~20K | Slower | Learning, small projects |
| Commands (Level 2) | ~25K | Fast | Initial project setup |
| Orchestration (Level 3) | ~35K | Fastest | Complex projects |

**New Feature-Scoped Workflow**: Use `/new-feature` to create features in `features/proposed/` instead of global `docs/`, achieving 40-50% token reduction.

## Best Practices

### Architecture Principles

- **Start Simple**: Don't over-engineer for future requirements
- **Boring Technology**: Use mature, well-documented tools
- **Clear Separation**: Routes → Controllers → Services → Models
- **Avoid Complexity**: No microservices for small projects

### Code Principles

- **YAGNI**: You Ain't Gonna Need It
- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself
- **SOLID**: Single Responsibility, Open/Closed, etc.

### Testing Principles

- **Test First**: Write tests before implementation (TDD)
- **AAA Pattern**: Arrange, Act, Assert
- **One Assertion**: Focus each test on one thing
- **Cover Edge Cases**: Test errors, nulls, boundaries

## Technology Stack

This template is built on **Deno 2** with modern, production-ready tools optimized for **serverless edge deployment**.

### Backend (Deno 2)
- **Runtime**: Deno 2.0+ (secure, TypeScript-first)
- **Framework**: Hono (ultra-fast, edge-ready, works on Deno Deploy)
- **Language**: TypeScript (built-in, no build step)
- **Database**: **Deno KV (recommended)** - zero-config, distributed, edge-ready
  - PostgreSQL available when complex queries needed
- **Testing**: Deno's built-in test runner with in-memory KV
- **Validation**: Zod
- **Deployment**: **Deno Deploy (recommended)** - zero-config serverless

### Frontend (Fresh + Preact)
- **Framework**: Fresh 1.7+ (Deno-native, SSR, Islands architecture)
- **UI Library**: Preact (lightweight React alternative)
- **State**: Preact Signals (reactive state management)
- **Styling**: Tailwind CSS (built-in with Fresh)
- **Deployment**: Works seamlessly on Deno Deploy

### Database: Deno KV (Default)

**Why Deno KV is the recommended default:**

✅ **Zero Configuration** - No setup, connection strings, or migrations needed
✅ **Built-in** - Ships with Deno runtime, no external database required
✅ **Edge-Ready** - Globally distributed on Deno Deploy
✅ **ACID Transactions** - Atomic operations for data consistency
✅ **Fast** - Optimized for key-value and simple queries
✅ **Easy Testing** - In-memory mode (`:memory:`) for isolated tests
✅ **Serverless-Native** - Perfect for edge deployment

**When to use PostgreSQL instead:**
- Need complex multi-table JOINs
- Require advanced aggregations (GROUP BY with HAVING)
- Full-text search at database level
- Existing PostgreSQL infrastructure
- Complex reporting and analytics

### Deployment: Deno Deploy (Default)

**Why Deno Deploy is the recommended deployment target:**

✅ **Zero Configuration** - No Docker, no infrastructure, just deploy
✅ **Global Edge Network** - Low latency worldwide (35+ regions)
✅ **Built-in Deno KV** - Distributed key-value store at the edge
✅ **Auto-Scaling** - Serverless, scales automatically
✅ **GitHub Integration** - Deploy on push with GitHub Actions
✅ **Free Tier** - Generous free tier for small projects
✅ **HTTPS Included** - Automatic SSL certificates

**When to use alternative deployment:**
- Need containerization (Docker/Kubernetes)
- Existing cloud infrastructure (AWS/GCP/Azure)
- On-premise requirements
- Heavy CPU/memory workloads

### Why Deno 2?

✅ **Zero Configuration** - TypeScript, testing, linting, formatting built-in
✅ **Secure by Default** - Explicit permissions for file, network, env access
✅ **Modern Web APIs** - fetch, crypto, Web Streams natively supported
✅ **Fast Package Resolution** - JSR registry, npm compatibility
✅ **Built-in Deno KV** - Key-value database included
✅ **Single Executable** - Compile to standalone binary (optional)
✅ **Edge-Ready** - Perfect for Deno Deploy and serverless

You can still use npm packages when needed via `npm:` specifier.

## Customization

### Adding Custom Agents

Create a new file in `.claude/agents/`:

```markdown
# My Custom Agent

Your agent description and responsibilities...

## Output Format
[What this agent produces]
```

### Adding Custom Commands

Create a new file in `.claude/commands/`:

```markdown
---
description: Short description for the command
---

Your command instructions...
```

## Examples

### Example 1: Adding User Authentication (Recommended)

Using Level 2 (semi-automated):

```bash
/new-feature
> "Add user authentication with email/password"

# The command will guide you through:
# - Gather detailed requirements
# - Update architecture (add auth strategy ADR)
# - Design auth API endpoints (login, register, logout)
# - Write tests for auth flow
# - Implement backend auth logic
# - Implement frontend login/register forms
```

### Example 2: Adding User Authentication (Advanced)

Using Level 3 (fully automated):

```bash
/auto-feature
> "Add user authentication with email/password"

# The orchestrator will:
# - Analyze current project state
# - Create and present execution plan
# - Automatically invoke required agents
# - Validate outputs at each step
# - Report completion with test results
```

### Example 3: Adding a Dashboard (Manual)

Using Level 1 (full control):

```bash
/requirements
# Describe dashboard requirements

/design-api
# Design dashboard data endpoints

/write-tests
# Write tests for dashboard

/implement-backend
# Implement data aggregation

/implement-frontend
# Build dashboard UI
```

## Troubleshooting

### Tests Failing

1. Check that you're in the Green phase (tests should be written first)
2. Review test expectations vs. implementation
3. Run specific test: `deno test <file-name>`

### Agent Not Following Architecture

1. Ensure `docs/architecture.md` exists and is up-to-date
2. Remind the agent to read architecture docs
3. Update ADRs for new decisions

### API Mismatch Between Frontend/Backend

1. Check `docs/api-spec.md` is the source of truth
2. Both agents should reference this file
3. Update spec first, then regenerate code

## Contributing

This is a template repository. Customize it for your needs!

To improve the template:
1. Fork this repository
2. Make your changes
3. Submit a pull request

## License

MIT License - feel free to use for any purpose.

## Resources

- [Orchestration Guide](docs/ORCHESTRATION_GUIDE.md) - Detailed guide to choosing automation levels
- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Architecture Decision Records](https://adr.github.io/)
- [Quick Start Guide](QUICKSTART.md) - Get started in 5 minutes
- [Fresh Documentation](https://fresh.deno.dev/docs/getting-started)
- [Deno Documentation](https://deno.com/)

## Deployment to Deno Deploy

### Initial Setup (One-time)

1. **Create a Deno Deploy account**
   - Visit https://dash.deno.com
   - Sign in with GitHub

2. **Create a new project**
   - Click "New Project"
   - Choose your GitHub repository
   - Set project name (e.g., `my-app`)

3. **Configure GitHub secrets**
   - Go to your GitHub repo → Settings → Secrets
   - Add `DENO_DEPLOY_TOKEN` from Deno Deploy dashboard

4. **Update configuration**
   - Edit `deno.json` → change `your-project-name` to your actual project name
   - Edit `.github/workflows/ci.yml` → change `your-project-name`

### Deploying

**Automatic deployment** (recommended):
```bash
git push origin main
# GitHub Actions automatically deploys to Deno Deploy
```

**Manual deployment**:
```bash
# Install deployctl
deno install -A jsr:@deno/deployctl

# Deploy to production
deno task deploy

# Deploy preview
deno task deploy:preview
```

### Database on Deno Deploy

Deno KV is automatically available on Deno Deploy:
```typescript
// Works locally and on Deno Deploy - no config needed!
const kv = await Deno.openKv();
```

On Deno Deploy, Deno KV is:
- **Globally distributed** - Replicated across edge locations
- **Eventually consistent** - Optimized for low latency reads
- **Managed** - No setup or maintenance required

### Local Development with Deno KV

Deno KV uses SQLite locally and FoundationDB in production. See `docs/DENO_KV_GUIDE.md` for comprehensive best practices.

**Quick Setup**:
```typescript
// backend/lib/kv.ts - Single instance pattern
let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    const env = Deno.env.get('DENO_ENV') || 'development';
    const path = env === 'production' ? undefined : './data/local.db';
    kvInstance = await Deno.openKv(path);
  }
  return kvInstance;
}
```

**Storage Locations**:
- **Local**: `./data/local.db` (SQLite file)
- **Testing**: `:memory:` (in-memory, no files)
- **Production**: FoundationDB (Deno Deploy)

**Management Commands**:
```bash
deno task kv:seed      # Add sample data
deno task kv:reset     # Clear all data
deno task kv:inspect   # View stored data
```

**Best Practices**:
- ✅ Use single instance pattern (don't call `Deno.openKv()` on every request)
- ✅ Use `:memory:` for tests (fast, isolated)
- ✅ Add `data/*.db` to `.gitignore` (already configured)
- ✅ See `docs/DENO_KV_GUIDE.md` for complete guide

## Deno 2 Quick Reference

```bash
# Development
deno task dev              # Start dev server (both backend + frontend)
deno test                  # Run tests
deno task test:coverage    # Test coverage
deno lint                  # Lint code
deno fmt                   # Format code
deno task type-check       # Type checking

# Deployment (Deno Deploy - Recommended)
deno task deploy           # Deploy to production
deno task deploy:preview   # Deploy preview environment
git push origin main       # Auto-deploy via GitHub Actions

# Build (for Docker/VPS deployment)
deno task build            # Build for production
deno compile               # Create standalone executable
deno task start            # Run production build
```

## Support

For issues or questions:
- Check existing documentation in `docs/`
- Use `/review` to validate your implementation
- Consult the agent definitions in `.claude/agents/`
- [Deno Documentation](https://deno.land/manual)
- [Hono Documentation](https://hono.dev/)

---

**Happy Building! 🚀**

**Recommended:** Start with `/new-feature` for most projects.

**Learning:** Use manual commands (`/requirements`, `/architect`, etc.) to understand the workflow.

**Advanced:** Try `/auto-feature` for complex projects requiring maximum automation.

See [Orchestration Guide](docs/ORCHESTRATION_GUIDE.md) to choose the right level for your needs.
