/**
 * Dark Mode Toggle Island
 * Client-side component for toggling between light and dark themes
 *
 * SSR-safe: Uses plain DOM manipulation, no signals during SSR
 */

import { IS_BROWSER } from 'fresh/runtime';
import { useEffect, useState } from 'preact/hooks';

interface DarkModeToggleProps {
  initialTheme?: 'light' | 'dark' | null;
}

export default function DarkModeToggle({ initialTheme }: DarkModeToggleProps) {
  // Simple useState - SSR safe
  const [isDark, setIsDark] = useState(initialTheme === 'dark');

  // Initialize on client
  useEffect(() => {
    if (!IS_BROWSER) return;

    // Get actual theme from DOM
    const currentIsDark = document.documentElement.classList.contains('dark');
    setIsDark(currentIsDark);

    // Listen for theme changes from other sources
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        setIsDark(e.newValue === 'dark');
      }
    };

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('theme');
      if (!stored) {
        // No user preference, follow system
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const handleToggle = () => {
    if (!IS_BROWSER) return;

    const newIsDark = !isDark;
    setIsDark(newIsDark);

    // Update DOM immediately
    document.documentElement.classList.toggle('dark', newIsDark);

    // Persist preference
    const newTheme = newIsDark ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme: newTheme } 
    }));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        // Sun icon for light mode
        <svg
          class="w-5 h-5 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg
          class="w-5 h-5 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
