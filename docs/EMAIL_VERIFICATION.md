# Email Verification System

Complete email verification implementation using Resend for transactional emails.

## 🎯 Features

- ✅ **Token-based verification** - Secure 24-hour expiring tokens
- ✅ **Beautiful email templates** - HTML and plain text versions
- ✅ **Rate limiting** - Prevent spam (3 emails per hour)
- ✅ **Optional enforcement** - Control with `REQUIRE_EMAIL_VERIFICATION` env var
- ✅ **Auto-expiring tokens** - Automatic cleanup in Deno KV
- ✅ **User-friendly UI** - Banner reminders and dedicated pages
- ✅ **Middleware protection** - Easy route protection for verified-only features

---

## 📋 Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain for development)
3. Get your API key from the dashboard

### 2. Configure Environment Variables

Update `.env`:

```bash
# Email Configuration
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=noreply@yourdomain.com
REQUIRE_EMAIL_VERIFICATION=false  # Set to true to enforce verification
```

**Development**: Use Resend's test mode. Emails to test addresses will work without domain verification.

**Production**: Verify your domain in Resend and set `REQUIRE_EMAIL_VERIFICATION=true`.

### 3. Update Existing Users (If Applicable)

If you have existing users in your database, they won't have the new `emailVerified` fields. Run this script:

```typescript
// scripts/migrate-users-email-verification.ts
import { getKv } from '../backend/lib/kv.ts';

const kv = await getKv();
const users = kv.list({ prefix: ['users'] });

for await (const entry of users) {
  const user = entry.value as any;
  if (!('emailVerified' in user)) {
    await kv.set(entry.key, {
      ...user,
      emailVerified: false,
      emailVerifiedAt: null,
      updatedAt: new Date().toISOString()
    });
    console.log(`Updated user: ${user.email}`);
  }
}

console.log('Migration complete!');
kv.close();
```

Run with: `deno run --allow-read --allow-write --allow-env scripts/migrate-users-email-verification.ts`

---

## 🔄 User Flow

### Signup Flow

1. User signs up with email, password, name
2. Account is created with `emailVerified: false`
3. Verification email is sent automatically (non-blocking)
4. User is logged in and redirected
5. Yellow banner appears prompting verification

### Verification Flow

1. User clicks verification link in email: `/verify-email?token=xxx`
2. Token is validated (checks expiry, user exists)
3. User's `emailVerified` is set to `true`, `emailVerifiedAt` is set
4. Token is deleted from KV
5. Success page shows with confirmation

### Resend Flow

1. User clicks "Resend verification email" from banner
2. Rate limiting prevents spam (3 per hour)
3. New token is generated and emailed
4. Old token remains valid until expiry

---

## 🛠️ API Endpoints

### `GET /api/auth/verify-email?token=xxx`

Verify email with token from email link.

**Response (Success)**:
```json
{
  "data": {
    "message": "Email verified successfully!",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": true
    }
  }
}
```

**Response (Error)**:
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Verification token has expired. Please request a new one."
  }
}
```

### `POST /api/auth/resend-verification`

Request a new verification email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "data": {
    "message": "Verification email sent successfully. Please check your inbox."
  }
}
```

**Rate Limit**: 3 requests per hour per IP

---

## 🔒 Protecting Routes

### Backend Middleware

Use `requireVerifiedEmail()` middleware to protect routes:

```typescript
import { requireVerifiedEmail } from '../lib/email-verification.ts';

// Only verified users can access
app.post('/api/premium-feature', requireVerifiedEmail(), async (c) => {
  // User is guaranteed to have verified email
  const user = c.get('user');
  // ...
});
```

### Optional Checking

Use `checkEmailVerification()` to add info without blocking:

```typescript
import { checkEmailVerification } from '../lib/email-verification.ts';

app.get('/api/profile', checkEmailVerification(), async (c) => {
  const user = c.get('user');
  const isVerified = c.get('emailVerified');
  
  return c.json({
    user,
    canAccessPremium: isVerified,
    showVerificationBanner: !isVerified
  });
});
```

### Frontend Protection

The `EmailVerificationBanner` island automatically shows when:
- User is logged in (`access_token` exists)
- Email is not verified (`email_verified === 'false'`)

You can also manually check in routes:

```typescript
// frontend/routes/premium.tsx
export const handler: Handlers = {
  GET(req, ctx) {
    const emailVerified = localStorage.getItem('email_verified');
    
    if (emailVerified !== 'true') {
      return new Response('', {
        status: 303,
        headers: { Location: '/resend-verification' }
      });
    }
    
    return ctx.render();
  }
};
```

---

## 🎨 UI Components

### `EmailVerificationBanner` Island

Automatically appears at the top of all authenticated pages:

- Shows yellow alert with warning icon
- "Resend verification email" button
- Dismissible
- Shows success/error messages inline

### `/verify-email` Page

Handles the verification token from email:

- ✅ Success state with green checkmark
- ❌ Error state with red X
- Links to home, login, or resend page

### `/resend-verification` Page

Standalone page to request new verification email:

- Email input form
- Rate limit protection
- Success/error messages
- Link back to login

---

## 📧 Email Template Customization

Edit `backend/lib/email.ts` to customize:

### Sender Info

```typescript
const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com';
```

### HTML Template

```typescript
function getVerificationEmailHTML(data: EmailVerificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Verify Your Email</title>
</head>
<body style="font-family: sans-serif; ...">
  <!-- Customize HTML here -->
  <h1>Welcome to Your App!</h1>
  <a href="${data.verificationUrl}">Verify Email</a>
</body>
</html>
  `.trim();
}
```

### Plain Text Version

```typescript
function getVerificationEmailText(data: EmailVerificationData): string {
  return `
Hi ${data.name},

Welcome to Your App! Please verify your email:
${data.verificationUrl}

This link expires in 24 hours.
  `.trim();
}
```

---

## 🧪 Testing

### Local Testing (Without Domain)

1. Use Resend's test mode
2. Send verification emails to test addresses
3. Check Resend dashboard for delivered emails
4. Copy verification link from dashboard

### Testing Verification Flow

```bash
# 1. Sign up a new user
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 2. Get verification token from Resend dashboard or email
# 3. Verify email
curl "http://localhost:8000/api/auth/verify-email?token=YOUR_TOKEN"

# 4. Check user is verified
curl http://localhost:8000/api/auth/verify \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Testing Rate Limiting

```bash
# Send 4 requests quickly - 4th should fail
for i in {1..4}; do
  curl -X POST http://localhost:8000/api/auth/resend-verification \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo "\nRequest $i"
done
```

### Testing Token Expiry

Tokens auto-expire after 24 hours. To test immediately:

1. Generate a token
2. Manually delete from KV: `await kv.delete(['email_verification', token])`
3. Try to verify - should get "expired" error

---

## 🔍 Database Schema

### Verification Tokens (Deno KV)

```typescript
['email_verification', token: string] = {
  userId: string,
  email: string,
  expiresAt: number  // Unix timestamp
}
```

**Auto-expiration**: Set with `expireIn: 24 * 60 * 60 * 1000` (24 hours)

### User Updates

```typescript
{
  ...existingUserFields,
  emailVerified: boolean,
  emailVerifiedAt: string | null  // ISO datetime
}
```

---

## 🚨 Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify domain in Resend dashboard (production only)
3. Check server logs for error messages
4. Test with Resend dashboard "Send Test Email"

### "Invalid API Key" Error

- API key must start with `re_`
- Regenerate key in Resend dashboard if needed
- Make sure no extra spaces in `.env`

### Banner Not Showing

1. Check localStorage: `localStorage.getItem('email_verified')` should be `'false'`
2. Make sure user is logged in (has `access_token`)
3. Check you're not on `/login` or `/signup` pages (banner hidden there)

### Token Already Used

- Tokens are single-use (deleted after verification)
- Request a new verification email

### Rate Limit Hit

- Wait 1 hour before requesting new email
- Rate limit: 3 emails per hour per IP
- Check `X-RateLimit-Reset` header for exact reset time

---

## 🎛️ Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | - | **Required**. Resend API key |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Sender email address |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Enforce verification for protected routes |
| `FRONTEND_URL` | `http://localhost:3000` | Used for verification link |

### Customization

**Token Expiry**: Change in `backend/routes/auth.ts`
```typescript
const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
```

**Rate Limit**: Change in `backend/lib/rate-limit.ts`
```typescript
emailVerification: createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,
  // ...
})
```

---

## 📝 Next Steps

Optional enhancements to consider:

1. **Email Change Flow**: Require verification when user changes email
2. **Admin Override**: Allow admins to manually verify users
3. **Verification Reminder Emails**: Send reminders after 48 hours
4. **Email Preferences**: Let users opt-in/out of certain emails
5. **Audit Log**: Track verification attempts and completions
6. **Analytics**: Track verification conversion rates

---

## 🔗 Related Documentation

- [ADVANCED_AUTH.md](./ADVANCED_AUTH.md) - Refresh tokens, CSRF, logout
- [SECURITY_HEADERS.md](./SECURITY_HEADERS.md) - Security best practices
- [Resend Documentation](https://resend.com/docs) - Email service docs

---

**✨ Email verification is now fully integrated with your authentication system!**
