// Deno test setup
// This file runs before all tests


// Mock environment variables for testing
Deno.env.set('DENO_ENV', 'test');
Deno.env.set('API_URL', 'http://localhost:3000/api');

// Global test utilities
export { assertEquals, assertExists, assertThrows } from 'jsr:@std/assert';

// Mock fetch for testing (if needed)
export function mockFetch(response: unknown, options: { status?: number } = {}) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    return new Response(JSON.stringify(response), {
      status: options.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

// Test data builders
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}
