/**
 * Admin Data Browser API Routes
 * Provides endpoints to browse all models in Deno KV storage
 */

import { Context, Hono } from 'hono';
import { verifyToken } from '../lib/jwt.ts';
import { getKv } from '../lib/kv.ts';

const dataBrowser = new Hono();
const kv = await getKv();

// Known model prefixes in the database
const MODEL_PREFIXES = [
  'users',
  'users_by_email',
  'refresh_tokens',
  'token_blacklist',
  'password_reset',
  'email_verification',
];

/**
 * GET /api/admin/data/models
 * Get list of available models/collections
 */
dataBrowser.get('/models', async (c: Context) => {
  try {
    // Verify admin access
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'No access token' } }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    const userEntry = await kv.get(['users', payload.sub]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    if (user.role !== 'admin') {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, 403);
    }

    // Count entries for each model
    const models = await Promise.all(
      MODEL_PREFIXES.map(async (prefix) => {
        let count = 0;
        const entries = kv.list({ prefix: [prefix] });
        
        for await (const _entry of entries) {
          count++;
          if (count > 1000) break; // Limit count to prevent long queries
        }
        
        return {
          name: prefix,
          count,
        };
      })
    );

    return c.json({
      data: {
        models: models.filter(m => m.count > 0), // Only return models with data
      }
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch models' } }, 500);
  }
});

/**
 * GET /api/admin/data/:model
 * Get data for a specific model with pagination and filtering
 */
dataBrowser.get('/:model', async (c: Context) => {
  try {
    // Verify admin access
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'No access token' } }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    const userEntry = await kv.get(['users', payload.sub]);
    if (!userEntry.value) {
      return c.json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }, 404);
    }

    const user = userEntry.value as any;
    if (user.role !== 'admin') {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, 403);
    }

    const model = c.req.param('model');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const filterProperty = c.req.query('filterProperty');
    const filterValue = c.req.query('filterValue');

    // Validate model exists
    if (!MODEL_PREFIXES.includes(model)) {
      return c.json({ error: { code: 'INVALID_MODEL', message: 'Invalid model name' } }, 400);
    }

    const entries = kv.list({ prefix: [model] });
    const data: any[] = [];
    const allProperties = new Set<string>();
    let totalCount = 0;
    let skipped = 0;
    const skip = (page - 1) * limit;

    for await (const entry of entries) {
      totalCount++;
      
      // Apply filtering if specified
      if (filterProperty && filterValue && entry.value) {
        const value = entry.value as any;
        const propValue = String(value[filterProperty] || '');
        if (!propValue.toLowerCase().includes(filterValue.toLowerCase())) {
          continue;
        }
      }

      // Skip entries for pagination
      if (skipped < skip) {
        skipped++;
        continue;
      }

      // Collect data
      if (data.length < limit) {
        const item: any = {
          _key: entry.key,
          _versionstamp: entry.versionstamp,
        };

        // Handle different value types
        if (entry.value && typeof entry.value === 'object') {
          Object.assign(item, entry.value);
          
          // Collect all property names for schema
          Object.keys(entry.value as object).forEach(key => {
            allProperties.add(key);
          });
          
          // Mask sensitive fields
          if (item.password) {
            item.password = '••••••••';
          }
          if (item.twoFactorSecret) {
            item.twoFactorSecret = '••••••••';
          }
        } else {
          item._value = entry.value;
        }
        
        data.push(item);
      }

      // Stop if we have enough data
      if (data.length >= limit) {
        break;
      }
    }

    const properties = ['_key', '_versionstamp', ...Array.from(allProperties).sort()];

    return c.json({
      data: {
        model,
        properties,
        items: data,
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore: data.length === limit,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching model data:', error);
    return c.json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch model data' } }, 500);
  }
});

export default dataBrowser;
