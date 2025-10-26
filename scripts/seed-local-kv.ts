#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Seed Local Deno KV Database
 *
 * This script populates the local KV database with sample data for development.
 * Modify the seed data below to match your application's needs.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env scripts/seed-local-kv.ts
 *   or
 *   deno task seed-kv (if added to deno.json tasks)
 */

// Set environment to development to ensure we use local DB
Deno.env.set('DENO_ENV', 'development');

// Open local KV database
const kv = await Deno.openKv('./data/local.db');

console.log('🌱 Seeding local Deno KV database...\n');

try {
  // Example: Seed users
  const users = [
    {
      id: crypto.randomUUID(),
      email: 'alice@example.com',
      name: 'Alice Johnson',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      email: 'bob@example.com',
      name: 'Bob Smith',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  console.log('Creating users...');
  for (const user of users) {
    // Store user by ID (primary key)
    await kv.set(['users', user.id], user);

    // Create secondary index by email
    await kv.set(['users_by_email', user.email], user.id);

    console.log(`  ✅ ${user.name} (${user.email})`);
  }

  // Example: Add more seed data here
  // const posts = [...];
  // for (const post of posts) {
  //   await kv.set(['posts', post.id], post);
  // }

  console.log('\n✅ Seeding complete!');
  console.log(`   Created ${users.length} users\n`);
} catch (error) {
  console.error('❌ Error seeding database:', error);
} finally {
  await kv.close();
}
