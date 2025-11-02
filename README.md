# Web Project Starter with Claude Code + Deno 2

**This is an opinionated starter template** with a pre-selected tech stack so you can focus on building features, not debating technology choices.

You must have [Claude Code](https://www.claude.com/pricing) to effectively use this template!! 

## The Stack

- **Runtime:** Deno 2
- **Backend:** Hono (REST API)
- **Frontend:** Fresh + Preact (optional, can be removed)
- **Database:** Deno KV
- **Deployment:** [Deno Deploy](https://deno.com/deploy)
- **Testing:** Deno's built-in test runner for unit tests and playwright for e2e tests

## Prerequisites

Deno 2 Installed

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

## Quick Start

### 1. Use This Template

Navigate to https://github.com/michaelkacher/claude-code-deno2-starter and click "Use this template" to create a new repository with the template.

Then clone your new repository that was created. 

```bash
git clone <your-repo-url>
cd <your-project>
```
2. Run the project

```bash
# Start the minimal server to see it running
deno task dev
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

3. Create a mockup

```bash
# Create a mockup and describe what you want to implement. 
# When finished, view your mockup http://localhost:3000/mockups/[name]
# The /mockup command can be used to iterate on the design
claude mockup create a task list and create task screens for yard work. There should be fields for estimated time, effort, and a list of required supplies.
```

4. Implement the mockup with and write tests

```bash
# from within Claude Code use the /new-feature command
# Provide the mockup to implement and provide more details on the functionality
/new-feature implement task-list mockup. [provide additional requirements]
```

**WARNING**: There is the option `claude --dangerously-skip-permissions` to skip being prompted for running commands and changing files. THIS IS DANGEROUS as your system can be accessed. If you proceed with this command, it is recommended to execute it in a sandboxed environment.


## Detailed Planning (Large/complex projects)

```bash
# Step 1: Document comprehensive project vision
/requirements

# Step 2: Review or customize architecture (optional)
/architect

# Step 3: Create Mockups
/mockup

# Step 4: Build your first feature with tests
/new-feature
```

**When to use this:**
- Planning 10+ features upfront
- Need detailed stakeholder documentation
- Multiple user personas to consider
- Complex integration requirements

**The /architect agent is also valuable for:**
- Migrating from Deno KV to PostgreSQL if the project outgrows KV
- Splitting into microservices when scaling
- Adding new infrastructure (Redis, message queues, etc.)
- Major refactoring decisions (authentication changes, API versioning)
- Creating ADRs for significant changes


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
| **architect-agent** | **Update** system architecture | Current `architecture.md` | Updated `docs/architecture.md`, `docs/adr/*.md` |
| **api-designer-agent** | Design API contracts | `requirements.md`, `architecture.md` | `docs/api-spec.md`, `docs/data-models.md` |
| **test-writer-agent** | Write tests (TDD Red phase) | `api-spec.md` | `tests/**/*.test.ts` |
| **backend-agent** | Implement backend (TDD Green) | `api-spec.md`, tests | Backend code |
| **frontend-agent** | Implement frontend (TDD Green) | `api-spec.md`, tests | Frontend components |
| **orchestrator-agent** ⚡ | Intelligent workflow automation (Advanced) | Project state | Automated execution |

**Note:** Architecture ships pre-defined. Most users won't need requirements-agent or architect-agent.

### Slash Commands

Quick workflows for common tasks:

| Command | Level | Description | When to Use |
|---------|-------|-------------|-------------|
| `/requirements` | Optional | Gather project-wide requirements | Large projects (10+ features) or stakeholder docs |
| `/architect` | Optional | **Update** architecture | Major changes only (DB migration, microservices) |
| `/mockup` | **Visual** | Create UI mockup | Quick visual prototyping before building |
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

**See [Orchestration Guide](docs/guides/ORCHESTRATION_GUIDE.md) for detailed comparison.**

---

### Understanding Feature-Scoped Workflow

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
│       ├── mockup.md                 # Create UI mockups/prototypes
│       ├── design.md                 # Update design system and styling
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
│   └── guides/                 # Detailed guides (see docs/QUICK_REFERENCE.md)
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

**Note:** Development-only routes (`/design-system`, `/mockups`) are automatically excluded from production builds. See [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) for details.

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
deno task kill-ports       # Kill processes on ports 3000 and 8000
```

**Note:** Use `kill-ports` if you get "port already in use" errors from hidden instances of the app.

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

This template is designed to be token-efficient with **multiple optimization layers**:

### API Design Optimizations (NEW ⭐)
1. **Feature-scoped documentation**: Features documented separately, reducing context by 40-50%
2. **Pattern reference system** ⭐: Reusable API patterns and error responses (saves ~500-800 tokens/feature)
3. **Shorthand templates** ⭐: Condensed format for simple CRUD features (saves ~400-600 tokens/feature)
4. **Smart agent instructions** ⭐: Agents automatically choose optimal templates and reference patterns

**See [Token Optimization Guide](docs/guides/TOKEN_OPTIMIZATION_GUIDE.md) for API design details.**

### Test Writing Optimizations (NEW ⭐)
5. **CRUD test templates** ⭐: Pre-built test suite for simple services (saves ~400-600 tokens/service)
6. **Test data patterns** ⭐: Reusable test data builders (saves ~100-150 tokens/file)
7. **Test pattern references** ⭐: Common testing scenarios (saves ~200-400 tokens/service)

**See [Test Optimization Guide](docs/guides/TEST_OPTIMIZATION_GUIDE.md) for test writing details.**

### Backend Implementation Optimizations (NEW ⭐)
8. **CRUD service templates** ⭐: Complete service implementation (saves ~600-800 tokens/service)
9. **CRUD route templates** ⭐: Standard REST endpoints (saves ~400-600 tokens/service)
10. **Backend pattern references** ⭐: Common backend patterns (saves ~200-400 tokens/service)

**See [Backend Optimization Guide](docs/guides/BACKEND_OPTIMIZATION_GUIDE.md) for implementation details.**

### Frontend Implementation Optimizations (NEW ⭐)
11. **Fresh route templates** ⭐: Pre-built list/detail pages (saves ~500-700 tokens/page)
12. **Design system components** ⭐: Button, Card, Input, Modal, etc. (saves ~300-500 tokens/feature)
13. **Frontend pattern references** ⭐: Form islands, API clients, state management (saves ~400-600 tokens/feature)

**See [Frontend Optimization Guide](docs/guides/FRONTEND_OPTIMIZATION_GUIDE.md) for UI implementation details.**

### General Best Practices
14. **Agents read files, not chat history**: Each agent reads output files from previous agents
15. **Narrow agent scope**: Each agent has a specific, limited responsibility
16. **Structured outputs**: Agents produce markdown files with clear structure
17. **No redundancy**: Information is stored once in files, not repeated in context

### Token Usage Comparison

| Phase | Old Approach | New (Optimized) | Savings |
|-------|--------------|-----------------|---------|
| **API Design** | ~25,000 tokens | ~8-12,000 tokens | **52-68%** |
| **Test Writing** | ~7,500 tokens | ~3,600 tokens | **52%** |
| **Backend Implementation** | ~2,500 tokens | ~1,000 tokens | **60%** |
| **Frontend Implementation** | ~3,000 tokens | ~1,200 tokens | **60%** |
| **Total per feature** | **~38,000 tokens** | **~13,800-17,800 tokens** | **53-64%** |

### Workflow Comparison

| Approach | Tokens/Feature | Speed | Best For |
|----------|----------------|-------|----------|
| **Pattern-optimized** ⭐ | **~11-15K** | **Fast** | **New features (recommended)** |
| Feature-scoped only | ~15-20K | Fast | Basic features |
| Manual (Level 1) | ~20K | Slower | Learning, small projects |
| Commands (Level 2) | ~25K | Fast | Initial project setup |
| Orchestration (Level 3) | ~35K | Fastest | Complex projects |

**NEW: Fully Optimized Workflow**: Use `/new-feature`, `/write-tests`, `/implement-backend`, and `/implement-frontend` to automatically apply all 13 optimization layers:
- Feature-scoped documentation (40-50% savings on API design)
- API pattern references (15-20% additional savings)
- Shorthand API templates (10-15% additional savings)
- CRUD test templates (50% savings on tests)
- Test data patterns (additional test savings)
- CRUD service templates (50-60% savings on backend)
- CRUD route templates (additional backend savings)
- Fresh route templates (55-65% savings on frontend pages)
- Design system components (additional frontend savings)
- **Total: 53-64% reduction in full feature development (API + Tests + Backend + Frontend)**

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

### Example 1: Building Your First Feature (Recommended)

Starting from a fresh template:

```bash
# Step 1: Define your project
/requirements
> "I want to build a task management app where users can create,
   complete, and organize tasks into projects"

# Step 2: Design architecture
/architect
# Agent evaluates requirements and recommends:
# - Hono for REST API
# - Deno KV for data storage (tasks + projects)
# - Fresh for the UI
# - Creates docs/architecture.md and ADRs

# Step 3: Build first feature
/new-feature
> "task-creation"

# The command will guide you through:
# - Gather detailed requirements for task creation
# - Design API endpoint (POST /api/tasks)
# - Design Deno KV schema for tasks
# - Write tests following TDD
# - Implement backend logic
# - Implement frontend form
```

### Example 2: Quick Start with Defaults

Skip requirements/architecture and jump right in:

```bash
/new-feature
> "user-authentication"

# First-run detection triggers:
⚠️  I noticed this might be your first feature!

Would you like to:
a) Run /requirements + /architect first (recommended)
b) Continue with default architecture (Hono + Fresh + Deno KV)
c) Skip architecture setup

# Choose (b) for quick start with sensible defaults
# The agent will use the template's default stack
```

### Example 3: Advanced Automation (Optional)

Using Level 3 (fully automated):

```bash
# After architecture is defined, use orchestrator for complex features
/auto-feature
> "Add user authentication with JWT tokens and role-based access control"

# The orchestrator will:
# - Analyze current project state
# - Create and present execution plan
# - Automatically invoke required agents
# - Validate outputs at each step
# - Report completion with test results
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

- [Quick Reference](docs/QUICK_REFERENCE.md) - Condensed guide for common patterns
- [Detailed Guides](docs/guides/) - Comprehensive guides for advanced topics
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

Deno KV uses SQLite locally and FoundationDB in production. See `docs/guides/DENO_KV_GUIDE.md` for comprehensive best practices.

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
- ✅ See `docs/guides/DENO_KV_GUIDE.md` for complete guide

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

See [Quick Reference](docs/QUICK_REFERENCE.md) for common patterns or [Orchestration Guide](docs/guides/ORCHESTRATION_GUIDE.md) for detailed automation levels.

# Backlog
* Create account did an alert popup, change to UI
* ensure the admin screen should only appear if auth enabled
* Can the admin screen show all models?
* the docs will load a lot of the guides for claude code, does the claudeignore need to be updated or these docs moved?

* Does the /design command also impact layout? If not, should there be a layout? Maybe add some common layouts?
* Confirm it still works with no .env file. Should a /setup command exist to create the .env file?
* Add a hamburger menu to the menu bar and option to add new screen to menu if it exists

* Does test user always get populated first go? Command to create test user? Update docs? Logging in with test@example.com / password123


* Setup integration tests to to test the api layer directly. Confirm that e2e and integration test added on /new-feature

* update home screen with:
*  all commands and up to date info. 
* How to set up auth
* Add open api link to home page info
  - Swagger UI: http://localhost:8000/api/docs (interactive testing)
  - ReDoc: http://localhost:8000/api/redoc (clean reading experience)
  - OpenAPI JSON: http://localhost:8000/api/openapi.json (raw spec)
  - API Info: http://localhost:8000/ (lists all endpoints)

* Evaluate Open API implementation, is Redoc the right choice?
* Error monitoring: Optional setting to integrate with something like Datadog?


Auth Priority Nice to Have:


The server is running at http://localhost:3000/

Test User Credentials:
Email: test@example.com
Password: password123

Quick Tests:
Login Flow: Try logging in - you'll get both access + refresh tokens
Auto-Refresh: Check browser console in 13 minutes - it should auto-refresh
CSRF Protection: Try login without the CSRF token header (should fail)
Token Revocation: Logout and verify the refresh token is invalidated
Security Headers: Check DevTools Network tab for CSP, HSTS, etc.

## Admin Panel

The template includes a complete admin panel for user management.

### Accessing the Admin Panel

**Local Development:**

1. **Make a user an admin**:
   ```bash
   deno task users:make-admin test@example.com
   ```

2. **Log in** with an admin account at http://localhost:3000/login

3. **Access admin panel**:
   - Click the "Admin Panel" button in the navigation bar (visible only to admins)
   - Or navigate directly to http://localhost:3000/admin/users

**Production:**

See [Production Admin Setup Guide](docs/PRODUCTION_ADMIN_SETUP.md) for automatic admin setup using environment variables.

### Admin Features

- **Dashboard Statistics**: Total users, verification rates, admin counts, recent signups
- **User Management Table**: View all registered users with search and filtering
- **User Actions**:
  - ↑/↓ Promote/demote admin roles
  - ✓ Manually verify emails
  - 🔒 Revoke all user sessions (force logout)
  - ✕ Delete users permanently
- **Filtering**: Search by name/email/ID, filter by role, filter by verification status
- **Pagination**: Navigate through users (50 per page)

### CLI Tools

```bash
# List all registered users
deno task users:list

# Promote a user to admin (local development)
deno task users:make-admin email@example.com
```

### Documentation

- [Production Admin Setup](docs/PRODUCTION_ADMIN_SETUP.md) - **How to set up first admin in production**
- [Admin Panel Quick Start](docs/ADMIN_QUICK_START.md) - Quick reference
- [Admin Panel Guide](docs/ADMIN_PANEL.md) - Complete documentation
- [Admin Implementation Summary](docs/ADMIN_IMPLEMENTATION_SUMMARY.md) - Technical details