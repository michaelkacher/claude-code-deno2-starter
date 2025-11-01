/**
 * Reset Password Page
 * Handles password reset with token from email link
 */

import { Handlers, PageProps } from "$fresh/server.ts";

interface ResetData {
  tokenValid: boolean;
  reason?: string;
  token?: string;
}

export const handler: Handlers<ResetData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return ctx.render({ tokenValid: false, reason: 'missing' });
    }

    try {
      const apiUrl = Deno.env.get('API_URL') || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/auth/validate-reset-token?token=${token}`);
      const data = await response.json();

      return ctx.render({
        tokenValid: data.data.valid,
        reason: data.data.reason,
        token: token
      });
    } catch (error) {
      return ctx.render({ tokenValid: false, reason: 'error' });
    }
  },
};

export default function ResetPasswordPage({ data, url }: PageProps<ResetData>) {
  if (!data.tokenValid) {
    return (
      <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
          <p class="text-gray-600 mb-6">
            {data.reason === 'expired' 
              ? 'This password reset link has expired. Reset links are valid for 1 hour.'
              : data.reason === 'missing'
              ? 'No reset token provided. Please use the link from your email.'
              : 'This password reset link is invalid or has already been used.'}
          </p>
          <div class="space-y-3">
            <a
              href="/forgot-password"
              class="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
            >
              Request New Reset Link
            </a>
            <a
              href="/login"
              class="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
            <svg class="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
          <p class="text-gray-600">
            Enter your new password below.
          </p>
        </div>
        
        <div id="message" class="hidden mb-4 p-3 rounded-md"></div>

        <form id="reset-form" class="space-y-4">
          <input type="hidden" id="token" value={data.token} />
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new password"
            />
            <p class="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            id="submit-btn"
            class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Password
          </button>
        </form>

        <div class="mt-6 text-center">
          <a
            href="/login"
            class="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Login
          </a>
        </div>
      </div>

      <script type="module" dangerouslySetInnerHTML={{__html: `
        const form = document.getElementById('reset-form');
        const submitBtn = document.getElementById('submit-btn');
        const messageDiv = document.getElementById('message');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const token = document.getElementById('token').value;
          const password = passwordInput.value;
          const confirmPassword = confirmPasswordInput.value;

          // Validate passwords match
          if (password !== confirmPassword) {
            messageDiv.className = 'mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700';
            messageDiv.innerHTML = \`
              <strong class="font-medium">Passwords don't match</strong>
              <p class="mt-1 text-sm">Please make sure both passwords are identical.</p>
            \`;
            messageDiv.classList.remove('hidden');
            return;
          }

          // Validate password length
          if (password.length < 8) {
            messageDiv.className = 'mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700';
            messageDiv.innerHTML = \`
              <strong class="font-medium">Password too short</strong>
              <p class="mt-1 text-sm">Password must be at least 8 characters long.</p>
            \`;
            messageDiv.classList.remove('hidden');
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Resetting...';
          messageDiv.classList.add('hidden');

          try {
            const apiUrl = window.location.origin.replace(':3000', ':8000');
            const response = await fetch(\`\${apiUrl}/api/auth/reset-password\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
              messageDiv.className = 'mb-4 p-3 rounded-md bg-green-50 border border-green-200 text-green-700';
              messageDiv.innerHTML = \`
                <strong class="font-medium">Password reset successful!</strong>
                <p class="mt-1 text-sm">\${data.data.message}</p>
                <p class="mt-2 text-sm">Redirecting to login page...</p>
              \`;
              messageDiv.classList.remove('hidden');
              
              // Redirect to login after 2 seconds
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            } else {
              messageDiv.className = 'mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700';
              messageDiv.innerHTML = \`
                <strong class="font-medium">Reset failed</strong>
                <p class="mt-1 text-sm">\${data.error?.message || 'Failed to reset password'}</p>
              \`;
              messageDiv.classList.remove('hidden');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
            }
          } catch (error) {
            messageDiv.className = 'mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700';
            messageDiv.innerHTML = \`
              <strong class="font-medium">Network Error</strong>
              <p class="mt-1 text-sm">Please check your connection and try again.</p>
            \`;
            messageDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
          }
        });

        // Real-time password match validation
        confirmPasswordInput.addEventListener('input', () => {
          const password = passwordInput.value;
          const confirmPassword = confirmPasswordInput.value;
          
          if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Passwords do not match');
          } else {
            confirmPasswordInput.setCustomValidity('');
          }
        });
      `}} />
    </div>
  );
}
