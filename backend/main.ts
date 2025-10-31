/**
 * Main server entry point
 * Using Hono framework for routing
 *
 * This is a minimal starter template. Add your routes as you build features!
 */

import { Hono } from 'hono';
import { cors } from 'jsr:@hono/hono/cors';
import { logger } from 'jsr:@hono/hono/logger';
import openApiRoutes from './routes/openapi.ts';
import { env, isDevelopment } from './config/env.ts';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

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

// TODO: Import and mount your routes here
// Example:
// import userRoutes from './routes/users.ts';
// app.route('/api/users', userRoutes);

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
