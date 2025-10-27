/**
 * Main server entry point
 * Using Hono framework for routing
 *
 * This is a minimal starter template. Add your routes as you build features!
 */

import { Hono } from 'hono';
import { cors } from 'jsr:@hono/hono/cors';
import { logger } from 'jsr:@hono/hono/logger';

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

const port = Number(Deno.env.get('PORT')) || 8000;

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📝 Ready to build! Start with: /requirements then /new-feature`);
Deno.serve({ port }, app.fetch);
