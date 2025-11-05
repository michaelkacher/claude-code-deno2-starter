import { type PageProps } from "$fresh/server.ts";
import Navigation from "../components/Navigation.tsx";
import ThemeProvider from "../components/ThemeProvider.tsx";
import EmailVerificationBanner from "../islands/EmailVerificationBanner.tsx";
import { getSiteName } from "../lib/config.ts";

export default function App({ Component, url }: PageProps) {
  // Check if auth is disabled (can be string 'true' or boolean true, defaults to true if not set)
  const disableAuthEnv = Deno.env.get('DISABLE_AUTH');
  const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === true || disableAuthEnv === undefined;
  
  // Don't show email verification banner on login or signup pages, or when auth is disabled
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  const showEmailBanner = !isAuthPage && !disableAuth;

  const siteName = getSiteName();
  
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
        <Navigation />
        {showEmailBanner && <EmailVerificationBanner />}
        <Component />
      </body>
    </html>
  );
}
