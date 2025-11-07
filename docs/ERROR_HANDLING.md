# Error Handling Guide

## Overview

This application implements comprehensive error handling for route handlers to provide a consistent, secure, and user-friendly error experience.

## Error Handler Utilities

Located in `frontend/lib/error-handler.ts`, the error handling utilities provide:

### Core Functions

#### `withErrorHandler(handler)`
Wraps async route handlers with automatic try-catch error handling.

```typescript
export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    // Your route logic here
    // Errors are automatically caught and handled
  }),
};
```

#### `handleApiFetch<T>(url, options)`
Safe API fetch with automatic error handling and type safety.

```typescript
const { data, error } = await handleApiFetch<User>(
  `${apiUrl}/auth/me`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

if (error) {
  // Handle error
  return ctx.render({ user: null, error });
}

// Use data safely
return ctx.render({ user: data });
```

#### `extractAuthToken(req)`
Safely extract auth token from either Authorization header or cookies.

```typescript
const token = extractAuthToken(req);
if (!token) {
  return redirectToLogin(pathname, 'auth_required');
}
```

#### `redirectToLogin(redirectUrl, reason?)`
Create consistent login redirects with optional reason.

```typescript
return redirectToLogin('/profile', 'session_expired');
```

#### `redirectToError(message, returnUrl?)`
Redirect to error page with message and return URL.

```typescript
return redirectToError('Failed to load data', '/dashboard');
```

#### `logError(error, context?)`
Structured error logging with context.

```typescript
logError(new Error('Failed to fetch'), {
  userId: user.id,
  endpoint: '/api/data',
});
```

#### `hasRole(userRole, requiredRole)`
Check if user has required role(s).

```typescript
if (!hasRole(user.role, 'admin')) {
  return redirectToLogin(pathname, 'insufficient_permissions');
}

// Or check multiple roles
if (!hasRole(user.role, ['admin', 'moderator'])) {
  // ...
}
```

### Error Codes

Standard error codes for consistent error handling:

```typescript
const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};
```

## Implementation Examples

### Basic Route Handler with Error Handling

```typescript
import { Handlers, PageProps } from "$fresh/server.ts";
import {
  extractAuthToken,
  handleApiFetch,
  redirectToLogin,
  withErrorHandler,
} from "../lib/error-handler.ts";

export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    const token = extractAuthToken(req);
    
    if (!token) {
      return redirectToLogin(new URL(req.url).pathname);
    }

    const apiUrl = Deno.env.get('API_URL') || 'http://localhost:8000/api';
    
    const { data, error } = await handleApiFetch<YourDataType>(
      `${apiUrl}/your-endpoint`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (error) {
      return ctx.render({ data: null, error });
    }

    return ctx.render({ data });
  }),
};
```

### Admin Route with Role Check

```typescript
export const handler: Handlers<AdminData> = {
  GET: withErrorHandler(async (req, ctx) => {
    const user = ctx.state.user;
    const token = ctx.state.token;

    if (!hasRole(user?.role, 'admin')) {
      logError(new Error('Unauthorized admin access'), {
        userId: user?.id,
        email: user?.email,
      });
      return redirectToLogin(new URL(req.url).pathname, 'insufficient_permissions');
    }

    // Admin-only logic here
  }),
};
```

### Parallel API Calls with Error Handling

```typescript
const [usersResult, statsResult] = await Promise.all([
  handleApiFetch<UsersData>(`${apiUrl}/admin/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }),
  handleApiFetch<StatsData>(`${apiUrl}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }),
]);

if (usersResult.error || statsResult.error) {
  logError(new Error('Failed to fetch admin data'), {
    usersError: usersResult.error,
    statsError: statsResult.error,
  });
  
  return ctx.render({
    ...defaultData,
    error: 'Failed to load admin data',
  });
}

// Both successful
return ctx.render({
  users: usersResult.data,
  stats: statsResult.data,
});
```

## Error Page

The application includes a dedicated error page at `/error` that displays user-friendly error messages.

Query parameters:
- `message`: Error message to display
- `return`: URL to return to

Example:
```
/error?message=Failed+to+load+data&return=/dashboard
```

## Best Practices

### 1. Always Use withErrorHandler
Wrap all route handlers with `withErrorHandler` to catch unexpected errors:

```typescript
export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    // Your logic
  }),
};
```

### 2. Use handleApiFetch for API Calls
Always use `handleApiFetch` instead of raw `fetch`:

```typescript
// ❌ Don't
const response = await fetch(url);
const data = await response.json();

// ✅ Do
const { data, error } = await handleApiFetch(url, options);
```

### 3. Log Errors with Context
Always provide context when logging errors:

```typescript
logError(error, {
  userId: user.id,
  action: 'delete_user',
  endpoint: url,
});
```

### 4. Handle Errors in UI
Always check for and display errors in your components:

```typescript
export default function Page({ data }: PageProps<Data>) {
  const { error } = data;

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  // Normal rendering
}
```

### 5. Provide Fallback Data
Define default/fallback data for error scenarios:

```typescript
const defaultData = {
  users: [],
  stats: { total: 0 },
};

if (error) {
  return ctx.render({ ...defaultData, error });
}
```

## Testing Error Handling

### Test Invalid Token
```bash
curl http://localhost:3000/profile \
  -H "Cookie: auth_token=invalid"
```

### Test Network Error
Stop the backend server and try accessing protected routes.

### Test Missing Permissions
Try accessing admin routes with a non-admin user.

## Security Considerations

1. **Never Expose Sensitive Error Details**: The error handler automatically hides stack traces and internal details in production
2. **Log All Security-Related Errors**: Always log unauthorized access attempts
3. **Use Consistent Error Responses**: Use the standard error codes and response format
4. **Validate All Inputs**: Use `validateRequired()` for input validation
5. **Rate Limit Error-Prone Endpoints**: Consider rate limiting login, signup, etc.

## Migration Guide

To migrate existing route handlers:

1. Import error handler utilities:
```typescript
import {
  withErrorHandler,
  handleApiFetch,
  extractAuthToken,
  redirectToLogin,
  logError,
} from "../lib/error-handler.ts";
```

2. Wrap handler with `withErrorHandler`:
```typescript
export const handler: Handlers<Data> = {
  GET: withErrorHandler(async (req, ctx) => {
    // existing logic
  }),
};
```

3. Replace `fetch` with `handleApiFetch`:
```typescript
const { data, error } = await handleApiFetch(url, options);
if (error) {
  return ctx.render({ data: null, error });
}
```

4. Add error handling to page components:
```typescript
if (data.error) {
  return <ErrorDisplay />;
}
```

## Future Enhancements

- [ ] Error reporting/monitoring integration
- [ ] Rate limiting for error-prone endpoints
- [ ] Automated retry logic for network errors
- [ ] Client-side error boundary components
- [ ] Error metrics and analytics
