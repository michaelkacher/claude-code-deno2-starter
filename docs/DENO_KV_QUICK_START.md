# Deno KV Quick Start

Quick reference for using Deno KV in this project. See `DENO_KV_GUIDE.md` for comprehensive documentation.

## TL;DR

```typescript
// backend/lib/kv.ts - Use this pattern!
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

## Storage Locations

| Environment | Storage | File |
|-------------|---------|------|
| **Local Dev** | SQLite | `./data/local.db` |
| **Tests** | In-Memory | `:memory:` (no file) |
| **Production** | FoundationDB | Deno Deploy (managed) |

## Commands

```bash
# Development
deno task dev              # Start with KV (creates ./data/local.db)

# Database Management
deno task kv:seed          # Add sample data
deno task kv:reset         # Delete database (fresh start)
deno task kv:inspect       # View all data

# Testing
deno test                  # Tests use :memory: (isolated)
```

## Best Practices

### ✅ DO

```typescript
// 1. Single instance (call once, reuse everywhere)
const kv = await getKv();

// 2. Use :memory: for tests
Deno.test('test name', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    // test code
  } finally {
    await kv.close();
  }
});

// 3. Dependency injection
export class UserService {
  constructor(private kv: Deno.Kv) {}
}

// 4. Close on shutdown
globalThis.addEventListener('unload', async () => {
  await kv.close();
});
```

### ❌ DON'T

```typescript
// 1. DON'T open on every request
export async function handler(req: Request) {
  const kv = await Deno.openKv();  // ❌ BAD!
}

// 2. DON'T use persistent DB for tests
Deno.test('test', async () => {
  const kv = await Deno.openKv('./test.db');  // ❌ BAD!
});

// 3. DON'T commit database files
git add data/*.db  // ❌ BAD! (already in .gitignore)
```

## Common Tasks

### Create Data

```typescript
const kv = await getKv();
await kv.set(['users', userId], { name: 'Alice', email: 'alice@example.com' });
```

### Read Data

```typescript
const kv = await getKv();
const user = await kv.get(['users', userId]);
console.log(user.value);  // { name: 'Alice', ... }
```

### List Data

```typescript
const kv = await getKv();
for await (const entry of kv.list({ prefix: ['users'] })) {
  console.log(entry.key, entry.value);
}
```

### Secondary Indexes

```typescript
// Create with index
await kv.atomic()
  .set(['users', userId], user)
  .set(['users_by_email', email], userId)
  .commit();

// Query by index
const userIdEntry = await kv.get(['users_by_email', email]);
const userId = userIdEntry.value;
const user = await kv.get(['users', userId]);
```

## Development Workflow

### First Time Setup

```bash
# 1. Start dev server (creates ./data/local.db automatically)
deno task dev

# 2. Add sample data (optional)
deno task kv:seed
```

### Working with Data

```bash
# View current data
deno task kv:inspect

# Add more data
deno task kv:seed

# Start fresh
deno task kv:reset
```

### Testing

```typescript
// Each test gets isolated in-memory database
Deno.test('user creation', async () => {
  const kv = await Deno.openKv(':memory:');
  try {
    const service = new UserService(kv);
    const user = await service.create({ email: 'test@example.com' });
    // assertions
  } finally {
    await kv.close();  // Clean up
  }
});
```

## Troubleshooting

### Database locked?
- Make sure you're using the single instance pattern
- Only call `Deno.openKv()` once, reuse the instance

### Data persisting between tests?
- Use `:memory:` for tests, not a file path
- Always close KV in test cleanup

### Can't find data?
```bash
deno task kv:inspect  # See what's actually stored
```

### Want to reset everything?
```bash
deno task kv:reset    # Deletes ./data/local.db
deno task dev         # Creates fresh database
deno task kv:seed     # Add sample data
```

## Files

- `docs/DENO_KV_GUIDE.md` - Complete guide
- `scripts/seed-local-kv.ts` - Seed script (customize for your app)
- `scripts/reset-local-kv.ts` - Reset script
- `scripts/inspect-local-kv.ts` - Inspection script
- `.gitignore` - Already configured to exclude KV files

## Resources

- [Deno KV Docs](https://docs.deno.com/deploy/kv/)
- [Deno Deploy KV](https://deno.com/kv)
- Full Guide: `docs/DENO_KV_GUIDE.md`
