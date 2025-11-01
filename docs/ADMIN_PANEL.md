# Admin Panel Documentation

Complete guide to the admin panel for user management.

## Overview

The admin panel provides a web-based interface for administrators to manage users, view statistics, and perform administrative tasks.

**Location**: `/admin/users`

**Access**: Only users with `role: 'admin'` can access the admin panel. Non-admin users are redirected to the home page.

---

## Features

### 1. Dashboard Statistics

Real-time statistics displayed at the top of the admin panel:

- **Total Users**: Total number of registered users
- **Verified**: Number of users with verified emails (with verification rate percentage)
- **Admins**: Number of users with admin role
- **Recent (24h)**: Number of new signups in the last 24 hours

### 2. User Table

Interactive table displaying all registered users with the following columns:

- **User**: Name, email, and user ID (first 8 characters)
- **Role**: Admin or User badge
- **Email Status**: Verified or Unverified badge
- **Created**: Registration date and time
- **Actions**: Management buttons

### 3. Filtering & Search

- **Search**: Filter by name, email, or user ID
- **Role Filter**: Show all, only users, or only admins
- **Email Status Filter**: Show all, only verified, or only unverified
- **Pagination**: Navigate through pages (50 users per page by default)

### 4. User Management Actions

#### Promote/Demote Role
- **Button**: ↑ (up arrow) to promote, ↓ (down arrow) to demote
- **Action**: Toggle between 'admin' and 'user' roles
- **Restriction**: Cannot change your own role

#### Verify Email
- **Button**: ✓ (checkmark)
- **Action**: Manually verify a user's email
- **Visibility**: Only shown for unverified users

#### Revoke Sessions
- **Button**: 🔒 (lock icon)
- **Action**: Log out user from all devices by invalidating all their tokens
- **Use Case**: Security incidents, account compromise

#### Delete User
- **Button**: ✕ (X icon)
- **Action**: Permanently delete user and all associated data
- **Restriction**: Cannot delete your own account
- **Warning**: Irreversible action with confirmation prompt

---

## API Endpoints

All admin endpoints require authentication with an admin role.

### GET /api/admin/users

List all users with optional filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 50): Users per page
- `search` (string): Search by name, email, or ID
- `role` (string): Filter by role ('admin' or 'user')
- `verified` (boolean): Filter by email verification status

**Response:**
```json
{
  "data": {
    "users": [
      {
        "id": "dd2b080c-054e-4c6e-8b19-187ab331f427",
        "email": "test@example.com",
        "name": "Test User",
        "role": "admin",
        "emailVerified": true,
        "emailVerifiedAt": "2025-01-15T10:30:00.000Z",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 42,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### GET /api/admin/users/:id

Get detailed information about a specific user.

**Response:**
```json
{
  "data": {
    "user": { /* user object */ },
    "activeSessions": 2
  }
}
```

### PATCH /api/admin/users/:id/role

Update a user's role.

**Request:**
```json
{
  "role": "admin" // or "user"
}
```

**Response:**
```json
{
  "data": {
    "user": { /* updated user object */ },
    "message": "User role updated to admin"
  }
}
```

### PATCH /api/admin/users/:id/verify-email

Manually verify a user's email.

**Response:**
```json
{
  "data": {
    "user": { /* updated user object */ },
    "message": "Email verified successfully"
  }
}
```

**Error (Already Verified):**
```json
{
  "error": {
    "code": "ALREADY_VERIFIED",
    "message": "Email is already verified"
  }
}
```

### POST /api/admin/users/:id/revoke-sessions

Revoke all active sessions for a user.

**Response:**
```json
{
  "data": {
    "message": "All sessions revoked successfully"
  }
}
```

### DELETE /api/admin/users/:id

Delete a user and all associated data.

**Response:**
```json
{
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Error (Self-Delete):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot delete your own account"
  }
}
```

### GET /api/admin/stats

Get admin dashboard statistics.

**Response:**
```json
{
  "data": {
    "totalUsers": 42,
    "verifiedUsers": 38,
    "unverifiedUsers": 4,
    "adminUsers": 2,
    "regularUsers": 40,
    "recentSignups24h": 5,
    "verificationRate": 90
  }
}
```

---

## Security

### Access Control

- **Middleware**: `requireAdmin()` checks JWT token and user role
- **Database Check**: Role is verified from database, not just token claims
- **Frontend Protection**: Server-side checks redirect unauthorized users

### Self-Protection

- Cannot change your own role
- Cannot delete your own account
- Your row is highlighted in purple in the user table

### Audit Trail

All user modifications update the `updatedAt` timestamp. Consider implementing:
- Detailed audit logs for admin actions
- Admin action history
- Change notifications

---

## Making a User an Admin

### Via Script (Recommended)

```bash
deno task users:make-admin <email>
```

Example:
```bash
deno task users:make-admin test@example.com
```

Output:
```
✅ User "Test User" (test@example.com) promoted to admin!
   User ID: dd2b080c-054e-4c6e-8b19-187ab331f427
   Updated at: 2025-01-15T10:30:00.000Z
```

### Via Admin Panel

Once you have at least one admin user:
1. Log in as admin
2. Go to Admin Panel
3. Find the user in the table
4. Click the ↑ (up arrow) button to promote them

### Direct Database Modification

**Not recommended**, but possible in emergencies:

```typescript
// In Deno KV console or script
const kv = await Deno.openKv();
const user = await kv.get(['users', 'USER_ID_HERE']);
await kv.set(['users', 'USER_ID_HERE'], {
  ...user.value,
  role: 'admin',
  updatedAt: new Date().toISOString()
});
```

---

## CLI Tools

### List All Users

View all registered users in the terminal:

```bash
deno task users:list
```

Output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       REGISTERED USERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Users: 3

Name                Email                           Verified  Role   Created
─────────────────────────────────────────────────────────────────────────────
Test User           test@example.com                ✓         admin  Jan 15
Michael B Kacher    michael.kacher7@gmail.com       ⚠         user   Jan 14
Michael B Kacher    michael.kacher8@gmail.com       ⚠         user   Jan 14
```

### Make Admin

Promote a user to admin:

```bash
deno task users:make-admin test@example.com
```

---

## Navigation

### Admin Link

The "Admin Panel" button appears in the navigation bar (AuthBanner) only for users with admin role.

**Implementation:**
- Reads `user_role` from localStorage
- Shows purple "Admin Panel" button
- Located between email and logout button

### Direct Access

- URL: `http://localhost:3000/admin/users`
- Requires authentication
- Redirects non-admins to home page
- Preserves intended URL for login redirect

---

## User Experience

### Loading States

- Skeleton loader while checking authentication
- Loading indicator during data fetches
- Disabled buttons during API calls

### Error Handling

- Red banner for errors
- User-friendly error messages
- Fallback to home page on critical errors

### Success Feedback

- Green banner for successful actions
- Confirmation prompts for destructive actions
- Real-time table updates after changes

### Responsive Design

- Mobile-friendly table layout
- Horizontal scroll for overflow
- Stacked filters on small screens
- Touch-friendly action buttons

---

## Development

### Adding New Admin Features

1. **Add API Endpoint** in `backend/routes/admin.ts`
2. **Use Admin Middleware**: `requireAdmin()`
3. **Update Frontend Island** in `AdminUserTable.tsx`
4. **Add UI Element** in `admin/users.tsx`

### Testing Admin Features

1. Create test user:
```bash
deno task kv:seed-user
```

2. Make them admin:
```bash
deno task users:make-admin test@example.com
```

3. Log in at http://localhost:3000/login:
   - Email: test@example.com
   - Password: password123

4. Navigate to Admin Panel

### Debugging

Check admin status:
```javascript
// In browser console
localStorage.getItem('user_role')
```

Check backend logs:
```bash
# Backend logs show admin middleware checks
# Watch for "Unauthorized: user is not admin" messages
```

---

## Production Considerations

### First Admin User

In production, use the CLI script to create the first admin:

```bash
# On Deno Deploy or your server
deno run --unstable-kv --allow-read --allow-write --allow-env \
  scripts/make-admin.ts admin@yourcompany.com
```

### Rate Limiting

Consider adding rate limiting to admin endpoints:
- Protect against brute force on user enumeration
- Prevent abuse of delete/modify operations
- Add separate rate limits for admin vs regular API

### Audit Logging

Implement comprehensive audit logs:
- Who performed the action
- What action was performed
- When it was performed
- User affected
- IP address and user agent

Example audit log entry:
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "adminId": "admin-user-id",
  "adminEmail": "admin@example.com",
  "action": "DELETE_USER",
  "targetUserId": "deleted-user-id",
  "targetEmail": "deleted@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Backup Strategy

Before bulk operations:
1. Export user data
2. Create database backup
3. Test in staging environment

### Monitoring

Track admin panel metrics:
- Admin login frequency
- User modifications per admin
- Deletion patterns
- Error rates
- Response times

---

## Troubleshooting

### "Unauthorized" Error

**Problem**: Admin panel redirects to home page

**Solutions**:
1. Verify user has admin role:
   ```bash
   deno task users:list
   ```

2. Check localStorage:
   ```javascript
   localStorage.getItem('user_role') // Should be 'admin'
   ```

3. Re-login if role was recently changed

### Can't See Admin Panel Link

**Problem**: "Admin Panel" button not showing

**Solutions**:
1. Clear browser cache and localStorage
2. Log out and log back in
3. Check `user_role` in localStorage
4. Verify backend `/api/auth/me` returns role

### Actions Not Working

**Problem**: Buttons don't do anything

**Solutions**:
1. Check browser console for errors
2. Verify token is still valid
3. Check backend logs for permission errors
4. Ensure backend server is running

### Cannot Make First Admin

**Problem**: No admin users exist

**Solution**: Use the CLI script:
```bash
deno task users:make-admin first-admin@example.com
```

---

## Future Enhancements

### Planned Features

1. **Bulk Operations**
   - Select multiple users
   - Bulk delete
   - Bulk role change
   - Bulk email verification

2. **Advanced Filtering**
   - Date range filters
   - Multiple search criteria
   - Saved filter presets

3. **User Activity**
   - Last login timestamp
   - Active sessions list
   - Login history

4. **Export Functionality**
   - Export user list to CSV
   - Export filtered results
   - Export audit logs

5. **Admin Roles**
   - Super admin vs regular admin
   - Granular permissions
   - Admin groups

6. **Notifications**
   - Email admins on new signups
   - Alert on suspicious activity
   - Admin action notifications

---

## Related Documentation

- [Authentication Documentation](./AUTHENTICATION.md)
- [Email Verification](./EMAIL_VERIFICATION.md)
- [Password Reset](./PASSWORD_RESET.md)
- [Security Features](./SECURITY.md)

---

## Support

For issues or questions:
1. Check this documentation
2. Review backend logs
3. Check browser console
4. Verify environment variables
5. Test with a fresh user account
