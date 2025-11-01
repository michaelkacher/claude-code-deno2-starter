import { type PageProps } from "$fresh/server.ts";
import AuthBanner from "../islands/AuthBanner.tsx";

export default function App({ Component, url }: PageProps) {
  // Check if auth is disabled
  const disableAuth = Deno.env.get('DISABLE_AUTH') === 'true';
  
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
        <Component />
      </body>
    </html>
  );
}
