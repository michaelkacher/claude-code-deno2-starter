/**
 * Centralized Error Code System
 *
 * This file provides a single source of truth for all error codes,
 * messages, and HTTP status codes used throughout the application.
 *
 * Usage:
 * ```typescript
 * import { ErrorCode, ErrorMessages, ErrorStatusCodes } from '@/lib/error-codes.ts';
 *
 * throw new AppError(ErrorCode.UNAUTHORIZED, ErrorMessages[ErrorCode.UNAUTHORIZED]);
 * ```
 */

/**
 * Standard error codes used throughout the application
 * Each code maps to a specific error condition
 */
export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  INVALID_TWO_FACTOR_CODE = 'INVALID_TWO_FACTOR_CODE',
  TWO_FACTOR_ALREADY_ENABLED = 'TWO_FACTOR_ALREADY_ENABLED',
  TWO_FACTOR_NOT_ENABLED = 'TWO_FACTOR_NOT_ENABLED',

  // User & Account Management (2xxx)
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_VERIFICATION_TOKEN = 'INVALID_VERIFICATION_TOKEN',
  VERIFICATION_TOKEN_EXPIRED = 'VERIFICATION_TOKEN_EXPIRED',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  RESET_TOKEN_EXPIRED = 'RESET_TOKEN_EXPIRED',

  // Validation & Input (3xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources (4xxx)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Rate Limiting (5xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server & External Services (9xxx)
  SERVER_ERROR = 'SERVER_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
}

/**
 * User-friendly error messages for each error code
 * These can be displayed to end users
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'Access denied',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
  [ErrorCode.REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ErrorCode.TWO_FACTOR_REQUIRED]: 'Two-factor authentication required',
  [ErrorCode.INVALID_TWO_FACTOR_CODE]: 'Invalid two-factor authentication code',
  [ErrorCode.TWO_FACTOR_ALREADY_ENABLED]: 'Two-factor authentication is already enabled',
  [ErrorCode.TWO_FACTOR_NOT_ENABLED]: 'Two-factor authentication is not enabled',

  // User & Account Management
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email address already in use',
  [ErrorCode.INVALID_VERIFICATION_TOKEN]: 'Invalid verification token',
  [ErrorCode.VERIFICATION_TOKEN_EXPIRED]: 'Verification token has expired',
  [ErrorCode.INVALID_RESET_TOKEN]: 'Invalid password reset token',
  [ErrorCode.RESET_TOKEN_EXPIRED]: 'Password reset token has expired',

  // Validation & Input
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.BAD_REQUEST]: 'Invalid request',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',

  // Resources
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Requested resource does not exist',
  [ErrorCode.ALREADY_EXISTS]: 'Resource already exists',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please try again later',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please slow down',

  // Server & External Services
  [ErrorCode.SERVER_ERROR]: 'Internal server error',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is unavailable',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Failed to send email',
};

/**
 * HTTP status codes for each error code
 * Used for consistent HTTP responses
 */
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  // Authentication & Authorization - 401, 403
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.REFRESH_TOKEN_INVALID]: 401,
  [ErrorCode.TWO_FACTOR_REQUIRED]: 403,
  [ErrorCode.INVALID_TWO_FACTOR_CODE]: 401,
  [ErrorCode.TWO_FACTOR_ALREADY_ENABLED]: 400,
  [ErrorCode.TWO_FACTOR_NOT_ENABLED]: 400,

  // User & Account Management - 404, 409
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.INVALID_VERIFICATION_TOKEN]: 400,
  [ErrorCode.VERIFICATION_TOKEN_EXPIRED]: 400,
  [ErrorCode.INVALID_RESET_TOKEN]: 400,
  [ErrorCode.RESET_TOKEN_EXPIRED]: 400,

  // Validation & Input - 400
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,

  // Resources - 404, 409
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,

  // Rate Limiting - 429
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  // Server & External Services - 500, 502, 503
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 503,
  [ErrorCode.EMAIL_SEND_FAILED]: 500,
};

/**
 * Helper function to check if an error code is a client error (4xx)
 */
export function isClientError(code: ErrorCode): boolean {
  const status = ErrorStatusCodes[code];
  return status >= 400 && status < 500;
}

/**
 * Helper function to check if an error code is a server error (5xx)
 */
export function isServerError(code: ErrorCode): boolean {
  const status = ErrorStatusCodes[code];
  return status >= 500 && status < 600;
}

/**
 * Helper function to check if an error code is an authentication error
 */
export function isAuthError(code: ErrorCode): boolean {
  return [
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.INVALID_CREDENTIALS,
    ErrorCode.EMAIL_NOT_VERIFIED,
    ErrorCode.SESSION_EXPIRED,
    ErrorCode.INVALID_TOKEN,
    ErrorCode.REFRESH_TOKEN_INVALID,
    ErrorCode.TWO_FACTOR_REQUIRED,
    ErrorCode.INVALID_TWO_FACTOR_CODE,
  ].includes(code);
}
