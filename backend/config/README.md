# Environment Configuration

This directory contains environment variable validation and configuration management.

## Overview

The `env.ts` module provides runtime validation of all environment variables using Zod schemas. This prevents the application from starting with invalid or misconfigured environment variables, providing clear error messages instead of cryptic runtime failures.

## Features

- **Runtime Validation**: All environment variables are validated at startup
- **Type Safety**: TypeScript types are automatically inferred from Zod schemas
- **Clear Error Messages**: Detailed validation errors with helpful tips
- **Automatic Type Coercion**: Strings are automatically converted to numbers, booleans, etc.
- **Smart Defaults**: Sensible defaults for optional variables
- **Security Checks**: Validates API key formats and minimum security requirements

## Usage

### Basic Usage

Import the validated configuration anywhere in your application:

```typescript
import { env, isDevelopment, isProduction } from './config/env.ts';

// Type-safe access to environment variables
const port = env.PORT; // number (validated 1-65535)
const apiUrl = env.API_URL; // string (validated URL format)
const jwtSecret = env.JWT_SECRET; // string | undefined

// Convenience flags
if (isDevelopment) {
  console.log('Running in development mode');
}
```

### Requiring Optional Variables

For features that require optional variables (like auth, payments, etc.), use the helper functions:

```typescript
import { requireAuth, requireStripe, requireSendGrid } from './config/env.ts';

// Authentication routes
app.post('/api/auth/login', (c) => {
  requireAuth(); // Throws clear error if JWT_SECRET not configured
  // ... login logic
});

// Payment routes
app.post('/api/payments/charge', (c) => {
  requireStripe(); // Throws clear error if STRIPE_SECRET_KEY not configured
  // ... payment logic
});

// Email routes
app.post('/api/emails/send', (c) => {
  requireSendGrid(); // Throws clear error if SENDGRID_API_KEY not configured
  // ... email logic
});
```

### Debugging Configuration

Print current configuration (redacts sensitive values in production):

```typescript
import { printConfig } from './config/env.ts';

printConfig();
// Output:
// 📋 Current Configuration:
//   Environment: development
//   Backend Port: 8000
//   API URL: http://localhost:8000/api
//   ...
```

## Environment Variables

See `.env.example` for a complete list of all available environment variables with descriptions and validation rules.

### Core Variables (Always Used)

| Variable | Type | Default | Validation |
|----------|------|---------|------------|
| `DENO_ENV` | enum | `development` | Must be: development, test, staging, production |
| `PORT` | number | `8000` | Must be 1-65535 |
| `API_URL` | URL | `http://localhost:8000/api` | Must be valid URL |
| `FRONTEND_PORT` | number | `3000` | Must be 1-65535 |
| `FRONTEND_URL` | URL | `http://localhost:3000` | Must be valid URL |
| `CORS_ORIGIN` | string | `http://localhost:3000` | - |

### Authentication Variables (Optional)

| Variable | Type | Validation | Required When |
|----------|------|------------|---------------|
| `JWT_SECRET` | string | Min 32 characters | Using auth features |
| `JWT_EXPIRES_IN` | string | Format: `\d+[smhdw]` (e.g., 7d) | Optional |

### Database Variables (Optional)

| Variable | Type | Validation | Required When |
|----------|------|------------|---------------|
| `DENO_KV_PATH` | string | - | Custom KV location |
| `DATABASE_URL` | URL | PostgreSQL URL format | Using PostgreSQL |
| `DB_POOL_SIZE` | number | Positive integer | Using PostgreSQL |

### Third-Party API Keys (Optional)

| Variable | Type | Validation | Required When |
|----------|------|------------|---------------|
| `STRIPE_SECRET_KEY` | string | Must start with `sk_` | Using Stripe |
| `SENDGRID_API_KEY` | string | Must start with `SG.` | Using SendGrid |
| `AWS_ACCESS_KEY_ID` | string | - | Using AWS |
| `AWS_SECRET_ACCESS_KEY` | string | - | Using AWS |

### Feature Flags (Optional)

| Variable | Type | Default |
|----------|------|---------|
| `ENABLE_ANALYTICS` | boolean | `false` |
| `ENABLE_DEBUG_MODE` | boolean | `false` |

## Validation Rules

### Port Numbers
- Must be valid integers
- Must be between 1 and 65535
- Automatically converted from string to number

### URLs
- Must be valid URL format (protocol + domain)
- Validated using Zod's `.url()` validator

### JWT Configuration
- `JWT_SECRET`: Minimum 32 characters for security
- `JWT_EXPIRES_IN`: Must match pattern `\d+[smhdw]` (e.g., `7d`, `24h`, `1w`)

### API Keys
- `STRIPE_SECRET_KEY`: Must start with `sk_`
- `SENDGRID_API_KEY`: Must start with `SG.`

### Booleans
- Must be string `"true"` or `"false"`
- Automatically converted to boolean type

## Error Handling

When validation fails, you'll see a detailed error message:

```
🚨 Environment Variable Validation Failed:

  ❌ PORT: PORT must be between 1 and 65535
  ❌ API_URL: Invalid url
  ❌ JWT_SECRET: JWT_SECRET must be at least 32 characters for security

💡 Tips:
  - Check your .env file exists and is properly formatted
  - Compare with .env.example for reference
  - Ensure all required variables are set
  - Validate URLs, ports, and API keys are correct
```

The application will not start until all validation errors are resolved.

## Adding New Environment Variables

To add a new environment variable:

1. **Add to Schema** (`backend/config/env.ts`):

```typescript
const envSchema = z.object({
  // ... existing variables ...

  MY_NEW_VARIABLE: z
    .string()
    .min(1)
    .default('default-value')
    .describe('Description of my variable'),
});
```

2. **Add to Validation Function**:

```typescript
function validateEnv(): Env {
  return envSchema.parse({
    // ... existing variables ...
    MY_NEW_VARIABLE: Deno.env.get('MY_NEW_VARIABLE'),
  });
}
```

3. **Update .env.example**:

```bash
# My New Feature
# Description of what this does
MY_NEW_VARIABLE=default-value
```

4. **Access in Code**:

```typescript
import { env } from './config/env.ts';

const myValue = env.MY_NEW_VARIABLE; // Type-safe access
```

## Best Practices

### Security

1. **Never commit .env files**: Add `.env` to `.gitignore`
2. **Use strong secrets**: Minimum 32 characters for JWT_SECRET
3. **Rotate secrets regularly**: Especially in production
4. **Use environment-specific values**: Different secrets for dev/staging/prod
5. **Store production secrets securely**: Use secret management services

### Development

1. **Copy from example**: Always start with `cp .env.example .env`
2. **Keep example updated**: Update `.env.example` when adding new variables
3. **Document validation rules**: Add comments explaining requirements
4. **Test validation**: Try invalid values to ensure validation works
5. **Use defaults**: Provide sensible defaults for development

### Deployment

1. **Deno Deploy**: Use dashboard to set environment variables
2. **CI/CD**: Use GitHub secrets for sensitive values
3. **Docker**: Pass via `docker run -e` or docker-compose.yml
4. **Cloud platforms**: Use platform-specific secret management

## Troubleshooting

### Application won't start

1. Check validation error messages
2. Compare your `.env` with `.env.example`
3. Ensure all required variables are set
4. Validate URL formats include protocol (http:// or https://)
5. Check port numbers are in valid range (1-65535)

### Variable not being used

1. Ensure it's added to the schema
2. Check it's included in `validateEnv()` function
3. Import `env` from `./config/env.ts` (not `Deno.env.get()`)

### Type errors

1. Schema types are automatically inferred
2. Use `env.VARIABLE_NAME` (not `Deno.env.get()`)
3. Check validation includes `.transform()` for type conversion

## Examples

### Example 1: Basic Configuration

```typescript
// backend/main.ts
import { env, isDevelopment } from './config/env.ts';

const app = new Hono();

if (isDevelopment) {
  console.log('🔧 Development mode features enabled');
}

Deno.serve({ port: env.PORT }, app.fetch);
```

### Example 2: Feature-Specific Validation

```typescript
// backend/routes/auth.ts
import { env, requireAuth } from '../config/env.ts';

app.post('/login', (c) => {
  requireAuth(); // Throws if JWT_SECRET not configured

  const token = jwt.sign({ userId: '123' }, env.JWT_SECRET!);
  return c.json({ token });
});
```

### Example 3: Conditional Features

```typescript
// backend/middleware/analytics.ts
import { env } from '../config/env.ts';

app.use('*', async (c, next) => {
  if (env.ENABLE_ANALYTICS) {
    // Track request
  }
  await next();
});
```

## Related Files

- `.env.example` - Template with all variables and documentation
- `backend/config/env.ts` - Validation logic and schema
- `backend/main.ts` - Usage example
- `backend/lib/api.ts` - API client using validated config

## References

- [Zod Documentation](https://zod.dev/)
- [Deno Environment Variables](https://deno.land/manual/runtime/environment_variables)
- [12-Factor App Config](https://12factor.net/config)
