/**
 * Reset Password Form Island
 * Handles password reset with strength validation
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useState } from 'preact/hooks';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.tsx';

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Check if token is valid and if 2FA is required
  useEffect(() => {
    if (IS_BROWSER) {
      const apiUrl = window.location.origin;
      fetch(`${apiUrl}/api/auth/validate-reset-token?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.data?.requires2FA) {
            setRequires2FA(true);
          }
          setCheckingToken(false);
        })
        .catch(() => setCheckingToken(false));
    }
  }, [token]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (!IS_BROWSER) return;

      const apiUrl = window.location.origin;
      
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          twoFactorCode: requires2FA ? twoFactorCode : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      // Success!
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login?message=password_reset';
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div class="bg-green-50 border border-green-200 rounded-lg p-6">
        <div class="flex items-center gap-3 mb-2">
          <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <h3 class="text-lg font-semibold text-green-900">Password Reset Successfully!</h3>
        </div>
        <p class="text-green-700 mb-4">
          Your password has been reset. You can now log in with your new password.
        </p>
        <p class="text-sm text-green-600">
          Redirecting to login page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {error && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" class="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
          required
          minLength={8}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter new password"
          disabled={isLoading}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
          required
          minLength={8}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Confirm new password"
          disabled={isLoading}
        />
        {password && confirmPassword && password !== confirmPassword && (
          <p class="text-xs text-red-600 mt-1">Passwords do not match</p>
        )}
        {password && confirmPassword && password === confirmPassword && (
          <p class="text-xs text-green-600 mt-1 flex items-center gap-1">
            <span>✓</span>
            <span>Passwords match</span>
          </p>
        )}
      </div>

      {requires2FA && (
        <div class="border-t border-gray-200 pt-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p class="text-sm text-blue-800">
              🔒 Two-factor authentication is enabled on this account. Please enter your 6-digit code or an 8-character backup code.
            </p>
          </div>
          <label htmlFor="twoFactorCode" class="block text-sm font-medium text-gray-700 mb-1">
            Two-Factor Code
          </label>
          <input
            type="text"
            id="twoFactorCode"
            value={twoFactorCode}
            onInput={(e) => setTwoFactorCode((e.target as HTMLInputElement).value)}
            required={requires2FA}
            maxLength={8}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-xl tracking-wider"
            placeholder="000000"
            disabled={isLoading}
          />
          <p class="text-xs text-gray-500 mt-1">
            Enter 6-digit authenticator code or 8-character backup code
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || password !== confirmPassword || (requires2FA && !twoFactorCode)}
        class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isLoading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
}

