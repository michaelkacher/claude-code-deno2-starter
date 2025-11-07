/**
 * Initial Admin Setup
 * One-time setup: Automatically promote first admin user on startup
 * 
 * Set INITIAL_ADMIN_EMAIL environment variable to the email address
 * that should be promoted to admin on first login.
 * 
 * Security: Only runs if:
 * - DISABLE_AUTH=false (authentication is enabled)
 * - INITIAL_ADMIN_EMAIL is set
 * - User with that email exists
 * - User is not already an admin
 * 
 * After first admin is created, remove INITIAL_ADMIN_EMAIL from env vars.
 */

import { UserRepository } from '../repositories/index.ts';

/**
 * Setup initial admin user if specified in environment
 * Safe to call on every startup - only promotes once
 */
export async function setupInitialAdmin(): Promise<void> {
  // Check if auth is disabled
  const authDisabled = Deno.env.get('DISABLE_AUTH') === 'true';
  
  if (authDisabled) {
    // Auth is disabled, no need for admin setup
    return;
  }

  // Check if initial admin email is specified
  const initialAdminEmail = Deno.env.get('INITIAL_ADMIN_EMAIL');
  
  if (!initialAdminEmail) {
    // No initial admin specified, skip silently
    return;
  }

  console.log(`🔍 Checking for initial admin setup: ${initialAdminEmail}`);

  try {
    const userRepo = new UserRepository();
    
    // Check if user exists
    const user = await userRepo.findByEmail(initialAdminEmail);
    
    if (!user) {
      console.warn(`⚠️  INITIAL_ADMIN_EMAIL set to "${initialAdminEmail}" but user not found.`);
      console.warn(`   Please sign up with this email first, then restart the server.`);
      return;
    }

    // Check if already admin
    if (user.role === 'admin') {
      console.log(`✅ Initial admin already configured: ${initialAdminEmail}`);
      console.log(`   You can now remove INITIAL_ADMIN_EMAIL from your environment variables.`);
      return;
    }

    // Promote to admin
    await userRepo.update(user.id, { role: 'admin' });
    
    console.log(`\n┌─────────────────────────────────────────────────────┐`);
    console.log(`│ ✅ INITIAL ADMIN CREATED                            │`);
    console.log(`├─────────────────────────────────────────────────────┤`);
    console.log(`│ Email: ${initialAdminEmail.padEnd(42)} │`);
    console.log(`│ Name:  ${user.name.padEnd(42)} │`);
    console.log(`│ ID:    ${user.id.substring(0, 42).padEnd(42)} │`);
    console.log(`├─────────────────────────────────────────────────────┤`);
    console.log(`│ ⚠️  IMPORTANT: Remove INITIAL_ADMIN_EMAIL from      │`);
    console.log(`│    your environment variables now for security.    │`);
    console.log(`└─────────────────────────────────────────────────────┘\n`);
  } catch (error) {
    console.error('❌ Failed to setup initial admin:', error);
    // Don't throw - this is optional setup, shouldn't crash the app
  }
}
