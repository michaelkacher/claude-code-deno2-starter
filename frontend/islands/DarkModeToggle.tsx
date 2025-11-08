/**
 * Dark Mode Toggle Island
 * Client-side component for toggling between light and dark themes
 *
 * MIGRATED TO PREACT SIGNALS - uses global theme store
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect } from 'preact/hooks';
import { ThemeStorage } from '../lib/storage.ts';
import { theme, isDarkMode, toggleTheme, setTheme } from '../lib/store.ts';

interface DarkModeToggleProps {
  initialTheme?: 'light' | 'dark' | null;
}

export default function DarkModeToggle({ initialTheme }: DarkModeToggleProps) {
  // Initialize theme from props if provided
  useEffect(() => {
    if (!IS_BROWSER) return;

    if (initialTheme && theme.value !== initialTheme) {
      setTheme(initialTheme);
    }

    // Sync state with current dark mode from DOM
    const currentIsDark = document.documentElement.classList.contains('dark');
    if (currentIsDark !== isDarkMode.value) {
      setTheme(currentIsDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!ThemeStorage.getTheme()) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggle = () => {
    if (!IS_BROWSER) return;
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={isDarkMode.value ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode.value ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode.value ? (
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
