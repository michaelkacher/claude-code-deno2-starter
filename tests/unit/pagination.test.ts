/**
 * Pagination Utilities Tests
 */

import { assertEquals, assertExists } from 'jsr:@std/assert';
import {
    createPaginatedResponse,
    formatTotalCount,
    getNextCursor,
    getOffsetLimit,
    getPaginationParams,
    PAGINATION_CONFIG,
    parseCursor,
} from '../../shared/lib/pagination.ts';

// Mock Hono context
function createMockContext(query: Record<string, string> = {}) {
  return {
    req: {
      query: (key: string) => query[key] || null,
    },
  } as any;
}

Deno.test('getPaginationParams - uses default limit when not specified', () => {
  const c = createMockContext({});
  const params = getPaginationParams(c);
  
  assertEquals(params.limit, PAGINATION_CONFIG.DEFAULT_LIMIT);
  assertEquals(params.cursor, undefined);
});

Deno.test('getPaginationParams - parses valid limit', () => {
  const c = createMockContext({ limit: '25' });
  const params = getPaginationParams(c);
  
  assertEquals(params.limit, 25);
});

Deno.test('getPaginationParams - enforces maximum limit', () => {
  const c = createMockContext({ limit: '500' });
  const params = getPaginationParams(c);
  
  assertEquals(params.limit, PAGINATION_CONFIG.MAX_LIMIT);
});

Deno.test('getPaginationParams - enforces minimum limit', () => {
  const c = createMockContext({ limit: '0' });
  const params = getPaginationParams(c);
  
  assertEquals(params.limit, PAGINATION_CONFIG.MIN_LIMIT);
});

Deno.test('getPaginationParams - handles negative limit', () => {
  const c = createMockContext({ limit: '-10' });
  const params = getPaginationParams(c);
  
  assertEquals(params.limit, PAGINATION_CONFIG.MIN_LIMIT);
});

Deno.test('getPaginationParams - handles invalid limit string', () => {
  const c = createMockContext({ limit: 'abc' });
  const params = getPaginationParams(c);
  
  assertEquals(params.limit, PAGINATION_CONFIG.DEFAULT_LIMIT);
});

Deno.test('getPaginationParams - parses cursor', () => {
  const c = createMockContext({ cursor: 'abc123' });
  const params = getPaginationParams(c);
  
  assertEquals(params.cursor, 'abc123');
});

Deno.test('getPaginationParams - parses offset', () => {
  const c = createMockContext({ offset: '20' });
  const params = getPaginationParams(c);
  
  assertEquals(params.offset, 20);
});

Deno.test('getPaginationParams - handles invalid offset', () => {
  const c = createMockContext({ offset: 'invalid' });
  const params = getPaginationParams(c);
  
  assertEquals(params.offset, undefined);
});

Deno.test('getPaginationParams - respects custom maxLimit', () => {
  const c = createMockContext({ limit: '75' });
  const params = getPaginationParams(c, { maxLimit: 50 });
  
  assertEquals(params.limit, 50);
});

Deno.test('getPaginationParams - respects custom defaultLimit', () => {
  const c = createMockContext({});
  const params = getPaginationParams(c, { defaultLimit: 25 });
  
  assertEquals(params.limit, 25);
});

Deno.test('createPaginatedResponse - creates response with all fields', () => {
  const data = [{ id: 1 }, { id: 2 }];
  const response = createPaginatedResponse(data, {
    limit: 10,
    cursor: 'abc',
    nextCursor: 'def',
    hasMore: true,
    total: 100,
  });
  
  assertEquals(response.data, data);
  assertEquals(response.pagination.limit, 10);
  assertEquals(response.pagination.cursor, 'abc');
  assertEquals(response.pagination.nextCursor, 'def');
  assertEquals(response.pagination.hasMore, true);
  assertEquals(response.pagination.total, 100);
});

Deno.test('createPaginatedResponse - infers hasMore from nextCursor', () => {
  const data = [{ id: 1 }];
  const response = createPaginatedResponse(data, {
    limit: 10,
    nextCursor: 'abc',
  });
  
  assertEquals(response.pagination.hasMore, true);
});

Deno.test('createPaginatedResponse - handles no more results', () => {
  const data = [{ id: 1 }];
  const response = createPaginatedResponse(data, {
    limit: 10,
    hasMore: false,
  });
  
  assertEquals(response.pagination.hasMore, false);
  assertEquals(response.pagination.nextCursor, undefined);
});

Deno.test('getNextCursor - returns cursor when more results', () => {
  const entries = [
    { key: ['users', '1'], value: { id: 1 } },
    { key: ['users', '2'], value: { id: 2 } },
    { key: ['users', '3'], value: { id: 3 } },
  ];
  
  const cursor = getNextCursor(entries, 2);
  
  assertExists(cursor);
  assertEquals(cursor, JSON.stringify(['users', '2']));
});

Deno.test('getNextCursor - returns undefined when no more results', () => {
  const entries = [
    { key: ['users', '1'], value: { id: 1 } },
    { key: ['users', '2'], value: { id: 2 } },
  ];
  
  const cursor = getNextCursor(entries, 2);
  
  assertEquals(cursor, undefined);
});

Deno.test('parseCursor - parses valid cursor', () => {
  const cursor = JSON.stringify(['users', '123']);
  const key = parseCursor(cursor);
  
  assertEquals(key, ['users', '123']);
});

Deno.test('parseCursor - handles invalid cursor', () => {
  const key = parseCursor('invalid-json');
  
  assertEquals(key, []);
});

Deno.test('getOffsetLimit - calculates offset for page 1', () => {
  const result = getOffsetLimit(1, 20);
  
  assertEquals(result.offset, 0);
  assertEquals(result.limit, 20);
});

Deno.test('getOffsetLimit - calculates offset for page 2', () => {
  const result = getOffsetLimit(2, 20);
  
  assertEquals(result.offset, 20);
  assertEquals(result.limit, 20);
});

Deno.test('getOffsetLimit - enforces max limit', () => {
  const result = getOffsetLimit(1, 500);
  
  assertEquals(result.limit, PAGINATION_CONFIG.MAX_LIMIT);
});

Deno.test('getOffsetLimit - enforces min limit', () => {
  const result = getOffsetLimit(1, 0);
  
  assertEquals(result.limit, PAGINATION_CONFIG.MIN_LIMIT);
});

Deno.test('getOffsetLimit - handles invalid page number', () => {
  const result = getOffsetLimit(0, 20);
  
  assertEquals(result.offset, 0); // Page 0 treated as page 1
});

Deno.test('getOffsetLimit - handles negative page number', () => {
  const result = getOffsetLimit(-5, 20);
  
  assertEquals(result.offset, 0); // Negative page treated as page 1
});

Deno.test('formatTotalCount - returns count when below max', () => {
  const result = formatTotalCount(500);
  
  assertEquals(result, 500);
});

Deno.test('formatTotalCount - returns string when above max', () => {
  const result = formatTotalCount(15000);
  
  assertEquals(result, '10000+');
});

Deno.test('formatTotalCount - respects custom max', () => {
  const result = formatTotalCount(600, 500);
  
  assertEquals(result, '500+');
});

Deno.test('formatTotalCount - returns exact count at boundary', () => {
  const result = formatTotalCount(10000);
  
  assertEquals(result, 10000);
});
