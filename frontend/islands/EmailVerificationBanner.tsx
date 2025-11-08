/**
 * Email Verification Banner Island
 * Shows a banner prompting users to verify their email
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useEffect, useState } from 'preact/hooks';

export default function EmailVerificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!IS_BROWSER) return;

    // Check if user is logged in and email is not verified
    const emailVerified = localStorage.getItem('email_verified');
    const email = localStorage.getItem('user_email');

    if (email && emailVerified === 'false') {
      setIsVisible(true);
      setUserEmail(email);
    }
  }, []);

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');

    try {
      const apiUrl = window.location.origin;
      
      const response = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(data.error?.message || 'Failed to send verification email');
      }
    } catch (error) {
      setMessage('Network error. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div class="max-w-7xl mx-auto flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm text-yellow-700">
            <strong class="font-medium">Email verification required.</strong>
            {' '}Please check your inbox and verify your email address to access all features.
          </p>
          {message && (
            <p class={`text-sm mt-2 ${message.includes('sent') ? 'text-green-700' : 'text-red-700'}`}>
              {message}
            </p>
          )}
          <div class="mt-2 flex items-center gap-4">
            <button
              onClick={handleResend}
              disabled={isResending}
              class="text-sm font-medium text-yellow-700 hover:text-yellow-600 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
            <button
              onClick={handleDismiss}
              class="text-sm font-medium text-yellow-700 hover:text-yellow-600"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button
              onClick={handleDismiss}
              class="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

