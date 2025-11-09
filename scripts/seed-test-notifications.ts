/**
 * Direct Test: Create Notifications in Deno KV
 * 
 * This script directly uses the NotificationService to create test notifications
 * without needing authentication.
 * 
 * Run with: deno run --allow-env --unstable-kv scripts/seed-test-notifications.ts
 */

import '@std/dotenv/load';
import { NotificationService } from '../shared/services/notifications.ts';

// Use a test user ID (replace with real user ID if you have one)
const TEST_USER_ID = 'test-user-123';

const sampleNotifications = [
  {
    userId: TEST_USER_ID,
    type: 'success' as const,
    title: 'Welcome!',
    message: 'Your account has been created successfully. Start exploring the platform!',
  },
  {
    userId: TEST_USER_ID,
    type: 'info' as const,
    title: 'New Feature: Notifications',
    message: 'Check out our brand new in-app notification system. Click the bell icon to see your notifications.',
    link: '/notifications',
  },
  {
    userId: TEST_USER_ID,
    type: 'warning' as const,
    title: 'Action Required',
    message: 'Please verify your email address to unlock all features.',
    link: '/settings/email',
  },
  {
    userId: TEST_USER_ID,
    type: 'error' as const,
    title: 'Payment Failed',
    message: 'Your recent payment could not be processed. Please update your payment method to continue.',
    link: '/settings/billing',
  },
  {
    userId: TEST_USER_ID,
    type: 'info' as const,
    title: 'System Maintenance Scheduled',
    message: 'We will be performing scheduled maintenance tonight from 2-4 AM EST. The service may be temporarily unavailable.',
  },
  {
    userId: TEST_USER_ID,
    type: 'success' as const,
    title: 'Profile Updated',
    message: 'Your profile information has been updated successfully.',
  },
  {
    userId: TEST_USER_ID,
    type: 'info' as const,
    title: 'New Message',
    message: 'You have received a new message from the support team.',
    link: '/messages',
  },
];

async function main() {
  console.log('=== Creating Test Notifications ===\n');
  console.log(`User ID: ${TEST_USER_ID}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const notification of sampleNotifications) {
    try {
      const created = await NotificationService.create(notification);
      console.log(`✓ ${created.type.toUpperCase().padEnd(8)} | ${created.title}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed: ${notification.title}`, error);
      failCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`✓ Created: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);

  // Get stats
  const allNotifications = await NotificationService.getUserNotifications(TEST_USER_ID);
  const unreadCount = await NotificationService.getUnreadCount(TEST_USER_ID);

  console.log(`\n📊 Total notifications: ${allNotifications.length}`);
  console.log(`📬 Unread: ${unreadCount}`);

  console.log('\n=== Testing Instructions ===');
  console.log('1. Start the dev server: deno task dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. The notification system requires authentication, so you need to:');
  console.log('   a. Create a real user account, OR');
  console.log('   b. Modify the script to use an existing user ID, OR');
  console.log('   c. Temporarily disable auth and use the test user ID\n');
  console.log(`Current test user ID: ${TEST_USER_ID}`);
  console.log('\nTo test with a real user:');
  console.log('1. Sign up at http://localhost:3000/signup');
  console.log('2. Note your user ID from the API response');
  console.log('3. Re-run this script after updating TEST_USER_ID');
}

if (import.meta.main) {
  main();
}
