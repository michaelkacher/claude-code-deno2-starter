/**
 * Security Validation Utilities
 * 
 * Validates critical security settings before server startup
 * Prevents common misconfigurations in production environments
 */

import { createLogger } from './logger.ts';

const logger = createLogger('SecurityValidation');

// The default development JWT secret from .env.example
const DEFAULT_DEV_JWT_SECRET = 'dev-secret-key-change-in-production-12345678901234567890';

/**
 * Validates that production environment has proper security configuration
 * Throws error and prevents server startup if critical issues are found
 */
export function validateProductionSecurity(): void {
  const env = Deno.env.get('DENO_ENV');
  
  // Only validate in production
  if (env !== 'production') {
    return;
  }

  logger.info('Running production security validation...');

  const errors: string[] = [];

  // Check JWT_SECRET
  const jwtSecret = Deno.env.get('JWT_SECRET');
  
  if (!jwtSecret) {
    errors.push('JWT_SECRET is not set');
  } else if (jwtSecret === DEFAULT_DEV_JWT_SECRET) {
    errors.push('JWT_SECRET is still set to the default development value');
  } else if (jwtSecret.length < 32) {
    errors.push(`JWT_SECRET is too short (${jwtSecret.length} chars, minimum 32 required)`);
  }

  // If there are errors, shut down with detailed message
  if (errors.length > 0) {
    const border = '='.repeat(80);
    console.error('\n' + border);
    console.error('🚨 CRITICAL SECURITY ERROR - SERVER STARTUP BLOCKED');
    console.error(border);
    console.error('\nProduction environment detected with insecure configuration:\n');
    
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ❌ ${error}`);
    });
    
    console.error('\n' + border);
    console.error('HOW TO FIX:');
    console.error(border);
    console.error('\n1. Generate a secure JWT secret:');
    console.error('   openssl rand -base64 32\n');
    console.error('2. Set it as an environment variable:');
    console.error('   export JWT_SECRET="your-generated-secret-here"\n');
    console.error('3. Or add it to your deployment platform\'s environment variables\n');
    console.error('⚠️  NEVER use the default development secret in production!');
    console.error('⚠️  NEVER commit production secrets to version control!');
    console.error('\n' + border + '\n');
    
    logger.error('Production security validation failed', { errors });
    
    // Exit with error code
    Deno.exit(1);
  }

  logger.info('✅ Production security validation passed');
}

/**
 * Validates security configuration for all environments
 * Logs warnings for development but doesn't block startup
 */
export function validateSecurityConfig(): void {
  const env = Deno.env.get('DENO_ENV') || 'development';
  
  logger.info(`Validating security configuration for ${env} environment`);

  const jwtSecret = Deno.env.get('JWT_SECRET');
  
  if (!jwtSecret) {
    if (env === 'development') {
      logger.warn('JWT_SECRET not set - authentication will not work');
      logger.warn('Using default from .env.example is recommended for local development');
    } else {
      logger.error('JWT_SECRET not set - authentication will not work');
    }
    return;
  }

  // Warn if using default in non-production (but don't block)
  if (jwtSecret === DEFAULT_DEV_JWT_SECRET && env !== 'production') {
    logger.warn('Using default development JWT_SECRET - OK for local development');
    logger.warn('Remember to change this before deploying to production!');
  }

  // Check minimum length
  if (jwtSecret.length < 32) {
    const message = `JWT_SECRET is too short (${jwtSecret.length} chars, minimum 32 recommended)`;
    if (env === 'production') {
      logger.error(message);
    } else {
      logger.warn(message);
    }
  }
}
