/**
 * Signup Form Island
 * Handles user registration with validation
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useState } from 'preact/hooks';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.tsx';

interface SignupFormProps {
  redirectTo?: string;
}

export default function SignupForm({ redirectTo = '/' }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Client-side validation
  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = IS_BROWSER 
        ? window.location.origin
        : 'http://localhost:3000';
      
      // Get CSRF token first
      const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.data.csrfToken;
      
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Signup failed');
        setIsLoading(false);
        return;
      }

      // Store access token in localStorage (refresh token is in httpOnly cookie)
      if (IS_BROWSER) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('user_email', data.data.user.email);
        localStorage.setItem('user_role', data.data.user.role);
        localStorage.setItem('email_verified', data.data.user.emailVerified ? 'true' : 'false');
        
        // Also set access token in cookie for server-side auth check (15 minutes expiry)
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 15);
        document.cookie = `auth_token=${data.data.accessToken}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
        
        // Show success message about email verification
        if (data.data.message) {
          setSuccess(true);
          setSuccessMessage(data.data.message);
          setIsLoading(false);
          
          // Redirect to intended page after 3 seconds
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 3000);
          return;
        }
        
        // If no message, redirect immediately
        window.location.href = redirectTo;
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  // If signup was successful, show success message
  if (success) {
    return (
      <div class="space-y-6">
        <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900 rounded-lg p-6">
          <div class="flex items-start gap-3">
            <svg class="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Account Created Successfully!</h3>
              <p class="text-green-800 dark:text-green-200 mb-4">
                {successMessage}
              </p>
              <p class="text-sm text-green-700 dark:text-green-300">
                Redirecting you to the app in 3 seconds...
              </p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {error && (
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Doe"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          required
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          required
          minLength={8}
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={isLoading}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
          required
          minLength={8}
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
  );
}

