/// <reference lib="deno.unstable" />
/**
 * TOTP (Time-based One-Time Password) Implementation
 * Used for Two-Factor Authentication (2FA)
 * 
 * Based on RFC 6238: https://tools.ietf.org/html/rfc6238
 */

import { decodeBase32, encodeBase32 } from '@std/encoding/base32';

/**
 * Generate a random secret key for TOTP
 * Returns a base32-encoded secret (160 bits / 20 bytes)
 */
export function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32(bytes);
}

/**
 * Generate HMAC-SHA1 hash
 */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  // Create a new buffer to ensure proper ArrayBuffer type
  const keyBuffer = new Uint8Array(key);
  const messageBuffer = new Uint8Array(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  return new Uint8Array(signature);
}

/**
 * Generate a TOTP code
 * @param secret - Base32-encoded secret key
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits in the code (default: 6)
 */
export async function generateTOTP(
  secret: string,
  timeStep = 30,
  digits = 6
): Promise<string> {
  // Decode the base32 secret
  const key = decodeBase32(secret);
  
  // Get the current time counter (Unix timestamp / time step)
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  
  // Convert counter to 8-byte buffer (big-endian)
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(4, counter, false); // Big-endian
  
  // Generate HMAC-SHA1
  const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));
  
  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncatedHash = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  );
  
  // Generate the code
  const code = truncatedHash % Math.pow(10, digits);
  
  // Pad with leading zeros if necessary
  return code.toString().padStart(digits, '0');
}

/**
 * Verify a TOTP code
 * @param code - The code to verify
 * @param secret - Base32-encoded secret key
 * @param window - Number of time steps to check (default: 1 = ±30 seconds)
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits in the code (default: 6)
 */
export async function verifyTOTP(
  code: string,
  secret: string,
  window = 1,
  timeStep = 30,
  digits = 6
): Promise<boolean> {
  // Check current time and ±window time steps
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const testTime = (currentCounter + i) * timeStep * 1000;
    const originalNow = Date.now;
    
    // Temporarily override Date.now() for testing different time windows
    // @ts-ignore - Need to override Date.now for time window testing
    Date.now = () => testTime;
    
    try {
      const expectedCode = await generateTOTP(secret, timeStep, digits);
      if (code === expectedCode) {
        return true;
      }
    } finally {
      // Restore original Date.now()
      Date.now = originalNow;
    }
  }
  
  return false;
}

/**
 * Generate a QR code URL for Google Authenticator
 * @param secret - Base32-encoded secret key
 * @param accountName - User's email or account identifier
 * @param issuer - Application name
 */
export function generateQRCodeURL(
  secret: string,
  accountName: string,
  issuer: string
): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generate a QR code data URL for display
 * Uses a QR code API service
 */
export function generateQRCodeDataURL(otpURL: string): string {
  const encodedURL = encodeURIComponent(otpURL);
  // Using Google Charts API for QR code generation
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodedURL}`;
}
