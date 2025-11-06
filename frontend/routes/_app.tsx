import { type PageProps } from "$fresh/server.ts";
import ErrorBoundary from "../components/ErrorBoundary.tsx";
import ThemeProvider from "../components/ThemeProvider.tsx";
import EmailVerificationBanner from "../islands/EmailVerificationBanner.tsx";
import Navigation from "../islands/Navigation.tsx";
import { getSiteName } from "../lib/config.ts";

interface AppState {
  userEmail?: string | null;
  userRole?: string | null;
  initialTheme?: 'light' | 'dark' | null;
}

export default function App({ Component, url, state }: PageProps<unknown, AppState>) {
  const siteName = getSiteName();
  
  // Get user data from middleware state
  const userEmail = state?.userEmail || null;
  const userRole = state?.userRole || null;
  const initialTheme = state?.initialTheme || null;
  
  // Check if auth is disabled
  const disableAuthEnv = typeof Deno !== 'undefined' ? Deno.env.get('DISABLE_AUTH') : undefined;
  const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === undefined;
  
  // Don't show email verification banner on login or signup pages
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  const showEmailBanner = !isAuthPage && !disableAuth;
  
  console.log('🎨 _app.tsx App component render', { userEmail, userRole, initialTheme, url: url.pathname });
  
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{siteName}</title>
        <link rel="stylesheet" href="/styles.css" />
        <ThemeProvider />
        {/* Prevent FOUC (Flash of Unstyled Content) by setting dark mode class early */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'dark' || (!theme && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }} />
      </head>
      <body style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }} class="transition-colors">
        <Navigation userEmail={userEmail} userRole={userRole} initialTheme={initialTheme} />
        {showEmailBanner && <EmailVerificationBanner />}
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>
      </body>
    </html>
  );
}
