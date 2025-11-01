/**
 * Make User Admin Script
 * Promote a user to admin role by email
 */

import { getKv } from '../backend/lib/kv.ts';

const kv = await getKv();

async function makeAdmin(email: string) {
  try {
    // Find user by email
    const userByEmailEntry = await kv.get(['users_by_email', email]);
    
    if (!userByEmailEntry.value) {
      console.error(`❌ User with email "${email}" not found`);
      Deno.exit(1);
    }

    const userId = userByEmailEntry.value as string;
    const userEntry = await kv.get(['users', userId]);

    if (!userEntry.value) {
      console.error(`❌ User data not found for ID: ${userId}`);
      Deno.exit(1);
    }

    const user = userEntry.value as any;

    if (user.role === 'admin') {
      console.log(`ℹ️  User "${user.name}" (${email}) is already an admin`);
      return;
    }

    // Update user role to admin
    const updatedUser = {
      ...user,
      role: 'admin',
      updatedAt: new Date().toISOString(),
    };

    await kv.set(['users', userId], updatedUser);

    console.log(`✅ User "${user.name}" (${email}) promoted to admin!`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Updated at: ${updatedUser.updatedAt}`);
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    Deno.exit(1);
  } finally {
    kv.close();
  }
}

// Get email from command line arguments
const email = Deno.args[0];

if (!email) {
  console.log('Usage: deno task users:make-admin <email>');
  console.log('Example: deno task users:make-admin test@example.com');
  Deno.exit(1);
}

await makeAdmin(email);
