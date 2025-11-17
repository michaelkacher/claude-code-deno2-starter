/**
 * Get User ID for Email
 * Helper script to find a user's ID by email
 * 
 * Run with: deno run --allow-env --allow-read --unstable-kv scripts/get-user-id.ts test@example.com
 */

import '@std/dotenv/load';
import { getKv } from '@/lib/kv.ts';

const email = Deno.args[0];

if (!email) {
  console.error('Usage: deno run --allow-env --allow-read --unstable-kv scripts/get-user-id.ts <email>');
  Deno.exit(1);
}

const kv = await getKv();

// Get user ID from email index
const userIdEntry = await kv.get<string>(['users_by_email', email.toLowerCase()]);

if (!userIdEntry.value) {
  console.log(`❌ User not found with email: ${email}`);
  Deno.exit(1);
}

const userId = userIdEntry.value;
console.log(`✓ Found user: ${email}`);
console.log(`User ID: ${userId}`);

// Get full user data
const userEntry = await kv.get(['users', userId]);
if (userEntry.value) {
  console.log('\nUser Details:');
  console.log(JSON.stringify(userEntry.value, null, 2));
}

kv.close();
