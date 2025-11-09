# Error Handling Standardization

**Priority**: High
**Effort**: 2-3 days
**Impact**: Very High (Reliability, Maintainability, DX)

## Problem Statement

Current error handling is fragmented with three major issues:

1. **Services throw string-based error codes** (27+ occurrences) instead of using custom error classes
2. **43 API routes have duplicate error handling** (~344 lines of repetitive try-catch blocks)
3. **Inconsistent error responses** across the application

### Current State Analysis

```typescript
// ❌ Service Layer - String-based errors (no type safety)
throw new Error("INVALID_CREDENTIALS");
throw new Error("EMAIL_NOT_VERIFIED");

// ❌ API Routes - Manual error mapping in every route
catch (error) {
  if (error.message === "INVALID_CREDENTIALS") {
    return errorResponse("UNAUTHORIZED", "Invalid credentials", 401);
  }
  if (error.name === "ZodError") {
    return errorResponse("VALIDATION_ERROR", error.errors[0].message, 400);
  }
  // ... 8+ more lines per route
}

// ✅ AVAILABLE BUT UNUSED - Custom error classes exist!
throw new AuthenticationError("Invalid credentials", "invalid_credentials");
```

### Impact
- **Code duplication**: 344 lines across 43 routes
- **Maintenance burden**: 27+ string codes to track manually
- **Type safety**: No compile-time error checking
- **Debugging**: Error context often lost
- **UX**: Inconsistent error messages

## Recommended Solution

Implement a three-tier standardized error handling system:

### Tier 1: Error Codes Enum (Single Source of Truth)
### Tier 2: Custom Error Classes in Services (Type Safety)
### Tier 3: Centralized Error Handler (DRY)

---

## Implementation Plan

### Phase 1: Foundation (Day 1 Morning)

#### Step 1.1: Create Error Codes Enum

**File**: `shared/lib/error-codes.ts` (NEW)

```typescript
/**
 * Standard Error Codes
 * Single source of truth for all application errors
 */
export enum ErrorCode {
  // Authentication (401)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Authorization (403)
  ADMIN_ACCESS_REQUIRED = 'ADMIN_ACCESS_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources (404, 409)
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  NOTIFICATION_NOT_FOUND = 'NOTIFICATION_NOT_FOUND',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  EMAIL_ALREADY_VERIFIED = 'EMAIL_ALREADY_VERIFIED',

  // Two-Factor Auth
  TWO_FACTOR_REQUIRED = 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_ALREADY_ENABLED = 'TWO_FACTOR_ALREADY_ENABLED',
  TWO_FACTOR_NOT_ENABLED = 'TWO_FACTOR_NOT_ENABLED',
  INVALID_VERIFICATION_CODE = 'INVALID_VERIFICATION_CODE',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * User-friendly error messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again',
  [ErrorCode.TOKEN_REVOKED]: 'This token has been revoked',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address to continue',

  [ErrorCode.ADMIN_ACCESS_REQUIRED]: 'This action requires administrator privileges',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to perform this action',

  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',

  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.JOB_NOT_FOUND]: 'Job not found',
  [ErrorCode.NOTIFICATION_NOT_FOUND]: 'Notification not found',
  [ErrorCode.EMAIL_EXISTS]: 'An account with this email already exists',
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: 'Email address is already verified',

  [ErrorCode.TWO_FACTOR_REQUIRED]: 'Two-factor authentication is required',
  [ErrorCode.TWO_FACTOR_ALREADY_ENABLED]: 'Two-factor authentication is already enabled',
  [ErrorCode.TWO_FACTOR_NOT_ENABLED]: 'Two-factor authentication is not enabled',
  [ErrorCode.INVALID_VERIFICATION_CODE]: 'Invalid verification code',

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',

  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is currently unavailable',
};

/**
 * HTTP status codes for each error
 */
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_REVOKED]: 401,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 403,

  [ErrorCode.ADMIN_ACCESS_REQUIRED]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,

  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.JOB_NOT_FOUND]: 404,
  [ErrorCode.NOTIFICATION_NOT_FOUND]: 404,
  [ErrorCode.EMAIL_EXISTS]: 409,
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: 409,

  [ErrorCode.TWO_FACTOR_REQUIRED]: 403,
  [ErrorCode.TWO_FACTOR_ALREADY_ENABLED]: 409,
  [ErrorCode.TWO_FACTOR_NOT_ENABLED]: 400,
  [ErrorCode.INVALID_VERIFICATION_CODE]: 400,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 503,
};
```

#### Step 1.2: Enhance Custom Error Classes

**File**: `frontend/lib/errors.ts` (UPDATE)

```typescript
import { ErrorCode, ErrorMessages, ErrorStatusCodes } from '../../shared/lib/error-codes.ts';

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    context?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = ErrorStatusCodes[code];
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(
    code: ErrorCode = ErrorCode.INVALID_CREDENTIALS,
    context?: Record<string, unknown>
  ) {
    super(ErrorMessages[code], code, context);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(
    code: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS,
    context?: Record<string, unknown>
  ) {
    super(ErrorMessages[code], code, context);
  }
}

/**
 * Validation error (400) with field-level details
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    fields?: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, context);
    this.fields = fields;
  }

  static fromZod(zodError: any): ValidationError {
    const fields: Record<string, string[]> = {};

    for (const issue of zodError.errors) {
      const path = issue.path.join('.');
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(issue.message);
    }

    return new ValidationError(
      'Validation failed',
      fields,
      { zodError: zodError.errors }
    );
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      fields: this.fields,
    };
  }
}

/**
 * Resource not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    code: ErrorCode = ErrorCode.USER_NOT_FOUND,
    context?: Record<string, unknown>
  ) {
    super(ErrorMessages[code] || `${resource} not found`, code, {
      ...context,
      resource,
    });
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(
    code: ErrorCode = ErrorCode.EMAIL_EXISTS,
    context?: Record<string, unknown>
  ) {
    super(ErrorMessages[code], code, context);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, context?: Record<string, unknown>) {
    super(
      ErrorMessages[ErrorCode.RATE_LIMIT_EXCEEDED],
      ErrorCode.RATE_LIMIT_EXCEEDED,
      { ...context, retryAfter }
    );
    this.retryAfter = retryAfter;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}
```

---

### Phase 2: Service Layer (Day 1 Afternoon)

#### Step 2.1: Update Auth Service

**File**: `shared/services/auth.service.ts`

```typescript
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../frontend/lib/errors.ts';
import { ErrorCode } from '../lib/error-codes.ts';

export class AuthService {
  // ... existing code ...

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // ✅ BEFORE: throw new Error("INVALID_CREDENTIALS");
      throw new AuthenticationError(
        ErrorCode.INVALID_CREDENTIALS,
        { email: this.sanitizeEmail(email) }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new AuthenticationError(
        ErrorCode.INVALID_CREDENTIALS,
        { email: this.sanitizeEmail(email) }
      );
    }

    if (!user.emailVerified) {
      // ✅ BEFORE: throw new Error("EMAIL_NOT_VERIFIED");
      throw new AuthorizationError(
        ErrorCode.EMAIL_NOT_VERIFIED,
        { userId: user.id, email: this.sanitizeEmail(email) }
      );
    }

    // ... rest of login logic
  }

  async signup(email: string, password: string, name: string): Promise<SignupResult> {
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      // ✅ BEFORE: throw new Error("EMAIL_EXISTS");
      throw new ConflictError(
        ErrorCode.EMAIL_EXISTS,
        { email: this.sanitizeEmail(email) }
      );
    }

    // ... rest of signup logic
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenData = await this.tokenRepo.findEmailVerificationToken(token);
    if (!tokenData) {
      // ✅ BEFORE: throw new Error("INVALID_TOKEN");
      throw new AuthenticationError(
        ErrorCode.INVALID_TOKEN,
        { tokenType: 'email_verification' }
      );
    }

    // ... rest of verification logic
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    let payload: TokenPayload;
    try {
      payload = await verifyToken(refreshToken, 'refresh');
    } catch {
      // ✅ BEFORE: throw new Error("INVALID_TOKEN");
      throw new AuthenticationError(
        ErrorCode.INVALID_TOKEN,
        { tokenType: 'refresh' }
      );
    }

    const isRevoked = await this.tokenRepo.isTokenRevoked(refreshToken);
    if (isRevoked) {
      // ✅ BEFORE: throw new Error("TOKEN_REVOKED");
      throw new AuthenticationError(
        ErrorCode.TOKEN_REVOKED,
        { userId: payload.sub }
      );
    }

    // ... rest of refresh logic
  }

  // Helper to sanitize email for logging
  private sanitizeEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  }
}
```

#### Step 2.2: Update Two-Factor Service

**File**: `shared/services/TwoFactorService.ts`

```typescript
import { AuthenticationError, ConflictError } from '../../frontend/lib/errors.ts';
import { ErrorCode } from '../lib/error-codes.ts';

export class TwoFactorService {
  // ... existing code ...

  async setup(userId: string): Promise<TwoFactorSetupResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', ErrorCode.USER_NOT_FOUND, { userId });
    }

    if (user.twoFactorEnabled) {
      // ✅ BEFORE: throw new Error("Two-factor authentication is already enabled");
      throw new ConflictError(
        ErrorCode.TWO_FACTOR_ALREADY_ENABLED,
        { userId }
      );
    }

    // ... rest of setup logic
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User', ErrorCode.USER_NOT_FOUND, { userId });
    }

    if (!user.twoFactorSecret) {
      // ✅ BEFORE: throw new Error("2FA not setup");
      throw new AuthenticationError(
        ErrorCode.TWO_FACTOR_NOT_ENABLED,
        { userId }
      );
    }

    const isValid = await verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      // ✅ BEFORE: throw new Error("Invalid verification code");
      throw new AuthenticationError(
        ErrorCode.INVALID_VERIFICATION_CODE,
        { userId, attemptedAt: new Date().toISOString() }
      );
    }

    return true;
  }

  // ... rest of methods
}
```

---

### Phase 3: Centralized Error Handler (Day 2 Morning)

#### Step 3.1: Create Route Error Handler

**File**: `frontend/lib/fresh-helpers.ts` (ADD)

```typescript
import { AppError, ValidationError } from './errors.ts';
import { ErrorCode } from '../../shared/lib/error-codes.ts';
import type { Logger } from '../../shared/lib/logger.ts';

/**
 * Centralized error handler for API routes
 * Handles all error types and returns consistent responses
 */
export function handleRouteError(
  error: unknown,
  logger: Logger,
  context?: Record<string, unknown>
): Response {
  // Handle our custom AppError instances
  if (error instanceof AppError) {
    // Log operational errors at appropriate level
    if (error.isOperational) {
      logger.warn(error.message, {
        code: error.code,
        statusCode: error.statusCode,
        context: { ...error.context, ...context },
      });
    } else {
      logger.error(error.message, error, {
        code: error.code,
        statusCode: error.statusCode,
        context: { ...error.context, ...context },
      });
    }

    // Return structured error response
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && { fields: error.fields }),
          ...(error instanceof RateLimitError && { retryAfter: error.retryAfter }),
        },
        timestamp: error.timestamp,
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    const validationError = ValidationError.fromZod(error);
    logger.warn('Validation error', {
      fields: validationError.fields,
      context,
    });

    return new Response(
      JSON.stringify({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: validationError.message,
          fields: validationError.fields,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle generic errors (unexpected)
  logger.error('Unexpected error in route handler', error, context);

  return new Response(
    JSON.stringify({
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Wrapper for route handlers with automatic error handling
 * Eliminates need for try-catch in every route
 */
export function withErrorHandler<T extends AppState = AppState>(
  handler: (req: Request, ctx: FreshContext<T>) => Promise<Response>
) {
  return async (req: Request, ctx: FreshContext<T>): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const logger = createLogger('RouteHandler');
      return handleRouteError(error, logger, {
        path: new URL(req.url).pathname,
        method: req.method,
      });
    }
  };
}
```

#### Step 3.2: Update Routes to Use Error Handler

**Before** (12+ lines):
```typescript
// frontend/routes/api/auth/login.ts
export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      const body = await parseJsonBody(req);
      const { email, password } = LoginSchema.parse(body);

      const authService = new AuthService();
      const result = await authService.login(email, password);

      return successResponse(result);
    } catch (error) {
      if (error.message === "INVALID_CREDENTIALS") {
        return errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
      }
      if (error.message === "EMAIL_NOT_VERIFIED") {
        return errorResponse("FORBIDDEN", "Please verify your email", 403);
      }
      if (error.name === "ZodError") {
        return errorResponse("VALIDATION_ERROR", error.errors[0].message, 400);
      }
      logger.error("Login error", { error });
      return errorResponse("SERVER_ERROR", "An error occurred", 500);
    }
  },
};
```

**After** (3 lines):
```typescript
// frontend/routes/api/auth/login.ts
import { withErrorHandler, parseJsonBody, successResponse } from '../../../lib/fresh-helpers.ts';

export const handler: Handlers<unknown, AppState> = {
  POST: withErrorHandler(async (req, ctx) => {
    const body = await parseJsonBody(req, LoginSchema);
    const authService = new AuthService();
    const result = await authService.login(body.email, body.password);
    return successResponse(result);
  }),
};
```

---

### Phase 4: Update All Routes (Day 2 Afternoon)

Apply the `withErrorHandler` pattern to all 43 routes:

#### Priority Order

**Week 1 - Critical Routes:**
1. ✅ `frontend/routes/api/auth/login.ts`
2. ✅ `frontend/routes/api/auth/signup.ts`
3. ✅ `frontend/routes/api/auth/refresh.ts`
4. ✅ `frontend/routes/api/auth/verify-email.ts`
5. ✅ `frontend/routes/api/2fa/setup.ts`
6. ✅ `frontend/routes/api/2fa/verify.ts`

**Week 2 - Admin Routes:**
7. `frontend/routes/api/admin/users/index.ts`
8. `frontend/routes/api/admin/users/[id]/delete.ts`
9. `frontend/routes/api/admin/stats.ts`
10. All other admin routes

**Week 3 - Remaining Routes:**
11. Job management routes
12. Notification routes
13. Miscellaneous routes

---

### Phase 5: Enhance Error Responses (Day 3)

#### Step 5.1: Add Request ID Tracking

**File**: `frontend/routes/api/_middleware.ts`

```typescript
export const handler: MiddlewareHandlerContext<AppState> = async (req, ctx) => {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  ctx.state.requestId = requestId;

  // Add to response headers
  const response = await ctx.next();
  response.headers.set('X-Request-ID', requestId);

  return response;
};
```

**Update error handler:**
```typescript
export function handleRouteError(
  error: unknown,
  logger: Logger,
  context?: Record<string, unknown>
): Response {
  const requestId = context?.requestId as string | undefined;

  // ... existing error handling ...

  return new Response(
    JSON.stringify({
      error: { /* ... */ },
      timestamp: new Date().toISOString(),
      requestId, // ✅ Add request ID to all error responses
    }),
    { /* ... */ }
  );
}
```

#### Step 5.2: Add Error Monitoring Integration

**File**: `shared/lib/error-monitoring.ts` (NEW)

```typescript
import { AppError } from '../../frontend/lib/errors.ts';

interface ErrorMonitoringConfig {
  dsn?: string;
  environment: string;
  release?: string;
}

class ErrorMonitor {
  private config: ErrorMonitoringConfig;

  constructor(config: ErrorMonitoringConfig) {
    this.config = config;
  }

  /**
   * Capture error and send to monitoring service (Sentry, etc.)
   */
  captureError(
    error: Error | AppError,
    context?: Record<string, unknown>
  ): void {
    // Only send non-operational errors to monitoring
    if (error instanceof AppError && error.isOperational) {
      return;
    }

    // In development, just log
    if (this.config.environment === 'development') {
      console.error('[ErrorMonitor]', error, context);
      return;
    }

    // TODO: Integrate with Sentry or similar
    // Sentry.captureException(error, { extra: context });
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: Deno.env.get('DENO_ENV') || 'development',
  release: Deno.env.get('APP_VERSION'),
});
```

---

## Testing Strategy

### Unit Tests

**File**: `tests/unit/error-handling.test.ts`

```typescript
import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertInstanceOf } from '@std/assert';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from '../frontend/lib/errors.ts';
import { ErrorCode } from '../shared/lib/error-codes.ts';

describe('Error Handling', () => {
  describe('AuthenticationError', () => {
    it('should create error with correct properties', () => {
      const error = new AuthenticationError(
        ErrorCode.INVALID_CREDENTIALS,
        { email: 'test@example.com' }
      );

      assertEquals(error.code, ErrorCode.INVALID_CREDENTIALS);
      assertEquals(error.statusCode, 401);
      assertEquals(error.isOperational, true);
      assertInstanceOf(error, Error);
    });

    it('should include context in JSON output', () => {
      const error = new AuthenticationError(
        ErrorCode.INVALID_CREDENTIALS,
        { userId: '123' }
      );

      const json = error.toJSON();
      assertEquals(json.context?.userId, '123');
    });
  });

  describe('ValidationError', () => {
    it('should convert Zod error to ValidationError', () => {
      // Mock Zod error
      const zodError = {
        errors: [
          { path: ['email'], message: 'Invalid email' },
          { path: ['password'], message: 'Too short' },
        ],
      };

      const error = ValidationError.fromZod(zodError);

      assertEquals(error.fields?.email, ['Invalid email']);
      assertEquals(error.fields?.password, ['Too short']);
    });
  });

  describe('handleRouteError', () => {
    it('should handle AppError correctly', async () => {
      const error = new NotFoundError('User', ErrorCode.USER_NOT_FOUND);
      const logger = createLogger('Test');

      const response = handleRouteError(error, logger);

      assertEquals(response.status, 404);
      const body = await response.json();
      assertEquals(body.error.code, ErrorCode.USER_NOT_FOUND);
    });

    it('should handle unknown errors gracefully', async () => {
      const error = new Error('Something went wrong');
      const logger = createLogger('Test');

      const response = handleRouteError(error, logger);

      assertEquals(response.status, 500);
      const body = await response.json();
      assertEquals(body.error.code, ErrorCode.INTERNAL_SERVER_ERROR);
    });
  });
});
```

### Integration Tests

Test that routes properly handle errors:

```typescript
describe('API Error Handling Integration', () => {
  it('should return 401 for invalid credentials', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpass',
      }),
    });

    assertEquals(response.status, 401);
    const body = await response.json();
    assertEquals(body.error.code, ErrorCode.INVALID_CREDENTIALS);
  });

  it('should return validation errors for missing fields', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assertEquals(response.status, 400);
    const body = await response.json();
    assertEquals(body.error.code, ErrorCode.VALIDATION_ERROR);
    assert(body.error.fields);
  });
});
```

---

## Migration Checklist

### Phase 1: Foundation ✅
- [x] Create `shared/lib/error-codes.ts`
- [x] Update `frontend/lib/errors.ts` with enhanced classes
- [x] Create `handleRouteError()` in `fresh-helpers.ts`
- [x] Create `withErrorHandler()` wrapper

### Phase 2: Services (3 files)
- [ ] Update `shared/services/auth.service.ts`
- [ ] Update `shared/services/TwoFactorService.ts`
- [ ] Update `shared/services/UserManagementService.ts`

### Phase 3: Critical Routes (6 files)
- [ ] `frontend/routes/api/auth/login.ts`
- [ ] `frontend/routes/api/auth/signup.ts`
- [ ] `frontend/routes/api/auth/refresh.ts`
- [ ] `frontend/routes/api/auth/verify-email.ts`
- [ ] `frontend/routes/api/2fa/setup.ts`
- [ ] `frontend/routes/api/2fa/verify.ts`

### Phase 4: All Routes (43 files total)
- [ ] Auth routes (7 total)
- [ ] Admin routes (6 total)
- [ ] 2FA routes (5 total)
- [ ] Notification routes (6 total)
- [ ] Job routes (6 total)
- [ ] Miscellaneous routes (13 total)

### Phase 5: Enhancements
- [ ] Add request ID tracking
- [ ] Integrate error monitoring (Sentry)
- [ ] Update documentation
- [ ] Add comprehensive tests

---

## Success Metrics

### Code Quality
- ✅ 0 string-based error codes (currently 27+)
- ✅ Type-safe error handling throughout
- ✅ Single source of truth for error codes
- ✅ 60-70% reduction in error handling code (344 lines → ~100 lines)

### Developer Experience
- ✅ Autocomplete for error codes
- ✅ Consistent error responses
- ✅ Easy to add new error types
- ✅ Clear error context in logs

### Production Readiness
- ✅ Structured error logging
- ✅ Error monitoring integration ready
- ✅ Request ID tracking
- ✅ User-friendly error messages

### Testing
- ✅ Unit tests for all error classes
- ✅ Integration tests for route error handling
- ✅ Error response format validation

---

## Breaking Changes

### Service Layer
**Before:**
```typescript
throw new Error("INVALID_CREDENTIALS");
```

**After:**
```typescript
import { AuthenticationError } from '../../frontend/lib/errors.ts';
import { ErrorCode } from '../lib/error-codes.ts';

throw new AuthenticationError(ErrorCode.INVALID_CREDENTIALS, { email });
```

### Route Handlers
**Before:**
```typescript
catch (error) {
  if (error.message === "INVALID_CREDENTIALS") {
    return errorResponse("UNAUTHORIZED", "...", 401);
  }
}
```

**After:**
```typescript
import { withErrorHandler } from '../lib/fresh-helpers.ts';

export const handler: Handlers = {
  POST: withErrorHandler(async (req, ctx) => {
    // No try-catch needed!
    // Errors automatically handled
  }),
};
```

---

## Files to Create/Update

### New Files (2)
- `shared/lib/error-codes.ts`
- `shared/lib/error-monitoring.ts`

### Updated Files (50+)
- `frontend/lib/errors.ts` (enhance)
- `frontend/lib/fresh-helpers.ts` (add `handleRouteError`, `withErrorHandler`)
- `shared/services/auth.service.ts`
- `shared/services/TwoFactorService.ts`
- `shared/services/UserManagementService.ts`
- 43 API route files
- `tests/unit/error-handling.test.ts` (new)

---

## Rollout Strategy

### Week 1: Core Infrastructure
- Day 1-2: Create error codes, enhance error classes
- Day 3: Update auth service (highest traffic)
- Day 4-5: Update critical auth routes

### Week 2: Remaining Services & Routes
- Day 1-2: Update TwoFactor and UserManagement services
- Day 3-5: Update remaining routes (admin, jobs, notifications)

### Week 3: Polish & Monitoring
- Day 1: Add request ID tracking
- Day 2: Integrate error monitoring
- Day 3: Add comprehensive tests
- Day 4-5: Documentation and training

---

## Resources

- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)
- [TypeScript Error Handling](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)
- [Sentry Integration](https://docs.sentry.io/platforms/javascript/guides/deno/)

---

## Notes

- All error codes are now in a single enum for discoverability
- Services throw typed errors instead of strings
- Routes use centralized error handler
- Error context is preserved for debugging
- User-friendly messages are consistent
- Ready for error monitoring integration (Sentry, etc.)

---

## Related Issues

- Improves debugging (full error context preserved)
- Reduces code duplication (60-70% reduction)
- Type safety (compile-time error checking)
- Better UX (consistent, helpful error messages)
- Production-ready (monitoring integration)
