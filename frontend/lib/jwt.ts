/**
 * JWT Utility Functions
 * Minimal client-side JWT helpers (no verification, just decoding and validation)
 */

import { decodeBase64 } from '@std/encoding/base64';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  emailVerified: boolean;
  iat: number;
  exp: number;
}

/**
 * Check if a string has valid JWT structure (3 base64 parts)
 */
export function isValidJwtStructure(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Decode JWT payload without verification (works in both browser and server)
 */
export function decodeJwt(token: string): JwtPayload {
  if (!isValidJwtStructure(token)) {
    throw new Error('Invalid JWT structure');
  }

  try {
    const parts = token.split('.');
    // JWT uses base64url encoding, replace characters
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (payload.length % 4 !== 0) {
      payload += '=';
    }
    
    // Decode using Deno's std library (works in both browser and server)
    const decoded = new TextDecoder().decode(decodeBase64(payload));
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error(`Failed to decode JWT payload: ${error}`);
  }
}

/**
 * Check if JWT is expired based on exp claim
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true; // If we can't decode it, consider it expired
  }
}
