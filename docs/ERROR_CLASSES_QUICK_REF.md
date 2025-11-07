# Error Classes Quick Reference

## Import

```typescript
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
  getUserMessage,
  isOperationalError,
  logAppError,
  toAppError,
} from './lib/errors.ts';
```

## Quick Examples

### Authentication
```typescript
throw new AuthenticationError('No token', 'missing_token');
```

### Authorization
```typescript
throw new AuthorizationError('Admin required', 'admin', user.role);
```

### Validation
```typescript
throw new ValidationError('Invalid', {
  email: ['Required', 'Must be valid'],
  password: ['Min 8 chars']
});
```

### Not Found
```typescript
throw new NotFoundError('User not found', 'User', '123');
```

### Conflict
```typescript
throw new ConflictError('Email exists', 'email', 'test@example.com');
```

### Rate Limit
```typescript
throw new RateLimitError('Too many requests', 60, 5);
```

### Network
```typescript
throw new NetworkError('Connection failed', url, 'GET');
```

### Service Unavailable
```typescript
throw new ServiceUnavailableError('DB down', 'Database', 300);
```

### Internal Server Error
```typescript
throw new InternalServerError('Unexpected error');
```

### Bad Request
```typescript
throw new BadRequestError('Invalid JSON');
```

## Utility Functions

```typescript
// Convert any error to AppError
const appError = toAppError(error);

// Get user-friendly message
const message = getUserMessage(error);

// Check if operational
if (isOperationalError(error)) { /* ... */ }

// Log with context
logAppError(error, { userId: '123' });
```

## In Route Handlers

```typescript
export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    // Just throw - withErrorHandler handles everything
    if (!token) {
      throw new AuthenticationError('Missing token', 'missing_token');
    }
    
    if (!hasRole(user.role, 'admin')) {
      throw new AuthorizationError('Admin required', 'admin', user.role);
    }
    
    // Errors from handleApiFetch are already AppError
    const { data, error } = await handleApiFetch(url);
    if (error) {
      throw error; // or render with getUserMessage(error)
    }
  }),
};
```

## Error Properties

| Class | Status | Code | Special Properties |
|-------|--------|------|-------------------|
| ValidationError | 400 | VALIDATION_ERROR | fields |
| AuthenticationError | 401 | AUTHENTICATION_ERROR | reason |
| AuthorizationError | 403 | AUTHORIZATION_ERROR | requiredRole, userRole |
| NotFoundError | 404 | NOT_FOUND | resourceType, resourceId |
| ConflictError | 409 | CONFLICT | conflictField, conflictValue |
| RateLimitError | 429 | RATE_LIMIT_EXCEEDED | retryAfter, limit |
| InternalServerError | 500 | INTERNAL_SERVER_ERROR | - |
| ServiceUnavailableError | 503 | SERVICE_UNAVAILABLE | serviceName, retryAfter |
| NetworkError | 503 | NETWORK_ERROR | url, method |
| BadRequestError | 400 | BAD_REQUEST | - |

## User Messages

All error classes have smart `toUserMessage()` methods that provide user-friendly messages based on error type and context.

```typescript
const error = new AuthenticationError('Bad token', 'expired_token');
console.log(error.toUserMessage());
// "Your session has expired. Please log in again."

const error2 = new NotFoundError('Missing', 'User', '123');
console.log(error2.toUserMessage());
// "User with ID 123 not found."
```
