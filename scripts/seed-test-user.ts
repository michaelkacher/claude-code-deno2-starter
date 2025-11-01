/**
 * Seed Script - Test User for Authentication
 * Creates a test user for login testing
 */

import { encodeHex } from 'jsr:@std/encoding/hex';

const kv = await Deno.openKv('./data/local.db');

// Create test user
const userId = crypto.randomUUID();
const email = 'test@example.com';
const password = 'password123';

// Hash password
const encoder = new TextEncoder();
const data = encoder.encode(password);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashedPassword = encodeHex(new Uint8Array(hashBuffer));

const user = {
  id: userId,
  email,
  password: hashedPassword,
  name: 'Test User',
  role: 'user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Store user with atomic write
const result = await kv
  .atomic()
  .set(['users', userId], user)
  .set(['users_by_email', email], userId)
  .commit();

if (result.ok) {
  console.log('✅ Test user created successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('👤 User ID:', userId);
} else {
  console.error('❌ Failed to create test user');
}

kv.close();
