import { type PageProps } from "$fresh/server.ts";
import AuthBanner from "../islands/AuthBanner.tsx";
import EmailVerificationBanner from "../islands/EmailVerificationBanner.tsx";

export default function App({ Component, url }: PageProps) {
  // Check if auth is disabled (can be string 'true' or boolean true, defaults to true if not set)
  const disableAuthEnv = Deno.env.get('DISABLE_AUTH');
  const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === true || disableAuthEnv === undefined;
  
  // Don't show auth banner on login or signup pages, or when auth is disabled
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  const showAuthBanner = !isAuthPage && !disableAuth;
  
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh-app</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {showAuthBanner && <AuthBanner />}
        {showAuthBanner && <EmailVerificationBanner />}
        <Component />
      </body>
    </html>
  );
}
