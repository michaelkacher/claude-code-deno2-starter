/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import { PageProps } from "$fresh/server.ts";

export default function ForgotPasswordPage(props: PageProps) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
            <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p class="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div id="message" class="hidden mb-4 p-3 rounded-md"></div>

        <form id="forgot-form" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            id="submit-btn"
            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Reset Link
          </button>
        </form>

        <div class="mt-6 text-center space-y-2">
          <a
            href="/login"
            class="text-sm text-purple-600 hover:text-purple-700 font-medium block"
          >
            ← Back to Login
          </a>
          <a
            href="/signup"
            class="text-sm text-gray-600 hover:text-gray-700 block"
          >
            Don't have an account? Sign up
          </a>
        </div>
      </div>

      <script type="module" dangerouslySetInnerHTML={{__html: `
        const form = document.getElementById('forgot-form');
        const submitBtn = document.getElementById('submit-btn');
        const messageDiv = document.getElementById('message');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
          messageDiv.classList.add('hidden');

          try {
            const apiUrl = window.location.origin.replace(':3000', ':8000');
            const response = await fetch(\`\${apiUrl}/api/auth/forgot-password\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
              messageDiv.className = 'mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700';
              messageDiv.innerHTML = \`
                <strong class="font-medium">Check your email!</strong>
                <p class="mt-1 text-sm">\${data.data.message}</p>
                <p class="mt-2 text-sm">If you don't receive an email within a few minutes, please check your spam folder.</p>
              \`;
              messageDiv.classList.remove('hidden');
              form.reset();
            } else {
              messageDiv.className = 'mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700';
              messageDiv.innerHTML = \`
                <strong class="font-medium">Error</strong>
                <p class="mt-1 text-sm">\${data.error?.message || 'Failed to send reset email'}</p>
              \`;
              messageDiv.classList.remove('hidden');
            }
          } catch (error) {
            messageDiv.className = 'mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700';
            messageDiv.innerHTML = \`
              <strong class="font-medium">Network Error</strong>
              <p class="mt-1 text-sm">Please check your connection and try again.</p>
            \`;
            messageDiv.classList.remove('hidden');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
          }
        });
      `}} />
    </div>
  );
}
