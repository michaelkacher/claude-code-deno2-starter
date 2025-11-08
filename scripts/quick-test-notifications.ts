/**
 * Quick Test: Create Notifications for test@example.com
 * 
 * Usage: deno task test-notifications
 */
import { NotificationService } from '../shared/services/notifications.ts';

// This is the test user's ID (test@example.com)
const userId = 'adb04da8-e1f5-482f-a118-e216e056b133';

console.log('Creating test notifications for test@example.com...\n');

try {
  await NotificationService.create({
    userId,
    type: 'success',
    title: 'Test Notification #1',
    message: 'This is a success notification. The system is working!',
  });
  console.log('✓ Created success notification');

  await NotificationService.create({
    userId,
    type: 'info',
    title: 'Test Notification #2',
    message: 'This is an info notification with a link.',
    link: '/notifications',
  });
  console.log('✓ Created info notification');

  await NotificationService.create({
    userId,
    type: 'warning',
    title: 'Test Notification #3',
    message: 'This is a warning notification.',
  });
  console.log('✓ Created warning notification');

  await NotificationService.create({
    userId,
    type: 'error',
    title: 'Test Notification #4',
    message: 'This is an error notification.',
  });
  console.log('✓ Created error notification');

  await NotificationService.create({
    userId,
    type: 'info',
    title: 'Test Complete',
    message: 'All test notifications have been created successfully!',
  });
  console.log('✓ Created final notification');

  console.log('\n✅ Success! Created 5 test notifications.');
  console.log('\n📋 Next steps:');
  console.log('1. Navigate to http://localhost:3000 in your browser');
  console.log('2. Login with test@example.com / password123');
  console.log('3. Click the profile dropdown to see your notifications');
  console.log('4. Test that they reload properly when navigating between pages');
} catch (error) {
  console.error('❌ Error creating notifications:', error);
  Deno.exit(1);
}
