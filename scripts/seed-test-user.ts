/**
 * Seed Script - Test User for Authentication
 * Creates a test user for login testing
 */

import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const kv = await Deno.openKv('./data/local.db');

// Create test user
const userId = crypto.randomUUID();
const email = 'test@example.com';
const password = 'password123';

// Hash password using bcrypt
console.log('🔐 Hashing password...');
const hashedPassword = await bcrypt.hash(password);

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
