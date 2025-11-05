import MobileMenuToggle from '../islands/MobileMenuToggle.tsx';
import UserProfileDropdown from '../islands/UserProfileDropdown.tsx';

export default function Navigation() {
  return (
    <nav class="bg-white shadow-sm border-b border-gray-200 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Deno 2 Starter
            </a>
          </div>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-6">
            <div class="flex items-center gap-1">
              <a
                href="/design-system"
                class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Design System
              </a>
            </div>
            
            {/* User Profile with Notifications */}
            <UserProfileDropdown />
          </div>

          {/* Mobile menu button and user profile */}
          <div class="md:hidden flex items-center gap-3">
            <UserProfileDropdown />
            <MobileMenuToggle>
              
              <a
                href="/design-system"
                class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Design System
              </a>
            </MobileMenuToggle>
          </div>
        </div>
      </div>
    </nav>
  );
}
