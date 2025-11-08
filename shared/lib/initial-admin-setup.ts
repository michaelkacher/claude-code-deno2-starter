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
import { createLogger } from './logger.ts';

const logger = createLogger('InitialAdminSetup');

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

  logger.info('Checking for initial admin setup', { email: initialAdminEmail });

  try {
    const userRepo = new UserRepository();
    
    // Check if user exists
    const user = await userRepo.findByEmail(initialAdminEmail);
    
    if (!user) {
      logger.warn('INITIAL_ADMIN_EMAIL user not found. Please sign up first.', { email: initialAdminEmail });
      return;
    }

    // Check if already admin
    if (user.role === 'admin') {
      logger.info('Initial admin already configured. Remove INITIAL_ADMIN_EMAIL from env.', { email: initialAdminEmail });
      return;
    }

    // Promote to admin
    await userRepo.update(user.id, { role: 'admin' });
    
    logger.info('INITIAL ADMIN CREATED - Remove INITIAL_ADMIN_EMAIL from env for security', {
      email: initialAdminEmail,
      name: user.name,
      userId: user.id,
    });
  } catch (error) {
    logger.error('Failed to setup initial admin', { error });
    // Don't throw - this is optional setup, shouldn't crash the app
  }
}
