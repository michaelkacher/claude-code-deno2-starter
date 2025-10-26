/**
 * Test data builders for creating mock data
 * Use these to create consistent test data across your test suite
 */

import type { User } from '@/types';

/**
 * Build a User object with default values
 * Override any properties as needed
 */
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

/**
 * Build an array of users
 */
export function buildUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    buildUser({
      id: `test-user-${i}`,
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
    })
  );
}

// Add more builders as needed for your data models
// Example:
// export function buildTodo(overrides = {}) { ... }
// export function buildPost(overrides = {}) { ... }
