# Custom Error Pages

This application includes custom error pages for common HTTP errors, providing a better user experience than default browser error pages.

## Available Error Pages

### 404 - Page Not Found (`404.tsx`)
Displays when a requested page doesn't exist.
- **URL**: `/404`
- **Use case**: Invalid routes, deleted pages
- **Features**: 
  - Helpful suggestions
  - Go back button
  - Link to home page

### 401 - Unauthorized (`401.tsx`)
Displays when authentication is required but not provided.
- **URL**: `/401?return=/protected-page`
- **Use case**: Accessing protected resources without authentication
- **Features**: 
  - Login button (with return URL)
  - Sign up link
  - Password reset link

### 403 - Forbidden (`403.tsx`)
Displays when user lacks permission to access a resource.
- **URL**: `/403?return=/admin`
- **Use case**: Insufficient permissions, role-based access control
- **Features**: 
  - Explanation of why access is denied
  - Login link (for switching accounts)
  - Contact admin link

### 500 - Server Error (`500.tsx`)
Displays when an internal server error occurs.
- **URL**: `/500`
- **Use case**: Unhandled exceptions, server failures
- **Features**: 
  - Error details (development mode only)
  - Refresh page button
  - Error tracking ID
  - Support contact link

### Generic Error Page (`error.tsx`)
Displays custom error messages.
- **URL**: `/error?message=Custom+error&code=ERR001&return=/previous-page`
- **Use case**: Custom error scenarios
- **Features**: 
  - Custom error message
  - Optional error code
  - Return URL support

## Usage in Code

### Import the helpers

```typescript
import {
  redirectTo404,
  redirectTo401,
  redirectTo403,
  redirectTo500,
  redirectToError,
} from "../lib/error-pages.ts";
```

### In Route Handlers

#### 404 - Not Found
```typescript
import { Handlers } from "$fresh/server.ts";
import { redirectTo404 } from "../../lib/error-pages.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const item = await findItem(id);
    
    if (!item) {
      return redirectTo404();
    }
    
    return ctx.render({ item });
  },
};
```

#### 401 - Unauthorized
```typescript
import { Handlers } from "$fresh/server.ts";
import { redirectTo401 } from "../../lib/error-pages.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const user = ctx.state.user;
    
    if (!user) {
      // Redirect to login with return URL
      return redirectTo401(req.url);
    }
    
    return ctx.render({ user });
  },
};
```

#### 403 - Forbidden
```typescript
import { Handlers } from "$fresh/server.ts";
import { redirectTo403 } from "../../lib/error-pages.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const user = ctx.state.user;
    
    if (user.role !== 'admin') {
      return redirectTo403(req.url);
    }
    
    return ctx.render({ user });
  },
};
```

#### 500 - Server Error
```typescript
import { Handlers } from "$fresh/server.ts";
import { redirectTo500 } from "../../lib/error-pages.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const data = await riskyOperation();
      return ctx.render({ data });
    } catch (error) {
      // Log error and redirect
      return redirectTo500(error as Error);
    }
  },
};
```

#### Custom Error
```typescript
import { Handlers } from "$fresh/server.ts";
import { redirectToError } from "../../lib/error-pages.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const result = await processPayment();
    
    if (result.error) {
      return redirectToError(
        "Payment processing failed. Please try again.",
        "PAYMENT_ERROR",
        "/checkout"
      );
    }
    
    return new Response(null, {
      status: 302,
      headers: { Location: "/success" },
    });
  },
};
```

### In Middleware

```typescript
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { redirectTo401 } from "../lib/error-pages.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext
) {
  const token = req.headers.get("Authorization");
  
  if (!token) {
    return redirectTo401(req.url);
  }
  
  // Verify token and set user in state
  const user = await verifyToken(token);
  ctx.state.user = user;
  
  return ctx.next();
}
```

## API Error Responses

For API endpoints, use `errorResponse()` instead of redirecting:

```typescript
import { Handlers } from "$fresh/server.ts";
import { errorResponse } from "../../lib/error-pages.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const data = await req.json();
    
    if (!data.email) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Email is required",
        400
      );
    }
    
    // Process request...
  },
};
```

## Design System

All error pages use:
- **Consistent layout**: Centered card with gradient background
- **Large error codes**: 9xl font with gradient text
- **Helpful icons**: SVG icons matching the error type
- **Actionable suggestions**: Clear steps users can take
- **Branded colors**: Using theme colors from `siteConfig`
- **Responsive design**: Mobile-first approach
- **Accessibility**: Proper heading hierarchy, keyboard navigation

### Color Schemes

- **404**: Blue to Purple gradient (not found, exploratory)
- **401**: Purple to Pink gradient (authentication, identity)
- **403**: Orange to Yellow gradient (warning, caution)
- **500**: Red to Orange gradient (error, critical)
- **Generic**: Red to Orange gradient (general errors)

## Customization

To customize error pages:

1. **Update branding**: Site name pulls from `siteConfig.site.name`
2. **Change colors**: Modify gradient classes in each `_*.tsx` file
3. **Add logging**: Integrate error tracking service in helpers
4. **Custom messages**: Update text in each error page component
5. **Add features**: Contact forms, search, breadcrumbs, etc.

## Testing

To test error pages locally:

```bash
# Start dev server
deno task dev

# Visit error pages directly:
http://localhost:3000/_404
http://localhost:3000/_401
http://localhost:3000/_403
http://localhost:3000/_500
http://localhost:3000/error?message=Test+error&code=TEST123

# Or trigger them in your routes
```

## Best Practices

1. **Always provide context**: Include error messages and codes
2. **Preserve return URLs**: Allow users to return to where they were
3. **Log server errors**: Use `redirectTo500()` to log before redirecting
4. **API vs Pages**: Use `errorResponse()` for APIs, redirects for pages
5. **Development vs Production**: Show error details only in dev mode
6. **User-friendly messages**: Avoid technical jargon in error messages
7. **Provide actions**: Always give users something they can do next

## Fresh Error Handling

Fresh automatically shows 404 errors for unknown routes. To provide a better experience:
- Our custom `/404` page can be used via redirects
- Use the helper functions to redirect to custom error pages
- The error pages follow Fresh's file-based routing (`404.tsx`, `401.tsx`, etc.)

## Future Enhancements

Potential improvements:
- Error tracking integration (Sentry, Rollbar)
- Custom 503 (Service Unavailable) page
- Animated illustrations for each error type
- Error search/help functionality
- Multi-language support
- Error page analytics
