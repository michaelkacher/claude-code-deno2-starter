/**
 * List All Users Script
 * View all registered users in the database
 * 
 * Usage: deno run --allow-env --allow-read scripts/list-users.ts
 */

import { getKv } from '../shared/lib/kv.ts';

const kv = await getKv();

console.log('\n📋 Registered Users:\n');
console.log('═'.repeat(100));

let count = 0;
const users = kv.list({ prefix: ['users'] });

for await (const entry of users) {
  const user = entry.value as User;
  count++;
  
  console.log(`\n${count}. ${user.name}`);
  console.log(`   Email:           ${user.email}`);
  console.log(`   Role:            ${user.role}`);
  console.log(`   Email Verified:  ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
  console.log(`   Created:         ${new Date(user.createdAt).toLocaleString()}`);
  console.log(`   User ID:         ${user.id}`);
  
  if (user.emailVerifiedAt) {
    console.log(`   Verified At:     ${new Date(user.emailVerifiedAt).toLocaleString()}`);
  }
}

console.log('\n' + '═'.repeat(100));
console.log(`\n✨ Total Users: ${count}\n`);

kv.close();
