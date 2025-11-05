# Dark Mode Implementation

## Overview

Dark mode has been successfully implemented with automatic theme detection and manual toggle support.

## Features

### ✅ Automatic Theme Detection
- Respects system theme preference (`prefers-color-scheme: dark`)
- Automatically switches when system theme changes
- No flash of unstyled content (FOUC) on page load

### ✅ Manual Toggle
- Toggle button in navigation bar (desktop and mobile)
- Saves user preference to localStorage
- Preference persists across sessions
- Manual preference overrides system preference

### ✅ Smooth Transitions
- CSS transitions for color changes
- Seamless switching between themes
- No jarring visual changes

## Components

### 1. DarkModeToggle Island (`frontend/islands/DarkModeToggle.tsx`)
Client-side interactive component that:
- Reads theme preference from localStorage
- Falls back to system preference if no saved theme
- Toggles `dark` class on `<html>` element
- Saves preference to localStorage
- Displays sun/moon icon based on current theme

### 2. ThemeProvider (`frontend/components/ThemeProvider.tsx`)
Enhanced with dark mode CSS variables:
- Light mode colors (default)
- Dark mode colors (under `.dark` selector)
- Adjusted brand colors for dark backgrounds
- Dark-optimized shadows and borders

### 3. Navigation (`frontend/components/Navigation.tsx`)
- Integrated DarkModeToggle in desktop navigation
- Integrated DarkModeToggle in mobile navigation
- Conditional rendering based on `enableDarkMode` feature flag
- Dark mode styles for navigation elements

### 4. App Wrapper (`frontend/routes/_app.tsx`)
- Inline script to apply dark mode class before render (prevents FOUC)
- Dark mode body styles
- Smooth color transitions

## Configuration

### Enable Dark Mode Feature

Enable/disable dark mode in `frontend/lib/config.ts`:

```typescript
features: {
  enableDarkMode: true, // Toggle dark mode feature
}
```

### Tailwind Configuration

**Critical**: Tailwind must be configured to use class-based dark mode in `frontend/tailwind.config.ts`:

```typescript
const config: Config = {
  darkMode: 'class', // REQUIRED: Enable dark mode with class strategy
  content: [
    './routes/**/*.{js,ts,jsx,tsx}',
    './islands/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
};
```

Without `darkMode: 'class'`, the `dark:` variant classes will not work!

## Color System

### Light Mode (Default)
- Background: `#ffffff` (white)
- Surface: `#f8fafc` (slate-50)
- Text: `#111827` (gray-900)
- Secondary Text: `#6b7280` (gray-500)

### Dark Mode
- Background: `#111827` (gray-900)
- Surface: `#1f2937` (gray-800)
- Text: `#f9fafb` (gray-50)
- Secondary Text: `#9ca3af` (gray-400)

### Brand Colors
- Primary, Secondary, Accent colors remain consistent
- Automatically adjusted for better contrast in dark mode
- Color shades recomputed for dark backgrounds

## CSS Classes

### Tailwind Dark Mode Classes
Use `dark:` prefix for dark mode styles:

```tsx
<div class="bg-white dark:bg-gray-900">
  <p class="text-gray-900 dark:text-gray-100">
    This text adapts to theme
  </p>
</div>
```

### Custom CSS Variables
Theme-aware CSS variables automatically switch:

```css
/* Automatically updates for dark mode */
.nav-item {
  color: var(--nav-text);
}

.form-input {
  background-color: var(--input-bg);
  border-color: var(--input-border);
}
```

## Usage Examples

### In Routes/Components
```tsx
// Automatically adapts
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content here
</div>
```

### In Islands
```tsx
// Check theme in client-side code
useEffect(() => {
  const isDark = document.documentElement.classList.contains('dark');
  console.log('Current theme:', isDark ? 'dark' : 'light');
}, []);
```

## Testing

### Manual Testing
1. Navigate to http://localhost:3000
2. Click sun/moon icon in navigation
3. Verify theme switches immediately
4. Refresh page - theme should persist
5. Clear localStorage and refresh - should use system preference
6. Change system theme - should auto-switch if no saved preference

### Browser DevTools
```javascript
// Check saved theme
localStorage.getItem('theme'); // 'light' | 'dark' | null

// Manually set theme
localStorage.setItem('theme', 'dark');
location.reload();

// Clear preference (use system theme)
localStorage.removeItem('theme');
location.reload();
```

## Browser Support

- ✅ Chrome/Edge 76+
- ✅ Firefox 67+
- ✅ Safari 12.1+
- ✅ iOS Safari 12.2+
- ✅ Android Chrome 76+

## Performance

- **No JavaScript Required**: Initial theme applied via inline script before page render
- **No FOUC**: Dark class added synchronously before paint
- **Minimal Storage**: Only 5 bytes stored in localStorage
- **Fast Transitions**: CSS-only with hardware acceleration

## Future Enhancements

Potential additions:
- [ ] Theme scheduling (auto-switch at sunset/sunrise)
- [ ] Per-page theme preferences
- [ ] High contrast mode
- [ ] Custom theme colors per user
- [ ] Theme preview before applying

## Troubleshooting

### Theme not persisting
- Check localStorage is enabled in browser
- Verify no other scripts clearing localStorage
- Check browser privacy settings

### FOUC (flash) on page load
- Inline script must run before body renders
- Script should be in `<head>` before stylesheets
- Check script is not deferred or async

### Toggle button not showing
- Verify `enableDarkMode: true` in config
- Check Fresh manifest includes DarkModeToggle island
- Run `deno task dev` to regenerate manifest

### Colors not adapting
- Ensure `.dark` class on `<html>` element
- Check CSS variables are properly scoped
- Verify Tailwind `dark:` classes are used correctly
