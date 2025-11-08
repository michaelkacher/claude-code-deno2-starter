# Custom Error Pages - Quick Reference

## Files Created

### Error Page Components
- ✅ `frontend/routes/404.tsx` - Page Not Found (updated)
- ✅ `frontend/routes/401.tsx` - Unauthorized (new)
- ✅ `frontend/routes/403.tsx` - Forbidden (new)
- ✅ `frontend/routes/500.tsx` - Server Error (new)
- ✅ `frontend/routes/error.tsx` - Generic Error (updated)

### Utilities
- ✅ `frontend/lib/error-pages.ts` - Helper functions for redirecting to error pages

### Documentation
- ✅ `docs/ERROR_PAGES.md` - Complete usage guide

## Quick Usage

```typescript
// In your route handlers
import { 
  redirectTo404, 
  redirectTo401, 
  redirectTo403, 
  redirectTo500 
} from "../lib/error-pages.ts";

// Not found
if (!resource) {
  return redirectTo404();
}

// Not authenticated
if (!user) {
  return redirectTo401(req.url);
}

// No permission
if (user.role !== 'admin') {
  return redirectTo403(req.url);
}

// Server error
try {
  // ...
} catch (error) {
  return redirectTo500(error as Error);
}
```

## Test the Error Pages

Visit these URLs in your browser:
- http://localhost:3000/404
- http://localhost:3000/401
- http://localhost:3000/403
- http://localhost:3000/500
- http://localhost:3000/error?message=Test+error&code=TEST

Use the helper functions to redirect to these pages from your route handlers.

## Design Features

- Modern gradient backgrounds (unique color per error type)
- Large, readable error codes (9xl font)
- Helpful suggestions and next steps
- Responsive design (mobile-first)
- Branded with site name from config
- Consistent card-based layout
- Clear call-to-action buttons

## Next Steps

1. Test each error page in development
2. Customize messages/colors as needed
3. Integrate error tracking service (optional)
4. Add custom illustrations (optional)
5. Set up error logging/monitoring
