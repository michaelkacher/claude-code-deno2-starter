/**
 * Two-Factor Authentication Setup Page
 * Allows users to enable 2FA on their account
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies } from "jsr:@std/http/cookie";
import TwoFactorSetup from "../../islands/TwoFactorSetup.tsx";

interface TwoFactorPageData {
  isAuthenticated: boolean;
}

export const handler: Handlers<TwoFactorPageData> = {
  GET(req, ctx) {
    // Check if user is authenticated
    const cookies = getCookies(req.headers);
    const authToken = cookies.auth_token;
    
    if (!authToken) {
      // Redirect to login if not authenticated
      const headers = new Headers();
      headers.set("location", "/login?redirect=/2fa/setup");
      return new Response(null, {
        status: 303,
        headers,
      });
    }

    return ctx.render({ isAuthenticated: true });
  },
};

export default function TwoFactorSetupPage({ data }: PageProps<TwoFactorPageData>) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <TwoFactorSetup />
    </div>
  );
}
