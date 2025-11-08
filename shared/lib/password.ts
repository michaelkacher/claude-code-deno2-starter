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

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Cost factor of 10 is a good balance between security and performance
  // Each increment doubles the time required
  return await bcrypt.hash(password);
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
