/**
 * Custom Error Classes
 * Provides a hierarchy of error types for better error handling and reporting
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Convert error to JSON for logging or API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(this.context && { context: this.context }),
      ...(Deno.env.get('DENO_ENV') === 'development' && { stack: this.stack }),
    };
  }

  /**
   * Create a user-friendly error message
   */
  toUserMessage(): string {
    return this.message;
  }
}

/**
 * Validation Error
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.fields = fields;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.fields && { fields: this.fields }),
    };
  }

  toUserMessage(): string {
    if (this.fields) {
      const fieldErrors = Object.entries(this.fields)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ');
      return `Validation failed: ${fieldErrors}`;
    }
    return this.message;
  }
}

/**
 * Authentication Error
 * Thrown when authentication fails or is missing
 */
export class AuthenticationError extends AppError {
  public readonly reason?: 'missing_token' | 'invalid_token' | 'expired_token' | 'revoked_token';

  constructor(
    message: string = 'Authentication required',
    reason?: AuthenticationError['reason'],
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
    this.reason = reason;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.reason && { reason: this.reason }),
    };
  }

  toUserMessage(): string {
    switch (this.reason) {
      case 'expired_token':
        return 'Your session has expired. Please log in again.';
      case 'invalid_token':
        return 'Invalid authentication. Please log in again.';
      case 'revoked_token':
        return 'Your session has been revoked. Please log in again.';
      case 'missing_token':
        return 'Please log in to access this resource.';
      default:
        return this.message;
    }
  }
}

/**
 * Authorization Error
 * Thrown when user lacks permission to perform an action
 */
export class AuthorizationError extends AppError {
  public readonly requiredRole?: string | string[];
  public readonly userRole?: string;

  constructor(
    message: string = 'You do not have permission to perform this action',
    requiredRole?: string | string[],
    userRole?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
    this.requiredRole = requiredRole;
    this.userRole = userRole;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.requiredRole && { requiredRole: this.requiredRole }),
      ...(this.userRole && { userRole: this.userRole }),
    };
  }

  toUserMessage(): string {
    if (this.requiredRole) {
      const roles = Array.isArray(this.requiredRole)
        ? this.requiredRole.join(' or ')
        : this.requiredRole;
      return `You need ${roles} role to access this resource.`;
    }
    return this.message;
  }
}

/**
 * Not Found Error
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(
    message: string = 'Resource not found',
    resourceType?: string,
    resourceId?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND', 404, true, context);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.resourceType && { resourceType: this.resourceType }),
      ...(this.resourceId && { resourceId: this.resourceId }),
    };
  }

  toUserMessage(): string {
    if (this.resourceType && this.resourceId) {
      return `${this.resourceType} with ID ${this.resourceId} not found.`;
    }
    if (this.resourceType) {
      return `${this.resourceType} not found.`;
    }
    return this.message;
  }
}

/**
 * Conflict Error
 * Thrown when an operation conflicts with existing data (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  public readonly conflictField?: string;
  public readonly conflictValue?: string;

  constructor(
    message: string = 'Resource conflict',
    conflictField?: string,
    conflictValue?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'CONFLICT', 409, true, context);
    this.conflictField = conflictField;
    this.conflictValue = conflictValue;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.conflictField && { conflictField: this.conflictField }),
      ...(this.conflictValue && { conflictValue: this.conflictValue }),
    };
  }

  toUserMessage(): string {
    if (this.conflictField) {
      return `A resource with this ${this.conflictField} already exists.`;
    }
    return this.message;
  }
}

/**
 * Rate Limit Error
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;
  public readonly limit?: number;

  constructor(
    message: string = 'Too many requests',
    retryAfter?: number,
    limit?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, context);
    this.retryAfter = retryAfter;
    this.limit = limit;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.retryAfter && { retryAfter: this.retryAfter }),
      ...(this.limit && { limit: this.limit }),
    };
  }

  toUserMessage(): string {
    if (this.retryAfter) {
      return `Too many requests. Please try again in ${this.retryAfter} seconds.`;
    }
    return 'Too many requests. Please try again later.';
  }
}

/**
 * Network Error
 * Thrown when network requests fail
 */
export class NetworkError extends AppError {
  public readonly url?: string;
  public readonly method?: string;

  constructor(
    message: string = 'Network request failed',
    url?: string,
    method?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', 503, true, context);
    this.url = url;
    this.method = method;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.url && { url: this.url }),
      ...(this.method && { method: this.method }),
    };
  }

  toUserMessage(): string {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }
}

/**
 * Service Unavailable Error
 * Thrown when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  public readonly serviceName?: string;
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Service temporarily unavailable',
    serviceName?: string,
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, true, context);
    this.serviceName = serviceName;
    this.retryAfter = retryAfter;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.serviceName && { serviceName: this.serviceName }),
      ...(this.retryAfter && { retryAfter: this.retryAfter }),
    };
  }

  toUserMessage(): string {
    if (this.serviceName) {
      return `${this.serviceName} is temporarily unavailable. Please try again later.`;
    }
    return 'Service temporarily unavailable. Please try again later.';
  }
}

/**
 * Internal Server Error
 * Thrown for unexpected server-side errors
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = 'An unexpected error occurred',
    context?: Record<string, unknown>
  ) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, false, context);
  }

  toUserMessage(): string {
    return 'An unexpected error occurred. Our team has been notified.';
  }
}

/**
 * Bad Request Error
 * Thrown when request is malformed or invalid
 */
export class BadRequestError extends AppError {
  constructor(
    message: string = 'Bad request',
    context?: Record<string, unknown>
  ) {
    super(message, 'BAD_REQUEST', 400, true, context);
  }
}

/**
 * Error utility functions
 */

/**
 * Check if error is an operational error (expected)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new InternalServerError('An unknown error occurred', {
    error: String(error),
  });
}

/**
 * Extract user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.toUserMessage();
  }

  if (error instanceof Error) {
    return 'An unexpected error occurred. Please try again.';
  }

  return 'An unknown error occurred. Please try again.';
}

/**
 * Log error with appropriate level based on type
 */
export function logAppError(error: AppError, additionalContext?: Record<string, unknown>): void {
  const logData = {
    ...error.toJSON(),
    ...(additionalContext && { additionalContext }),
  };

  if (error.isOperational) {
    console.warn('Operational error:', JSON.stringify(logData, null, 2));
  } else {
    console.error('Critical error:', JSON.stringify(logData, null, 2));
  }
}
