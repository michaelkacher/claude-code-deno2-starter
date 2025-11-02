# E2E Test Patterns

Quick reference for common Playwright testing patterns.

## Selectors

### Data Test IDs (RECOMMENDED)
```typescript
// Add to your components:
<button data-testid="submit-button">Submit</button>

// Use in tests:
await page.click('[data-testid="submit-button"]');
```

### Other Selectors
```typescript
// By role (accessible)
await page.getByRole('button', { name: 'Submit' });

// By text
await page.getByText('Welcome');

// By placeholder
await page.getByPlaceholder('Enter email');

// By label
await page.getByLabel('Email address');

// CSS selector
await page.locator('.my-class');
```

## Form Interactions

### Input Fields
```typescript
// Text input
await page.fill('[data-testid="email"]', 'test@example.com');

// Clear and type
await page.fill('[data-testid="email"]', ''); // Clear
await page.type('[data-testid="email"]', 'test@example.com');

// Select dropdown
await page.selectOption('[data-testid="country"]', 'USA');

// Checkbox
await page.check('[data-testid="terms"]');
await page.uncheck('[data-testid="newsletter"]');

// Radio button
await page.check('[data-testid="plan-pro"]');

// File upload
await page.setInputFiles('[data-testid="avatar"]', 'path/to/file.jpg');
```

### Buttons and Clicks
```typescript
// Click
await page.click('[data-testid="submit"]');

// Double click
await page.dblclick('[data-testid="row"]');

// Right click
await page.click('[data-testid="menu"]', { button: 'right' });

// Click with modifier keys
await page.click('[data-testid="item"]', { modifiers: ['Control'] });

// Click specific position
await page.click('[data-testid="canvas"]', { position: { x: 100, y: 200 } });
```

## Waiting and Timing

### Wait for Elements
```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="content"]');

// Wait for element to be hidden
await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });

// Wait for element to be attached (in DOM)
await page.waitForSelector('[data-testid="item"]', { state: 'attached' });

// Wait for element to be detached (removed from DOM)
await page.waitForSelector('[data-testid="modal"]', { state: 'detached' });
```

### Wait for Navigation
```typescript
// Wait for URL
await page.waitForURL('**/dashboard');

// Wait for load state
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');
await page.waitForLoadState('load');
```

### Wait for Function
```typescript
// Wait for custom condition
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length > 5;
});

// Wait for API response
await page.waitForResponse('**/api/users');
```

## Assertions

### Element Assertions
```typescript
// Visibility
await expect(page.locator('[data-testid="message"]')).toBeVisible();
await expect(page.locator('[data-testid="loading"]')).toBeHidden();

// Text content
await expect(page.locator('[data-testid="title"]')).toHaveText('Welcome');
await expect(page.locator('[data-testid="title"]')).toContainText('come');

// Value
await expect(page.locator('[data-testid="email"]')).toHaveValue('test@example.com');

// Attribute
await expect(page.locator('[data-testid="link"]')).toHaveAttribute('href', '/home');

// Class
await expect(page.locator('[data-testid="button"]')).toHaveClass(/active/);

// Count
await expect(page.locator('[data-testid="item"]')).toHaveCount(5);

// Enabled/Disabled
await expect(page.locator('[data-testid="submit"]')).toBeEnabled();
await expect(page.locator('[data-testid="submit"]')).toBeDisabled();

// Checked
await expect(page.locator('[data-testid="terms"]')).toBeChecked();
await expect(page.locator('[data-testid="newsletter"]')).not.toBeChecked();
```

### Page Assertions
```typescript
// URL
await expect(page).toHaveURL('http://localhost:3000/dashboard');
await expect(page).toHaveURL(/dashboard/);

// Title
await expect(page).toHaveTitle('Dashboard - MyApp');

// Screenshot comparison (visual regression)
await expect(page).toHaveScreenshot('dashboard.png');
```

## Navigation

```typescript
// Go to URL
await page.goto('http://localhost:3000');

// Go back
await page.goBack();

// Go forward
await page.goForward();

// Reload
await page.reload();

// Navigate and wait for load
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
```

## Authentication

### Login Helper
```typescript
async function login(page, email, password) {
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/');
}

// Use in tests
test('should access protected route', async ({ page }) => {
  await login(page, 'test@example.com', 'password123');
  await page.goto('http://localhost:3000/dashboard');
  // ... test protected route
});
```

### Reuse Authentication State
```typescript
// Save auth state once
test('login and save state', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Save authentication state
  await page.context().storageState({ path: 'auth.json' });
});

// Reuse in other tests
test.use({ storageState: 'auth.json' });

test('access dashboard', async ({ page }) => {
  // Already logged in!
  await page.goto('http://localhost:3000/dashboard');
});
```

## API Mocking

### Mock API Response
```typescript
test('should handle API error', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });
  
  await page.goto('http://localhost:3000/users');
  await expect(page.locator('[data-testid="error"]')).toBeVisible();
});

// Mock with custom response
await page.route('**/api/users', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ]),
  });
});

// Abort request (network failure)
await page.route('**/api/users', route => route.abort());
```

## Keyboard and Mouse

### Keyboard
```typescript
// Press single key
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');
await page.keyboard.press('Escape');

// Press key combination
await page.keyboard.press('Control+A');
await page.keyboard.press('Meta+C'); // Command on Mac

// Type text
await page.keyboard.type('Hello World');

// Press and hold
await page.keyboard.down('Shift');
await page.keyboard.press('A');
await page.keyboard.up('Shift');
```

### Mouse
```typescript
// Move to position
await page.mouse.move(100, 200);

// Click at position
await page.mouse.click(100, 200);

// Drag and drop
await page.mouse.move(100, 100);
await page.mouse.down();
await page.mouse.move(200, 200);
await page.mouse.up();
```

## Screenshots and Videos

```typescript
// Screenshot element
await page.locator('[data-testid="chart"]').screenshot({ path: 'chart.png' });

// Screenshot full page
await page.screenshot({ path: 'page.png', fullPage: true });

// Video recording (in playwright.config.ts)
use: {
  video: 'on', // 'on', 'off', 'retain-on-failure'
}
```

## Mobile and Responsive

```typescript
// Set viewport size
await page.setViewportSize({ width: 375, height: 667 });

// Test with device preset
const iPhone = devices['iPhone 13'];
const context = await browser.newContext({
  ...iPhone,
});

// Test rotation
await page.setViewportSize({ width: 667, height: 375 }); // Landscape
```

## Debugging

```typescript
// Pause execution (opens inspector)
await page.pause();

// Console output
page.on('console', msg => console.log(msg.text()));

// Network requests
page.on('request', request => console.log('>>', request.method(), request.url()));
page.on('response', response => console.log('<<', response.status(), response.url()));

// Run with headed browser
npx playwright test --headed

// Run with UI mode
npx playwright test --ui

// Debug specific test
npx playwright test --debug tests/e2e/login.test.ts
```

## Performance

```typescript
// Measure page load time
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(3000); // Under 3 seconds
});

// Check performance metrics
const performanceTiming = JSON.parse(
  await page.evaluate(() => JSON.stringify(window.performance.timing))
);
```

## Best Practices

1. **Use data-testid attributes** - More stable than CSS classes or text
2. **Wait for elements properly** - Use built-in waits, avoid `waitForTimeout`
3. **Keep tests independent** - Each test should work in isolation
4. **Use Page Object Model** - For complex pages, create page objects
5. **Test critical paths only** - E2E tests are slow, focus on key workflows
6. **Clean up test data** - Use beforeAll/afterAll for setup/teardown
7. **Mock external dependencies** - Reduce flakiness from external APIs
8. **Take screenshots on failure** - Helps debug issues
9. **Run in parallel** - Playwright supports parallel execution
10. **Use TypeScript** - Better IDE support and type safety
