# Web Project Starter with Claude Code + Deno 2

Go from idea, to mockups, to features that are fully tested--fast! Having AI build yor tests help prevent backward compatibility issues and prevents the AI from drifting from the intent of other features.

**This is an opinionated starter template** with a pre-selected tech stack so you can focus on building features, not debating technology choices.

## The Stack

- **Runtime:** Deno 2
- **Framework:** Fresh 1.7.3 (Pure SSR - single server)
- **Database:** Deno KV
- **Background Jobs:** Queue + Scheduler system
- **Deployment:** [Deno Deploy](https://deno.com/deploy)
- **Testing:** Deno's built-in test runner for unit tests and playwright for e2e tests

## Architecture

**Pure Fresh** - No separate backend server! Everything runs on a single Fresh server:
- **Server-side routes** (`frontend/routes/**/*.tsx`) - Pages rendered on the server
- **API endpoints** (`frontend/routes/api/**/*.ts`) - REST API handlers
- **Islands** (`frontend/islands/**/*.tsx`) - Client-side interactive components
- **Background services** - Queue, scheduler, and workers for async tasks
- **Shared code** (`shared/`) - Repositories, utilities, workers used by all of the above

Single server at `http://localhost:3000`

## Prerequisites

1. Deno 2 Installed

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

2. **AI Assistant** (choose one):
   - **Claude Code**: Install with `npm install -g @anthropic-ai/claude-code` ([pricing](https://www.claude.com/pricing))
   - **GitHub Copilot**: VS Code integration(requires GitHub Copilot subscription)

## Quick Start

### 1. Use This Template

Navigate to https://github.com/michaelkacher/claude-code-deno2-starter and click "Use this template" to create a new repository with the template.

Then clone your new repository that was created. 

```bash
git clone <your-repo-url>
cd <your-project>

# Set up environment variables
cp .env.example .env
```

Edit `.env` with your configuration. (this is not required to run in dev mode)

2. Run the project

```bash
# Start the Fresh server with background services
deno task dev
# Server: http://localhost:3000
# API: http://localhost:3000/api/*
```

3. Gather Requirements (Not required, but recommended for larger projects)
```bash
# Gathers information on the scope of the project, personas, goals,
# Non-functional requirements, and more
/requirements
```
4. Customize your template (Not required, but recommended for real projects)

```bash
# Guided customization workflow to brand your application
# Works with Claude Code and GitHub Copilot
/customize

# The command walks you through:
# - Naming your application
# - Setting up branding and colors
# - Configuring features (notifications, 2FA, file uploads, etc.)
# - Updating navigation structure
# - Creates/updates frontend/lib/config.ts with your settings
```

**What gets customized:**
- Site name, description, and URL
- Brand colors and theme
- Navigation menu items (primary, mobile, footer)
- Feature flags (notifications, 2FA, file uploads, admin panel, dark mode)
- API configuration

4. Create a mockup

```bash
# Create a mockup and describe what you want to implement. 
# When finished, view your mockup http://localhost:3000/mockups/[name]
# The /mockup command can be used to iterate on the design
/mockup create a task list and create task screens for yard work. There should be fields for estimated time, effort, and a list of required supplies.
```

5. Implement the mockup with and write tests

```bash
# from within Claude Code use the /new-feature command
# Provide the mockup to implement and provide more details on the functionality
/new-feature implement task-list mockup. [provide additional requirements]
```

**WARNING**: There is the option `claude --dangerously-skip-permissions` to skip being prompted for running commands and changing files. THIS IS DANGEROUS as your system can be accessed. If you proceed with this command, it is recommended to execute it in a sandboxed environment.

6. Validate quality and tests
```bash
# This runs tests, validates the quality of the implemented feature and security best practices
/review
```

## Architecture

### Development Workflow

```
Requirements → Architecture → API Design → Tests → Implementation → Review
     ↓             ↓              ↓          ↓           ↓            ↓
  (agent)      (agent)        (agent)   (agent)     (agents)      (command)
```


**The /architect agent is also valuable for:**
- Migrating from Deno KV to PostgreSQL if the project outgrows KV
- Splitting into microservices when scaling
- Adding new infrastructure (Redis, message queues, etc.)
- Major refactoring decisions (authentication changes, API versioning)
- Creating ADRs for significant changes

### Sub-Agents

Each agent is a specialized Claude Code agent with a specific purpose:

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **requirements-agent** | Gather and document requirements | User conversation | `docs/requirements.md` |
| **architect-agent** | **Update** system architecture | Current `architecture.md` | Updated `docs/architecture.md`, `docs/adr/*.md` |
| **test-writer-agent** | Write tests (TDD Red phase) | Feature requirements | `tests/**/*.test.ts` |
| **backend-agent** | Implement backend (TDD Green) | Requirements, tests | Backend code |
| **frontend-agent** | Implement frontend (TDD Green) | Requirements, tests | Frontend components |

**Note:** Architecture ships pre-defined. Most users won't need requirements-agent or architect-agent.

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

1. **Red**: Write failing tests first
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

### Running Tests

```bash
# Run all tests
deno task test

# Run with coverage
deno task test:coverage
deno task coverage

# Watch mode
deno task test:watch

# Specific file
deno task test tests/users_test.ts
```

## Project Structure

```
.
├── .claude/
│   ├── agents/              # Sub-agent definitions
│   │   ├── requirements-agent.md
│   │   ├── requirements-agent-feature.md  # ⭐ Feature-scoped (lightweight)
│   │   ├── architect-agent.md
│   │   ├── test-writer-agent.md
│   │   ├── backend-agent.md
│   │   └── frontend-agent.md
│   └── commands/            # Slash command definitions
│       ├── customize.md              # ⭐ Initial template customization
│       ├── new-feature.md            # ⭐ Recommended workflow (uses feature-scoped agents)
│       ├── feature-complete.md       # ⭐ Finalize and move to implemented
│       ├── mockup.md                 # Create UI mockups/prototypes
│       ├── design.md                 # Update design system and styling
│       ├── requirements.md
│       ├── architect.md
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
├── shared/                  # Shared server-side code
│   ├── lib/                # Utilities (JWT, KV, queue, scheduler, etc.)
│   ├── repositories/       # Data access layer
│   ├── workers/            # Background job workers
│   ├── config/             # Environment configuration
│   └── types/              # TypeScript types
├── frontend/                # Fresh application
│   ├── routes/             # Fresh file-based routes (pages + API endpoints)
│   ├── islands/            # Interactive client components
│   ├── components/         # Shared UI components
│   ├── lib/                # Frontend utilities
│   └── static/             # Static assets
└── tests/                   # Test files
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── helpers/            # Test utilities
```

## Available Commands

### Development
```bash
deno task dev              # Start Fresh server with background services
```

### Production & Deployment
```bash
deno task build            # Build for production
deno task preview          # Preview production build

# Deno Deploy (Recommended)
deno task deploy           # Deploy to Deno Deploy (production)
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
deno task kill-ports       # Kill processes on ports 3000
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

## Troubleshooting

### API Mismatch Between Frontend/Backend

1. Check `docs/api-spec.md` is the source of truth
2. Frontend, backend, and testing agents should reference this file
3. Update spec first, then regenerate code

## Contributing

This is a template repository. Customize it for your needs!

To improve the template:
1. Fork this repository
2. Make your changes
3. Submit a pull request

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

## License

MIT License - feel free to use for any purpose.

## Support

For issues or questions:
- Check existing documentation in `docs/`
- Use `/review` to validate your implementation
- Consult the agent definitions in `.claude/agents/`
- [Deno Documentation](https://deno.land/manual)
- [Fresh Documentation](https://fresh.deno.dev)
- Submit an issue to the repository