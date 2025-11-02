# GitHub Copilot Instructions

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

### Deno KV Patterns
```typescript
import { getKv } from './lib/kv.ts';
const kv = await getKv();

// Get
const entry = await kv.get(['users', userId]);
const user = entry.value;

// Set
await kv.set(['users', userId], userData);

// List with prefix
const entries = kv.list({ prefix: ['users'] });
for await (const entry of entries) {
  console.log(entry.key, entry.value);
}

// Atomic transaction
await kv.atomic()
  .set(['users', userId], user)
  .set(['users_by_email', email], userId)
  .commit();
```

## Important Guidelines

### When Writing Backend Code
1. Always use `payload.sub` to get user ID from JWT (NOT `payload.userId`)
2. Mount more specific routes BEFORE general routes (e.g., `/api/admin/data` before `/api/admin`)
3. Include CORS for all methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
4. Validate input with Zod schemas from `backend/types/`
5. Use `c.json()` for responses, not `c.text()` or `Response`
6. Add rate limiting to sensitive endpoints

### When Writing Frontend Code
1. Use Islands for client-side interactivity (state, event handlers)
2. Use Routes for server-side rendering and data fetching
3. Check `IS_BROWSER` before accessing browser APIs in islands
4. API calls should replace port 3000→8000: `window.location.origin.replace(':3000', ':8000')`
5. Store access token in localStorage, check auth in middleware

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
