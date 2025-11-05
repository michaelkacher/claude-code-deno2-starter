import NotificationBell from '../islands/NotificationBell.tsx';

export default function Navigation() {
  return (
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900">
              Deno 2 Starter
            </a>
          </div>

          {/* Navigation Items */}
          <div class="flex items-center gap-4">
            <a
              href="/"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </a>
            <a
              href="/design-system"
              class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Design System
            </a>
            
            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </div>
      </div>
    </nav>
  );
}
