import MobileMenuToggle from '../islands/MobileMenuToggle.tsx';
import UserProfileDropdown from '../islands/UserProfileDropdown.tsx';
import { getMobileNavigationItems, getNavigationItems, getSiteName } from '../lib/config.ts';

export default function Navigation() {
  const siteName = getSiteName();
  const navigationItems = getNavigationItems();
  const mobileNavigationItems = getMobileNavigationItems();

  return (
    <nav class="bg-white shadow-sm border-b border-gray-200 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold nav-brand">
              {siteName}
            </a>
          </div>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-6">
            <div class="flex items-center gap-1">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  class="nav-item px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                >
                  {item.icon && <span class="text-sm">{item.icon}</span>}
                  {item.label}
                </a>
              ))}
            </div>
            
            {/* User Profile with Notifications */}
            <UserProfileDropdown />
          </div>

          {/* Mobile menu button and user profile */}
          <div class="md:hidden flex items-center gap-3">
            <UserProfileDropdown />
            <MobileMenuToggle>
              {mobileNavigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                >
                  {item.icon && <span class="text-sm">{item.icon}</span>}
                  {item.label}
                </a>
              ))}
            </MobileMenuToggle>
          </div>
        </div>
      </div>
    </nav>
  );
}
