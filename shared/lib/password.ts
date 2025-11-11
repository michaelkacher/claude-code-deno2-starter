/**
 * Password hashing utilities using bcrypt
 * 
 * bcrypt is designed for password hashing with:
 * - Adaptive cost factor (can increase over time)
 * - Built-in salt generation
 * - Resistant to brute force attacks
 */

import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { createLogger } from './logger.ts';

const logger = createLogger('Password');

// Use lower cost factor in tests for faster execution
// Cost 4 = ~3ms, Cost 10 = ~100ms
const BCRYPT_COST = Deno.env.get('DENO_ENV') === 'test' ? 4 : 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Cost factor of 10 is a good balance between security and performance
  // Each increment doubles the time required
  // In tests, use cost 4 for faster execution
  return await bcrypt.hash(password, await bcrypt.genSalt(BCRYPT_COST));
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Previously hashed password
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // If hash is invalid format, return false
    logger.error('Password verification error', { error });
    return false;
  }
}
