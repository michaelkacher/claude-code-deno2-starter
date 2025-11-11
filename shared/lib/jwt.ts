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

export async function getHmacKey(): Promise<CryptoKey> {
  const jwtSecret = Deno.env.get('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
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