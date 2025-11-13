/**
 * Quick Test: Create Notifications for test@example.com
 * 
 * Usage: deno task test-notifications
 * 
 * This script calls the test API endpoint on the dev server,
 * which ensures WebSocket broadcasts work properly.
 */

const DEV_SERVER_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'admin@dev.local';
const TEST_USER_PASSWORD = 'admin123';

console.log('🔐 Logging in as', TEST_USER_EMAIL, '...\n');

try {
  // Step 1: Login to get auth token
  const loginResponse = await fetch(`${DEV_SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    const errorData = await loginResponse.text();
    throw new Error(`Login failed: ${loginResponse.status} - ${errorData}`);
  }

  const loginData = await loginResponse.json();
  const accessToken = loginData.data?.accessToken;

  if (!accessToken) {
    throw new Error('No access token received from login');
  }

  console.log('✓ Logged in successfully');
  console.log('\n🔔 Creating test notifications...\n');

  // Step 2: Call the test-create endpoint
  const createResponse = await fetch(`${DEV_SERVER_URL}/api/notifications/test-create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.text();
    throw new Error(`Failed to create notifications: ${createResponse.status} - ${errorData}`);
  }

  const result = await createResponse.json();
  
  console.log('✅ Success!', result.message);
  console.log('\n📬 Created notifications:');
  result.notifications?.forEach((n: Notification, i: number) => {
    console.log(`  ${i + 1}. ${n.title}`);
  });

  console.log('\n📋 Next steps:');
  console.log('1. Check your browser - notifications should appear WITHOUT refreshing!');
  console.log('2. Watch the browser console for WebSocket messages');
  console.log('3. Navigate to http://localhost:3000/notifications to see all notifications');

} catch (error) {
  console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
  console.error('\n💡 Make sure:');
  console.error('  - Dev server is running (deno task dev)');
  console.error('  - test@example.com account exists with password: password123');
  console.error('  - Server is accessible at http://localhost:3000');
  Deno.exit(1);
}
