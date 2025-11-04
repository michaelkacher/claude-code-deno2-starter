# Admin Panel Cookie Fix

## Issue

When logged in as an admin user and clicking the "Admin Panel" button, the page redirected to the login page instead of showing the admin panel. Attempting to log in again hit rate limits.

## Root Cause

**Cookie name mismatch**: The authentication system uses `auth_token` as the cookie name, but the admin panel was looking for a cookie named `token`.

## Affected Files

1. **`frontend/routes/admin/users.tsx`** (server-side handler)
   - Was checking for `token=` cookie
   - Should check for `auth_token=` cookie

2. **`frontend/islands/AdminUserTable.tsx`** (client-side island)
   - `getToken()` function was looking for `token=` cookie
   - Should look for `auth_token=` cookie

3. **Logout button** in admin page
   - Was clearing wrong cookie name
   - Should clear `auth_token` and localStorage

## Fix Applied

### Changed in `frontend/routes/admin/users.tsx`

**Before:**
```typescript
const token = req.headers.get('cookie')?.split('; ')
  .find((c) => c.startsWith('token='))
  ?.split('=')[1];
```

**After:**
```typescript
const token = req.headers.get('cookie')?.split('; ')
  .find((c) => c.startsWith('auth_token='))
  ?.split('=')[1];
```

### Changed in `frontend/islands/AdminUserTable.tsx`

**Before:**
```typescript
const getToken = () => {
  const token = document.cookie.split('; ')
    .find((c) => c.startsWith('token='))
    ?.split('=')[1];
  return token;
};
```

**After:**
```typescript
const getToken = () => {
  const token = document.cookie.split('; ')
    .find((c) => c.startsWith('auth_token='))
    ?.split('=')[1];
  return token;
};
```

### Changed logout button in `frontend/routes/admin/users.tsx`

**Before:**
```tsx
<button
  onClick="document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; window.location.href = '/login';"
  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
>
  Logout
</button>
```

**After:**
```tsx
<button
  onClick="document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; localStorage.clear(); window.location.href = '/login';"
  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
>
  Logout
</button>
```

## Testing the Fix

1. **Clear browser data** (to remove any stale state):
   - Open DevTools → Application → Storage → Clear site data
   - Or use incognito/private window

2. **Log in** as admin:
   ```
   Email: test@example.com
   Password: password123
   ```

3. **Click "Admin Panel"** button in navigation

4. **Verify** you see the admin dashboard with user statistics and table

## Prevention

To prevent similar issues in the future:

1. **Centralize cookie names** in a constants file
2. **Use a helper function** for cookie operations
3. **Add integration tests** that verify cookie handling

### Recommended: Create cookie utilities

```typescript
// frontend/lib/cookies.ts
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export function getCookie(name: string): string | null {
  const value = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`))
    ?.split('=')[1];
  return value || null;
}

export function setCookie(name: string, value: string, days: number = 7) {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
}
```

Then use throughout the app:
```typescript
import { COOKIE_NAMES, getCookie } from '@/lib/cookies.ts';

// Instead of: document.cookie.split('; ').find(...)
const token = getCookie(COOKIE_NAMES.AUTH_TOKEN);
```

## Related Files

- `frontend/islands/LoginForm.tsx` - Sets `auth_token` cookie on login
- `frontend/islands/SignupForm.tsx` - Sets `auth_token` cookie on signup
- `frontend/islands/AuthBanner.tsx` - Clears `auth_token` cookie on logout
- All use the correct `auth_token` name consistently

## Status

✅ **Fixed**: All admin panel components now use correct `auth_token` cookie name
✅ **Tested**: Admin panel accessible after fix
✅ **Documented**: Added admin panel section to README.md
