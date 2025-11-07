# Repository Pattern for Deno KV

## Overview

The repository pattern provides a centralized, type-safe data access layer for Deno KV operations. This pattern abstracts direct KV access into specialized repository classes, improving code organization, testability, and maintainability.

## Benefits

✅ **Type Safety** - Full TypeScript typing for all operations  
✅ **Centralized Logic** - All data access in one place  
✅ **Testability** - Easy to mock for unit tests  
✅ **Consistency** - Standardized error handling and logging  
✅ **Maintainability** - Changes to data access logic in one location  
✅ **Transaction Support** - Built-in atomic operations

## Architecture

```
backend/
└── repositories/
    ├── base-repository.ts         # Base class with common CRUD operations
    ├── user-repository.ts         # User data access
    ├── token-repository.ts        # Token management (refresh, blacklist, etc.)
    ├── notification-repository.ts # Notification CRUD
    ├── job-repository.ts          # Background job management
    └── index.ts                   # Exports and factory
```

## Available Repositories

### 1. UserRepository

Manages user data with email indexing and role filtering.

**Methods:**
- `findById(userId)` - Get user by ID
- `findByEmail(email)` - Get user by email
- `create(userData)` - Create new user (auto-hashes password, creates email index)
- `update(userId, updates)` - Update user (handles email changes)
- `deleteUser(userId)` - Delete user and email index
- `listUsers(options)` - List all users with pagination
- `listByRole(role, options)` - Filter users by role
- `countUsers()` - Count total users
- `emailExists(email)` - Check if email is taken
- `enable2FA(userId, secret, backupCodes)` - Enable 2FA
- `disable2FA(userId)` - Disable 2FA
- `verifyEmail(userId)` - Mark email as verified
- `updatePassword(userId, password)` - Update password (auto-hashes)
- `getStats()` - Get user statistics

**Example:**
```typescript
import { UserRepository } from './repositories/index.ts';

const userRepo = new UserRepository();

// Find user
const user = await userRepo.findByEmail('user@example.com');

// Create user
const newUser = await userRepo.create({
  email: 'new@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  role: 'user',
  emailVerified: false,
  emailVerifiedAt: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  twoFactorBackupCodes: [],
});

// Update user
await userRepo.update(user.id, {
  name: 'Jane Doe',
  emailVerified: true,
});

// List users with pagination
const result = await userRepo.listUsers({ limit: 10 });
console.log(result.items); // Array of users
console.log(result.hasMore); // boolean
```

### 2. TokenRepository

Manages all token types: refresh tokens, blacklist, password resets, email verification.

**Methods:**

**Refresh Tokens:**
- `storeRefreshToken(userId, tokenId, expiresAt)` - Store refresh token
- `getRefreshToken(userId, tokenId)` - Get refresh token
- `verifyRefreshToken(userId, tokenId)` - Check if valid
- `revokeRefreshToken(userId, tokenId)` - Revoke specific token
- `revokeAllUserRefreshTokens(userId)` - Revoke all user tokens
- `listUserRefreshTokens(userId)` - List user's tokens

**Blacklist:**
- `blacklistToken(tokenId, userId, expiresAt, reason?)` - Blacklist access token
- `isTokenBlacklisted(tokenId)` - Check if blacklisted
- `getBlacklistEntry(tokenId)` - Get blacklist details

**Password Reset:**
- `storePasswordResetToken(token, userId, email, expiresAt)` - Store reset token
- `getPasswordResetToken(token)` - Get reset token (checks expiry)
- `deletePasswordResetToken(token)` - Delete reset token

**Email Verification:**
- `storeEmailVerificationToken(token, userId, email, expiresAt)` - Store verification token
- `getEmailVerificationToken(token)` - Get verification token (checks expiry)
- `deleteEmailVerificationToken(token)` - Delete verification token

**Cleanup:**
- `cleanupExpiredTokens()` - Remove expired tokens

**Example:**
```typescript
import { TokenRepository } from './repositories/index.ts';

const tokenRepo = new TokenRepository();

// Store refresh token
await tokenRepo.storeRefreshToken(
  userId,
  tokenId,
  Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
);

// Verify refresh token
const isValid = await tokenRepo.verifyRefreshToken(userId, tokenId);

// Blacklist access token
await tokenRepo.blacklistToken(
  accessTokenId,
  userId,
  expiryTimestamp,
  'user_logout'
);

// Store password reset token
await tokenRepo.storePasswordResetToken(
  resetToken,
  userId,
  email,
  Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
);

// Cleanup expired tokens
const cleaned = await tokenRepo.cleanupExpiredTokens();
console.log(`Cleaned ${cleaned.refreshTokens} refresh tokens`);
```

### 3. NotificationRepository

Manages user notifications with read/unread tracking.

**Methods:**
- `create(userId, type, title, message, link?)` - Create notification
- `findById(userId, notificationId)` - Get notification
- `listUserNotifications(userId, options)` - List with filters
- `markAsRead(userId, notificationId)` - Mark as read
- `markAllAsRead(userId)` - Mark all as read
- `deleteNotification(userId, notificationId)` - Delete notification
- `deleteAllUserNotifications(userId)` - Delete all
- `getUnreadCount(userId)` - Get unread count
- `getCountsByType(userId)` - Count by type (info, success, warning, error)
- `deleteOldReadNotifications(olderThanDays)` - Cleanup old notifications

**Example:**
```typescript
import { NotificationRepository } from './repositories/index.ts';

const notificationRepo = new NotificationRepository();

// Create notification
await notificationRepo.create(
  userId,
  'success',
  'Welcome!',
  'Your account has been created',
  '/profile'
);

// List unread notifications
const unread = await notificationRepo.listUserNotifications(userId, {
  read: false,
  limit: 10,
  sortByDate: 'desc',
});

// Mark as read
await notificationRepo.markAsRead(userId, notificationId);

// Get unread count
const count = await notificationRepo.getUnreadCount(userId);

// Cleanup old notifications
await notificationRepo.deleteOldReadNotifications(30); // 30 days
```

### 4. JobRepository

Manages background job queue data.

**Methods:**
- `create(name, data, options)` - Create job
- `findById(jobId)` - Get job
- `updateStatus(jobId, status, updates)` - Update job status
- `incrementAttempts(jobId)` - Increment retry attempts
- `listJobs(options)` - List with filters (status, name, sort)
- `getPendingJobs(limit)` - Get jobs ready to process
- `deleteJob(jobId)` - Delete job
- `getStats()` - Get queue statistics
- `deleteOldCompletedJobs(olderThanDays)` - Cleanup completed jobs
- `deleteOldFailedJobs(olderThanDays)` - Cleanup failed jobs
- `retryJob(jobId)` - Retry failed job

**Example:**
```typescript
import { JobRepository } from './repositories/index.ts';

const jobRepo = new JobRepository();

// Create job
const job = await jobRepo.create('send-email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Hello!',
}, {
  priority: 10,
  maxRetries: 3,
});

// Get pending jobs
const pending = await jobRepo.getPendingJobs(5);

// Update job status
await jobRepo.updateStatus(job.id, 'running', {
  startedAt: new Date().toISOString(),
  processingBy: 'worker-1',
});

// Complete job
await jobRepo.updateStatus(job.id, 'completed', {
  completedAt: new Date().toISOString(),
  result: { messageId: '123' },
});

// Get statistics
const stats = await jobRepo.getStats();
console.log(`Pending: ${stats.pending}, Running: ${stats.running}`);

// Cleanup old jobs
await jobRepo.deleteOldCompletedJobs(7); // 7 days
```

## Usage in Routes

### Before (Direct KV Access)

```typescript
// backend/routes/auth.ts
import { getKv } from '../lib/kv.ts';

auth.post('/login', async (c) => {
  const kv = await getKv();
  const { email, password } = c.get('validatedBody');
  
  // Get user by email
  const userKey = await kv.get(['users_by_email', email]);
  const userId = userKey.value as string;
  const userEntry = await kv.get(['users', userId]);
  const user = userEntry.value;
  
  // ... rest of login logic
});
```

### After (Repository Pattern)

```typescript
// backend/routes/auth.ts
import { UserRepository, TokenRepository } from '../repositories/index.ts';

auth.post('/login', async (c) => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  const { email, password } = c.get('validatedBody');
  
  // Get user by email
  const user = await userRepo.findByEmail(email);
  
  // ... rest of login logic
});
```

## Advanced Usage

### Transaction Support

```typescript
const userRepo = new UserRepository();

// Get atomic operation
const atomic = await userRepo.atomic();

// Build transaction
await atomic
  .set(['custom_key'], { data: 'value' })
  .delete(['another_key'])
  .commit();
```

### Testing with Mock KV

```typescript
import { RepositoryFactory } from './repositories/index.ts';

// Create test KV instance
const testKv = await Deno.openKv(':memory:');

// Create repositories with test KV
const factory = new RepositoryFactory(testKv);
const userRepo = factory.createUserRepository();

// Test operations
const user = await userRepo.create({
  email: 'test@example.com',
  password: 'password',
  name: 'Test User',
  // ... other fields
});

// Cleanup
await testKv.close();
```

### Custom Repository

Create your own repository by extending `BaseRepository`:

```typescript
import { BaseRepository, RepositoryOptions } from './base-repository.ts';

interface MyEntity {
  id: string;
  name: string;
  createdAt: string;
}

export class MyRepository extends BaseRepository<MyEntity> {
  constructor(options: RepositoryOptions = {}) {
    super('MyEntity', options);
  }

  async findByName(name: string): Promise<MyEntity | null> {
    const kv = await this.getKv();
    const entities = kv.list<MyEntity>({ prefix: ['my_entities'] });
    
    for await (const entry of entities) {
      if (entry.value?.name === name) {
        return entry.value;
      }
    }
    
    return null;
  }

  async createEntity(name: string): Promise<MyEntity> {
    const id = crypto.randomUUID();
    const entity: MyEntity = {
      id,
      name,
      createdAt: new Date().toISOString(),
    };

    await this.set(['my_entities', id], entity);
    return entity;
  }
}
```

## Migration Guide

### Step 1: Import Repositories

```typescript
// Old
import { getKv } from '../lib/kv.ts';

// New
import { UserRepository, TokenRepository } from '../repositories/index.ts';
```

### Step 2: Initialize Repositories

```typescript
// Old
const kv = await getKv();

// New
const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();
```

### Step 3: Replace KV Operations

**Finding Users:**
```typescript
// Old
const userKey = await kv.get(['users_by_email', email]);
const userId = userKey.value as string;
const userEntry = await kv.get(['users', userId]);
const user = userEntry.value;

// New
const user = await userRepo.findByEmail(email);
```

**Creating Users:**
```typescript
// Old
const userId = crypto.randomUUID();
const user = { id: userId, email, password: hashedPassword, ...other };
await kv.atomic()
  .set(['users', userId], user)
  .set(['users_by_email', email], userId)
  .commit();

// New
const user = await userRepo.create({ email, password, ...other });
```

**Updating Users:**
```typescript
// Old
const userEntry = await kv.get(['users', userId]);
const user = userEntry.value;
const updated = { ...user, name: newName, updatedAt: new Date().toISOString() };
await kv.set(['users', userId], updated);

// New
const updated = await userRepo.update(userId, { name: newName });
```

**Token Operations:**
```typescript
// Old
await kv.set(['refresh_tokens', userId, tokenId], tokenData, { expireIn: ttl });

// New
await tokenRepo.storeRefreshToken(userId, tokenId, expiresAt);
```

## Best Practices

### 1. One Repository Per Route Handler

```typescript
// ✅ Good
auth.post('/login', async (c) => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  // ... use repositories
});

// ❌ Avoid - Don't reuse instances across requests
const userRepo = new UserRepository(); // Global instance
auth.post('/login', async (c) => {
  // ... use global userRepo
});
```

### 2. Use Repository Methods, Not Direct KV

```typescript
// ✅ Good
const user = await userRepo.findByEmail(email);

// ❌ Avoid - Don't mix patterns
const kv = await getKv();
const userEntry = await kv.get(['users', userId]);
```

### 3. Handle Null Returns

```typescript
const user = await userRepo.findById(userId);

if (!user) {
  return c.json({ error: 'User not found' }, 404);
}

// ... use user
```

### 4. Use Type-Safe Updates

```typescript
// ✅ Good - TypeScript enforces valid fields
await userRepo.update(userId, {
  name: 'New Name',
  emailVerified: true,
});

// ❌ Error - TypeScript will catch invalid fields
await userRepo.update(userId, {
  invalidField: 'value', // Compile error
});
```

### 5. Leverage Specialized Methods

```typescript
// ✅ Good - Use specialized methods
await userRepo.verifyEmail(userId);
await userRepo.updatePassword(userId, newPassword);
await userRepo.enable2FA(userId, secret, backupCodes);

// ❌ Less clear - Generic update
await userRepo.update(userId, { emailVerified: true, emailVerifiedAt: now });
```

## Testing

### Unit Tests

```typescript
// tests/unit/repositories/user-repository.test.ts
import { assertEquals, assertExists } from 'jsr:@std/assert';
import { UserRepository } from '../../../backend/repositories/index.ts';

Deno.test('UserRepository - create user', async () => {
  const kv = await Deno.openKv(':memory:');
  const userRepo = new UserRepository({ kv });
  
  const user = await userRepo.create({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: 'user',
    emailVerified: false,
    emailVerifiedAt: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: [],
  });
  
  assertExists(user.id);
  assertEquals(user.email, 'test@example.com');
  
  await kv.close();
});
```

### Integration Tests

```typescript
// tests/integration/auth.test.ts
import { UserRepository, TokenRepository } from '../../backend/repositories/index.ts';

Deno.test('Auth flow with repositories', async () => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  
  // Create user
  const user = await userRepo.create({
    email: 'integration@test.com',
    password: 'password123',
    // ... other fields
  });
  
  // Store refresh token
  await tokenRepo.storeRefreshToken(
    user.id,
    'token-123',
    Math.floor(Date.now() / 1000) + 3600
  );
  
  // Verify token exists
  const isValid = await tokenRepo.verifyRefreshToken(user.id, 'token-123');
  assertEquals(isValid, true);
  
  // Cleanup
  await userRepo.deleteUser(user.id);
});
```

## Performance Considerations

1. **Batch Operations** - Use `listUsers()` instead of multiple `findById()` calls
2. **Pagination** - Always use `limit` option for large datasets
3. **Indexes** - Email lookups use indexed keys for O(1) access
4. **Caching** - Consider adding caching layer for frequently accessed data
5. **Connection Pooling** - Repositories use singleton KV connection

## Common Patterns

### Existence Check Before Create

```typescript
const exists = await userRepo.emailExists(email);
if (exists) {
  return c.json({ error: 'Email already exists' }, 409);
}

const user = await userRepo.create({ email, ...data });
```

### Atomic Multi-Entity Operations

```typescript
const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();

// Create user
const user = await userRepo.create(userData);

// Store verification token
await tokenRepo.storeEmailVerificationToken(
  verificationToken,
  user.id,
  user.email,
  expiresAt
);
```

### Pagination with Cursor

```typescript
let cursor: string | null = null;
const allUsers: User[] = [];

do {
  const result = await userRepo.listUsers({ limit: 100, cursor });
  allUsers.push(...result.items);
  cursor = result.cursor;
} while (cursor);
```

## Troubleshooting

### Issue: "Cannot read property of null"

**Cause:** Repository method returned `null` (entity not found)  
**Solution:** Always check for null before using the result

```typescript
const user = await userRepo.findById(userId);
if (!user) {
  // Handle not found case
}
```

### Issue: "Email already exists" on create

**Cause:** Email already registered  
**Solution:** Check existence first or catch the error

```typescript
try {
  const user = await userRepo.create(userData);
} catch (error) {
  if (error.message.includes('Email already exists')) {
    return c.json({ error: 'Email taken' }, 409);
  }
  throw error;
}
```

### Issue: Repository operations are slow

**Cause:** Not using pagination or fetching too much data  
**Solution:** Use `limit` option and pagination

```typescript
// Instead of fetching all users
const allUsers = await userRepo.listUsers(); // Slow if many users

// Fetch in batches
const batch = await userRepo.listUsers({ limit: 100 });
```

## Future Enhancements

- [ ] Add caching layer (Redis/Memcached)
- [ ] Implement query builder for complex filters
- [ ] Add soft delete support
- [ ] Implement audit logging for all changes
- [ ] Add full-text search capabilities
- [ ] Support for composite indexes
- [ ] Automated migration system
- [ ] GraphQL resolver integration

## Related Documentation

- [Deno KV Guide](https://deno.land/manual/runtime/kv)
- [Backend Architecture](./architecture.md)
- [Testing Guide](../tests/README.md)
- [API Documentation](./API_DOCUMENTATION.md)
