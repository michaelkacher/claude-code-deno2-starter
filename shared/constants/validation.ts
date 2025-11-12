/**
 * Shared Validation Constants
 * 
 * Centralized validation limits and error messages to ensure consistency
 * between backend (Zod schemas) and frontend (client-side validation).
 * 
 * Usage:
 * - Backend: Use in Zod schemas for API route validation
 * - Frontend: Use in island validation functions
 * - Tests: Reference for boundary testing
 */

/**
 * Validation limits organized by resource type
 */
export const VALIDATION_LIMITS = {
  CAMPAIGN: {
    NAME_MIN: 1,
    NAME_MAX: 100,
    DESCRIPTION_MAX: 1000,
    SETTING_MAX: 200,
    BACKGROUND_MAX: 5000,
    INVITE_CODE_MIN: 6,
    INVITE_CODE_MAX: 8,
  },
  
  USER: {
    EMAIL_MIN: 3,
    EMAIL_MAX: 255,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,
    USERNAME_MIN: 3,
    USERNAME_MAX: 50,
    DISPLAY_NAME_MAX: 100,
  },
  
  // Add more resources as needed
  // COMMENT: {
  //   CONTENT_MIN: 1,
  //   CONTENT_MAX: 5000,
  // },
} as const;

/**
 * Common validation error messages
 * 
 * Use these factory functions to generate consistent error messages
 * across backend and frontend validation.
 */
export const VALIDATION_MESSAGES = {
  // Required field errors
  REQUIRED: (field: string) => `${field} is required`,
  
  // Length errors
  MIN_LENGTH: (field: string, min: number) => 
    `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => 
    `${field} must be ${max} characters or less`,
  EXACT_LENGTH: (field: string, length: number) => 
    `${field} must be exactly ${length} characters`,
  
  // Range errors
  MIN_VALUE: (field: string, min: number) => 
    `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => 
    `${field} must be ${max} or less`,
  BETWEEN: (field: string, min: number, max: number) => 
    `${field} must be between ${min} and ${max}`,
  
  // Format errors
  INVALID_EMAIL: "Invalid email address",
  INVALID_URL: "Invalid URL format",
  INVALID_DATE: "Invalid date format",
  
  // Custom errors
  ALREADY_EXISTS: (field: string) => `${field} already exists`,
  NOT_FOUND: (resource: string) => `${resource} not found`,
  UNAUTHORIZED: "You don't have permission to perform this action",
} as const;

/**
 * Common validation patterns (regex)
 */
export const VALIDATION_PATTERNS = {
  // Email: Basic email validation (backend uses Zod's email validation)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Username: Alphanumeric, dash, underscore
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  
  // URL: Basic URL validation
  URL: /^https?:\/\/.+/,
  
  // Invite code: Alphanumeric only (safe characters)
  INVITE_CODE: /^[A-Z0-9]+$/,
} as const;

/**
 * Helper function to validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
): { valid: boolean; error?: string } {
  const length = value.trim().length;
  
  if (length < min) {
    return { valid: false, error: `Must be at least ${min} characters` };
  }
  
  if (length > max) {
    return { valid: false, error: `Must be ${max} characters or less` };
  }
  
  return { valid: true };
}

/**
 * Helper function to validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email.trim()) {
    return { valid: false, error: VALIDATION_MESSAGES.REQUIRED("Email") };
  }
  
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return { valid: false, error: VALIDATION_MESSAGES.INVALID_EMAIL };
  }
  
  if (email.length > VALIDATION_LIMITS.USER.EMAIL_MAX) {
    return { 
      valid: false, 
      error: VALIDATION_MESSAGES.MAX_LENGTH("Email", VALIDATION_LIMITS.USER.EMAIL_MAX),
    };
  }
  
  return { valid: true };
}
