/**
 * Create notifications for test@example.com user
 */
import { NotificationService } from '@/services/notifications.ts';

const userId = 'adb04da8-e1f5-482f-a118-e216e056b133';

await NotificationService.create({
  userId,
  type: 'success',
  title: 'Welcome Back!',
  message: 'The notification system is now working. Click the bell icon to see your notifications.',
});

await NotificationService.create({
  userId,
  type: 'info',
  title: 'New Feature: Notifications',
  message: 'You can now receive in-app notifications for important updates and events.',
  link: '/notifications',
});

await NotificationService.create({
  userId,
  type: 'warning',
  title: 'Action Needed',
  message: 'Please review your account settings to ensure everything is up to date.',
  link: '/settings',
});

await NotificationService.create({
  userId,
  type: 'info',
  title: 'Tip: Mark as Read',
  message: 'Click on any notification to mark it as read, or use "Mark all read" to clear them all at once.',
});

await NotificationService.create({
  userId,
  type: 'success',
  title: 'Setup Complete',
  message: 'Your notification system is fully configured and ready to use!',
});

console.log('✓ Created 5 notifications for test@example.com');
console.log('Refresh your browser to see them!');
