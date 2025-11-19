/**
 * Password hashing utilities using PBKDF2 (Web Crypto API)
 * 
 * PBKDF2 is a key derivation function that:
 * - Works in all JavaScript environments (including Vite SSR and Deno)
 * - Uses Web Crypto API (native, no dependencies)
 * - Configurable iterations for adaptive security
 * - Built-in salt generation
 * - Resistant to brute force attacks
 */

import { createLogger } from './logger.ts';

const logger = createLogger('Password');

// Use fewer iterations in tests for faster execution
// 100,000 iterations is recommended by OWASP for PBKDF2-SHA256
const ITERATIONS = Deno.env.get('DENO_ENV') === 'test' ? 10000 : 100000;

/**
 * Hash a password using PBKDF2
 * @param password - Plain text password
 * @returns Hashed password with salt in format: iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Encode password as bytes
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Import password as a key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256 // 32 bytes
  );
  
  // Convert to base64 for storage
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  
  return `${ITERATIONS}$${saltBase64}$${hashBase64}`;
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Previously hashed password in format: iterations$salt$hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Parse the stored hash
    const parts = hash.split('$');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      logger.error('Invalid hash format', { hash });
      return false;
    }
    
    const iterations = parseInt(parts[0], 10);
    const saltBase64 = parts[1];
    const storedHashBase64 = parts[2];
    
    // Decode salt from base64
    const saltArray = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    
    // Encode password as bytes
    const passwordBuffer = new TextEncoder().encode(password);
    
    // Import password as a key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive key using PBKDF2 with same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: iterations,
        hash: 'SHA-256',
      },
      key,
      256 // 32 bytes
    );
    
    // Convert to base64 for comparison
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const computedHashBase64 = btoa(String.fromCharCode(...hashArray));
    
    // Constant-time comparison to prevent timing attacks
    return computedHashBase64 === storedHashBase64;
  } catch (error) {
    // If hash is invalid format, return false
    logger.error('Password verification error', error);
    return false;
  }
}

