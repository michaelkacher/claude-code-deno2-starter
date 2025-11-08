import { defineConfig } from '@playwright/test';

export default defineConfig({
 testDir: './tests/e2e', 
 fullyParallel: true,
 timeout: 30000, // 30 seconds per test
 expect: {
   timeout: 5000, // 5 seconds is maximum time to wait for condition
 },
 retries: process.env.CI ? 2 : 0, // Retry failed tests on CI
 forbidOnly: !!process.env.CI, // Fail if 'test.only' is left in the code on CI
 workers: process.env.CI ? 1 : undefined, // Use a single worker on CI
 
 reporter: 'html', // Use HTML reporter for test results
 use: {
   baseURL: 'http://localhost:3000', // Base URL for tests
   trace: 'on-first-retry', // Collect trace on first retry
   screenshot: 'only-on-failure', // Capture screenshot on failure
   video: 'retain-on-failure', // Record video on failure
 },
 projects: [
   {
     name: 'chromium',
     use: { browserName: 'Desktop Chrome' },
   },
   {
     name: 'firefox',
     use: { browserName: 'Desktop Firefox' },
   },
   {
     name: 'webkit',
     use: { browserName: 'Desktop Safari' },
   },
   {
        name: 'Mobile Chrome',
        use: { browserName: 'Pixel 5' },
   },
    {
        name: 'Mobile Safari',
        use: { browserName: 'iPhone 12' },
   },
 ],
 webServer: {
    command: 'deno task dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
 },
});