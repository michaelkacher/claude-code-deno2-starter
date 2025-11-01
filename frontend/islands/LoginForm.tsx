/**
 * Login Form Island
 * Handles authentication and JWT token storage
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useState } from 'preact/hooks';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = IS_BROWSER 
        ? window.location.origin.replace(':3000', ':8000')
        : 'http://localhost:8000';
      
      // Get CSRF token first
      const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.data.csrfToken;
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = data.error?.retryAfter;
          const retryMessage = retryAfter 
            ? `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
            : data.error?.message || 'Too many attempts. Please try again later.';
          setError(retryMessage);
        } else {
          setError(data.error?.message || 'Login failed');
        }
        setIsLoading(false);
        return;
      }

      // Store access token in localStorage (refresh token is in httpOnly cookie)
      if (IS_BROWSER) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('user_email', data.data.user.email);
        localStorage.setItem('user_role', data.data.user.role);
        
        // Also set access token in cookie for server-side auth check (15 minutes expiry)
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 15);
        document.cookie = `auth_token=${data.data.accessToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
        
        // Redirect to intended page or home
        window.location.href = redirectTo;
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
