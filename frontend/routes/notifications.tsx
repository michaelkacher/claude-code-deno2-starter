/**
 * Notifications Page
 * View and manage all user notifications
 */

import { Head } from '$fresh/runtime.ts';
import { PageProps } from '$fresh/server.ts';
import NotificationList from '../islands/NotificationList.tsx';

export default function NotificationsPage(props: PageProps) {
  return (
    <>
      <Head>
        <title>Notifications - Deno 2 Starter</title>
      </Head>
      
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              Notifications
            </h1>
            <p class="text-gray-600">
              View and manage all your notifications
            </p>
          </div>

          {/* Notifications List */}
          <NotificationList />
        </div>
      </div>
    </>
  );
}
