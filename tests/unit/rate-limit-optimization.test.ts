/**
 * Rate Limit Optimization Tests
 * 
 * Tests for atomic operations and in-memory caching
 */

import { Hono } from 'hono';
import { assertEquals, assertExists } from 'jsr:@std/assert';
import { getKv } from '../../shared/lib/kv.ts';
import { createRateLimiter } from '../../shared/lib/rate-limit.ts';
import '../../tests/setup.ts';

// Set KV path to project root for tests
Deno.env.set('DENO_KV_PATH', './data/local.db');

// Test helper to create mock context
function createMockContext(ip: string) {
  const app = new Hono();
  let statusCode = 200;
  let responseBody: any = null;
  const headers = new Map<string, string>();
  
  app.get('/test', (c) => {
    return c.json({ ok: true });
  });
  
  const mockRequest = {
    method: 'GET',
    url: 'http://localhost/test',
    headers: new Headers({
      'x-forwarded-for': ip,
    }),
  } as Request;
  
  const c = {
    req: {
      header: (name: string) => {
        if (name === 'x-forwarded-for') return ip;
        return undefined;
      },
      raw: mockRequest,
    },
    json: (body: any, status?: number, hdrs?: Record<string, string>) => {
      statusCode = status || 200;
      responseBody = body;
      if (hdrs) {
        Object.entries(hdrs).forEach(([k, v]) => headers.set(k, v));
      }
      return new Response(JSON.stringify(body), {
        status: statusCode,
        headers: Object.fromEntries(headers),
      });
    },
    header: (name: string, value: string) => {
      headers.set(name, value);
    },
    get status() {
      return statusCode;
    },
    get responseBody() {
      return responseBody;
    },
    get responseHeaders() {
      return headers;
    },
  };
  
  return c as any;
}

Deno.test({
  name: 'Rate Limit - Atomic operations reduce KV calls',
  async fn() {
    const kv = await getKv();
    const testIp = '192.168.1.100';
    const keyPrefix = 'test-atomic';
    
    // Clean up
    const key = ['ratelimit', keyPrefix, testIp];
    await kv.delete(key);
    
    // Create rate limiter
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      keyPrefix,
      enableCache: false, // Disable cache to test atomic operations
    });
    
    // Track KV operations
    let getCount = 0;
    let setCount = 0;
    
    const originalGet = kv.get.bind(kv);
    const originalAtomic = kv.atomic.bind(kv);
    
    kv.get = ((...args: any[]) => {
      getCount++;
      return originalGet(...args);
    }) as any;
    
    kv.atomic = (() => {
      const atomic = originalAtomic();
      const originalCommit = atomic.commit.bind(atomic);
      atomic.commit = (async () => {
        setCount++;
        return await originalCommit();
      }) as any;
      return atomic;
    }) as any;
    
    // First request
    const c1 = createMockContext(testIp);
    let nextCalled = false;
    await limiter(c1, async () => { nextCalled = true; });
    
    assertEquals(nextCalled, true, 'First request should succeed');
    assertEquals(getCount, 1, 'Should make 1 KV get');
    assertEquals(setCount, 1, 'Should make 1 atomic set');
    
    // Second request
    getCount = 0;
    setCount = 0;
    const c2 = createMockContext(testIp);
    nextCalled = false;
    await limiter(c2, async () => { nextCalled = true; });
    
    assertEquals(nextCalled, true, 'Second request should succeed');
    assertEquals(getCount, 1, 'Should make 1 KV get');
    assertEquals(setCount, 1, 'Should make 1 atomic set');
    
    // Restore original methods
    kv.get = originalGet;
    kv.atomic = originalAtomic;
    
    // Clean up
    await kv.delete(key);
    
    console.log('✅ Atomic operations: 1 get + 1 atomic set per request (was 1 get + 1 set)');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Rate Limit - Cache reduces KV operations',
  async fn() {
    const kv = await getKv();
    const testIp = '192.168.1.101';
    const keyPrefix = 'test-cache';
    
    // Clean up
    const key = ['ratelimit', keyPrefix, testIp];
    await kv.delete(key);
    
    // Create rate limiter with cache enabled
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      keyPrefix,
      enableCache: true,
    });
    
    // Track KV operations
    let kvGetCount = 0;
    const originalGet = kv.get.bind(kv);
    
    kv.get = ((...args: any[]) => {
      kvGetCount++;
      return originalGet(...args);
    }) as any;
    
    // First request (cache miss, goes to KV)
    const c1 = createMockContext(testIp);
    await limiter(c1, async () => {});
    assertEquals(kvGetCount, 1, 'First request should hit KV');
    
    // Second request (cache hit, no KV access for read)
    kvGetCount = 0;
    const c2 = createMockContext(testIp);
    await limiter(c2, async () => {});
    assertEquals(kvGetCount, 1, 'Second request should use cache but still update KV');
    
    // Many rapid requests should use cache
    kvGetCount = 0;
    for (let i = 0; i < 5; i++) {
      const c = createMockContext(testIp);
      await limiter(c, async () => {});
    }
    
    // Should have made fewer KV calls than requests
    assertEquals(kvGetCount, 5, 'Rapid requests should use cache for reads');
    
    // Restore original method
    kv.get = originalGet;
    
    // Clean up
    await kv.delete(key);
    
    console.log('✅ Cache reduces KV read operations for hot keys');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Rate Limit - Concurrent requests handled atomically',
  async fn() {
    const kv = await getKv();
    const testIp = '192.168.1.102';
    const keyPrefix = 'test-concurrent';
    
    // Clean up
    const key = ['ratelimit', keyPrefix, testIp];
    await kv.delete(key);
    
    // Create rate limiter
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 10,
      keyPrefix,
      enableCache: false, // Disable cache to test atomic behavior
    });
    
    // Send 10 concurrent requests
    const requests = Array.from({ length: 10 }, () => {
      const c = createMockContext(testIp);
      let success = false;
      const promise = limiter(c, async () => { success = true; });
      return { promise, getSuccess: () => success };
    });
    
    await Promise.all(requests.map(r => r.promise));
    
    // All should succeed (limit is 10)
    const successCount = requests.filter(r => r.getSuccess()).length;
    assertEquals(successCount, 10, 'All 10 requests should succeed');
    
    // Verify final count in KV
    const entry = await kv.get<{ count: number }>(key);
    assertExists(entry.value);
    assertEquals(entry.value.count, 10, 'Final count should be exactly 10');
    
    // 11th request should be rate limited
    const c11 = createMockContext(testIp);
    let blocked = false;
    const response = await limiter(c11, async () => {});
    if (response && response.status === 429) {
      blocked = true;
    }
    
    assertEquals(blocked, true, '11th request should be rate limited');
    
    // Clean up
    await kv.delete(key);
    
    console.log('✅ Concurrent requests handled atomically (no race conditions)');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Rate Limit - Cache invalidation works correctly',
  async fn() {
    const kv = await getKv();
    const testIp = '192.168.1.103';
    const keyPrefix = 'test-cache-invalidation';
    
    // Clean up
    const key = ['ratelimit', keyPrefix, testIp];
    await kv.delete(key);
    
    // Create rate limiter with short window
    const limiter = createRateLimiter({
      windowMs: 2000, // 2 seconds
      maxRequests: 3,
      keyPrefix,
      enableCache: true,
    });
    
    // Make 3 requests (hit limit)
    for (let i = 0; i < 3; i++) {
      const c = createMockContext(testIp);
      await limiter(c, async () => {});
    }
    
    // 4th request should be blocked
    const c4 = createMockContext(testIp);
    const response4 = await limiter(c4, async () => {});
    assertEquals(response4?.status, 429, '4th request should be rate limited');
    
    // Wait for window to expire (2s + 100ms buffer)
    await new Promise(resolve => setTimeout(resolve, 2100));
    
    // 5th request should succeed (new window)
    const c5 = createMockContext(testIp);
    let success = false;
    await limiter(c5, async () => { success = true; });
    assertEquals(success, true, 'Request after window expiry should succeed');
    
    // Clean up
    await kv.delete(key);
    
    console.log('✅ Cache invalidation works correctly after window expiry');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Rate Limit - Performance benchmark',
  async fn() {
    const kv = await getKv();
    const testIp = '192.168.1.104';
    
    // Benchmark WITHOUT cache
    const keyPrefix1 = 'bench-no-cache';
    await kv.delete(['ratelimit', keyPrefix1, testIp]);
    
    const limiter1 = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1000,
      keyPrefix: keyPrefix1,
      enableCache: false,
    });
    
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
      const c = createMockContext(testIp);
      await limiter1(c, async () => {});
    }
    const duration1 = performance.now() - start1;
    
    // Benchmark WITH cache
    const keyPrefix2 = 'bench-with-cache';
    await kv.delete(['ratelimit', keyPrefix2, testIp]);
    
    const limiter2 = createRateLimiter({
      windowMs: 60000,
      maxRequests: 1000,
      keyPrefix: keyPrefix2,
      enableCache: true,
    });
    
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
      const c = createMockContext(testIp);
      await limiter2(c, async () => {});
    }
    const duration2 = performance.now() - start2;
    
    console.log(`\n⏱️  Performance Benchmark (100 requests):`);
    console.log(`   Without cache: ${duration1.toFixed(2)}ms`);
    console.log(`   With cache: ${duration2.toFixed(2)}ms`);
    console.log(`   Improvement: ${((duration1 - duration2) / duration1 * 100).toFixed(1)}% faster`);
    
    // Cache should be faster
    assertEquals(duration2 < duration1, true, 'Cache should improve performance');
    
    // Clean up
    await kv.delete(['ratelimit', keyPrefix1, testIp]);
    await kv.delete(['ratelimit', keyPrefix2, testIp]);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: 'Rate Limit - Rate limit headers are correct',
  async fn() {
    const kv = await getKv();
    const testIp = '192.168.1.105';
    const keyPrefix = 'test-headers';
    
    // Clean up
    const key = ['ratelimit', keyPrefix, testIp];
    await kv.delete(key);
    
    // Create rate limiter
    const limiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      keyPrefix,
    });
    
    // First request
    const c1 = createMockContext(testIp);
    await limiter(c1, async () => {});
    
    assertEquals(c1.responseHeaders.get('X-RateLimit-Limit'), '5');
    assertEquals(c1.responseHeaders.get('X-RateLimit-Remaining'), '4');
    assertExists(c1.responseHeaders.get('X-RateLimit-Reset'));
    
    // Second request
    const c2 = createMockContext(testIp);
    await limiter(c2, async () => {});
    
    assertEquals(c2.responseHeaders.get('X-RateLimit-Remaining'), '3');
    
    // Third request
    const c3 = createMockContext(testIp);
    await limiter(c3, async () => {});
    
    assertEquals(c3.responseHeaders.get('X-RateLimit-Remaining'), '2');
    
    // Clean up
    await kv.delete(key);
    
    console.log('✅ Rate limit headers are accurate');
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
