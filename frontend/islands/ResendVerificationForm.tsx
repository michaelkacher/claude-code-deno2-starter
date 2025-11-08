/**
 * Resend Verification Email Form Island
 * 
 * Interactive form for requesting a new email verification link.
 * Handles form submission, validation, and error/success messages.
 */

import { useRef, useState } from 'preact/hooks';

interface FormState {
  isSubmitting: boolean;
  message: { type: 'success' | 'error'; content: string } | null;
}

export default function ResendVerificationForm() {
  const [state, setState] = useState<FormState>({
    isSubmitting: false,
    message: null,
  });
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    const email = emailRef.current?.value;
    if (!email) return;

    setState({ isSubmitting: true, message: null });

    try {
      const apiUrl = window.location.origin;
      const response = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setState({
          isSubmitting: false,
          message: {
            type: 'success',
            content: data.data.message || 'Verification email sent! Please check your inbox.',
          },
        });
        
        // Reset form on success
        if (emailRef.current) {
          emailRef.current.value = '';
        }
      } else {
        setState({
          isSubmitting: false,
          message: {
            type: 'error',
            content: data.error?.message || 'Failed to send verification email',
          },
        });
      }
    } catch (error) {
      setState({
        isSubmitting: false,
        message: {
          type: 'error',
          content: 'Network error. Please try again later.',
        },
      });
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
            <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Resend Verification Email</h1>
          <p class="text-gray-600">
            Enter your email address and we'll send you a new verification link.
          </p>
        </div>

        {state.message && (
          <div class={`mb-4 p-3 rounded-md ${
            state.message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {state.message.content}
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              ref={emailRef}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={state.isSubmitting}
            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isSubmitting ? 'Sending...' : 'Send Verification Email'}
          </button>
        </form>

        <div class="mt-6 text-center">
          <a
            href="/login"
            class="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
