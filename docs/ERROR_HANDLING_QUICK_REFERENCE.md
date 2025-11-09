# Error Handling Quick Reference

Quick guide for implementing error handling in routes and services.

## 🎯 TL;DR

**In Routes**: Use `withErrorHandler()` wrapper, throw typed errors
**In Services**: Throw typed errors from `frontend/lib/errors.ts`
**Never**: Manual try-catch or `errorResponse()` calls in routes

## Route Pattern

### ✅ Correct Pattern
```typescript
import {
  successResponse,
  withErrorHandler,
  requireUser,
  type AppState
} from "../lib/fresh-helpers.ts";
import { NotFoundError, BadRequestError } from "../lib/errors.ts";

export const handler: Handlers<unknown, AppState> = {
  GET: withErrorHandler(async (req, ctx) => {
    const user = requireUser(ctx);  // Throws AuthenticationError if not logged in

    const item = await repo.findById(itemId);
    if (!item) {
      throw new NotFoundError(undefined, 'Item', itemId);
    }

    return successResponse(item);
  })
};
```

## Service Pattern

### ✅ Correct Pattern
```typescript
import { NotFoundError, ConflictError, BadRequestError } from "../../frontend/lib/errors.ts";
import { ErrorCode } from "../lib/error-codes.ts";

export class YourService {
  async findById(id: string) {
    const item = await this.repo.findById(id);

    if (!item) {
      throw new NotFoundError(undefined, 'Item', id);
    }

    return item;
  }

  async create(data: CreateData) {
    // Check for duplicates
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(undefined, 'email', data.email);
    }

    // Validate business rules
    if (data.age < 18) {
      throw new BadRequestError("Must be 18 or older");
    }

    return await this.repo.create(data);
  }
}
```

## Available Error Classes

| Error Class | When to Use | Example |
|-------------|-------------|---------|
| `NotFoundError` | Resource doesn't exist | `throw new NotFoundError(undefined, 'User', userId)` |
| `BadRequestError` | Invalid request/input | `throw new BadRequestError("Invalid date format")` |
| `ValidationError` | Field validation fails | `throw new ValidationError(undefined, { email: ["Invalid"] })` |
| `AuthenticationError` | Auth fails | `throw new AuthenticationError(ErrorCode.INVALID_CREDENTIALS)` |
| `AuthorizationError` | No permission | `throw new AuthorizationError("Admin required", "admin", user.role)` |
| `ConflictError` | Duplicate resource | `throw new ConflictError(undefined, 'email', email)` |
| `RateLimitError` | Too many requests | `throw new RateLimitError(undefined, 60, 100)` |
| `InternalServerError` | Unexpected error | `throw new InternalServerError("Database connection failed")` |

## Common Patterns

### Pattern 1: Resource Not Found
```typescript
const user = await userRepo.findById(userId);
if (!user) {
  throw new NotFoundError(undefined, 'User', userId);
}
```

### Pattern 2: Validation
```typescript
if (!email.includes('@')) {
  throw new ValidationError(undefined, { email: ["Invalid email format"] });
}

// Or with Zod (automatic validation)
const data = await parseJsonBody(req, UserSchema);
// Zod errors automatically converted to ValidationError
```

### Pattern 3: Authorization
```typescript
const user = requireUser(ctx);  // Throws AuthenticationError
const admin = requireAdmin(ctx);  // Throws AuthorizationError

// Custom permission check
if (resource.ownerId !== user.sub) {
  throw new AuthorizationError("You can only edit your own resources");
}
```

### Pattern 4: Business Rule Violation
```typescript
if (order.status === 'completed') {
  throw new BadRequestError("Cannot modify completed orders");
}

if (user.balance < amount) {
  throw new BadRequestError("Insufficient balance");
}
```

### Pattern 5: Duplicate Prevention
```typescript
const existing = await repo.findByEmail(email);
if (existing) {
  throw new ConflictError(undefined, 'email', email);
}
```

### Pattern 6: Rate Limiting
```typescript
if (requestCount > limit) {
  throw new RateLimitError(undefined, 60, limit);
}
```

## Error Response Format

All errors are automatically formatted to:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with ID abc123 not found.",
    "details": {
      "resourceType": "User",
      "resourceId": "abc123"
    }
  }
}
```

## Imports Cheatsheet

```typescript
// Typed errors
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  RateLimitError,
  InternalServerError
} from "../../frontend/lib/errors.ts";

// Error codes (optional, errors have default messages)
import { ErrorCode } from "../../shared/lib/error-codes.ts";

// Route helpers
import {
  successResponse,
  withErrorHandler,
  requireUser,
  requireAdmin,
  parseJsonBody,
  type AppState
} from "../../lib/fresh-helpers.ts";
```

## Migration Checklist

When migrating a route:

- [ ] Add `withErrorHandler` import
- [ ] Add typed error imports (NotFoundError, BadRequestError, etc.)
- [ ] Wrap handler with `withErrorHandler(async (req, ctx) => { ... })`
- [ ] Replace `errorResponse()` calls with `throw new XxxError()`
- [ ] Remove try-catch blocks
- [ ] Remove manual error handling logic
- [ ] Test all error scenarios

## Common Mistakes

### ❌ Mistake 1: Using generic Error
```typescript
throw new Error("User not found");  // Don't do this
```
✅ Use typed error:
```typescript
throw new NotFoundError(undefined, 'User', userId);
```

### ❌ Mistake 2: Returning error response
```typescript
return errorResponse("BAD_REQUEST", "Invalid input", 400);  // Don't do this
```
✅ Throw typed error:
```typescript
throw new BadRequestError("Invalid input");
```

### ❌ Mistake 3: Manual try-catch in routes
```typescript
try {
  const result = await service.method();
  return successResponse(result);
} catch (error) {
  return errorResponse("ERROR", "Failed", 500);
}
```
✅ Let withErrorHandler handle it:
```typescript
const result = await service.method();  // Just throws on error
return successResponse(result);
```

### ❌ Mistake 4: Catching and re-throwing
```typescript
try {
  await service.method();
} catch (error) {
  throw new InternalServerError("Something failed");
}
```
✅ Let the service error propagate:
```typescript
await service.method();  // Service throws typed errors
```

## Testing Error Handling

```typescript
import { assertRejects } from '@std/assert';
import { NotFoundError } from '../../frontend/lib/errors.ts';

describe('YourService', () => {
  it('should throw NotFoundError when item not found', async () => {
    await assertRejects(
      () => service.findById('nonexistent'),
      NotFoundError,
      'Item with ID nonexistent not found'
    );
  });
});
```

## Questions?

- See agent instructions: `.claude/agents/_full/backend-agent.md`
- See error codes: `shared/lib/error-codes.ts`
- See error classes: `frontend/lib/errors.ts`
