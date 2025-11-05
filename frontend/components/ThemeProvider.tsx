/**
 * Theme Configuration Component
 * Generates CSS custom properties from the site configuration
 */

import { getTheme } from '../lib/config.ts';

export default function ThemeProvider() {
  const theme = getTheme();

  const cssVariables = `
    :root {
      /* Brand Colors - Light Mode */
      --color-primary: ${theme.primary};
      --color-secondary: ${theme.secondary};
      --color-accent: ${theme.accent};
      --color-background: ${theme.background};
      --color-surface: ${theme.surface};
      --color-text: #111827;
      --color-text-secondary: #6b7280;

      /* Semantic Colors (derived from brand) */
      --color-primary-50: color-mix(in srgb, var(--color-primary) 5%, white);
      --color-primary-100: color-mix(in srgb, var(--color-primary) 10%, white);
      --color-primary-200: color-mix(in srgb, var(--color-primary) 25%, white);
      --color-primary-300: color-mix(in srgb, var(--color-primary) 40%, white);
      --color-primary-400: color-mix(in srgb, var(--color-primary) 65%, white);
      --color-primary-500: var(--color-primary);
      --color-primary-600: color-mix(in srgb, var(--color-primary) 85%, black);
      --color-primary-700: color-mix(in srgb, var(--color-primary) 70%, black);
      --color-primary-800: color-mix(in srgb, var(--color-primary) 55%, black);
      --color-primary-900: color-mix(in srgb, var(--color-primary) 40%, black);

      /* Component-specific variables */
      --nav-bg: var(--color-background);
      --nav-border: var(--color-primary-200);
      --nav-text: var(--color-primary-900);
      --nav-text-hover: var(--color-primary-600);
      --nav-brand: var(--color-primary-900);
      --nav-brand-hover: var(--color-primary-600);

      /* Button variants */
      --btn-primary-bg: var(--color-primary);
      --btn-primary-hover: var(--color-primary-700);
      --btn-primary-text: white;
      
      --btn-secondary-bg: var(--color-secondary);
      --btn-secondary-hover: color-mix(in srgb, var(--color-secondary) 85%, black);
      --btn-secondary-text: white;
      
      --btn-accent-bg: var(--color-accent);
      --btn-accent-hover: color-mix(in srgb, var(--color-accent) 85%, black);
      --btn-accent-text: white;

      /* Form elements */
      --input-border: var(--color-primary-300);
      --input-border-focus: var(--color-primary-500);
      --input-bg: var(--color-background);

      /* Status colors */
      --color-success: #059669;
      --color-warning: #d97706;
      --color-error: #dc2626;
      --color-info: var(--color-primary);

      /* Shadows */
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

      /* Transitions */
      --transition-fast: 150ms ease-in-out;
      --transition-normal: 250ms ease-in-out;
      --transition-slow: 350ms ease-in-out;
    }

    /* Theme-aware component styles */
    .nav-brand {
      color: var(--nav-brand);
      transition: color var(--transition-fast);
    }

    .nav-brand:hover {
      color: var(--nav-brand-hover);
    }

    .nav-item {
      color: var(--nav-text);
      transition: color var(--transition-fast);
    }

    .nav-item:hover {
      color: var(--nav-text-hover);
    }

    .btn-primary {
      background-color: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      transition: background-color var(--transition-fast);
    }

    .btn-primary:hover {
      background-color: var(--btn-primary-hover);
    }

    .btn-secondary {
      background-color: var(--btn-secondary-bg);
      color: var(--btn-secondary-text);
      transition: background-color var(--transition-fast);
    }

    .btn-secondary:hover {
      background-color: var(--btn-secondary-hover);
    }

    .btn-accent {
      background-color: var(--btn-accent-bg);
      color: var(--btn-accent-text);
      transition: background-color var(--transition-fast);
    }

    .btn-accent:hover {
      background-color: var(--btn-accent-hover);
    }

    /* Form styling */
    .form-input {
      border-color: var(--input-border);
      background-color: var(--input-bg);
      transition: border-color var(--transition-fast);
    }

    .form-input:focus {
      border-color: var(--input-border-focus);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
    }

    /* Status indicators */
    .status-success { color: var(--color-success); }
    .status-warning { color: var(--color-warning); }
    .status-error { color: var(--color-error); }
    .status-info { color: var(--color-info); }

    .bg-success { background-color: var(--color-success); }
    .bg-warning { background-color: var(--color-warning); }
    .bg-error { background-color: var(--color-error); }
    .bg-info { background-color: var(--color-info); }

    /* Dark Mode */
    .dark {
      /* Dark Mode Colors */
      --color-background: #111827;
      --color-surface: #1f2937;
      --color-text: #f9fafb;
      --color-text-secondary: #9ca3af;

      /* Adjust brand colors for dark mode */
      --color-primary-50: color-mix(in srgb, var(--color-primary) 10%, black);
      --color-primary-100: color-mix(in srgb, var(--color-primary) 20%, black);
      --color-primary-200: color-mix(in srgb, var(--color-primary) 30%, black);
      --color-primary-900: color-mix(in srgb, var(--color-primary) 20%, white);

      /* Component adjustments for dark mode */
      --nav-bg: var(--color-surface);
      --nav-border: #374151;
      --nav-text: var(--color-text);
      --nav-text-hover: var(--color-primary-400);
      --nav-brand: var(--color-text);
      --nav-brand-hover: var(--color-primary-400);

      /* Form elements in dark mode */
      --input-border: #374151;
      --input-border-focus: var(--color-primary-400);
      --input-bg: #1f2937;

      /* Shadows in dark mode */
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
    }
  `;

  return (
    <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
  );
}