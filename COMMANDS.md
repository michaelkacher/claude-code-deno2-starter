# Quick Command Reference

## Development Workflow

### Starting Development
```bash
# Start Fresh server with background services
deno task dev
```

**Access Points:**
- Fresh App: http://localhost:3000
- API Endpoints: http://localhost:3000/api/*
- API Health: http://localhost:3000/api/health
- API Docs: http://localhost:3000/api/docs

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
deno task type-check     # Check types in shared and frontend
```

## Production Workflow

### Building for Production
```bash
# Build for production
deno task build
```

### Running Production Build
```bash
# Run production server
deno task preview
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
# Kill process on port 3000
deno task kill-ports

# Or manually:
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -ti:3000 | xargs kill -9
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
   - `/requirements` → `/architect` → `/new-feature`

4. **Keep dependencies minimal:**
   - Deno manages dependencies automatically
   - No need for `node_modules` or `package-lock.json`
