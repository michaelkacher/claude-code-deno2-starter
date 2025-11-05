import { type PageProps } from "$fresh/server.ts";
import Navigation from "../components/Navigation.tsx";
import EmailVerificationBanner from "../islands/EmailVerificationBanner.tsx";

export default function App({ Component, url }: PageProps) {
  // Check if auth is disabled (can be string 'true' or boolean true, defaults to true if not set)
  const disableAuthEnv = Deno.env.get('DISABLE_AUTH');
  const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === true || disableAuthEnv === undefined;
  
  // Don't show email verification banner on login or signup pages, or when auth is disabled
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  const showEmailBanner = !isAuthPage && !disableAuth;
  
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh-app</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Navigation />
        {showEmailBanner && <EmailVerificationBanner />}
        <Component />
      </body>
    </html>
  );
}
