/**
 * Main server entry point
 * Using Hono framework for routing
 *
 * This is a minimal starter template. Add your routes as you build features!
 */

import { Hono } from 'hono';
import { cors } from 'jsr:@hono/hono/cors';
import { logger } from 'jsr:@hono/hono/logger';
import 'jsr:@std/dotenv/load';
import { env, isDevelopment } from './config/env.ts';
import { bodySizeLimits } from './lib/body-limit.ts';
import { rateLimiters } from './lib/rate-limit.ts';
import { securityHeaders } from './lib/security-headers.ts';
import openApiRoutes from './routes/openapi.ts';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', securityHeaders()); // Add security headers to all responses
app.use('*', bodySizeLimits.json); // Limit request body size (1MB default)
app.use('*', cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-CSRF-Token'],
}));

// Apply rate limiting to all API routes (except health check and docs)
app.use('/api/*', async (c, next) => {
  const pathname = new URL(c.req.url).pathname;
  
  // Skip rate limiting for health checks and documentation endpoints
  const skipPaths = ['/api/health', '/api/openapi.json', '/api/docs', '/api/redoc'];
  if (skipPaths.some(path => pathname.startsWith(path))) {
    await next();
    return;
  }
  
  // Apply general API rate limiter
  await rateLimiters.api(c, next);
});

// Root route - API info
app.get('/', (c) => {
  return c.json({
    name: 'API Server',
    version: '0.1.0',
    status: 'running',
    message: 'Add your API routes in backend/routes/',
    endpoints: {
      health: '/api/health',
      openapi: '/api/openapi.json',
      docs: '/api/docs',
      redoc: '/api/redoc',
    },
  });
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount OpenAPI documentation routes
app.route('/api', openApiRoutes);

// Import routes
import adminRoutes from './routes/admin.ts';
import dataSyncRoutes from './routes/admin/data-sync.ts';
import authRoutes from './routes/auth.ts';
import dataBrowserRoutes from './routes/data-browser.ts';
import twoFactorRoutes from './routes/two-factor.ts';

// Mount routes (more specific routes first to avoid conflicts)
app.route('/api/auth', authRoutes);
app.route('/api/2fa', twoFactorRoutes);
app.route('/api/admin/data-sync', dataSyncRoutes);
app.route('/api/admin/data', dataBrowserRoutes);
app.route('/api/admin', adminRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    },
    500,
  );
});

const port = env.PORT;

// Setup initial admin if specified (only runs if DISABLE_AUTH=false)
import { setupInitialAdmin } from './lib/initial-admin-setup.ts';
await setupInitialAdmin();

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📝 Environment: ${env.DENO_ENV}`);
console.log(`📝 API URL: ${env.API_URL}`);
console.log(`📝 Frontend URL: ${env.FRONTEND_URL}`);
if (isDevelopment) {
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
  console.log(`📖 ReDoc: http://localhost:${port}/api/redoc`);
}
console.log(`📝 Ready to build! Start with: /requirements then /new-feature`);
Deno.serve({ port }, app.fetch);

