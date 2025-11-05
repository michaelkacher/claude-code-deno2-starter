/**
 * Helper: Create Test Notifications with Auth
 * 
 * This script:
 * 1. Signs up a test user (or uses existing)
 * 2. Creates sample notifications for that user
 * 3. Logs the access token for testing in the browser
 * 
 * Run with: deno run --allow-net --allow-env --unstable-kv scripts/create-test-notifications.ts
 */

import 'jsr:@std/dotenv/load';

const API_URL = Deno.env.get('API_URL') || 'http://localhost:8000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!@#';

interface NotificationRequest {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
}

const sampleNotifications: Omit<NotificationRequest, 'userId'>[] = [
  {
    type: 'success',
    title: 'Welcome!',
    message: 'Your account has been created successfully.',
  },
  {
    type: 'info',
    title: 'New Feature Available',
    message: 'Check out our new notification system!',
    link: '/features/notifications',
  },
  {
    type: 'warning',
    title: 'Action Required',
    message: 'Please verify your email address to continue.',
    link: '/settings/email',
  },
  {
    type: 'error',
    title: 'Payment Failed',
    message: 'Your recent payment could not be processed.',
    link: '/settings/billing',
  },
  {
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM EST.',
  },
];

async function getOrCreateTestUser() {
  console.log('Getting or creating test user...');
  
  // Try to login first
  try {
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✓ Logged in as existing user');
      return {
        userId: data.user.id,
        accessToken: data.accessToken,
      };
    }
  } catch (error) {
    // User doesn't exist, will create below
  }

  // Create new user
  try {
    const signupResponse = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User',
      }),
    });

    if (signupResponse.ok) {
      const data = await signupResponse.json();
      console.log('✓ Created new test user');
      return {
        userId: data.user.id,
        accessToken: data.accessToken,
      };
    } else {
      const error = await signupResponse.text();
      console.error('✗ Failed to create user:', error);
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating user:', error);
    return null;
  }
}

async function createNotification(
  notification: NotificationRequest,
  accessToken: string,
) {
  try {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(notification),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('  ✓', data.notification.title);
      return data.notification;
    } else {
      const error = await response.text();
      console.error('  ✗ Failed:', error);
      return null;
    }
  } catch (error) {
    console.error('  ✗ Error:', error);
    return null;
  }
}

async function main() {
  console.log('=== Notification System Test ===\n');
  console.log(`API URL: ${API_URL}\n`);

  // Get or create test user
  const user = await getOrCreateTestUser();
  if (!user) {
    console.error('\n✗ Failed to get or create test user');
    Deno.exit(1);
  }

  console.log(`User ID: ${user.userId}\n`);

  // Create sample notifications
  console.log('Creating sample notifications:');
  let successCount = 0;

  for (const notification of sampleNotifications) {
    const result = await createNotification(
      { ...notification, userId: user.userId },
      user.accessToken,
    );
    if (result) {
      successCount++;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n✓ Created ${successCount}/${sampleNotifications.length} notifications\n`);

  // Instructions for testing
  console.log('=== Testing Instructions ===\n');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Open browser console (F12)');
  console.log('3. Run this command to set the access token:\n');
  console.log(`   localStorage.setItem('access_token', '${user.accessToken}');\n`);
  console.log('4. Refresh the page');
  console.log('5. Click the notification bell icon in the navigation bar');
  console.log('6. You should see your notifications!\n');
  console.log('=== Test Credentials ===\n');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}\n`);
}

if (import.meta.main) {
  main();
}
