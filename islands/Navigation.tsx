import { getFeatures, getMobileNavigationItems, getNavigationItems, getSiteName } from '../lib/config.ts';
import DarkModeToggle from './DarkModeToggle.tsx';
import MobileMenuToggle from './MobileMenuToggle.tsx';
import UserProfileDropdown from './UserProfileDropdown.tsx';

interface NavigationProps {
  userEmail?: string | null;
  userRole?: string | null;
  initialTheme?: 'light' | 'dark' | null;
}

export default function Navigation(props: NavigationProps) {
  // Config functions now work in both server and browser
  // The config.ts file checks for Deno availability internally
  const siteName = getSiteName();
  const navigationItems = getNavigationItems();
  const mobileNavigationItems = getMobileNavigationItems();
  const features = getFeatures();

  return (
    <nav 
      style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }} 
      class="shadow-sm border-b relative transition-colors"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold nav-brand">
              {siteName}
            </a>
          </div>

          {/* Desktop Navigation */}
          <div class="hidden md:flex items-center gap-3">
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
          </div>

          {/* Right side: Dark Mode + Profile (shared across desktop and mobile) */}
          <div class="flex items-center gap-2 md:gap-3">
            {/* Dark Mode Toggle */}
            {features.enableDarkMode && <DarkModeToggle key="theme" initialTheme={props.initialTheme} />}
            
            {/* User Profile with Notifications - SINGLE INSTANCE for both desktop and mobile */}
            <UserProfileDropdown key="profile" initialEmail={props.userEmail} initialRole={props.userRole} />
            
            {/* Mobile menu toggle - only visible on mobile */}
            <div class="md:hidden">
              <MobileMenuToggle>
              {mobileNavigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
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
      </div>
    </nav>
  );
}

