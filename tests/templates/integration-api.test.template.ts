/**
 * Integration Test Template (API Endpoint)
 * Copy this template for new API endpoint tests
 * Replace [ENDPOINT] and [Feature] with actual values
 */

import { assertEquals } from 'jsr:@std/assert';
import { createTestClient } from '../helpers/test-client.ts';

// TODO: Import types
// import type { Feature } from '../../shared/types/index.ts';

const client = createTestClient();

Deno.test('[ENDPOINT] - creates resource with valid data', async () => {
  // Arrange
  const validData = {
    // TODO: Add valid test data
  };

  // Act
  const response = await client.post('/api/[endpoint]', validData);

  // Assert
  assertEquals(response.status, 201);
  assertEquals(response.data.propertyName, validData.propertyName);
});

Deno.test('[ENDPOINT] - returns 400 for invalid data', async () => {
  // Arrange
  const invalidData = {
    // TODO: Add invalid test data
  };

  // Act
  const response = await client.post('/api/[endpoint]', invalidData);

  // Assert
  assertEquals(response.status, 400);
  assertEquals(response.error?.code, 'VALIDATION_ERROR');
});

Deno.test('[ENDPOINT] - returns 401 for unauthenticated request', async () => {
  // Act
  const response = await client.post('/api/[endpoint]', {}, {
    skipAuth: true,
  });

  // Assert
  assertEquals(response.status, 401);
});

Deno.test('[ENDPOINT] - lists all resources', async () => {
  // Arrange
  // TODO: Create test data

  // Act
  const response = await client.get('/api/[endpoint]');

  // Assert
  assertEquals(response.status, 200);
  assertEquals(Array.isArray(response.data), true);
});

Deno.test('[ENDPOINT] - gets resource by id', async () => {
  // Arrange
  const testId = 'test-id';

  // Act
  const response = await client.get(`/api/[endpoint]/${testId}`);

  // Assert
  assertEquals(response.status, 200);
  assertEquals(response.data.id, testId);
});

Deno.test('[ENDPOINT] - returns 404 for non-existent resource', async () => {
  // Act
  const response = await client.get('/api/[endpoint]/non-existent-id');

  // Assert
  assertEquals(response.status, 404);
});
