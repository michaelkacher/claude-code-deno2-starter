/**
 * Theme Initialization Script
 * 
 * This script runs BEFORE any other JavaScript to prevent FOUC (Flash of Unstyled Content).
 * It must be inline or loaded synchronously in the <head>.
 * 
 * We check localStorage for the user's theme preference and apply it immediately
 * to avoid a flash of the wrong theme before the app hydrates.
 */
(function() {
  const theme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme === 'dark' || (!theme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();
