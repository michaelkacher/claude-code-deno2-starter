# Repository Pattern - Quick Reference

## Quick Start

```typescript
import { UserRepository, TokenRepository, NotificationRepository, JobRepository } from './repositories/index.ts';
```

## Common Operations

### Users

```typescript
const userRepo = new UserRepository();

// Find user
const user = await userRepo.findByEmail('user@example.com');
const user = await userRepo.findById(userId);

// Create user (auto-hashes password, creates email index)
const newUser = await userRepo.create({
  email: 'new@example.com',
  password: 'plaintext',
  name: 'John Doe',
  role: 'user',
  emailVerified: false,
  emailVerifiedAt: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  twoFactorBackupCodes: [],
});

// Update user
await userRepo.update(userId, { name: 'Jane Doe' });

// Delete user
await userRepo.deleteUser(userId);

// List users (with pagination)
const result = await userRepo.listUsers({ limit: 10 });

// Check email exists
const exists = await userRepo.emailExists('test@example.com');

// Specialized operations
await userRepo.verifyEmail(userId);
await userRepo.updatePassword(userId, 'newPassword');
await userRepo.enable2FA(userId, secret, backupCodes);
await userRepo.disable2FA(userId);

// Get statistics
const stats = await userRepo.getStats();
```

### Tokens

```typescript
const tokenRepo = new TokenRepository();

// Refresh tokens
await tokenRepo.storeRefreshToken(userId, tokenId, expiresAt);
const isValid = await tokenRepo.verifyRefreshToken(userId, tokenId);
await tokenRepo.revokeRefreshToken(userId, tokenId);
await tokenRepo.revokeAllUserRefreshTokens(userId);

// Blacklist
await tokenRepo.blacklistToken(tokenId, userId, expiresAt, 'user_logout');
const isBlacklisted = await tokenRepo.isTokenBlacklisted(tokenId);

// Password reset
await tokenRepo.storePasswordResetToken(token, userId, email, expiresAt);
const resetData = await tokenRepo.getPasswordResetToken(token);
await tokenRepo.deletePasswordResetToken(token);

// Email verification
await tokenRepo.storeEmailVerificationToken(token, userId, email, expiresAt);
const verifyData = await tokenRepo.getEmailVerificationToken(token);
await tokenRepo.deleteEmailVerificationToken(token);

// Cleanup
const cleaned = await tokenRepo.cleanupExpiredTokens();
```

### Notifications

```typescript
const notificationRepo = new NotificationRepository();

// Create notification
await notificationRepo.create(
  userId,
  'success', // 'info' | 'success' | 'warning' | 'error'
  'Title',
  'Message content',
  '/optional/link'
);

// List notifications
const notifications = await notificationRepo.listUserNotifications(userId, {
  read: false, // Filter by read status
  type: 'error', // Filter by type
  limit: 10,
  sortByDate: 'desc',
});

// Mark as read
await notificationRepo.markAsRead(userId, notificationId);
await notificationRepo.markAllAsRead(userId);

// Delete
await notificationRepo.deleteNotification(userId, notificationId);
await notificationRepo.deleteAllUserNotifications(userId);

// Get counts
const unreadCount = await notificationRepo.getUnreadCount(userId);
const countsByType = await notificationRepo.getCountsByType(userId);

// Cleanup old notifications
await notificationRepo.deleteOldReadNotifications(30); // 30 days
```

### Jobs

```typescript
const jobRepo = new JobRepository();

// Create job
const job = await jobRepo.create('send-email', {
  to: 'user@example.com',
  subject: 'Welcome',
}, {
  priority: 10,
  maxRetries: 3,
  scheduledFor: new Date('2024-12-31'),
});

// Update status
await jobRepo.updateStatus(job.id, 'running', {
  startedAt: new Date().toISOString(),
  processingBy: 'worker-1',
});

await jobRepo.updateStatus(job.id, 'completed', {
  completedAt: new Date().toISOString(),
  result: { messageId: '123' },
});

// List jobs
const pending = await jobRepo.getPendingJobs(10);
const failed = await jobRepo.listJobs({ status: 'failed', limit: 20 });
const allJobs = await jobRepo.listJobs({
  sortBy: 'priority',
  sortOrder: 'desc',
});

// Retry failed job
await jobRepo.retryJob(jobId);

// Get statistics
const stats = await jobRepo.getStats();
// { pending: 5, running: 2, completed: 100, failed: 3, retrying: 1, total: 111 }

// Cleanup
await jobRepo.deleteOldCompletedJobs(7); // 7 days
await jobRepo.deleteOldFailedJobs(30); // 30 days
```

## Migration Patterns

### Before → After

| Before (Direct KV) | After (Repository) |
|-------------------|-------------------|
| `kv.get(['users', userId])` | `userRepo.findById(userId)` |
| `kv.get(['users_by_email', email])` + `kv.get(['users', id])` | `userRepo.findByEmail(email)` |
| `kv.set(['users', userId], user)` | `userRepo.update(userId, updates)` |
| `kv.list({ prefix: ['users'] })` | `userRepo.listUsers()` |
| `kv.atomic().set().commit()` | `userRepo.create()` (atomic built-in) |
| `kv.delete(['users', userId])` | `userRepo.deleteUser(userId)` |

## Common Patterns

### Check Existence Before Create

```typescript
const exists = await userRepo.emailExists(email);
if (exists) {
  return c.json({ error: 'Email already taken' }, 409);
}
const user = await userRepo.create(userData);
```

### Handle Null Returns

```typescript
const user = await userRepo.findById(userId);
if (!user) {
  return c.json({ error: 'User not found' }, 404);
}
// Use user safely
```

### Pagination

```typescript
let cursor: string | null = null;
const allUsers: User[] = [];

do {
  const result = await userRepo.listUsers({ limit: 100, cursor });
  allUsers.push(...result.items);
  cursor = result.cursor;
} while (cursor);
```

### Multi-Repository Operations

```typescript
async function completeSignup(email: string, password: string) {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  
  // 1. Create user
  const user = await userRepo.create({ email, password, ...other });
  
  // 2. Generate verification token
  const token = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  
  // 3. Store verification token
  await tokenRepo.storeEmailVerificationToken(token, user.id, email, expiresAt);
  
  return { user, verificationToken: token };
}
```

## Testing

### Unit Test with Mock KV

```typescript
import { assertEquals } from 'jsr:@std/assert';
import { UserRepository } from './repositories/index.ts';

Deno.test('UserRepository - create user', async () => {
  const kv = await Deno.openKv(':memory:');
  const repo = new UserRepository({ kv });
  
  const user = await repo.create({
    email: 'test@example.com',
    password: 'password',
    name: 'Test User',
    // ... other required fields
  });
  
  assertEquals(user.email, 'test@example.com');
  
  await kv.close();
});
```

### Integration Test

```typescript
Deno.test('Integration - Auth flow', async () => {
  const userRepo = new UserRepository();
  const tokenRepo = new TokenRepository();
  
  const user = await userRepo.create(userData);
  await tokenRepo.storeRefreshToken(user.id, tokenId, expiresAt);
  
  const isValid = await tokenRepo.verifyRefreshToken(user.id, tokenId);
  assertEquals(isValid, true);
  
  await userRepo.deleteUser(user.id);
});
```

## Best Practices

✅ **DO:**
- Create repository instance per request
- Handle null returns from find methods
- Use specialized methods (verifyEmail, updatePassword)
- Use pagination for large datasets
- Close KV connection in tests

❌ **DON'T:**
- Don't reuse repository instances globally
- Don't mix direct KV access with repositories
- Don't forget null checks
- Don't fetch unbounded data without limits
- Don't use repositories for non-entity data (use direct KV for cache/temp data)

## Error Handling

```typescript
try {
  const user = await userRepo.create(userData);
} catch (error) {
  if (error.message.includes('Email already exists')) {
    return c.json({ error: 'Email taken' }, 409);
  }
  throw error; // Re-throw unexpected errors
}
```

## Performance Tips

1. **Use Limits**: Always specify `limit` for list operations
2. **Batch Operations**: Use `listUsers()` instead of multiple `findById()`
3. **Index Lookups**: Use `findByEmail()` (O(1)) instead of listing and filtering
4. **Cleanup**: Regularly delete old notifications, completed jobs, expired tokens

## Advanced Usage

### Custom Repository

```typescript
import { BaseRepository, RepositoryOptions } from './base-repository.ts';

interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export class ProductRepository extends BaseRepository<Product> {
  constructor(options: RepositoryOptions = {}) {
    super('Product', options);
  }

  async findByName(name: string): Promise<Product | null> {
    const kv = await this.getKv();
    const products = kv.list<Product>({ prefix: ['products'] });
    
    for await (const entry of products) {
      if (entry.value?.name === name) {
        return entry.value;
      }
    }
    
    return null;
  }

  async createProduct(name: string, price: number): Promise<Product> {
    const product: Product = {
      id: crypto.randomUUID(),
      name,
      price,
      createdAt: new Date().toISOString(),
    };
    
    await this.set(['products', product.id], product);
    return product;
  }
}
```

### Repository Factory (for Testing)

```typescript
import { RepositoryFactory } from './repositories/index.ts';

const kv = await Deno.openKv(':memory:');
const factory = new RepositoryFactory(kv);

const userRepo = factory.createUserRepository();
const tokenRepo = factory.createTokenRepository();

// Use repositories...

await kv.close();
```

## Documentation

- **Full Guide**: `docs/REPOSITORY_PATTERN.md`
- **Agent Recommendations**: `docs/REPOSITORY_PATTERN_AGENT_RECOMMENDATIONS.md`
- **Examples**: `backend/repositories/*.ts`
