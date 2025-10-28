/**
 * Reusable Test Data Patterns
 *
 * Import these instead of defining test data in every test file.
 * Token savings: ~50-100 tokens per test file
 *
 * Usage:
 * ```typescript
 * import { buildUser, validUserData } from '../helpers/test-data-patterns.ts';
 *
 * const user = buildUser({ email: 'custom@example.com' });
 * ```
 */

// ============================================================================
// Data Builders
// ============================================================================

/**
 * Generic builder for creating test data with defaults + overrides
 */
export function createBuilder<T extends Record<string, unknown>>(
  defaults: T
): (overrides?: Partial<T>) => T {
  return (overrides = {}) => ({
    ...defaults,
    ...overrides,
  });
}

// ============================================================================
// Common Field Patterns
// ============================================================================

export const commonFields = {
  id: () => crypto.randomUUID(),
  createdAt: () => new Date().toISOString(),
  updatedAt: () => new Date().toISOString(),
  status: 'active' as const,
};

// ============================================================================
// Example: User Data (Customize for your domain)
// ============================================================================

export const validUserData = {
  email: 'test@example.com',
  name: 'Test User',
  // Add other required fields
};

export const invalidUserData = {
  missingEmail: {
    name: 'Test User',
  },
  missingName: {
    email: 'test@example.com',
  },
  invalidEmail: {
    email: 'not-an-email',
    name: 'Test User',
  },
  tooLongName: {
    email: 'test@example.com',
    name: 'x'.repeat(101), // Exceeds 100 char limit
  },
  emptyName: {
    email: 'test@example.com',
    name: '',
  },
};

export const buildUser = createBuilder({
  id: crypto.randomUUID(),
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============================================================================
// Example: Task Data (Customize for your domain)
// ============================================================================

export const validTaskData = {
  name: 'Test Task',
  description: 'Test task description',
  status: 'pending' as const,
};

export const invalidTaskData = {
  missingName: {
    description: 'Test task',
    status: 'pending' as const,
  },
  invalidStatus: {
    name: 'Test Task',
    status: 'invalid-status',
  },
  tooLongName: {
    name: 'x'.repeat(101),
    status: 'pending' as const,
  },
};

export const buildTask = createBuilder({
  id: crypto.randomUUID(),
  name: 'Test Task',
  description: 'Test task description',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============================================================================
// Validation Test Data Generators
// ============================================================================

/**
 * Generate test cases for string length validation
 */
export function stringLengthCases(field: string, min: number, max: number) {
  return {
    [`${field}_tooShort`]: 'x'.repeat(min - 1),
    [`${field}_minLength`]: 'x'.repeat(min),
    [`${field}_maxLength`]: 'x'.repeat(max),
    [`${field}_tooLong`]: 'x'.repeat(max + 1),
  };
}

/**
 * Generate test cases for numeric range validation
 */
export function numericRangeCases(field: string, min: number, max: number) {
  return {
    [`${field}_tooSmall`]: min - 1,
    [`${field}_minimum`]: min,
    [`${field}_maximum`]: max,
    [`${field}_tooLarge`]: max + 1,
  };
}

/**
 * Generate test cases for email validation
 */
export const emailCases = {
  valid: [
    'test@example.com',
    'user+tag@example.co.uk',
    'user.name@example.com',
  ],
  invalid: [
    'not-an-email',
    '@example.com',
    'user@',
    'user@.com',
    'user@example',
    '',
  ],
};

/**
 * Generate test cases for required fields
 */
export function requiredFieldCases(requiredFields: string[]) {
  return requiredFields.map((field) => ({
    testName: `missing_${field}`,
    missingField: field,
  }));
}

// ============================================================================
// Common Test Scenarios
// ============================================================================

/**
 * Standard pagination test data
 */
export function createPaginationTestData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Item ${i + 1}`,
    createdAt: new Date(Date.now() + i * 1000).toISOString(),
  }));
}

/**
 * Edge case values for testing
 */
export const edgeCases = {
  strings: {
    empty: '',
    whitespace: '   ',
    veryLong: 'x'.repeat(10000),
    specialChars: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
    unicode: '日本語 🎉 emoji',
    newlines: 'line1\nline2\nline3',
  },
  numbers: {
    zero: 0,
    negative: -1,
    veryLarge: Number.MAX_SAFE_INTEGER,
    verySmall: Number.MIN_SAFE_INTEGER,
    decimal: 3.14159,
  },
  arrays: {
    empty: [],
    single: [1],
    large: Array.from({ length: 1000 }, (_, i) => i),
  },
  objects: {
    empty: {},
    nested: { a: { b: { c: 'deep' } } },
  },
};

// ============================================================================
// KV Test Data
// ============================================================================

/**
 * Create KV seed data for testing
 */
export function createKvSeedData<T>(
  keyPrefix: string,
  items: T[],
  getId: (item: T) => string
) {
  return items.map((item) => ({
    key: [keyPrefix, getId(item)],
    value: item,
  }));
}

/**
 * Create KV seed data with secondary index
 */
export function createKvSeedDataWithIndex<T>(
  keyPrefix: string,
  items: T[],
  getId: (item: T) => string,
  indexKey: string,
  getIndexValue: (item: T) => string
) {
  const data: Array<{ key: unknown[]; value: unknown }> = [];

  items.forEach((item) => {
    // Primary record
    data.push({
      key: [keyPrefix, getId(item)],
      value: item,
    });

    // Secondary index
    data.push({
      key: [`${keyPrefix}_by_${indexKey}`, getIndexValue(item)],
      value: getId(item),
    });
  });

  return data;
}

// ============================================================================
// Export Patterns for Common Use
// ============================================================================

/**
 * Example usage in tests:
 *
 * ```typescript
 * import {
 *   buildUser,
 *   validUserData,
 *   invalidUserData,
 *   emailCases,
 *   stringLengthCases,
 * } from '../helpers/test-data-patterns.ts';
 *
 * // Use builder for custom data
 * const user1 = buildUser({ email: 'user1@example.com' });
 * const user2 = buildUser({ email: 'user2@example.com', role: 'admin' });
 *
 * // Use valid/invalid data for standard tests
 * await service.create(validUserData); // Valid case
 * await assertRejects(() => service.create(invalidUserData.missingEmail)); // Invalid case
 *
 * // Use validation cases
 * const nameLengthCases = stringLengthCases('name', 1, 100);
 * await assertRejects(() => service.create({ name: nameLengthCases.name_tooLong }));
 * ```
 */
