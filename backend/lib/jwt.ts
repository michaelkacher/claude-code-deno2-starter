import { create, verify } from 'jsr:@std/crypto/jwt';
import { env } from '../config/env.ts';

export async function createToken(payload: Record<string, unknown>) {
  const jwt = await create({ alg: 'HS256', typ: 'JWT' }, payload, env.JWT_SECRET!);
  return jwt;
}

export async function verifyToken(token: string) {
  try {
    const payload = await verify(token, env.JWT_SECRET!, 'HS256');
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}