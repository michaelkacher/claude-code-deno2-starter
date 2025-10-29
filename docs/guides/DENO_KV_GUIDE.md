# Deno KV Development Guide

A comprehensive guide to using Deno KV for local development, testing, and production deployment.

## Overview

Deno KV is a key-value database built into Deno that:
- **Local**: Uses SQLite for local development
- **Production**: Uses FoundationDB on Deno Deploy (globally distributed)
- **Zero Config**: No setup, connection strings, or migrations needed
- **Consistent API**: Same code works locally and in production

## Local Development Storage

### Where Data is Stored

When you run `Deno.openKv()` locally, it creates a **SQLite database file** on your filesystem.

**Default location** (if no path specified):
```
{project-directory}/.deno_kv_store/
```

**Custom location** (recommended for clarity):
```typescript
// Explicit path - better for understanding where data lives
const kv = await Deno.openKv('./data/local.db');
```

**In-memory** (for testing - data lost on restart):
```typescript
// Perfect for tests - no file system writes
const kv = await Deno.openKv(':memory:');
```

### File System Structure

When running locally, you'll see:
```
your-project/
├── .deno_kv_store/        # Default KV storage (if using Deno.openKv())
│   └── {hash}.sqlite      # SQLite database file
├── data/                  # Custom location (if using Deno.openKv('./data/local.db'))
│   └── local.db           # Your KV data
└── backend/
    └── main.ts
```

## Best Practices for Local Development

### 1. Single Instance Pattern ⭐ CRITICAL

**DO THIS** ✅:
```typescript
// backend/lib/kv.ts
let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    // Open once, reuse everywhere
    const path = Deno.env.get('DENO_ENV') === 'production'
      ? undefined  // Use Deno Deploy's KV
      : './data/local.db';  // Local SQLite file

    kvInstance = await Deno.openKv(path);
  }
  return kvInstance;
}
```

```typescript
// backend/services/users.ts
import { getKv } from '../lib/kv.ts';

export class UserService {
  async create(data: CreateUserInput) {
    const kv = await getKv();  // Reuses same instance
    // ... use kv
  }
}
```

**DON'T DO THIS** ❌:
```typescript
// BAD: Opening new connection on every request
export async function handler(req: Request) {
  const kv = await Deno.openKv();  // ❌ Creates new connection each time!
  // ... use kv
}
```

**Why?** Opening `Deno.openKv()` on every request:
- Hurts performance (connection overhead)
- May cause file locking issues
- Wastes resources

### 2. Environment-Based Configuration

Use environment variables to control database location:

```typescript
// backend/config/kv.ts
const DENO_ENV = Deno.env.get('DENO_ENV') || 'development';

export function getKvPath(): string | undefined {
  switch (DENO_ENV) {
    case 'production':
      return undefined;  // Deno Deploy handles this
    case 'test':
      return ':memory:';  // In-memory for tests
    case 'development':
    default:
      return './data/dev.db';  // Local SQLite file
  }
}

let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    kvInstance = await Deno.openKv(getKvPath());
  }
  return kvInstance;
}
```

**.env** (for local development):
```bash
DENO_ENV=development
```

### 3. Testing with In-Memory Database

Always use `:memory:` for tests to ensure isolation:

```typescript
// tests/integration/users.test.ts
import { assertEquals } from '@std/assert';
import { UserService } from '../../backend/services/users.ts';

Deno.test('UserService - create user', async () => {
  // Create isolated in-memory database for this test
  const kv = await Deno.openKv(':memory:');

  try {
    const service = new UserService(kv);

    const user = await service.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    assertEquals(user.email, 'test@example.com');

    // Verify it was stored
    const found = await service.findById(user.id);
    assertEquals(found?.email, 'test@example.com');
  } finally {
    // Clean up - close the database
    await kv.close();
  }
});

Deno.test('UserService - another test', async () => {
  // Completely isolated - different in-memory database
  const kv = await Deno.openKv(':memory:');

  try {
    const service = new UserService(kv);
    // This test has no data from previous test
  } finally {
    await kv.close();
  }
});
```

**Benefits**:
- ✅ Fast (no disk I/O)
- ✅ Isolated (each test gets fresh database)
- ✅ No cleanup needed (memory cleared on close)
- ✅ Parallel test execution safe

### 4. Dependency Injection Pattern

Pass KV instance to services instead of importing globally:

```typescript
// backend/services/users.ts
export class UserService {
  constructor(private kv: Deno.Kv) {}

  async create(data: CreateUserInput): Promise<User> {
    // Use this.kv instead of global instance
    await this.kv.set(['users', userId], user);
    return user;
  }
}
```

```typescript
// backend/main.ts
import { getKv } from './lib/kv.ts';
import { UserService } from './services/users.ts';

const kv = await getKv();
const userService = new UserService(kv);

// Use userService in routes
```

**Benefits**:
- ✅ Easy to test (inject mock KV)
- ✅ Clear dependencies
- ✅ Flexible (swap implementations)

### 5. Graceful Shutdown

Close KV connection on app shutdown:

```typescript
// backend/main.ts
import { Hono } from 'hono';
import { getKv } from './lib/kv.ts';

const app = new Hono();
const kv = await getKv();

// ... set up routes

// Handle shutdown gracefully
globalThis.addEventListener('unload', async () => {
  console.log('Closing KV connection...');
  await kv.close();
});

Deno.serve(app.fetch);
```

### 6. Development vs Production Differences

| Aspect | Local Development | Production (Deno Deploy) |
|--------|-------------------|--------------------------|
| **Storage Backend** | SQLite | FoundationDB |
| **Location** | File system (`./data/local.db`) | Global edge network |
| **Consistency** | Strong | Eventually consistent |
| **Latency** | ~1ms | ~10-50ms (global) |
| **Replication** | None (single file) | Multi-region replicas |
| **Backups** | Manual (copy .db file) | Automatic continuous backups |
| **Scaling** | Single machine | Auto-scales globally |

**Important**: Code works identically in both environments!

```typescript
// This works the same locally and on Deno Deploy
const kv = await Deno.openKv();
await kv.set(['users', '123'], { name: 'Alice' });
const user = await kv.get(['users', '123']);
```

### 7. Data Inspection During Development

#### Option 1: Use SQLite CLI (Local Only)

```bash
# Install SQLite CLI
brew install sqlite  # macOS
apt install sqlite3  # Linux
choco install sqlite # Windows

# Open your local database
sqlite3 ./data/local.db

# Run queries
sqlite> .tables
sqlite> SELECT * FROM kv;
sqlite> .quit
```

#### Option 2: Create Admin Endpoints (Development Only)

```typescript
// backend/routes/admin.ts (dev only!)
import { Hono } from 'hono';
import { getKv } from '../lib/kv.ts';

const admin = new Hono();

// ⚠️ Only enable in development!
if (Deno.env.get('DENO_ENV') === 'development') {
  admin.get('/kv/all', async (c) => {
    const kv = await getKv();
    const entries = [];

    // List all entries (careful with large datasets!)
    for await (const entry of kv.list({ prefix: [] })) {
      entries.push({
        key: entry.key,
        value: entry.value,
      });
    }

    return c.json({ entries });
  });
}

export default admin;
```

#### Option 3: Use Deno Deploy Dashboard (Production)

For production data on Deno Deploy:
- Visit https://dash.deno.com
- Select your project
- Navigate to "KV" tab
- Browse keys and values

### 8. Data Seeding for Development

Create seed scripts for local development:

```typescript
// scripts/seed-local-kv.ts
import { getKv } from '../backend/lib/kv.ts';

async function seedDatabase() {
  const kv = await getKv();

  console.log('Seeding local KV database...');

  // Create sample users
  const users = [
    { id: '1', email: 'alice@example.com', name: 'Alice' },
    { id: '2', email: 'bob@example.com', name: 'Bob' },
  ];

  for (const user of users) {
    await kv.set(['users', user.id], user);
    await kv.set(['users_by_email', user.email], user.id);
    console.log(`✅ Created user: ${user.email}`);
  }

  console.log('✅ Seeding complete!');
  await kv.close();
}

if (import.meta.main) {
  seedDatabase();
}
```

Run with:
```bash
deno run --allow-read --allow-write --allow-env scripts/seed-local-kv.ts
```

### 9. Resetting Local Data

To reset your local database during development:

```bash
# Delete the database file
rm -rf ./data/local.db
# or
rm -rf .deno_kv_store/

# Restart your server - new empty database will be created
deno task dev
```

Or create a reset script:

```typescript
// scripts/reset-local-kv.ts
const dbPath = './data/local.db';

try {
  await Deno.remove(dbPath);
  console.log('✅ Local KV database reset');
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.log('Database file not found, nothing to reset');
  } else {
    throw error;
  }
}
```

### 10. Git Ignore

Always add KV storage to `.gitignore`:

```gitignore
# .gitignore

# Deno KV local storage
.deno_kv_store/
data/*.db
data/*.db-shm
data/*.db-wal

# SQLite journal files
*.sqlite
*.sqlite-shm
*.sqlite-wal
```

## Example: Complete Setup

Here's a complete example with all best practices:

### Project Structure
```
backend/
├── config/
│   └── kv.ts           # KV configuration
├── lib/
│   └── kv.ts           # KV singleton
├── services/
│   └── users.ts        # Business logic
├── routes/
│   └── users.ts        # API routes
└── main.ts             # Entry point

scripts/
├── seed-local-kv.ts    # Seed development data
└── reset-local-kv.ts   # Reset local database

tests/
└── integration/
    └── users.test.ts   # Tests with :memory:

data/
└── .gitkeep            # Track directory, not files
```

### Implementation

**backend/lib/kv.ts**:
```typescript
let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    const env = Deno.env.get('DENO_ENV') || 'development';

    const path = env === 'production'
      ? undefined  // Deno Deploy
      : env === 'test'
      ? ':memory:'  // Tests
      : './data/local.db';  // Development

    kvInstance = await Deno.openKv(path);
    console.log(`📦 KV opened: ${path || 'Deno Deploy'}`);
  }
  return kvInstance;
}

export async function closeKv() {
  if (kvInstance) {
    await kvInstance.close();
    kvInstance = null;
    console.log('📦 KV closed');
  }
}
```

**backend/main.ts**:
```typescript
import { Hono } from 'hono';
import { getKv, closeKv } from './lib/kv.ts';
import usersRoutes from './routes/users.ts';

const app = new Hono();

// Initialize KV once at startup
await getKv();

app.route('/api/v1/users', usersRoutes);

// Graceful shutdown
globalThis.addEventListener('unload', async () => {
  await closeKv();
});

Deno.serve(app.fetch);
```

**tests/integration/users.test.ts**:
```typescript
import { assertEquals } from '@std/assert';
import { UserService } from '../../backend/services/users.ts';

Deno.test('UserService CRUD operations', async () => {
  // Isolated test database
  const kv = await Deno.openKv(':memory:');

  try {
    const service = new UserService(kv);

    // Create
    const user = await service.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    assertEquals(user.email, 'test@example.com');

    // Read
    const found = await service.findById(user.id);
    assertEquals(found?.id, user.id);

    // Update
    const updated = await service.update(user.id, { name: 'Updated Name' });
    assertEquals(updated?.name, 'Updated Name');

    // Delete
    const deleted = await service.delete(user.id);
    assertEquals(deleted, true);
  } finally {
    await kv.close();
  }
});
```

## Summary: Best Practices Checklist

- ✅ Use single instance pattern (`getKv()` singleton)
- ✅ Use `:memory:` for tests
- ✅ Use explicit path for development (`./data/local.db`)
- ✅ Use dependency injection (pass KV to services)
- ✅ Close KV on shutdown
- ✅ Add KV files to `.gitignore`
- ✅ Create seed scripts for development data
- ✅ Use environment variables to control behavior
- ✅ Never call `Deno.openKv()` on every request
- ✅ Test locally, deploy globally (same code)

## Common Mistakes to Avoid

1. ❌ Opening KV on every request (performance hit)
2. ❌ Not closing KV in tests (resource leaks)
3. ❌ Committing `.deno_kv_store/` to git
4. ❌ Using persistent DB for tests (test pollution)
5. ❌ Assuming local SQLite behaves exactly like production FoundationDB (eventual consistency differences)

## Resources

- [Deno KV Documentation](https://docs.deno.com/deploy/kv/)
- [Deno KV on Deno Deploy](https://deno.com/kv)
- [Self-hosted Deno KV](https://github.com/denoland/denokv)
