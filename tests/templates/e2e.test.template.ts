/**
 * E2E Test Template for [Feature Name]
 * 
 * Tests complete user workflows in a real browser environment.
 * Uses Playwright for browser automation.
 * 
 * @see https://playwright.dev/docs/intro
 */

import { expect, test } from '@playwright/test';

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8000';

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
};

/**
 * Setup: Run before all tests
 * Use this for one-time setup like creating test users
 */
test.beforeAll(async ({ request }) => {
  // Example: Create test user via API
  // await request.post(`${API_URL}/api/auth/signup`, {
  //   data: testUser,
  // });
});

/**
 * Cleanup: Run after all tests
 * Use this for cleanup like deleting test data
 */
test.afterAll(async ({ request }) => {
  // Example: Clean up test user
  // await request.delete(`${API_URL}/api/admin/users/${testUser.id}`);
});

/**
 * Setup: Run before each test
 * Use this for per-test setup like logging in
 */
test.beforeEach(async ({ page }) => {
  // Example: Navigate to home page before each test
  // await page.goto(BASE_URL);
});

// ============================================================================
// Happy Path Tests
// ============================================================================

test.describe('[Feature Name] - Happy Path', () => {
  test('should [action] successfully', async ({ page }) => {
    // Arrange: Navigate to the page
    await page.goto(`${BASE_URL}/[route]`);
    
    // Act: Perform user action
    await page.fill('[data-testid="input-field"]', 'test value');
    await page.click('[data-testid="submit-button"]');
    
    // Assert: Verify expected outcome
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toHaveText('Success!');
  });

  test('should display [list/data] correctly', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}/[route]`);
    
    // Act: Wait for data to load
    await page.waitForSelector('[data-testid="data-list"]');
    
    // Assert: Verify data is displayed
    const items = await page.locator('[data-testid="list-item"]').count();
    expect(items).toBeGreaterThan(0);
  });

  test('should navigate through [workflow] successfully', async ({ page }) => {
    // Step 1: Start workflow
    await page.goto(`${BASE_URL}/[start-route]`);
    await page.click('[data-testid="start-button"]');
    
    // Step 2: Fill form
    await page.fill('[data-testid="field-1"]', 'value 1');
    await page.fill('[data-testid="field-2"]', 'value 2');
    await page.click('[data-testid="next-button"]');
    
    // Step 3: Confirm and submit
    await page.click('[data-testid="confirm-button"]');
    
    // Assert: Verify completion
    await expect(page).toHaveURL(`${BASE_URL}/[completion-route]`);
    await expect(page.locator('[data-testid="completion-message"]')).toBeVisible();
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

test.describe('[Feature Name] - Error Handling', () => {
  test('should show validation error for invalid input', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}/[route]`);
    
    // Act: Submit invalid data
    await page.fill('[data-testid="input-field"]', 'invalid');
    await page.click('[data-testid="submit-button"]');
    
    // Assert: Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');
  });

  test('should handle network error gracefully', async ({ page }) => {
    // Arrange: Mock network failure
    await page.route(`${API_URL}/api/[endpoint]`, route => route.abort());
    await page.goto(`${BASE_URL}/[route]`);
    
    // Act: Trigger request
    await page.click('[data-testid="submit-button"]');
    
    // Assert: Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('network');
  });

  test('should prevent submission with empty required fields', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}/[route]`);
    
    // Act: Try to submit without filling required fields
    await page.click('[data-testid="submit-button"]');
    
    // Assert: Verify submission blocked
    await expect(page).toHaveURL(`${BASE_URL}/[route]`); // Still on same page
    await expect(page.locator('[data-testid="required-error"]')).toBeVisible();
  });
});

// ============================================================================
// Authentication & Authorization Tests
// ============================================================================

test.describe('[Feature Name] - Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    // Arrange: Clear any existing auth
    await page.context().clearCookies();
    
    // Act: Try to access protected route
    await page.goto(`${BASE_URL}/[protected-route]`);
    
    // Assert: Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should access protected route when authenticated', async ({ page }) => {
    // Arrange: Log in
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${BASE_URL}/`);
    
    // Act: Navigate to protected route
    await page.goto(`${BASE_URL}/[protected-route]`);
    
    // Assert: Verify access granted
    await expect(page).toHaveURL(`${BASE_URL}/[protected-route]`);
    await expect(page.locator('[data-testid="protected-content"]')).toBeVisible();
  });

  test('should prevent unauthorized access to admin routes', async ({ page, request }) => {
    // Arrange: Log in as regular user (not admin)
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Act: Try to access admin route
    await page.goto(`${BASE_URL}/admin`);
    
    // Assert: Verify access denied
    await expect(page).toHaveURL(`${BASE_URL}/`); // Redirected to home
    await expect(page.locator('[data-testid="unauthorized-message"]')).toBeVisible();
  });
});

// ============================================================================
// UI/UX Tests
// ============================================================================

test.describe('[Feature Name] - UI/UX', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Arrange: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/[route]`);
    
    // Assert: Verify mobile layout
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-menu"]')).not.toBeVisible();
  });

  test('should show loading state during data fetch', async ({ page }) => {
    // Arrange: Slow down network to see loading state
    await page.route(`${API_URL}/api/[endpoint]`, async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Act: Navigate to page that fetches data
    await page.goto(`${BASE_URL}/[route]`);
    
    // Assert: Verify loading indicator appears
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Assert: Verify loading disappears when data loaded
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="data-list"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Arrange
    await page.goto(`${BASE_URL}/[route]`);
    
    // Act: Use keyboard to navigate
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.press('Enter'); // Activate element
    
    // Assert: Verify keyboard interaction works
    await expect(page.locator('[data-testid="activated-element"]')).toBeVisible();
  });
});

// ============================================================================
// Data Persistence Tests
// ============================================================================

test.describe('[Feature Name] - Data Persistence', () => {
  test('should persist data after page reload', async ({ page }) => {
    // Arrange: Create data
    await page.goto(`${BASE_URL}/[route]`);
    await page.fill('[data-testid="input-field"]', 'test value');
    await page.click('[data-testid="save-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Act: Reload page
    await page.reload();
    
    // Assert: Verify data persisted
    const value = await page.inputValue('[data-testid="input-field"]');
    expect(value).toBe('test value');
  });

  test('should sync data across tabs', async ({ browser }) => {
    // Arrange: Open two tabs
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Act: Make change in first tab
    await page1.goto(`${BASE_URL}/[route]`);
    await page1.fill('[data-testid="input-field"]', 'synced value');
    await page1.click('[data-testid="save-button"]');
    
    // Navigate to same page in second tab
    await page2.goto(`${BASE_URL}/[route]`);
    
    // Assert: Verify data synced
    const value = await page2.inputValue('[data-testid="input-field"]');
    expect(value).toBe('synced value');
    
    await context.close();
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

test.describe('[Feature Name] - Performance', () => {
  test('should load page within acceptable time', async ({ page }) => {
    // Act: Measure page load time
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/[route]`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Assert: Verify load time under threshold
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });

  test('should handle large data sets efficiently', async ({ page }) => {
    // Arrange: Navigate to page with pagination
    await page.goto(`${BASE_URL}/[route]?limit=100`);
    
    // Act: Wait for data to load
    await page.waitForSelector('[data-testid="data-list"]');
    
    // Assert: Verify page renders without hanging
    const items = await page.locator('[data-testid="list-item"]').count();
    expect(items).toBeGreaterThan(0);
    
    // Verify scroll works smoothly (no jank)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(100);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper: Log in a user
 */
async function login(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`${BASE_URL}/`);
}

/**
 * Helper: Create test data via API
 */
async function createTestData(request: any, data: any) {
  const response = await request.post(`${API_URL}/api/[endpoint]`, {
    data,
  });
  return response.json();
}

/**
 * Helper: Clean up test data
 */
async function cleanupTestData(request: any, id: string) {
  await request.delete(`${API_URL}/api/[endpoint]/${id}`);
}

/**
 * Helper: Wait for element to be stable (not animating)
 */
async function waitForStable(page: any, selector: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible' });
  
  // Wait for animations to complete
  await page.waitForTimeout(300);
}
