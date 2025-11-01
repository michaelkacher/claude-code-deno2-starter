/**
 * Auth Banner Island
 * Displays user email and logout button when logged in
 * Shows login button when logged out
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useState } from 'preact/hooks';

export default function AuthBanner() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!IS_BROWSER) return;
    
    // Check for auth token and user email in localStorage
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('user_email');
    
    if (token && email) {
      setUserEmail(email);
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    if (!IS_BROWSER) return;
    
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    
    // Clear cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
    
    // Redirect to home
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="text-xl font-bold text-gray-900">
              Deno 2 Starter
            </div>
            <div class="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <a href="/" class="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Deno 2 Starter
          </a>
          
          <div class="flex items-center gap-4">
            {userEmail ? (
              <>
                <span class="text-sm text-gray-600">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/login"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
