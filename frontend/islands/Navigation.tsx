/**
 * Navigation Island
 * 
 * Converted from component to island to preserve state across page navigations.
 * This prevents the header from re-rendering and flickering when navigating between pages.
 * 
 * Benefits:
 * - Preserves island state (UserProfileDropdown, DarkModeToggle)
 * - Prevents re-initialization of WebSocket connections
 * - Smoother navigation experience
 * - No visible refresh/flicker in the header
 */

import { memo } from 'preact/compat';
import { getFeatures, getMobileNavigationItems, getNavigationItems, getSiteName } from '../lib/config.ts';
import DarkModeToggle from './DarkModeToggle.tsx';
import MobileMenuToggle from './MobileMenuToggle.tsx';
import UserProfileDropdown from './UserProfileDropdown.tsx';

interface NavigationProps {
  userEmail?: string | null;
  userRole?: string | null;
  initialTheme?: 'light' | 'dark' | null;
}

function Navigation(props: NavigationProps) {
  console.log('🧭 Navigation render', { userEmail: props.userEmail, userRole: props.userRole, initialTheme: props.initialTheme });
  
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
            {features.enableDarkMode && <DarkModeToggle initialTheme={props.initialTheme} />}
            
            {/* User Profile with Notifications - SINGLE INSTANCE for both desktop and mobile */}
            <UserProfileDropdown initialEmail={props.userEmail} initialRole={props.userRole} />
            
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

// Memoize Navigation to prevent re-renders when props haven't changed
// This is critical for preventing child islands from re-rendering on page navigation
export default memo(Navigation, (prevProps, nextProps) => {
  const isSame = prevProps.userEmail === nextProps.userEmail && 
                 prevProps.userRole === nextProps.userRole &&
                 prevProps.initialTheme === nextProps.initialTheme;
  
  console.log('🔍 Navigation memo comparison:', {
    prev: { email: prevProps.userEmail, role: prevProps.userRole, theme: prevProps.initialTheme },
    next: { email: nextProps.userEmail, role: nextProps.userRole, theme: nextProps.initialTheme },
    isSame,
    willSkipRender: isSame
  });
  
  return isSame;
});
