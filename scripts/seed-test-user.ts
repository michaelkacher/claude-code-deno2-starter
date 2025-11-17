/**
 * Seed Script - Admin User for Authentication
 * Creates an admin user for login testing
 */

import { hashPassword } from '@/lib/password.ts';

const kv = await Deno.openKv('./data/local.db');

// Create admin user
const userId = crypto.randomUUID();
const email = 'admin@dev.local';
const password = 'admin123';

// Hash password using PBKDF2
console.log('🔐 Hashing password...');
const hashedPassword = await hashPassword(password);

const user = {
  id: userId,
  email,
  password: hashedPassword,
  name: 'Admin User',
  role: 'admin',
  emailVerified: true,
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
  console.log('✅ Admin user created successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('👤 User ID:', userId);
  console.log('👑 Role: admin');
} else {
  console.error('❌ Failed to create admin user');
}

kv.close();
