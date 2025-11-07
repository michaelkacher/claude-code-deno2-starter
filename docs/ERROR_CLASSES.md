# Custom Error Classes

## Overview

This application implements a comprehensive error class hierarchy for type-safe, structured error handling. All custom errors extend from a base `AppError` class, providing consistent error behavior and better error reporting.

## Error Class Hierarchy

```
Error (Native JavaScript)
  └── AppError (Base Application Error)
        ├── ValidationError
        ├── AuthenticationError
        ├── AuthorizationError
        ├── NotFoundError
        ├── ConflictError
        ├── RateLimitError
        ├── NetworkError
        ├── ServiceUnavailableError
        ├── InternalServerError
        └── BadRequestError
```

## Base Class: AppError

All custom errors inherit from `AppError`, which provides:

```typescript
class AppError extends Error {
  code: string;              // Error code (e.g., 'VALIDATION_ERROR')
  statusCode: number;        // HTTP status code (e.g., 400)
  isOperational: boolean;    // Whether error is expected/operational
  timestamp: string;         // ISO timestamp when error occurred
  context?: Record<string, unknown>; // Additional context data
}
```

### Methods

- `toJSON()` - Serialize error for logging or API responses
- `toUserMessage()` - Get user-friendly error message

### Example

```typescript
const error = new AppError(
  'Something went wrong',
  'APP_ERROR',
  500,
  true,
  { userId: '123' }
);

console.log(error.toJSON());
// {
//   name: 'AppError',
//   code: 'APP_ERROR',
//   message: 'Something went wrong',
//   statusCode: 500,
//   timestamp: '2025-11-06T...',
//   context: { userId: '123' }
// }
```

## Error Classes

### 1. ValidationError

For input validation failures.

```typescript
throw new ValidationError(
  'Invalid input data',
  {
    email: ['Email is required', 'Email must be valid'],
    password: ['Password must be at least 8 characters']
  },
  { userId: user.id }
);
```

**Properties:**
- `fields?` - Map of field names to validation error messages
- `statusCode` - 400
- `code` - 'VALIDATION_ERROR'

**User Message:**
```
"Validation failed: email: Email is required, Email must be valid; password: Password must be at least 8 characters"
```

### 2. AuthenticationError

For authentication failures (missing or invalid credentials).

```typescript
throw new AuthenticationError(
  'Invalid credentials',
  'invalid_token',
  { attemptedEmail: 'user@example.com' }
);
```

**Properties:**
- `reason?` - 'missing_token' | 'invalid_token' | 'expired_token' | 'revoked_token'
- `statusCode` - 401
- `code` - 'AUTHENTICATION_ERROR'

**User Messages:**
- `expired_token`: "Your session has expired. Please log in again."
- `invalid_token`: "Invalid authentication. Please log in again."
- `revoked_token`: "Your session has been revoked. Please log in again."
- `missing_token`: "Please log in to access this resource."

### 3. AuthorizationError

For permission/role-based access denials.

```typescript
throw new AuthorizationError(
  'Admin access required',
  'admin',
  'user',
  { attemptedAction: 'delete_user' }
);
```

**Properties:**
- `requiredRole?` - Required role(s) for access
- `userRole?` - User's actual role
- `statusCode` - 403
- `code` - 'AUTHORIZATION_ERROR'

**User Message:**
```
"You need admin role to access this resource."
```

### 4. NotFoundError

For missing resources.

```typescript
throw new NotFoundError(
  'User not found',
  'User',
  'user-123',
  { requestedBy: 'admin-456' }
);
```

**Properties:**
- `resourceType?` - Type of resource (e.g., 'User', 'Post')
- `resourceId?` - ID of missing resource
- `statusCode` - 404
- `code` - 'NOT_FOUND'

**User Message:**
```
"User with ID user-123 not found."
```

### 5. ConflictError

For conflicts with existing data (e.g., duplicate email).

```typescript
throw new ConflictError(
  'Email already exists',
  'email',
  'user@example.com'
);
```

**Properties:**
- `conflictField?` - Field causing conflict
- `conflictValue?` - Value causing conflict
- `statusCode` - 409
- `code` - 'CONFLICT'

**User Message:**
```
"A resource with this email already exists."
```

### 6. RateLimitError

For rate limit violations.

```typescript
throw new RateLimitError(
  'Too many login attempts',
  60,
  5,
  { ip: '192.168.1.1' }
);
```

**Properties:**
- `retryAfter?` - Seconds until retry allowed
- `limit?` - Rate limit threshold
- `statusCode` - 429
- `code` - 'RATE_LIMIT_EXCEEDED'

**User Message:**
```
"Too many requests. Please try again in 60 seconds."
```

### 7. NetworkError

For network/connectivity failures.

```typescript
throw new NetworkError(
  'Failed to connect to API',
  'https://api.example.com',
  'GET'
);
```

**Properties:**
- `url?` - URL that failed
- `method?` - HTTP method
- `statusCode` - 503
- `code` - 'NETWORK_ERROR'

**User Message:**
```
"Unable to connect to the server. Please check your connection and try again."
```

### 8. ServiceUnavailableError

For temporarily unavailable services.

```typescript
throw new ServiceUnavailableError(
  'Database is down',
  'Database',
  300
);
```

**Properties:**
- `serviceName?` - Name of unavailable service
- `retryAfter?` - Seconds until service may be available
- `statusCode` - 503
- `code` - 'SERVICE_UNAVAILABLE'

**User Message:**
```
"Database is temporarily unavailable. Please try again later."
```

### 9. InternalServerError

For unexpected server errors.

```typescript
throw new InternalServerError(
  'Unexpected error',
  { stack: error.stack }
);
```

**Properties:**
- `statusCode` - 500
- `code` - 'INTERNAL_SERVER_ERROR'
- `isOperational` - false (critical error)

**User Message:**
```
"An unexpected error occurred. Our team has been notified."
```

### 10. BadRequestError

For malformed requests.

```typescript
throw new BadRequestError(
  'Invalid JSON in request body'
);
```

**Properties:**
- `statusCode` - 400
- `code` - 'BAD_REQUEST'

## Utility Functions

### toAppError(error: unknown): AppError

Convert any error to an AppError instance.

```typescript
try {
  // some operation
} catch (error) {
  const appError = toAppError(error);
  console.log(appError.code, appError.statusCode);
}
```

### isOperationalError(error: Error): boolean

Check if an error is operational (expected).

```typescript
if (isOperationalError(error)) {
  // Handle gracefully
} else {
  // Critical error - alert team
}
```

### getUserMessage(error: unknown): string

Extract user-friendly message from any error.

```typescript
const message = getUserMessage(error);
// Always returns a safe, user-friendly string
```

### logAppError(error: AppError, context?): void

Log error with appropriate severity level.

```typescript
logAppError(error, { endpoint: '/api/users' });
// Logs as warning if operational, error if critical
```

## Usage in Route Handlers

### Throwing Custom Errors

```typescript
export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    const token = extractAuthToken(req);
    
    // Throw authentication error
    if (!token) {
      throw new AuthenticationError(
        'No token provided',
        'missing_token'
      );
    }
    
    // Throw authorization error
    if (!hasRole(user.role, 'admin')) {
      throw new AuthorizationError(
        'Admin access required',
        'admin',
        user.role
      );
    }
    
    // Throw validation error
    if (!data.email) {
      throw new ValidationError(
        'Validation failed',
        { email: ['Email is required'] }
      );
    }
    
    // Errors are automatically caught and handled by withErrorHandler
  }),
};
```

### Handling API Errors

```typescript
const { data, error } = await handleApiFetch<User>(url, options);

if (error) {
  // error is already an AppError instance
  logError(error, { context: 'fetch_user' });
  
  // Throw to trigger redirect/response
  if (error instanceof AuthenticationError) {
    throw error;
  }
  
  // Or render with user-friendly message
  return ctx.render({
    data: null,
    error: getUserMessage(error)
  });
}
```

## Integration with withErrorHandler

The `withErrorHandler` wrapper automatically:

1. **Catches** all thrown errors
2. **Converts** to AppError if needed (via `toAppError`)
3. **Logs** with appropriate level (via `logAppError`)
4. **Redirects** authentication/authorization errors to login
5. **Returns** JSON error responses with user-friendly messages

```typescript
export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    // Your code here
    // Any thrown error is automatically handled
    throw new NotFoundError('User not found', 'User', '123');
    // → Logged, converted to JSON response, sent with 404 status
  }),
};
```

## Error Response Format

All errors are converted to a consistent JSON format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User with ID 123 not found.",
    "details": {
      "resourceType": "User",
      "resourceId": "123"
    }
  },
  "timestamp": "2025-11-06T12:34:56.789Z"
}
```

## Best Practices

### 1. Use Specific Error Types

```typescript
// ❌ Generic
throw new Error('User not found');

// ✅ Specific
throw new NotFoundError('User not found', 'User', userId);
```

### 2. Provide Context

```typescript
throw new AuthorizationError(
  'Admin required',
  'admin',
  user.role,
  {
    userId: user.id,
    attemptedAction: 'delete_user',
    targetUserId: targetId
  }
);
```

### 3. Use Type Guards

```typescript
if (error instanceof AuthenticationError) {
  // Handle authentication specifically
} else if (error instanceof ValidationError) {
  // Handle validation specifically
}
```

### 4. Let withErrorHandler Handle Redirects

```typescript
// ❌ Manual redirect
if (!token) {
  return redirectToLogin(...);
}

// ✅ Throw and let withErrorHandler handle it
if (!token) {
  throw new AuthenticationError('Missing token', 'missing_token');
}
```

### 5. Log Errors with Context

```typescript
try {
  await dangerousOperation();
} catch (error) {
  const appError = toAppError(error);
  logAppError(appError, {
    userId: user.id,
    operation: 'delete',
    targetId: id
  });
  throw appError;
}
```

## Testing Errors

```typescript
import { assertEquals } from '$std/testing/asserts.ts';
import { NotFoundError, getUserMessage } from './errors.ts';

Deno.test('NotFoundError provides correct message', () => {
  const error = new NotFoundError('Test', 'User', '123');
  
  assertEquals(error.code, 'NOT_FOUND');
  assertEquals(error.statusCode, 404);
  assertEquals(error.resourceType, 'User');
  assertEquals(error.resourceId, '123');
  assertEquals(
    error.toUserMessage(),
    'User with ID 123 not found.'
  );
});

Deno.test('getUserMessage handles any error', () => {
  const message1 = getUserMessage(new Error('test'));
  const message2 = getUserMessage('string');
  const message3 = getUserMessage(null);
  
  // All return safe messages
  assertEquals(typeof message1, 'string');
  assertEquals(typeof message2, 'string');
  assertEquals(typeof message3, 'string');
});
```

## Migration from Legacy Errors

### Before
```typescript
if (!user) {
  return createErrorResponse(
    'NOT_FOUND',
    'User not found',
    404
  );
}
```

### After
```typescript
if (!user) {
  throw new NotFoundError('User not found', 'User', userId);
}
```

## Performance Considerations

- Error creation is lightweight (< 1ms)
- Stack traces captured only when needed
- Context data is optional
- Serialization (toJSON) is lazy

## Security Considerations

- Stack traces hidden in production
- Sensitive data should not be in context
- User messages are always safe for display
- Internal details logged but not exposed
