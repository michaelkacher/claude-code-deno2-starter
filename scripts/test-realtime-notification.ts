/**
 * Test Real-Time WebSocket Notifications
 * Creates a notification and verifies it's delivered in real-time via WebSocket
 * 
 * Run with: deno run --allow-env --allow-read --allow-write --unstable-kv scripts/test-realtime-notification.ts
 */

import { notifyUser } from '../shared/lib/notification-websocket.ts';
import { NotificationService } from '../shared/services/notifications.ts';

// Use the test@example.com user
const userId = 'adb04da8-e1f5-482f-a118-e216e056b133';

console.log('=== Testing Real-Time Notification Delivery ===\n');
console.log(`User ID: ${userId}`);
console.log('\n1. Make sure you have http://localhost:3000 open in your browser');
console.log('2. Make sure you are logged in as test@example.com');
console.log('3. Watch the notification bell for real-time updates!\n');

// Wait 5 seconds to give user time to prepare
console.log('Creating test notification in 5 seconds...\n');
await new Promise((resolve) => setTimeout(resolve, 5000));

// Create a notification
const notification = await NotificationService.create({
  userId,
  type: 'success',
  title: '🎉 Real-Time Test!',
  message: 'If you see this instantly (without page refresh), WebSocket is working!',
});

console.log('✅ Notification created:', notification.title);

// Also try to notify via WebSocket directly (if user is connected)
notifyUser(userId, notification);

console.log('\n📡 WebSocket notification sent (if user is connected)');
console.log('\nCheck your browser - the notification should appear instantly!');
console.log('Look for:');
console.log('  - Green connection indicator on the bell icon');
console.log('  - Unread count badge updated in real-time');
console.log('  - New notification in the dropdown\n');

// Create a few more with delays to test continuous updates
console.log('Creating 3 more notifications with 3-second intervals...\n');

await new Promise((resolve) => setTimeout(resolve, 3000));
await NotificationService.create({
  userId,
  type: 'info',
  title: 'Test 2',
  message: 'Second real-time notification',
});
console.log('✅ Notification 2 created');

await new Promise((resolve) => setTimeout(resolve, 3000));
await NotificationService.create({
  userId,
  type: 'warning',
  title: 'Test 3',
  message: 'Third real-time notification',
});
console.log('✅ Notification 3 created');

await new Promise((resolve) => setTimeout(resolve, 3000));
await NotificationService.create({
  userId,
  type: 'error',
  title: 'Test 4',
  message: 'Fourth and final real-time notification',
});
console.log('✅ Notification 4 created');

console.log('\n🎊 Test complete!');
console.log('If all 4 notifications appeared instantly, WebSocket is working perfectly!');
