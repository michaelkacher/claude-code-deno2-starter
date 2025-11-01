/**
 * Two-Factor Authentication (2FA) Routes
 * Handles TOTP-based 2FA setup, verification, and management
 */

import { Context, Hono } from 'hono';
import { z } from 'zod';
import { bodySizeLimits } from '../lib/body-limit.ts';
import { csrfProtection } from '../lib/csrf.ts';
import { verifyToken } from '../lib/jwt.ts';
import { getKv } from '../lib/kv.ts';
import { hashPassword } from '../lib/password.ts';
import { generateQRCodeDataURL, generateQRCodeURL, generateSecret, verifyTOTP } from '../lib/totp.ts';

const twoFactor = new Hono();
const kv = await getKv();

// Validation schemas
const SetupSchema = z.object({
  password: z.string().min(8), // Require password confirmation for security
});

const EnableSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

const VerifySchema = z.object({
  code: z.string().min(6).max(8), // 6 digits for TOTP, 8 chars for backup codes
});

const DisableSchema = z.object({
  password: z.string().min(8),
  code: z.string().length(6).regex(/^\d{6}$/),
});

/**
 * GET /api/2fa/status
 * Check if 2FA is enabled for the current user
 */
twoFactor.get('/status', async (c: Context) => {
  try {
    // Get access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'No access token provided' } }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    // Get user from database
    const userEntry = await kv.get(['users', payload.userId]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    
    return c.json({
      data: {
        twoFactorEnabled: user.twoFactorEnabled || false,
        hasBackupCodes: (user.twoFactorBackupCodes?.length || 0) > 0,
      }
    });
  } catch (error) {
    console.error('2FA status check error:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to check 2FA status' } }, 500);
  }
});

/**
 * POST /api/2fa/setup
 * Start 2FA setup process - generate secret and QR code
 */
twoFactor.post('/setup', csrfProtection(), bodySizeLimits.json, async (c: Context) => {
  try {
    // Get access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'No access token provided' } }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    // Get user from database
    const userEntry = await kv.get(['users', payload.userId]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    
    // Verify password for additional security
    const body = await c.req.json();
    const { password } = SetupSchema.parse(body);
    
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return c.json({ error: { code: 'INVALID_PASSWORD', message: 'Invalid password' } }, 401);
    }

    // Generate new secret
    const secret = generateSecret();
    
    // Generate QR code URL for authenticator apps
    const issuer = Deno.env.get('APP_NAME') || 'MyApp';
    const otpURL = generateQRCodeURL(secret, user.email, issuer);
    const qrCodeURL = generateQRCodeDataURL(otpURL);
    
    // Store secret temporarily (not enabled yet)
    // We'll enable it only after user verifies they can generate codes
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false; // Not enabled until verified
    user.updatedAt = new Date().toISOString();
    
    await kv.set(['users', user.id], user);
    
    return c.json({
      data: {
        secret,
        qrCodeURL,
        manualEntryKey: secret,
        message: 'Scan the QR code with your authenticator app, then verify with a code to enable 2FA'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } }, 400);
    }
    console.error('2FA setup error:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to setup 2FA' } }, 500);
  }
});

/**
 * POST /api/2fa/enable
 * Enable 2FA after verifying the code
 */
twoFactor.post('/enable', csrfProtection(), bodySizeLimits.json, async (c: Context) => {
  try {
    // Get access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'No access token provided' } }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    // Get user from database
    const userEntry = await kv.get(['users', payload.userId]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    
    // Verify code
    const body = await c.req.json();
    const { code } = EnableSchema.parse(body);
    
    if (!user.twoFactorSecret) {
      return c.json({ error: { code: 'NO_SECRET', message: 'No 2FA secret found. Run setup first.' } }, 400);
    }
    
    const isValid = await verifyTOTP(code, user.twoFactorSecret);
    
    if (!isValid) {
      return c.json({ error: { code: 'INVALID_CODE', message: 'Invalid verification code' } }, 401);
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hashPassword(code))
    );
    
    // Enable 2FA
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    user.updatedAt = new Date().toISOString();
    
    await kv.set(['users', user.id], user);
    
    return c.json({
      data: {
        enabled: true,
        backupCodes, // Show backup codes only once!
        message: 'Two-factor authentication enabled successfully. Save your backup codes in a safe place.'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } }, 400);
    }
    console.error('2FA enable error:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to enable 2FA' } }, 500);
  }
});

/**
 * POST /api/2fa/verify
 * Verify a 2FA code (TOTP or backup code)
 */
twoFactor.post('/verify', csrfProtection(), bodySizeLimits.json, async (c: Context) => {
  try {
    const body = await c.req.json();
    const { code } = VerifySchema.parse(body);
    
    // Get user ID from request context (set by login flow)
    const userId = c.get('pendingUserId');
    if (!userId) {
      return c.json({ error: { code: 'NO_USER_CONTEXT', message: 'No user context for 2FA verification' } }, 400);
    }
    
    // Get user from database
    const userEntry = await kv.get(['users', userId]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return c.json({ error: { code: '2FA_NOT_ENABLED', message: '2FA is not enabled for this user' } }, 400);
    }
    
    // Try TOTP first (6 digits)
    if (code.length === 6) {
      const isValid = await verifyTOTP(code, user.twoFactorSecret);
      if (isValid) {
        return c.json({
          data: {
            verified: true,
            method: 'totp'
          }
        });
      }
    }
    
    // Try backup codes (8 characters)
    if (code.length === 8 && user.twoFactorBackupCodes) {
      const bcrypt = await import('bcrypt');
      
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const hashedCode = user.twoFactorBackupCodes[i];
        const isValid = await bcrypt.compare(code, hashedCode);
        
        if (isValid) {
          // Remove used backup code
          user.twoFactorBackupCodes.splice(i, 1);
          user.updatedAt = new Date().toISOString();
          await kv.set(['users', user.id], user);
          
          return c.json({
            data: {
              verified: true,
              method: 'backup',
              remainingBackupCodes: user.twoFactorBackupCodes.length,
              message: user.twoFactorBackupCodes.length === 0 
                ? 'Warning: This was your last backup code. Please generate new ones.'
                : `Backup code used. ${user.twoFactorBackupCodes.length} remaining.`
            }
          });
        }
      }
    }
    
    return c.json({ error: { code: 'INVALID_CODE', message: 'Invalid verification code' } }, 401);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } }, 400);
    }
    console.error('2FA verification error:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to verify 2FA code' } }, 500);
  }
});

/**
 * POST /api/2fa/disable
 * Disable 2FA (requires password and current code)
 */
twoFactor.post('/disable', csrfProtection(), bodySizeLimits.json, async (c: Context) => {
  try {
    // Get access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'No access token provided' } }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    // Get user from database
    const userEntry = await kv.get(['users', payload.userId]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    
    // Verify password and code
    const body = await c.req.json();
    const { password, code } = DisableSchema.parse(body);
    
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return c.json({ error: { code: 'INVALID_PASSWORD', message: 'Invalid password' } }, 401);
    }
    
    if (!user.twoFactorSecret) {
      return c.json({ error: { code: '2FA_NOT_ENABLED', message: '2FA is not enabled' } }, 400);
    }
    
    const isValidCode = await verifyTOTP(code, user.twoFactorSecret);
    
    if (!isValidCode) {
      return c.json({ error: { code: 'INVALID_CODE', message: 'Invalid verification code' } }, 401);
    }
    
    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    user.updatedAt = new Date().toISOString();
    
    await kv.set(['users', user.id], user);
    
    return c.json({
      data: {
        disabled: true,
        message: 'Two-factor authentication has been disabled'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } }, 400);
    }
    console.error('2FA disable error:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to disable 2FA' } }, 500);
  }
});

/**
 * Generate random backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    codes.push(code);
  }
  
  return codes;
}

export default twoFactor;
