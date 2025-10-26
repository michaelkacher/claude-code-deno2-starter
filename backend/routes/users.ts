/**
 * User routes
 * Example of how to structure API routes
 */

import { Hono } from 'hono';
import type { Context } from 'jsr:@hono/hono';

const users = new Hono();

// GET /api/users
users.get('/', (c: Context) => {
  return c.json({
    data: [
      {
        id: '1',
        email: 'user@example.com',
        name: 'Example User',
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
    },
  });
});

// GET /api/users/:id
users.get('/:id', (c: Context) => {
  const id = c.req.param('id');

  return c.json({
    data: {
      id,
      email: 'user@example.com',
      name: 'Example User',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
});

// POST /api/users
users.post('/', async (c: Context) => {
  const body = await c.req.json();

  // TODO: Add validation with Zod
  // TODO: Add database integration

  return c.json({
    data: {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }, 201);
});

// PUT /api/users/:id
users.put('/:id', async (c: Context) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  return c.json({
    data: {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    },
  });
});

// DELETE /api/users/:id
users.delete('/:id', (c: Context) => {
  const id = c.req.param('id');

  return c.json({
    data: {
      id,
      deleted: true,
    },
  });
});

export default users;
