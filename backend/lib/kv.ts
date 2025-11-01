import { env } from '../config/env.ts';

let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (kvInstance) return kvInstance;

  // Prefer explicit path if provided
  const path = env.DENO_KV_PATH
    ? env.DENO_KV_PATH
    : (env.DENO_ENV === 'production' ? undefined : './data/local.db');

  kvInstance = await Deno.openKv(path);
  return kvInstance;
}
