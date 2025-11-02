/**
 * Environment variable validation and configuration
 *
 * This module validates all environment variables at startup and provides
 * type-safe access to configuration values throughout the application.
 *
 * Features:
 * - Runtime validation using Zod
 * - Type-safe access to env vars
 * - Clear error messages for misconfigured variables
 * - Support for required and optional variables
 * - Automatic type coercion (strings to numbers, booleans, etc.)
 *
 * @example
 * ```typescript
 * import { env } from './config/env.ts';
 *
 * // Type-safe access to validated env vars
 * const port = env.PORT; // number
 * const apiUrl = env.API_URL; // string (URL)
 * const isProduction = env.IS_PRODUCTION; // boolean
 * ```
 */

import { z } from 'zod';

// ============================================================================
// Environment Schema Definition
// ============================================================================

/**
 * Zod schema for environment variables
 * Add new environment variables here with their validation rules
 */
const envSchema = z.object({
  // ===== Application Environment =====
  DENO_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development')
    .describe('Application environment'),

  // ===== Server Configuration =====
  PORT: z
    .string()
    .default('8000')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        throw new Error('PORT must be a valid number');
      }
      if (num < 1 || num > 65535) {
        throw new Error('PORT must be between 1 and 65535');
      }
      return num;
    })
    .describe('Backend server port'),

  // ===== API Configuration =====
  API_URL: z
    .string()
    .url()
    .default('http://localhost:8000/api')
    .describe('Backend API base URL'),

  // ===== Frontend Configuration =====
  FRONTEND_PORT: z
    .string()
    .default('3000')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num)) {
        throw new Error('FRONTEND_PORT must be a valid number');
      }
      if (num < 1 || num > 65535) {
        throw new Error('FRONTEND_PORT must be between 1 and 65535');
      }
      return num;
    })
    .describe('Frontend server port'),

  FRONTEND_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
    .describe('Frontend base URL'),

  // ===== CORS Configuration =====
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .describe('CORS allowed origin'),

  // ===== Database Configuration =====
  DENO_KV_PATH: z
    .string()
    .optional()
    .describe('Custom path for Deno KV database (optional)'),

  DATABASE_URL: z
    .string()
    .url()
    .optional()
    .describe('PostgreSQL connection URL (optional, alternative to Deno KV)'),

  DB_POOL_SIZE: z
    .string()
    .default('20')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) {
        throw new Error('DB_POOL_SIZE must be a positive number');
      }
      return num;
    })
    .describe('Database connection pool size'),

  // ===== Authentication =====
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .optional()
    .describe('Secret key for JWT token signing (required for auth features)'),

  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhdw]$/, 'JWT_EXPIRES_IN must be a valid duration (e.g., 7d, 24h)')
    .default('7d')
    .describe('JWT token expiration time'),

  DISABLE_AUTH: z
    .union([
      z.string().transform(val => val === 'true'),
      z.boolean()
    ])
    .default(true)
    .describe('Disable authentication for local development'),

  // ===== Third-Party API Keys =====
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_')
    .optional()
    .describe('Stripe API secret key'),

  SENDGRID_API_KEY: z
    .string()
    .startsWith('SG.', 'SENDGRID_API_KEY must start with SG.')
    .optional()
    .describe('SendGrid email service API key'),

  AWS_ACCESS_KEY_ID: z
    .string()
    .optional()
    .describe('AWS access key ID'),

  AWS_SECRET_ACCESS_KEY: z
    .string()
    .optional()
    .describe('AWS secret access key'),

  // ===== Feature Flags =====
  ENABLE_ANALYTICS: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .describe('Enable analytics tracking'),

  ENABLE_DEBUG_MODE: z
    .string()
    .default('false')
    .transform((val) => val === 'true')
    .describe('Enable debug mode with verbose logging'),

  // ===== Deployment Configuration =====
  DENO_DEPLOY_PROJECT: z
    .string()
    .optional()
    .describe('Deno Deploy project name'),

  DENO_DEPLOY_TOKEN: z
    .string()
    .optional()
    .describe('Deno Deploy authentication token (for CI/CD)'),
});

// ============================================================================
// Type Inference
// ============================================================================

/**
 * TypeScript type for validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

// ============================================================================
// Validation and Export
// ============================================================================

/**
 * Validates environment variables and returns typed configuration
 * Throws detailed error if validation fails
 */
function validateEnv(): Env {
  try {
    // Parse and validate environment variables
    return envSchema.parse({
      DENO_ENV: Deno.env.get('DENO_ENV'),
      PORT: Deno.env.get('PORT'),
      API_URL: Deno.env.get('API_URL'),
      FRONTEND_PORT: Deno.env.get('FRONTEND_PORT'),
      FRONTEND_URL: Deno.env.get('FRONTEND_URL'),
      CORS_ORIGIN: Deno.env.get('CORS_ORIGIN'),
      DENO_KV_PATH: Deno.env.get('DENO_KV_PATH'),
      DATABASE_URL: Deno.env.get('DATABASE_URL'),
      DB_POOL_SIZE: Deno.env.get('DB_POOL_SIZE'),
      JWT_SECRET: Deno.env.get('JWT_SECRET'),
      JWT_EXPIRES_IN: Deno.env.get('JWT_EXPIRES_IN'),
      DISABLE_AUTH: Deno.env.get('DISABLE_AUTH'),
      STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
      SENDGRID_API_KEY: Deno.env.get('SENDGRID_API_KEY'),
      AWS_ACCESS_KEY_ID: Deno.env.get('AWS_ACCESS_KEY_ID'),
      AWS_SECRET_ACCESS_KEY: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
      ENABLE_ANALYTICS: Deno.env.get('ENABLE_ANALYTICS'),
      ENABLE_DEBUG_MODE: Deno.env.get('ENABLE_DEBUG_MODE'),
      DENO_DEPLOY_PROJECT: Deno.env.get('DENO_DEPLOY_PROJECT'),
      DENO_DEPLOY_TOKEN: Deno.env.get('DENO_DEPLOY_TOKEN'),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors into readable message
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.');
        return `  ❌ ${path}: ${err.message}`;
      });

      console.error('\n🚨 Environment Variable Validation Failed:\n');
      console.error(errorMessages.join('\n'));
      console.error('\n💡 Tips:');
      console.error('  - Check your .env file exists and is properly formatted');
      console.error('  - Compare with .env.example for reference');
      console.error('  - Ensure all required variables are set');
      console.error('  - Validate URLs, ports, and API keys are correct\n');

      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

/**
 * Validated and typed environment configuration
 * Use this throughout your application for type-safe access to env vars
 */
export const env = validateEnv();

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Computed boolean flags for common environment checks
 */
export const isDevelopment = env.DENO_ENV === 'development';
export const isTest = env.DENO_ENV === 'test';
export const isStaging = env.DENO_ENV === 'staging';
export const isProduction = env.DENO_ENV === 'production';

/**
 * Check if required secrets are configured for auth features
 */
export function requireAuth() {
  if (!env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is required for authentication features. Please set it in your .env file.'
    );
  }
}

/**
 * Check if required AWS credentials are configured
 */
export function requireAWS() {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required for AWS features. Please set them in your .env file.'
    );
  }
}

/**
 * Check if Stripe is configured
 */
export function requireStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is required for payment features. Please set it in your .env file.'
    );
  }
}

/**
 * Check if SendGrid is configured
 */
export function requireSendGrid() {
  if (!env.SENDGRID_API_KEY) {
    throw new Error(
      'SENDGRID_API_KEY is required for email features. Please set it in your .env file.'
    );
  }
}

/**
 * Print current configuration (for debugging)
 * Redacts sensitive values in production
 */
export function printConfig() {
  const redact = (value: string | number | boolean | undefined) => {
    if (isProduction && typeof value === 'string') {
      return '***REDACTED***';
    }
    return value;
  };

  console.log('\n📋 Current Configuration:');
  console.log(`  Environment: ${env.DENO_ENV}`);
  console.log(`  Backend Port: ${env.PORT}`);
  console.log(`  API URL: ${env.API_URL}`);
  console.log(`  Frontend Port: ${env.FRONTEND_PORT}`);
  console.log(`  Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`  CORS Origin: ${env.CORS_ORIGIN}`);
  console.log(`  Analytics: ${env.ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);
  console.log(`  Debug Mode: ${env.ENABLE_DEBUG_MODE ? 'Enabled' : 'Disabled'}`);
  console.log(`  JWT Secret: ${env.JWT_SECRET ? redact(env.JWT_SECRET) : 'Not set'}`);
  console.log(`  Stripe: ${env.STRIPE_SECRET_KEY ? redact(env.STRIPE_SECRET_KEY) : 'Not configured'}`);
  console.log(`  SendGrid: ${env.SENDGRID_API_KEY ? redact(env.SENDGRID_API_KEY) : 'Not configured'}`);
  console.log(`  AWS: ${env.AWS_ACCESS_KEY_ID ? redact(env.AWS_ACCESS_KEY_ID) : 'Not configured'}\n`);
}
