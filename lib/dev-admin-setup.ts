/**
 * Development Admin Auto-Setup
 * Automatically creates a default admin user on first run in development mode
 * 
 * Runs when:
 * - DENO_ENV=development (or undefined, defaulting to development)
 * - Database has zero users (first run detection)
 * 
 * Creates a test admin with well-known credentials for local development.
 * Credentials can be customized via environment variables.
 * 
 * Security: Only runs in development, never in production.
 */

import { UserRepository } from '../repositories/index.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('DevAdminSetup');

/**
 * Display admin credentials to console and write to file
 * @param email - Admin email
 * @param password - Admin password
 * @param name - Admin name
 * @param isFirstRun - Whether this is the first run (affects messaging)
 */
function displayAdminCredentials(
  email: string, 
  password: string, 
  name: string, 
  isFirstRun: boolean
): void {
  const border = '='.repeat(70);
  const title = isFirstRun 
    ? '🎉 FIRST RUN DETECTED - Development Admin Created!'
    : '🔑 Development Admin Credentials (Single User Detected)';
  
  console.log('\n' + border);
  console.log(title);
  console.log(border);
  console.log('📧 Email:    ' + email);
  console.log('🔑 Password: ' + password);
  console.log('👤 Name:     ' + name);
  console.log('');
  console.log('🌐 Login at: http://localhost:3000/login');
  console.log('');
  console.log('⚠️  DEVELOPMENT ONLY - These credentials are for local dev');
  console.log('   Never use these in production!');
  console.log('');
  console.log('💡 Customize via environment variables:');
  console.log('   DEV_ADMIN_EMAIL=your@email.com');
  console.log('   DEV_ADMIN_PASSWORD=yourpassword');
  console.log('   DEV_ADMIN_NAME="Your Name"');
  
  if (isFirstRun) {
    console.log('');
    console.log('💾 Credentials saved to: .dev-admin-credentials.txt');
    console.log('   (This file persists across dev server restarts)');
  }
  console.log(border + '\n');
  
  // Write credentials to file for persistence across watcher restarts
  if (isFirstRun) {
    try {
      const credentialsContent = `
${border}
DEVELOPMENT ADMIN CREDENTIALS
${border}

Email:    ${email}
Password: ${password}
Name:     ${name}

Login at: http://localhost:3000/login

⚠️  DEVELOPMENT ONLY - These credentials are for local dev
   Never use these in production!

💡 Customize via environment variables:
   DEV_ADMIN_EMAIL=your@email.com
   DEV_ADMIN_PASSWORD=yourpassword
   DEV_ADMIN_NAME="Your Name"

This file is auto-generated on first run and can be deleted.
${border}
`.trim();

      Deno.writeTextFileSync('.dev-admin-credentials.txt', credentialsContent);
      logger.debug('Credentials written to .dev-admin-credentials.txt');
    } catch (error) {
      logger.warn('Failed to write credentials file', error);
    }
  }
}

/**
 * Auto-create dev admin user on first run
 * Safe to call on every startup - only creates when needed
 */
export async function setupDevAdmin(): Promise<void> {
  // Only run in development mode
  const denoEnv = Deno.env.get('DENO_ENV');
  const isDevelopment = !denoEnv || denoEnv === 'development';
  
  if (!isDevelopment) {
    logger.debug('Skipping dev admin setup - not in development mode');
    return; // Skip in production/staging/test
  }

  logger.info('Running dev admin setup check...');

  try {
    const userRepo = new UserRepository();
    
    // Check if any users exist
    const userCount = await userRepo.countUsers();
    logger.debug('User count check', { userCount });
    
    // Get default credentials (used for both creation and display)
    const defaultEmail = 'admin@dev.local';
    const defaultPassword = 'admin123';
    
    const email = Deno.env.get('DEV_ADMIN_EMAIL') || defaultEmail;
    const password = Deno.env.get('DEV_ADMIN_PASSWORD') || defaultPassword;
    const name = Deno.env.get('DEV_ADMIN_NAME') || 'Dev Admin';

    if (userCount > 0) {
      // If there's exactly 1 user, it's likely the dev admin we just created
      // Display credentials again in case watcher restarted and cleared the logs
      if (userCount === 1) {
        logger.info('Single user detected (likely dev admin), displaying credentials');
        displayAdminCredentials(email, password, name, false);
      } else {
        logger.info('Users already exist, skipping dev admin creation');
      }
      return;
    }

    // First run detected - create dev admin
    logger.info('First run detected - creating development admin user');

    // Create the admin user
    await userRepo.create({
      email,
      password,
      name,
      role: 'admin',
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });

    // Display success message with credentials
    displayAdminCredentials(email, password, name, true);

    logger.info('Development admin created successfully', { 
      email, 
      name,
      usingDefaults: email === defaultEmail && password === defaultPassword
    });
  } catch (error) {
    // Log error prominently - this is important for first-run experience
    console.error('\n❌ FAILED TO CREATE DEVELOPMENT ADMIN USER');
    console.error('Error:', error);
    console.error('You can still use the app by signing up manually at /signup\n');
    logger.error('Failed to setup development admin', { error });
    // Don't throw - this shouldn't crash the app
    // User can still create account manually via signup
  }
}

