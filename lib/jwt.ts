import { create, getNumericDate, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { TokenConfig } from './config.ts';

export function parseDurationToSeconds(input: string): number {
  const match = input.match(/^(\d+)([smhdw])$/);
  if (!match) return 60 * 60 * 24 * 7; // default 7d
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    case 'w':
      return value * 60 * 60 * 24 * 7;
    default:
      return 60 * 60 * 24 * 7;
  }
}

// Cache the HMAC key to avoid re-creating it on every request
let cachedHmacKey: CryptoKey | null = null;

export async function getHmacKey(): Promise<CryptoKey> {
  if (cachedHmacKey) {
    return cachedHmacKey;
  }
  
  const jwtSecret = Deno.env.get('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const enc = new TextEncoder();
  cachedHmacKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  return cachedHmacKey;
}

export async function createToken(payload: Record<string, unknown>, customExpiry?: string) {
  const key = await getHmacKey();
  const jwtExpiresIn = Deno.env.get('JWT_EXPIRES_IN') || '7d';
  const expSeconds = customExpiry 
    ? parseDurationToSeconds(customExpiry)
    : parseDurationToSeconds(jwtExpiresIn);
  const jwt = await create(
    { alg: 'HS256', typ: 'JWT' },
    { ...payload, exp: getNumericDate(expSeconds) },
    key,
  );
  return jwt;
}

/**
 * Create access token (short-lived, configured expiry time)
 */
export async function createAccessToken(payload: Record<string, unknown>) {
  return await createToken({ ...payload, type: 'access' }, TokenConfig.getAccessTokenExpiry());
}

/**
 * Create refresh token (long-lived, configured expiry time)
 */
export async function createRefreshToken(payload: Record<string, unknown>) {
  const tokenId = crypto.randomUUID();
  return {
    token: await createToken({ ...payload, type: 'refresh', jti: tokenId }, TokenConfig.getRefreshTokenExpiry()),
    tokenId,
  };
}

export async function verifyToken(token: string) {
  try {
    const key = await getHmacKey();
    const payload = await verify(token, key);
    return payload as Record<string, unknown>;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Check if a JWT token is expired (client-side utility)
 * @param token - The JWT token to check
 * @returns true if expired or invalid, false if valid
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  try {
    // Decode JWT without verification (just to check expiry)
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) return true;
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Decode JWT token without verification (for middleware use)
 * @param token - The JWT token to decode
 * @returns Decoded payload or null if invalid
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if a string has valid JWT structure
 * @param token - The string to check
 * @returns true if it has valid JWT structure (3 parts separated by dots)
 */
export function isValidJwtStructure(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}
