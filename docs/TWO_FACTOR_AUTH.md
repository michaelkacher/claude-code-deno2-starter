# Two-Factor Authentication (2FA) Guide

This project includes a complete TOTP-based Two-Factor Authentication system that adds an extra layer of security to user accounts.

## Features

✅ **TOTP-based 2FA** - Time-based One-Time Passwords (RFC 6238)
✅ **QR Code Setup** - Easy enrollment with authenticator apps
✅ **Backup Codes** - 10 single-use recovery codes
✅ **Password Reset Protection** - Requires 2FA verification when enabled
✅ **Secure Implementation** - Password confirmation required for setup/disable

## User Flow

### Enabling 2FA

1. **Navigate to Setup**
   - Go to `/2fa/setup` (requires authentication)
   - Or add a link in your profile page

2. **Confirm Password**
   - User must confirm their password for security

3. **Scan QR Code**
   - Display QR code for authenticator apps (Google Authenticator, Authy, etc.)
   - Manual entry key provided as backup

4. **Verify Setup**
   - User enters a 6-digit code from their authenticator app
   - System validates the code

5. **Save Backup Codes**
   - 10 backup codes generated (8 characters each)
   - Each code can only be used once
   - User must save these securely

### Using 2FA

**During Password Reset:**
- If user has 2FA enabled, they must provide:
  - Reset token (from email)
  - New password
  - 6-digit TOTP code OR 8-character backup code

**Backup Codes:**
- Use when authenticator app is unavailable
- Each code is single-use (deleted after use)
- System warns when running low on codes

### Disabling 2FA

1. Navigate to `/2fa/setup` (or profile settings)
2. Confirm password
3. Provide current 6-digit code
4. 2FA disabled, all backup codes deleted

## API Endpoints

### GET `/api/2fa/status`
Check if 2FA is enabled for the current user.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "data": {
    "twoFactorEnabled": true,
    "hasBackupCodes": true
  }
}
```

### POST `/api/2fa/setup`
Start 2FA setup process - generates secret and QR code.

**Headers:**
- `Authorization: Bearer <access_token>`
- `X-CSRF-Token: <csrf_token>`

**Body:**
```json
{
  "password": "user_password"
}
```

**Response:**
```json
{
  "data": {
    "secret": "BASE32_ENCODED_SECRET",
    "qrCodeURL": "https://chart.googleapis.com/...",
    "manualEntryKey": "BASE32_ENCODED_SECRET",
    "message": "Scan the QR code..."
  }
}
```

### POST `/api/2fa/enable`
Enable 2FA after verifying the code.

**Headers:**
- `Authorization: Bearer <access_token>`
- `X-CSRF-Token: <csrf_token>`

**Body:**
```json
{
  "code": "123456"
}
```

**Response:**
```json
{
  "data": {
    "enabled": true,
    "backupCodes": ["ABC12345", "DEF67890", ...],
    "message": "Two-factor authentication enabled..."
  }
}
```

### POST `/api/2fa/verify`
Verify a 2FA code (used internally during password reset).

**Headers:**
- `X-CSRF-Token: <csrf_token>`

**Body:**
```json
{
  "code": "123456"  // 6 digits (TOTP) or 8 chars (backup)
}
```

**Response:**
```json
{
  "data": {
    "verified": true,
    "method": "totp",  // or "backup"
    "remainingBackupCodes": 9,  // only for backup codes
    "message": "Backup code used..."  // only for backup codes
  }
}
```

### POST `/api/2fa/disable`
Disable 2FA (requires password and current code).

**Headers:**
- `Authorization: Bearer <access_token>`
- `X-CSRF-Token: <csrf_token>`

**Body:**
```json
{
  "password": "user_password",
  "code": "123456"
}
```

**Response:**
```json
{
  "data": {
    "disabled": true,
    "message": "Two-factor authentication has been disabled"
  }
}
```

## Password Reset with 2FA

### Updated Flow

1. **User requests password reset** (`POST /api/auth/forgot-password`)
2. **User receives reset email** with token
3. **User clicks reset link** - Frontend checks if 2FA is required:
   ```
   GET /api/auth/validate-reset-token?token=xxx
   Response: { "data": { "valid": true, "requires2FA": true } }
   ```
4. **Frontend shows 2FA field** if `requires2FA: true`
5. **User submits new password + 2FA code**:
   ```
   POST /api/auth/reset-password
   Body: { "token": "xxx", "password": "new", "twoFactorCode": "123456" }
   ```
6. **Backend verifies 2FA** before allowing password reset

### Error Codes

- `2FA_REQUIRED` (403) - 2FA code is required but not provided
- `INVALID_2FA_CODE` (401) - The provided 2FA code is invalid
- `NO_SECRET` (400) - No 2FA secret found (run setup first)
- `2FA_NOT_ENABLED` (400) - 2FA is not enabled for this user

## Database Schema

### User Model Extensions

```typescript
{
  // ... existing user fields ...
  twoFactorEnabled: boolean;        // Is 2FA active?
  twoFactorSecret: string | null;   // BASE32-encoded secret
  twoFactorBackupCodes: string[];   // Hashed backup codes
}
```

## Security Considerations

### ✅ Secure Design

1. **Password Confirmation Required**
   - Setup/disable requires password verification
   - Prevents unauthorized 2FA changes

2. **Backup Codes**
   - Hashed with bcrypt before storage
   - Single-use only (deleted after use)
   - Regenerated on each 2FA enable

3. **Time Window Validation**
   - TOTP codes valid for ±30 seconds (1 window)
   - Prevents replay attacks

4. **Secret Storage**
   - Stored in database (not encrypted by default)
   - Consider encrypting secrets at rest for high-security applications

5. **Recovery Options**
   - Backup codes provided
   - Admin can disable 2FA for account recovery

### ⚠️ Important Notes

1. **Backup Codes Are Critical**
   - Users must save backup codes securely
   - No way to recover access without them or admin intervention

2. **QR Code Security**
   - QR codes are generated using Google Charts API
   - Consider self-hosted QR generation for air-gapped environments

3. **Admin Recovery**
   - Admins can disable 2FA for locked-out users
   - Document recovery process for your organization

## Implementation Details

### TOTP Algorithm (RFC 6238)

```typescript
// Generate 6-digit code from secret
const code = await generateTOTP(secret, timeStep=30, digits=6);

// Verify code with ±30 second window
const isValid = await verifyTOTP(code, secret, window=1);
```

### QR Code Format

```
otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
```

### Backup Codes Format

- **Length:** 8 characters
- **Characters:** A-Z (excluding similar: I, L, O), 2-9 (excluding 0, 1)
- **Example:** `A3K7M9Q2`

## Testing

### Manual Testing

1. **Enable 2FA:**
   ```bash
   # Use Google Authenticator or Authy app
   # Scan QR code
   # Verify with generated code
   ```

2. **Test Password Reset:**
   ```bash
   # Request reset email
   # Use reset link
   # Should require 2FA code
   ```

3. **Test Backup Codes:**
   ```bash
   # Use backup code instead of TOTP
   # Verify code is deleted after use
   # Check remaining count
   ```

### Automated Testing

Create test file: `tests/integration/api/two-factor.test.ts`

```typescript
Deno.test("2FA - Complete setup flow", async () => {
  // 1. Setup 2FA
  // 2. Verify code
  // 3. Test backup codes
  // 4. Test password reset with 2FA
  // 5. Disable 2FA
});
```

## User Interface

### Components Created

1. **`TwoFactorSetup`** (`frontend/islands/TwoFactorSetup.tsx`)
   - Multi-step wizard
   - Password confirmation
   - QR code display
   - Code verification
   - Backup codes display

2. **`ResetPasswordForm`** (updated)
   - Checks if 2FA required
   - Conditional 2FA input field
   - Supports both TOTP and backup codes

### Routes Created

1. **`/2fa/setup`** - 2FA setup page (requires auth)

## Future Enhancements

### Potential Improvements

1. **WebAuthn Support**
   - Add hardware key support (YubiKey, etc.)
   - Passwordless authentication

2. **SMS/Email Backup**
   - Send backup codes via SMS/email
   - Alternative to authenticator apps

3. **Recovery Email**
   - Allow users to set recovery email
   - Admin-assisted account recovery

4. **Remember Device**
   - Skip 2FA on trusted devices for X days
   - Device fingerprinting

5. **Audit Log**
   - Log 2FA enable/disable events
   - Failed verification attempts

## Troubleshooting

### Common Issues

**Issue: "Time drift - codes not working"**
- Ensure server time is synchronized (NTP)
- Authenticator app time must be accurate

**Issue: "Lost authenticator device"**
- Use backup codes
- Contact admin for 2FA disable

**Issue: "QR code not scanning"**
- Use manual entry key
- Check authenticator app permissions

## Resources

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
- [Authy](https://authy.com/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
