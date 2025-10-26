# Web Project Starter with Claude Code + Deno 2

A GitHub template for web projects powered by **Deno 2**, configured with Claude Code sub-agents and commands that follow Test-Driven Development (TDD) principles.

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

**Recommended approach** - use the semi-automated command:

```bash
/new-feature
```

Then describe your feature. The command will guide you through the workflow.

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
│   │   ├── architect-agent.md
│   │   ├── api-designer-agent.md
│   │   ├── test-writer-agent.md
│   │   ├── backend-agent.md
│   │   ├── frontend-agent.md
│   │   └── orchestrator-agent.md     # Advanced: Intelligent orchestration
│   └── commands/            # Slash command definitions
│       ├── new-feature.md            # Recommended workflow
│       ├── auto-feature.md           # Advanced: Full automation
│       ├── requirements.md
│       ├── architect.md
│       ├── design-api.md
│       ├── write-tests.md
│       ├── implement-backend.md
│       ├── implement-frontend.md
│       └── review.md
├── docs/                    # Generated documentation
│   ├── requirements.md      # Project requirements
│   ├── architecture.md      # System architecture
│   ├── api-spec.md         # API specification
│   ├── data-models.md      # TypeScript data models
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

### Production
```bash
deno task build            # Build both backend + frontend
deno task build:backend    # Compile backend to executable
deno task build:frontend   # Build frontend for production
deno task preview          # Preview production backend build
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

## Token Efficiency

This template is designed to be token-efficient:

1. **Agents read files, not chat history**: Each agent reads output files from previous agents
2. **Narrow agent scope**: Each agent has a specific, limited responsibility
3. **Structured outputs**: Agents produce markdown files with clear structure
4. **No redundancy**: Information is stored once in files, not repeated in context
5. **Progressive refinement**: Start with high-level docs, add details as needed
6. **Flexible automation**: Choose the level that balances speed vs token usage

| Automation Level | Token Usage | Speed | Best For |
|------------------|-------------|-------|----------|
| Manual (Level 1) | Lowest (~20K) | Slower | Learning, small projects |
| Commands (Level 2) | Moderate (~25K) | Fast | Most projects ⭐ |
| Orchestration (Level 3) | Higher (~35K) | Fastest | Complex projects |

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

This template is built on **Deno 2** with modern, production-ready tools:

### Backend (Deno 2)
- **Runtime**: Deno 2.0+ (secure, TypeScript-first)
- **Framework**: Hono (ultra-fast, edge-ready)
- **Language**: TypeScript (built-in, no build step)
- **Database**: Deno KV (built-in) or PostgreSQL
- **Testing**: Deno's built-in test runner
- **Validation**: Zod

### Frontend (Optional)
- Preact (lightweight React alternative)
- Fresh (Deno-native framework)
- Twind (Tailwind-in-JS)
- Or integrate any framework you prefer

### Why Deno 2?

✅ **Zero Configuration** - TypeScript, testing, linting, formatting built-in
✅ **Secure by Default** - Explicit permissions for file, network, env access
✅ **Modern Web APIs** - fetch, crypto, Web Streams natively supported
✅ **Fast Package Resolution** - JSR registry, npm compatibility
✅ **Single Executable** - Compile to standalone binary
✅ **Edge-Ready** - Deploy to Deno Deploy, Cloudflare, etc.

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

## Deno 2 Quick Reference

```bash
# Development
deno task dev              # Start dev server
deno test                  # Run tests
deno task test:coverage    # Test coverage
deno lint                  # Lint code
deno fmt                   # Format code
deno task type-check       # Type checking

# Build & Deploy
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
