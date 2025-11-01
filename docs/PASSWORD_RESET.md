# Password Reset Flow

Complete password reset implementation with token-based verification and email notifications.

## 🎯 Features

- ✅ **Token-based reset** - Secure 1-hour expiring tokens
- ✅ **Email notifications** - Beautiful HTML emails via Resend
- ✅ **Rate limiting** - Prevent abuse (3 requests per hour)
- ✅ **Single-use tokens** - Tokens deleted after successful reset
- ✅ **Session invalidation** - All refresh tokens revoked on password change
- ✅ **Generic responses** - Don't reveal if email exists (security best practice)
- ✅ **User-friendly UI** - Clear error messages and success states
- ✅ **Password validation** - Minimum 8 characters with client-side validation

---

## 🔄 User Flow

### 1. **Forgot Password**
1. User clicks "Forgot your password?" on login page
2. User enters their email address
3. System checks if email exists (silently)
4. If exists: generates token, sends reset email
5. **Always** shows success message (don't reveal if email exists)

### 2. **Email Notification**
User receives email with:
- Reset link: `/reset-password?token=xxx`
- 1-hour expiration notice
- Security notice if they didn't request reset

### 3. **Reset Password**
1. User clicks link in email
2. Token is validated server-side
3. If valid: shows new password form
4. If invalid/expired: shows error with "Request new link" button
5. User enters new password (must be 8+ characters)
6. Password is confirmed (client-side validation)
7. On success: all sessions invalidated, redirected to login

---

## 🛠️ API Endpoints

### `POST /api/auth/forgot-password`

Request a password reset email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (always success):
```json
{
  "data": {
    "message": "If an account exists with this email, a password reset link will be sent."
  }
}
```

**Rate Limit**: 3 requests per hour per IP

**Security Note**: Response is identical whether email exists or not to prevent email enumeration.

---

### `GET /api/auth/validate-reset-token?token=xxx`

Validate a reset token without using it.

**Query Parameters**:
- `token` (required): UUID reset token

**Response** (valid token):
```json
{
  "data": {
    "valid": true
  }
}
```

**Response** (invalid/expired):
```json
{
  "data": {
    "valid": false,
    "reason": "expired"  // or "invalid"
  }
}
```

---

### `POST /api/auth/reset-password`

Reset password with valid token.

**Request Body**:
```json
{
  "token": "uuid-token-from-email",
  "password": "newpassword123"
}
```

**Response** (success):
```json
{
  "data": {
    "message": "Password reset successfully. Please login with your new password."
  }
}
```

**Response** (invalid token):
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired reset token"
  }
}
```

**Response** (expired token):
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Reset token has expired. Please request a new one."
  }
}
```

**Side Effects**:
- Password is hashed with bcrypt
- Reset token is deleted (single-use)
- All user's refresh tokens are revoked
- User must login again with new password

---

## 🎨 Frontend Pages

### `/forgot-password`

**Features**:
- Email input form
- Rate limit protection
- Success message (generic for security)
- Links to login and signup
- Beautiful gradient background

**User Experience**:
- Clear instructions
- Helpful success message with next steps
- Link back to login

---

### `/reset-password?token=xxx`

**Server-Side Validation**:
- Token validated before page renders
- Shows appropriate error for invalid/expired/missing tokens

**Valid Token UI**:
- New password input (min 8 chars)
- Confirm password input
- Real-time password match validation
- Auto-redirect to login on success

**Invalid Token UI**:
- Clear error message
- "Request New Reset Link" button
- "Back to Login" button

---

## 🔒 Security Features

### 1. **Short Token Expiry**
```typescript
const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
```
- Shorter than email verification (24h)
- Reduces window for token compromise

### 2. **Generic Responses**
```typescript
// Always return same message
return c.json({
  data: {
    message: 'If an account exists with this email, a password reset link will be sent.'
  }
});
```
- Prevents email enumeration attacks
- Same response time for existing/non-existing emails

### 3. **Single-Use Tokens**
```typescript
// Delete token immediately after use
await kv.delete(['password_reset', token]);
```
- Tokens can't be reused
- Prevents replay attacks

### 4. **Session Invalidation**
```typescript
// Revoke all refresh tokens
await revokeAllUserTokens(userId);
```
- All devices are logged out
- Forces re-login with new password
- Protects against concurrent session attacks

### 5. **Rate Limiting**
```typescript
passwordReset: createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,
  keyPrefix: 'password-reset',
  message: 'Too many password reset requests. Please try again later.'
})
```
- Prevents brute force attacks
- Prevents email spam
- 3 attempts per hour per IP

### 6. **Password Validation**
```typescript
password: z.string().min(8)
```
- Minimum 8 characters required
- Can be extended with regex for complexity
- Client-side validation for UX

---

## 📧 Email Template

The reset email includes:

- **Subject**: "Reset your password"
- **Sender**: `EMAIL_FROM` env variable
- **Content**:
  - Personalized greeting with user's name
  - Clear "Reset Password" button
  - Link as plain text (for email clients that don't render HTML)
  - 1-hour expiration notice
  - Security notice if they didn't request it

**Customization**: Edit `sendPasswordResetEmail()` in `backend/lib/email.ts`

---

## 🧪 Testing

### Manual Testing

1. **Request Reset**:
```bash
curl -X POST http://localhost:8000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

2. **Check Email** (Resend dashboard or inbox)

3. **Validate Token**:
```bash
curl "http://localhost:8000/api/auth/validate-reset-token?token=YOUR_TOKEN"
```

4. **Reset Password**:
```bash
curl -X POST http://localhost:8000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN","password":"newpassword123"}'
```

5. **Verify Old Sessions Invalidated**:
```bash
# Try using old refresh token - should fail
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Cookie: refresh_token=OLD_TOKEN"
```

---

### Test Scenarios

#### ✅ Happy Path
- [ ] Request reset for existing email
- [ ] Receive email with valid link
- [ ] Click link, validate token
- [ ] Enter new password, confirm matches
- [ ] Submit successfully
- [ ] Redirect to login
- [ ] Login with new password works
- [ ] Old refresh tokens are invalid

#### ❌ Error Scenarios
- [ ] Request reset for non-existent email (should look identical to success)
- [ ] Use expired token (after 1 hour)
- [ ] Use token twice (second attempt fails)
- [ ] Password too short (< 8 chars)
- [ ] Passwords don't match
- [ ] Rate limit after 3 attempts
- [ ] Invalid token format

#### 🔐 Security Tests
- [ ] Response time identical for existing/non-existing emails
- [ ] Token expires after exactly 1 hour
- [ ] Token is deleted after successful reset
- [ ] All sessions invalidated after reset
- [ ] Rate limiting enforced correctly
- [ ] Password is hashed in database

---

## 🗄️ Database Schema

### Password Reset Tokens (Deno KV)

```typescript
['password_reset', token: string] = {
  userId: string,
  email: string,
  expiresAt: number,  // Unix timestamp (now + 1 hour)
  createdAt: string   // ISO datetime
}
```

**Auto-Expiration**: Set with `expireIn: 60 * 60 * 1000` (1 hour)

**Cleanup**: Tokens are automatically deleted by Deno KV after expiration or after successful use.

---

## 🚨 Troubleshooting

### Emails Not Sending

**Issue**: User doesn't receive reset email

**Solutions**:
1. Check `RESEND_API_KEY` is set correctly in `.env`
2. Verify domain in Resend dashboard (production)
3. Check server logs for email sending errors
4. Test with Resend "Send Test Email" feature
5. Check spam folder

**Development**: Use Resend test mode - emails visible in dashboard even without domain verification.

---

### Token Already Used

**Issue**: "Invalid or expired reset token" immediately after clicking link

**Cause**: Token was already used or deleted

**Solutions**:
- Request a new reset link from `/forgot-password`
- Check if token was used by another request (check timing in logs)
- Ensure only one click on the email link

---

### Token Expired

**Issue**: Token expired before user completed reset

**Solution**: 
- Request new reset link
- Consider increasing token expiry (not recommended for security)

**Prevention**:
- Tell users to complete reset within 1 hour
- Add expiry time to email template

---

### Rate Limit Hit

**Issue**: "Too many password reset requests"

**Cause**: User or IP exceeded 3 requests in 1 hour

**Solutions**:
- Wait 1 hour before requesting again
- Check `X-RateLimit-Reset` header for exact reset time
- Contact support if legitimate need for more attempts

**For Admins**: Manually clear rate limit:
```typescript
const kv = await getKv();
await kv.delete(['ratelimit', 'password-reset', 'USER_IP']);
```

---

### Sessions Not Invalidated

**Issue**: User still logged in after password reset

**Cause**: Frontend has cached access token

**Solution**:
- Access tokens expire in 15 minutes anyway
- For immediate logout: clear localStorage and cookies:
```javascript
localStorage.removeItem('access_token');
document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | - | **Required**. Resend API key for sending emails |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Sender email address |
| `FRONTEND_URL` | `http://localhost:3000` | Used for reset link in email |

### Customization Options

**Token Expiry**: Edit in `backend/routes/auth.ts`
```typescript
const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
```

**Rate Limit**: Edit in `backend/lib/rate-limit.ts`
```typescript
passwordReset: createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,            // 3 attempts
  // ...
})
```

**Password Requirements**: Edit in `backend/routes/auth.ts`
```typescript
password: z.string()
  .min(8)
  .regex(/[A-Z]/)  // At least one uppercase
  .regex(/[0-9]/)  // At least one number
  // etc.
```

---

## 📊 Monitoring

### Metrics to Track

1. **Reset Requests**: How many password reset requests
2. **Success Rate**: Requests → successful password resets
3. **Token Expiry**: How many tokens expire without being used
4. **Rate Limit Hits**: How often users hit rate limits
5. **Time to Complete**: Time from request to successful reset

### Logging

Add logging to track:
- Password reset requests (with email hash, not plaintext)
- Successful password resets
- Failed attempts (expired tokens, invalid tokens, etc.)
- Rate limit violations

---

## 🎯 Best Practices

### For Users

1. ✅ Complete reset within 1 hour
2. ✅ Use strong, unique password
3. ✅ Check spam folder if no email received
4. ✅ Don't share reset links
5. ✅ Request new link if expired

### For Developers

1. ✅ Never log passwords or tokens
2. ✅ Monitor for suspicious patterns (many resets from one IP)
3. ✅ Keep token expiry short (1 hour max)
4. ✅ Always invalidate sessions on password change
5. ✅ Generic responses to prevent enumeration
6. ✅ Rate limit aggressively
7. ✅ Test email deliverability regularly

---

## 🔗 Related Documentation

- [EMAIL_VERIFICATION.md](./EMAIL_VERIFICATION.md) - Email verification system
- [ADVANCED_AUTH.md](./ADVANCED_AUTH.md) - Refresh tokens, CSRF, logout
- [SECURITY_HEADERS.md](./SECURITY_HEADERS.md) - Security best practices
- [Resend Documentation](https://resend.com/docs) - Email service docs

---

## 🚀 Future Enhancements

Optional features to consider:

1. **Security Notifications**: Email user when password is changed
2. **Password History**: Prevent reusing last 3-5 passwords
3. **Account Lockout**: Lock account after multiple failed reset attempts
4. **Two-Factor Auth**: Require 2FA before allowing password reset
5. **Password Strength Meter**: Visual feedback on password strength
6. **Magic Links**: Alternative to password reset (temporary login links)
7. **Security Questions**: Additional verification before reset
8. **Admin Reset**: Allow admins to force password reset

---

**✨ Password reset flow is now fully implemented and ready to use!**
