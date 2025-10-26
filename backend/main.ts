/**
 * Main server entry point
 * Using Hono framework for routing
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
    endpoints: {
      health: '/api/health',
      users: '/api/users',
    },
    frontend: 'http://localhost:8000 (run: cd frontend && deno task start)',
  });
});

// API Routes
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example API endpoint
app.get('/api/users', (c) => {
  return c.json({
    data: [
      {
        id: '1',
        email: 'user@example.com',
        name: 'Example User',
        role: 'user',
      },
    ],
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
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
Deno.serve({ port }, app.fetch);
