# GitHub Copilot Instructions

> **Custom Workflows Available**: This project includes custom workflows that mirror Claude Code commands.
> See `.github/copilot-workflows.md` for detailed instructions on running feature development, mockup creation, and starter customization workflows.
> 
> **Quick Start**: `@workspace customize starter` or `@workspace I want to customize this template`
> **Feature Development**: `@workspace run new-feature workflow` or `@workspace create a new feature`

## Project Overview

This is a **Deno 2 + Fresh 1.7.3** full-stack application with Hono backend API, featuring:
- **Runtime**: Deno 2 with TypeScript
- **Backend**: Hono framework at `http://localhost:8000`
- **Frontend**: Fresh SSR framework at `http://localhost:3000`
- **Database**: Deno KV (key-value store)
- **Authentication**: JWT-based with dual tokens (access + refresh), 2FA support
- **UI**: Tailwind CSS with Fresh Islands architecture

## Tech Stack

### Backend (`/backend`)
- **Framework**: Hono (lightweight edge-first framework)
- **Database**: Deno KV with model prefixes: `users`, `users_by_email`, `refresh_tokens`, `token_blacklist`, `password_reset`, `email_verification`
- **Auth**: JWT (access tokens 15min, refresh tokens 30 days), bcrypt for passwords
- **2FA**: TOTP-based (RFC 6238), 6-digit codes, 8-char backup codes
- **Security**: CORS, CSP headers, rate limiting, body size limits
- **API Docs**: OpenAPI 3.1 spec with Swagger UI and ReDoc

### Frontend (`/frontend`)
- **Framework**: Fresh 1.7.3 (Preact-based SSR)
- **Architecture**: Islands for interactivity, server-side routes for pages
- **Styling**: Tailwind CSS
- **State**: Preact hooks (useState, useEffect) in islands
- **Auth**: Server-side middleware, localStorage for client-side token storage

## Development Commands

```bash
deno task dev          # Start both servers (backend:8000, frontend:3000)
deno task kill-ports   # Kill processes on ports 3000 and 8000
deno task test         # Run all tests
```

## Code Patterns

### Backend Route Structure
```typescript
import { Hono } from 'hono';
const app = new Hono();

app.get('/endpoint', async (c) => {
  // Validate input with Zod
  // Query Deno KV
  // Return c.json({ data: {...} })
});

export default app;
```

### Frontend Island Structure
```typescript
import { useState } from 'preact/hooks';
import { IS_BROWSER } from '$fresh/runtime.ts';

export default function MyIsland() {
  const [state, setState] = useState('');
  
  // Only run in browser
  if (!IS_BROWSER) return null;
  
  return <div>{state}</div>;
}
```

### Authentication
- JWT payload uses `sub` for user ID (not `userId`)
- Access token in localStorage as `access_token`
- Refresh token in httpOnly cookie as `refresh_token`
- Auth check in `frontend/routes/_middleware.ts`
- Protected routes redirect to `/login?redirect=/original-path`

### Repository Pattern (PREFERRED)
**Always use repositories for data access instead of direct KV operations**

```typescript
import { UserRepository, TokenRepository, NotificationRepository, JobRepository } from './repositories/index.ts';

// Initialize repositories
const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();

// User operations
const user = await userRepo.findByEmail(email);
const newUser = await userRepo.create(userData);
await userRepo.update(userId, { name: 'New Name' });

// Token operations
await tokenRepo.storeRefreshToken(userId, tokenId, expiresAt);
const isValid = await tokenRepo.verifyRefreshToken(userId, tokenId);
await tokenRepo.blacklistToken(tokenId, userId, expiresAt);

// Notification operations
const notificationRepo = new NotificationRepository();
await notificationRepo.create(userId, 'success', 'Title', 'Message');
const unread = await notificationRepo.getUnreadCount(userId);

// Job operations
const jobRepo = new JobRepository();
const job = await jobRepo.create('job-name', jobData, { priority: 10 });
await jobRepo.updateStatus(jobId, 'completed');
```

### Direct Deno KV (LEGACY - avoid in new code)
```typescript
import { getKv } from './lib/kv.ts';
const kv = await getKv();

// Only use direct KV for:
// 1. Non-entity data (cache, temporary data)
// 2. Complex operations not covered by repositories
// 3. Performance-critical paths (with benchmarks)
```

## Important Guidelines

### When Writing Backend Code
1. **Use Repository Pattern** - Import from `backend/repositories/index.ts`, NOT direct `getKv()` calls
2. Always use `payload.sub` to get user ID from JWT (NOT `payload.userId`)
3. Mount more specific routes BEFORE general routes (e.g., `/api/admin/data` before `/api/admin`)
4. Include CORS for all methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
5. **Use validation middleware** - Import `validateBody/validateQuery/validateParams` from `backend/middleware/validate.ts`
6. Define Zod schemas in `backend/types/` files (e.g., `SignupSchema`, `ListUsersQuerySchema`)
7. Use `c.json()` for responses, not `c.text()` or `Response`
8. Add rate limiting to sensitive endpoints
9. **Use structured logging** - Import `createLogger` from `backend/lib/logger.ts`, NOT console.log
10. All admin routes automatically protected by `frontend/routes/admin/_middleware.ts`

### When Writing Frontend Code
1. Use Islands for client-side interactivity (state, event handlers)
2. Use Routes for server-side rendering and data fetching
3. Check `IS_BROWSER` before accessing browser APIs in islands
4. **Use API client** - Import `api` from `frontend/lib/api-client.ts`, NOT raw fetch
5. **Use storage abstraction** - Import `TokenStorage` or `ThemeStorage` from `frontend/lib/storage.ts`, NOT direct localStorage
6. **Use loading components** - Import from `frontend/components/common` (LoadingSpinner, LoadingButton, Skeleton, PageLoader)
7. Wrap new page sections in `<ErrorBoundary>` if they might fail independently

### Security Considerations
1. Never expose `JWT_SECRET` or sensitive env vars client-side
2. Mask sensitive fields in admin views: `password`, `twoFactorSecret`
3. Use httpOnly cookies for refresh tokens
4. CSP headers must allow CDNs: `https://cdn.jsdelivr.net` for API docs
5. Rate limit auth endpoints to prevent brute force

### Deno Specifics
1. Use `jsr:` imports for JSR packages (not `npm:`)
2. Run with `--unstable-kv` flag for Deno KV access
3. Import JSON with `with { type: 'json' }` syntax
4. Use `Deno.env.get()` for environment variables
5. Fresh requires `deno.json` workspace configuration

## File Organization

### Backend Repositories (`/backend/repositories`)
- `base-repository.ts` - Base class with common CRUD operations
- `user-repository.ts` - User data access (findByEmail, create, update, etc.)
- `token-repository.ts` - Token management (refresh, blacklist, password reset, email verification)
- `notification-repository.ts` - Notification CRUD and queries
- `job-repository.ts` - Background job management
- `index.ts` - Repository exports and factory

### Backend Routes (`/backend/routes`)
- `auth.ts` - Login, signup, logout, password reset, email verification
- `admin.ts` - User management, stats
- `data-browser.ts` - Admin KV storage browser
- `two-factor.ts` - 2FA setup, enable, disable, verify
- `openapi.ts` - API documentation (Swagger UI, ReDoc)

### Frontend Routes (`/frontend/routes`)
- `index.tsx` - Home page
- `login.tsx`, `signup.tsx` - Auth pages
- `_middleware.ts` - Auth check for protected routes
- `_app.tsx` - Global app wrapper
- `admin/users.tsx` - Admin user management
- `admin/data.tsx` - Admin data browser

### Frontend Islands (`/frontend/islands`)
- Interactive components with client-side state
- Use Preact hooks, not React
- Examples: `LoginForm.tsx`, `SignupForm.tsx`, `AdminDataBrowser.tsx`

## Common Issues & Solutions

### "Route not found" errors
- Check route mounting order in `backend/main.ts`
- More specific routes must come before general routes

### JWT "expected string, number..." errors
- Use `payload.sub` not `payload.userId`
- Check JWT creation uses `sub` claim

### CORS errors
- Add method to `allowMethods` array in `backend/main.ts`
- Include `credentials: true` in fetch calls

### CSP blocking external scripts
- Add domains to CSP in `backend/lib/security-headers.ts`
- Update both DEV_CSP and DEFAULT_CSP

### Fresh Islands not rendering
- Check `IS_BROWSER` before using browser APIs
- Ensure island is registered in Fresh manifest
- Run `deno task dev` to regenerate manifest

## Testing

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Use test helpers from `tests/helpers/`
- KV test helper creates isolated test database

## Documentation

- API docs: `http://localhost:8000/api/docs` (Swagger UI)
- API docs: `http://localhost:8000/api/redoc` (ReDoc)
- OpenAPI spec: `backend/openapi.json`
- Feature docs: `features/` directory
- Architecture: `docs/architecture.md`

## When Suggesting Changes

1. **Read existing patterns** before suggesting new approaches
2. **Check file structure** - don't recreate existing functionality
3. **Follow naming conventions** - kebab-case for files, PascalCase for components
4. **Add types** - use TypeScript, define interfaces
5. **Consider both environments** - code may run server-side or client-side
6. **Update OpenAPI spec** when adding/changing endpoints
7. **Add tests** for new features

## Environment Variables

See `.env.example` for all available variables. Key ones:
- `JWT_SECRET` - Required for auth (min 32 chars)
- `API_URL` - Backend API URL (default: http://localhost:8000/api)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:3000)
- `DENO_ENV` - Environment (development, production)
- `PORT` - Backend port (default: 8000)
- `FRONTEND_PORT` - Frontend port (default: 3000)
