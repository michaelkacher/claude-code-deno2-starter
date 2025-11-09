# Quick Reference Guide

**Last Updated:** 2025-11-08

This is a condensed reference for common patterns and workflows. For detailed guides, see `docs/guides/`.

---

## Stack Overview

- **Runtime:** Deno 2 (TypeScript-native, secure, edge-ready)
- **Backend:** Fresh 1.7.3 API routes (file-based, SSR-native, edge-optimized)
- **Frontend:** Fresh + Preact (SSR, islands architecture)
- **Database:** Deno KV (built-in, zero-config, globally distributed)
- **Deployment:** Deno Deploy (serverless edge, auto-scaling)

---

## Quick Start Commands

```bash
# Start development
deno task dev                    

# Build feature (recommended)
/new-feature                     # Handles everything: requirements → tests → implementation

# Create UI mockup first
/mockup                          # Fast visual prototype
/new-feature                     # Converts mockup to full feature

# Testing
deno task test                        # Run all tests
deno task test:watch             # Watch mode
deno task test:coverage          # Coverage report

# Code quality
deno task check                  # Lint + format + type check
deno fmt                         # Format code
deno lint                        # Lint code

# Deployment
deno task deploy                 # Deploy to Deno Deploy
git push origin main             # Auto-deploy via GitHub Actions
```

---

## Authentication & Security

### First Run Setup (Development)

On first run in development mode, a test admin account is automatically created:
- 📧 Email: `admin@dev.local`
- 🔑 Password: `admin123`

**Customize Credentials (Optional):**
```bash
# .env file
DEV_ADMIN_EMAIL=your@email.com
DEV_ADMIN_PASSWORD=yourpassword
DEV_ADMIN_NAME="Your Name"
```

### Environment Variables

```bash
# .env file - Authentication
JWT_EXPIRES_IN=15m               # Access token expiry (15 minutes)
JWT_REFRESH_EXPIRES_IN=30d       # Refresh token expiry (30 days)
JWT_SECRET=your-secret-here      # Min 32 chars, required for auth

# Production: Auto-promote to admin
INITIAL_ADMIN_EMAIL=user@company.com  # Remove after first admin created
```

### Token Refresh Mechanism

The app automatically refreshes access tokens to keep users logged in:

- **Access Token:** 15 minutes (stored in cookie + localStorage)
- **Refresh Token:** 30 days (httpOnly cookie, server-side only)
- **Auto-refresh:** Every 10 minutes (5-minute buffer before expiry)
- **Cookie Settings:** `SameSite=Lax` for both login and refresh

```typescript
// Token refresh runs automatically in the background
// No user action needed - handled by /lib/token-refresh

// Timeline:
// 0 min:  Login → tokens issued
// 10 min: Auto-refresh (5 min before expiry)
// 20 min: Auto-refresh again
// ...continues every 10 minutes
```

**Key Points:**
- Refresh happens regardless of page visibility or user activity
- Uses BroadcastChannel for cross-tab synchronization
- If refresh fails (401/403), redirects to login automatically
- Refresh token is httpOnly and cannot be accessed by JavaScript

### Middleware Flow

```typescript
// Page middleware (_middleware.ts)
1. Extract auth_token from cookie
2. Decode JWT and set ctx.state (userEmail, userRole)
3. Allow public routes (/, /login, /signup, etc.)
4. Verify token signature via /api/auth/verify
5. Redirect to login if invalid/expired
6. Pass ctx.state to _app.tsx (server-side only)

// Client-side state
- Navigation receives props from _app.tsx
- UserProfileDropdown initializes from props
- Token stored in localStorage + cookie
- Auto-refresh keeps session alive
```

---

## Common Patterns

### API Endpoints (REST)

```typescript
// Standard CRUD pattern
GET    /api/resource             // List all
GET    /api/resource/:id         // Get one
POST   /api/resource             // Create
PUT    /api/resource/:id         // Update
DELETE /api/resource/:id         // Delete
```

### Deno KV Keys

```typescript
// Hierarchical key patterns
['users', userId]                    // User by ID
['users_by_email', email]            // Secondary index
['posts', postId]                    // Post by ID
['posts_by_user', userId, postId]    // User's posts
['comments', postId, commentId]      // Post's comments

// Composite indexes (for fast multi-field queries)
['users_by_role', role, timestamp, userId]              // Query by role
['users_by_role_verified', role, verified, timestamp]   // Query by role + verified
['notifications_by_user_read', userId, read, timestamp] // Unread notifications
['jobs_by_name_status', name, status, priority]         // Jobs by name + status
```

### Composite Index Queries (100x-1000x faster)

```typescript
import { CompositeIndexManager } from './lib/composite-indexes.ts';

// ❌ SLOW: Full table scan
const allUsers = kv.list({ prefix: ['users'] });
for await (const entry of allUsers) {
  if (entry.value.role === 'admin') admins.push(entry.value);
}

// ✅ FAST: Indexed query (O(log n) instead of O(n))
const admins = await CompositeIndexManager.queryUsers({ role: 'admin' });

// Multi-field query (role + emailVerified)
const verifiedAdmins = await CompositeIndexManager.queryUsers({ 
  role: 'admin', 
  emailVerified: true 
});

// Unread notifications
const unread = await CompositeIndexManager.queryNotifications({ 
  userId: '123',
  read: false 
});

// See docs/COMPOSITE_INDEXES.md for full guide
```

### Response Format

```typescript
// Success
{ "data": { /* resource */ } }

// Error
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

---

## Token Optimization

### Feature-Scoped Development (Recommended)

```bash
/new-feature                     # Creates docs in features/proposed/[name]/
# vs global docs approach        # 40-50% fewer tokens
```

### Pattern References

Agents automatically use templates from:
- `shared/templates/` - Service & route patterns
- `frontend/templates/` - Component & page patterns
- `tests/templates/` - Test patterns

**Savings:** ~50-60% reduction per feature (from ~38K to ~14K tokens)

---

## TDD Workflow

```
1. RED:   Write failing test
2. GREEN: Write minimal code
3. REFACTOR: Improve code        (while keeping tests green)
```

---

## File Structure

```
shared/
├── repositories/              # Data access
├── services/            # Business logic
└── types/               # TypeScript types

frontend/
├── routes/              # Fresh routes (SSR)
├── islands/             # Interactive components (client-side)
└── components/          # Shared components

tests/
├── unit/                # Unit tests
└── integration/         # Integration tests

features/
├── proposed/            # Features being developed
└── implemented/         # Completed features

docs/
├── architecture.md      # System architecture (THIS FILE IS ESSENTIAL)
└── guides/              # Detailed guides (reference only)
```

---

## Testing with Deno KV

```typescript
// In-memory KV for tests (fast, isolated)
const kv = await Deno.openKv(':memory:');

// Cleanup after tests
try {
  // ... test code
} finally {
  await kv.close();
}
```

---

## When to Migrate

### Deno KV → PostgreSQL
When you need:
- Complex JOINs across many tables
- Advanced aggregations (GROUP BY with HAVING)
- Full-text search at database level
- Analytics/reporting queries

### Monolith → Microservices
When you have:
- 10+ developers
- Clear domain boundaries
- Different scaling needs per service
- 100K+ users

---

## Slash Commands Quick Ref

| Command | Use Case | When to Use |
|---------|----------|-------------|
| `/new-feature` | Build complete feature | 90% of development |
| `/mockup` | Visual prototype | UI-heavy features |
| `/design` | Update design system | Rebrand, customize styling |

| `/review` | Code review | Before merging |
| `/requirements` | Project docs | Large projects (10+ features) |
| `/architect` | Update architecture | DB migration, microservices |

---

## Best Practices

### Code
- ✅ YAGNI - You Ain't Gonna Need It
- ✅ KISS - Keep It Simple, Stupid
- ✅ DRY - Don't Repeat Yourself
- ✅ Test first (TDD)
- ✅ Use logger for server-side code (never console.log in routes/services)

### Architecture
- ✅ Start simple, scale later
- ✅ Use boring, proven technology
- ✅ Avoid premature optimization
- ✅ Clear separation: Routes → Services → Database

### Authentication
- ✅ Development: Auto-setup creates admin@dev.local on first run
- ✅ Production: Use INITIAL_ADMIN_EMAIL for first admin, then remove it
- ✅ Use consistent cookie settings (SameSite=Lax for auth_token)
- ✅ Token refresh should run regardless of user activity
- ✅ Provide sufficient buffer time before token expiry (5+ minutes)

### Testing
- ✅ Test business logic (not frameworks)
- ✅ Use in-memory KV for speed
- ✅ AAA pattern (Arrange, Act, Assert)
- ✅ One assertion per test

---

## Common Issues

### "Port already in use"
```bash
# Kill processes on ports 3000
deno task kill-ports
# Then restart: deno task dev
```

### "Unexpected logout / Session expired"

**Root Causes:**
1. **Token expired before refresh** - Check token refresh is running
2. **Cookie SameSite mismatch** - Should always be `Lax` for auth_token
3. **Page visibility/activity blocking refresh** - Fixed in latest version

**Debug Steps:**
```bash
# 1. Check .env configuration
JWT_EXPIRES_IN=15m               # Or increase to 30m/1h

# 2. Open browser console and look for:
"Periodic token refresh triggered"
"Access token refreshed successfully"

# 3. Verify cookie settings in DevTools:
# - auth_token: SameSite=Lax, expires in 15 minutes
# - refresh_token: HttpOnly, SameSite=Lax, expires in 30 days
```

**Solutions:**
- Increase token expiry time: `JWT_EXPIRES_IN=30m` or `1h`
- Verify token refresh script is loaded in browser
- Check network tab for `/api/auth/refresh` calls every 10 minutes
- Ensure refresh token cookie is not blocked by browser settings

### "Module not found"
```bash
# Always include .ts extension in imports
import { foo } from './bar.ts';  // ✅ Correct
import { foo } from './bar';      // ❌ Wrong
```

### "Tests failing"
```bash
# Ensure using in-memory KV for tests
const kv = await Deno.openKv(':memory:');
```

### "State is null in _app.tsx"

This is **expected behavior** when there's no auth cookie. The middleware sets `ctx.state` correctly, but:
- Client-side renders don't have access to server-side state
- State is only available during server-side rendering
- Use props passed from _app.tsx to islands for user data
- Never rely on ctx.state being available in client-side code

---

## Resources

- **Architecture:** `docs/architecture.md` (ESSENTIAL - read this!)
- **Detailed Guides:** `docs/guides/` (reference when needed)
- **Templates:** `shared/templates/`, `frontend/templates/`, `tests/templates/`
- **Deno Docs:** https://deno.com/manual
- **Fresh Docs:** https://fresh.deno.dev/docs
- **Deno KV Docs:** https://deno.com/kv

### Key Architecture Points

1. **Single Server:** All code runs on one Fresh server (SSR + API + Islands)
2. **Token Refresh:** Automatic every 10 minutes with 5-minute buffer
3. **Auth Flow:** Cookie → Middleware → State → Props → Islands
4. **Logging:** Use `createLogger()` for all server-side code, console for client-side debug only
5. **State Management:** Server state (ctx.state) is separate from client state (signals/localStorage)

---

## Troubleshooting Checklist

Before reporting issues, verify:

- [ ] Dev server running (`deno task dev`)
- [ ] First run created admin@dev.local (check console output)
- [ ] JWT_SECRET is at least 32 characters in `.env`
- [ ] Dev server restarted after .env changes
- [ ] Browser console shows token refresh logs every 10 minutes
- [ ] Cookies are not being blocked by browser/extensions
- [ ] Fresh cache cleared: `rm -rf frontend/_fresh`
- [ ] Using latest code with consistent SameSite=Lax cookies

---

## Token Optimization Summary

| Approach | Tokens/Feature | Speed | Use When |
|----------|----------------|-------|----------|
| **Feature-scoped + patterns** | ~14K | Fast | New features (recommended) |
| Feature-scoped only | ~20K | Fast | Basic features |
| Global docs | ~38K | Slower | Initial setup |

**Recommendation:** Always use `/new-feature` for 40-50% token savings.

---

**Need more details?** See comprehensive guides in `docs/guides/`:
- `TOKEN_OPTIMIZATION_GUIDE.md`
- `TEST_OPTIMIZATION_GUIDE.md`
- `BACKEND_OPTIMIZATION_GUIDE.md`
- `FRONTEND_OPTIMIZATION_GUIDE.md`
- `ORCHESTRATION_GUIDE.md`
- `DENO_KV_GUIDE.md`
