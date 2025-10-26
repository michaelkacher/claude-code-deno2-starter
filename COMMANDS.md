# Quick Command Reference

## Development Workflow

### Starting Development
```bash
# Start everything (recommended)
deno task dev

# Start individually
deno task dev:backend    # API server on port 8000
deno task dev:frontend   # Fresh app on port 3000
```

**Access Points:**
- Backend API: http://localhost:8000
- API Health: http://localhost:8000/api/health
- Frontend App: http://localhost:3000

### Common Development Tasks

```bash
# Code quality checks
deno task check          # Run all checks (lint + format + types)
deno task lint:fix       # Auto-fix linting issues
deno task fmt            # Format code

# Testing
deno task test           # Run tests once
deno task test:watch     # Run tests on file changes
deno task test:coverage  # Generate coverage report

# Type checking
deno task type-check     # Check types in backend and frontend
```

## Production Workflow

### Building for Production
```bash
# Build everything
deno task build

# Build individually
deno task build:backend    # Compile to executable in ./dist/backend
deno task build:frontend   # Build static assets in ./frontend/_fresh
```

### Running Production Build
```bash
# Run backend
deno task preview
# or
./dist/backend

# Run frontend (serve static files)
deno task start:frontend
```

## Cleanup

```bash
# Remove all build artifacts and cache
deno task clean
```

## Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   - `PORT=8000` - Backend API port
   - `FRONTEND_PORT=3000` - Frontend app port
   - Add database URLs, API keys, etc. as needed

## Troubleshooting

### Port Already in Use
```bash
# On Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Clean Start
```bash
deno task clean
rm -rf .env
cp .env.example .env
deno task dev
```

### Type Errors
```bash
# Check what's wrong
deno task type-check

# Fix formatting and linting
deno task fmt
deno task lint:fix
```

## Project Structure Quick Reference

```
backend/                 # Backend API (Hono)
├── main.ts             # Entry point
├── routes/             # API routes
├── lib/                # Shared utilities
└── types/              # TypeScript types

frontend/               # Frontend (Fresh 2)
├── routes/             # File-based routing
├── islands/            # Interactive components
├── components/         # UI components
└── static/             # Static assets

tests/                  # Test files
docs/                   # Documentation
.claude/                # Claude Code agents & commands
```

## Best Practices

1. **Always run checks before committing:**
   ```bash
   deno task check
   deno task test
   ```

2. **Use environment variables for configuration:**
   - Never commit `.env` files
   - Update `.env.example` when adding new variables

3. **Follow the development workflow:**
   - `/requirements` → `/architect` → `/design-api` → `/write-tests` → implementation

4. **Keep dependencies minimal:**
   - Deno manages dependencies automatically
   - No need for `node_modules` or `package-lock.json`
