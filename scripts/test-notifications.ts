/**
 * Test Script: Create Sample Notifications
 * 
 * This script creates sample notifications for testing the notification system.
 * Run with: deno run --allow-net --unstable-kv scripts/test-notifications.ts
 */

import '@std/dotenv/load';

const API_URL = Deno.env.get('API_URL') || 'http://localhost:5173/api';

// Sample user ID (replace with an actual user ID from your system)
const TEST_USER_ID = 'test-user-id';

interface NotificationRequest {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
}

const sampleNotifications: NotificationRequest[] = [
  {
    userId: TEST_USER_ID,
    type: 'success',
    title: 'Welcome!',
    message: 'Your account has been created successfully.',
  },
  {
    userId: TEST_USER_ID,
    type: 'info',
    title: 'New Feature Available',
    message: 'Check out our new notification system!',
    link: '/features/notifications',
  },
  {
    userId: TEST_USER_ID,
    type: 'warning',
    title: 'Action Required',
    message: 'Please verify your email address to continue.',
    link: '/settings/email',
  },
  {
    userId: TEST_USER_ID,
    type: 'error',
    title: 'Payment Failed',
    message: 'Your recent payment could not be processed. Please update your payment method.',
    link: '/settings/billing',
  },
  {
    userId: TEST_USER_ID,
    type: 'info',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM EST.',
  },
];

async function createNotification(notification: NotificationRequest) {
  try {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Created notification:', data.notification.title);
      return data.notification;
    } else {
      const error = await response.text();
      console.error('✗ Failed to create notification:', error);
      return null;
    }
  } catch (error) {
    console.error('✗ Error creating notification:', error);
    return null;
  }
}

async function main() {
  console.log('Creating sample notifications...\n');
  console.log(`User ID: ${TEST_USER_ID}`);
  console.log(`API URL: ${API_URL}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const notification of sampleNotifications) {
    const result = await createNotification(notification);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n---');
  console.log(`✓ Created: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log('---\n');

  if (successCount > 0) {
    console.log('Test the notification bell in the frontend:');
    console.log('1. Start the dev server: deno task dev');
    console.log('2. Open http://localhost:5173 in your browser');
    console.log('3. Click the bell icon in the navigation to see notifications');
    console.log('\nNote: Make sure you have a valid access token in localStorage');
  }
}

// Run the script
if (import.meta.main) {
  main();
}
