import { type PageProps } from "$fresh/server.ts";
import AuthBanner from "../islands/AuthBanner.tsx";

export default function App({ Component, url }: PageProps) {
  // Don't show auth banner on login or signup pages
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>fresh-app</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {!isAuthPage && <AuthBanner />}
        <Component />
      </body>
    </html>
  );
}
