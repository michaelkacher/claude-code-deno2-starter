# Advanced Authentication Features

This document describes the advanced authentication features implemented in the application.

## Features Implemented

### 1. ✅ Refresh Token Mechanism

**Purpose:** Separates short-lived access tokens from long-lived refresh tokens for better security

**How it works:**
- **Access Token:** Short-lived (15 minutes), used for API requests
- **Refresh Token:** Long-lived (30 days), stored in httpOnly cookie, used to get new access tokens
- **Auto-refresh:** Frontend automatically refreshes access token every 13 minutes

**Benefits:**
- Reduced risk if access token is stolen (expires quickly)
- Refresh tokens stored in httpOnly cookies (not accessible to JavaScript)
- Can revoke refresh tokens without affecting other sessions

**API Endpoints:**
```bash
# Refresh access token
POST /api/auth/refresh
# Uses refresh token from cookie
# Returns: { data: { accessToken: "..." } }
```

**Frontend Implementation:**
- Access token stored in `localStorage` (for API requests)
- Access token also in regular cookie (for server-side middleware)
- Refresh token in httpOnly cookie (secure, not accessible to JS)
- Auto-refresh utility runs every 13 minutes

---

### 2. ✅ Token Revocation/Blacklist

**Purpose:** Ability to invalidate tokens before they expire

**How it works:**
- Tokens have unique IDs (`jti` claim)
- Revoked tokens stored in Deno KV blacklist
- Blacklist entries auto-expire when token would naturally expire
- Refresh tokens stored in database for validation

**Use Cases:**
- User logs out → revoke their refresh token
- User logs out from all devices → revoke all refresh tokens
- Security breach → admin can revoke specific tokens
- Password change → revoke all existing tokens

**API Endpoints:**
```bash
# Logout (revoke current refresh token)
POST /api/auth/logout

# Logout from all devices (revoke all refresh tokens)
POST /api/auth/logout-all
Authorization: Bearer <access-token>
```

**Storage:**
```typescript
// Blacklisted tokens (auto-expire)
['token_blacklist', tokenId] → { blacklistedAt, expiresAt }

// Active refresh tokens (auto-expire)
['refresh_tokens', userId, tokenId] → { tokenId, userId, createdAt, expiresAt }
```

---

### 3. ✅ CSRF Protection

**Purpose:** Prevents Cross-Site Request Forgery attacks

**Implementation:** Double Submit Cookie pattern
1. Server generates CSRF token and sets it in cookie
2. Frontend reads cookie and sends token in custom header
3. Server verifies both cookie and header match

**Why this works:**
- Attackers can't read cookies from other domains (Same-Origin Policy)
- Attackers can't set custom headers in cross-origin requests
- Both must match for request to succeed

**API Endpoints:**
```bash
# Get CSRF token (call before login/signup)
GET /api/auth/csrf-token
# Returns: { data: { csrfToken: "..." } }
# Sets cookie: csrf_token=<token>

# Protected endpoints require:
Header: X-CSRF-Token: <token>
Cookie: csrf_token=<token>
```

**Frontend Usage:**
```typescript
// 1. Get CSRF token
const response = await fetch('/api/auth/csrf-token', {
  credentials: 'include'
});
const { csrfToken } = await response.json();

// 2. Include in request
await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  credentials: 'include',
  body: JSON.stringify({ email, password }),
});
```

---

### 4. ✅ Constant-Time Comparisons

**Purpose:** Prevents timing attacks that could reveal information

**Already Implemented:**
1. **Password Verification:** bcrypt uses constant-time comparison internally
2. **User Existence:** Always verifies password even if user doesn't exist
3. **CSRF Token Comparison:** Custom constant-time string comparison

**Timing Attack Example (VULNERABLE):**
```typescript
// BAD: Early return reveals information
if (!user) return 'Invalid user';
if (!verifyPassword) return 'Invalid password';
```

**Protected Implementation:**
```typescript
// GOOD: Always takes same time
const userExists = !!user;
const user = userExists ? realUser : dummyUser;
const passwordMatches = await verifyPassword(password, user.password);

if (!userExists || !passwordMatches) {
  return 'Invalid email or password';
}
```

---

## Security Architecture

### Token Flow

```
┌─────────┐                 ┌─────────┐                ┌──────────┐
│ Client  │                 │  API    │                │  Deno KV │
└────┬────┘                 └────┬────┘                └────┬─────┘
     │                           │                          │
     │ 1. Login                  │                          │
     ├──────────────────────────>│                          │
     │                           │ 2. Verify credentials    │
     │                           ├─────────────────────────>│
     │                           │<─────────────────────────┤
     │                           │ 3. Create tokens         │
     │                           │ 4. Store refresh token   │
     │                           ├─────────────────────────>│
     │ 5. Return access token    │                          │
     │    Set refresh token cookie                          │
     │<──────────────────────────┤                          │
     │                           │                          │
     │ 6. API request            │                          │
     │    (access token)         │                          │
     ├──────────────────────────>│                          │
     │                           │ 7. Check blacklist       │
     │                           ├─────────────────────────>│
     │                           │<─────────────────────────┤
     │ 8. Response               │                          │
     │<──────────────────────────┤                          │
     │                           │                          │
     │ 9. Refresh token          │                          │
     │    (after 13 min)         │                          │
     ├──────────────────────────>│                          │
     │                           │ 10. Verify refresh token │
     │                           ├─────────────────────────>│
     │                           │<─────────────────────────┤
     │ 11. New access token      │                          │
     │<──────────────────────────┤                          │
     │                           │                          │
     │ 12. Logout                │                          │
     ├──────────────────────────>│                          │
     │                           │ 13. Blacklist token      │
     │                           ├─────────────────────────>│
     │                           │ 14. Delete refresh token │
     │                           ├─────────────────────────>│
     │<──────────────────────────┤                          │
```

---

## Testing

### Test Refresh Token
```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrf-token>" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# 2. Use refresh token (after access token expires)
curl -X POST http://localhost:8000/api/auth/refresh \
  -b cookies.txt

# 3. Logout
curl -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt
```

### Test CSRF Protection
```bash
# 1. Get CSRF token
curl http://localhost:8000/api/auth/csrf-token -c cookies.txt

# 2. Try without CSRF token (should fail)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -b cookies.txt

# 3. With CSRF token (should succeed)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-from-step-1>" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -b cookies.txt
```

### Test Token Revocation
```bash
# 1. Login
curl -X POST http://localhost:8000/api/auth/login ...

# 2. Make authenticated request (should work)
curl http://localhost:8000/api/auth/verify \
  -H "Authorization: Bearer <access-token>"

# 3. Logout
curl -X POST http://localhost:8000/api/auth/logout -b cookies.txt

# 4. Try to refresh (should fail - token revoked)
curl -X POST http://localhost:8000/api/auth/refresh -b cookies.txt
```

---

## Configuration

### Token Expiration Times

Edit `backend/lib/jwt.ts` to change expiration:

```typescript
// Access token (currently 15 minutes)
export async function createAccessToken(payload: Record<string, unknown>) {
  return await createToken({ ...payload, type: 'access' }, '15m');
}

// Refresh token (currently 30 days)
export async function createRefreshToken(payload: Record<string, unknown>) {
  const tokenId = crypto.randomUUID();
  return {
    token: await createToken({ ...payload, type: 'refresh', jti: tokenId }, '30d'),
    tokenId,
  };
}
```

### Auto-Refresh Interval

Edit `frontend/lib/token-refresh.ts`:

```typescript
// Refresh every 13 minutes (2 minutes before 15min expiry)
const refreshInterval = 13 * 60 * 1000;
```

---

## Security Best Practices

### ✅ Implemented
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (30 days) in httpOnly cookies
- Token revocation/blacklist system
- CSRF protection with double-submit cookie pattern
- Constant-time comparisons for password verification
- bcrypt password hashing
- Rate limiting on auth endpoints
- Security headers (CSP, X-Frame-Options, etc.)
- Request body size limits

### 🔄 Recommended Additions
- Email verification (send verification email on signup)
- Password reset flow (forgot password functionality)
- Account lockout after failed attempts (track in KV)
- Two-factor authentication (TOTP/SMS)
- Session management dashboard (view all active sessions)
- IP-based anomaly detection (alert on suspicious login)

---

## Troubleshooting

### "CSRF token missing" error
- Ensure you call `/api/auth/csrf-token` before login/signup
- Include `credentials: 'include'` in fetch requests
- Send token in `X-CSRF-Token` header

### "Token has been revoked" error
- User logged out - need to log in again
- All tokens revoked (logout-all) - normal behavior
- Clear localStorage and cookies, redirect to login

### Access token expires too quickly
- Auto-refresh should handle this (runs every 13 min)
- Check browser console for refresh errors
- Ensure refresh token cookie is being sent

### Refresh token not working
- Check that refresh token cookie exists
- Verify cookie is httpOnly and sent with credentials
- Check server logs for blacklist/database errors

---

## Migration from Old System

If upgrading from the previous auth system:

1. **Database:** Clear all users and tokens
   ```bash
   deno task kv:reset
   deno task kv:seed-user
   ```

2. **Frontend:** Update token references
   - Change `auth_token` to `access_token` in localStorage
   - Update API calls to fetch CSRF token first
   - Include `credentials: 'include'` in all auth requests

3. **Backend:** Old tokens incompatible
   - All users need to log in again
   - Old JWT tokens won't work with new system

---

## API Reference

### POST /api/auth/csrf-token
Get CSRF token for authentication requests

**Response:**
```json
{
  "data": {
    "csrfToken": "abc123..."
  }
}
```

### POST /api/auth/login
Login with email and password

**Headers:**
- `X-CSRF-Token`: CSRF token from /csrf-token

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    }
  }
}
```

**Cookies Set:**
- `refresh_token`: httpOnly, 30 days

### POST /api/auth/refresh
Get new access token using refresh token

**Response:**
```json
{
  "data": {
    "accessToken": "eyJhbG..."
  }
}
```

### POST /api/auth/logout
Logout and revoke refresh token

**Response:**
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

### POST /api/auth/logout-all
Logout from all devices

**Headers:**
- `Authorization`: Bearer <access-token>

**Response:**
```json
{
  "data": {
    "message": "Logged out from all devices successfully"
  }
}
```
