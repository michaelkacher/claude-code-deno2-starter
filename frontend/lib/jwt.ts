/**
 * JWT Utility Functions
 * Minimal client-side JWT helpers (no verification, just decoding and validation)
 */

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
 * Decode JWT payload without verification (client-side only)
 */
export function decodeJwt(token: string): JwtPayload {
  if (!isValidJwtStructure(token)) {
    throw new Error('Invalid JWT structure');
  }

  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    throw new Error('Failed to decode JWT payload');
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
