/**
 * Two-Factor Authentication Setup Island
 * Handles 2FA enrollment with QR code display
 *
 * MIGRATED TO API CLIENT
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useSignal } from '@preact/signals';
import { twoFactorApi } from '../lib/api-client.ts';

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export default function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const step = useSignal<'password' | 'scan' | 'verify' | 'backup'>('password');
  const password = useSignal('');
  const verificationCode = useSignal('');
  const qrCodeURL = useSignal('');
  const manualKey = useSignal('');
  const backupCodes = useSignal<string[]>([]);
  const error = useSignal('');
  const isLoading = useSignal(false);

  const handlePasswordSubmit = async (e: Event) => {
    e.preventDefault();
    error.value = '';
    isLoading.value = true;

    try {
      // Use API client for 2FA setup
      const data = await twoFactorApi.setup(password.value);
      
      qrCodeURL.value = data.qrCodeURL;
      manualKey.value = data.manualEntryKey;
      step.value = 'scan';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to setup 2FA';
    } finally {
      isLoading.value = false;
    }
  };

  const handleVerifyCode = async (e: Event) => {
    e.preventDefault();
    error.value = '';
    isLoading.value = true;

    try {
      // Use API client for 2FA enable
      const data = await twoFactorApi.enable(verificationCode.value);
      
      backupCodes.value = data.backupCodes;
      step.value = 'backup';
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid verification code';
    } finally {
      isLoading.value = false;
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    } else if (IS_BROWSER) {
      window.location.href = '/profile';
    }
  };

  const copyBackupCodes = () => {
    if (IS_BROWSER) {
      navigator.clipboard.writeText(backupCodes.value.join('\n'));
      alert('Backup codes copied to clipboard!');
    }
  };

  return (
    <div class="max-w-2xl mx-auto">
      {/* Password Confirmation Step */}
      {step.value === 'password' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Enable Two-Factor Authentication</h2>
          <p class="text-gray-600 mb-6">
            Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
          </p>

          {error.value && (
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error.value}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} class="space-y-4">
            <div>
              <label htmlFor="password" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm Your Password
              </label>
              <input
                type="password"
                id="password"
                value={password.value}
                onInput={(e) => password.value = (e.target as HTMLInputElement).value}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your password"
                disabled={isLoading.value}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading.value}
              class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading.value ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {/* QR Code Scan Step */}
      {step.value === 'scan' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Scan QR Code</h2>
          <p class="text-gray-600 mb-6">
            Scan this QR code with your authenticator app:
          </p>

          <div class="flex justify-center mb-6">
            <img src={qrCodeURL.value} alt="2FA QR Code" class="border border-gray-300 rounded-lg" />
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-gray-700 mb-2">Can't scan? Enter this key manually:</p>
            <code class="text-sm text-gray-900 break-all">{manualKey.value}</code>
          </div>

          <button
            type="button"
            onClick={() => step.value = 'verify'}
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            I've Scanned the Code
          </button>
        </div>
      )}

      {/* Verification Step */}
      {step.value === 'verify' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Verify Setup</h2>
          <p class="text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app to complete setup:
          </p>

          {error.value && (
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error.value}
            </div>
          )}

          <form onSubmit={handleVerifyCode} class="space-y-4">
            <div>
              <label htmlFor="code" class="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode.value}
                onInput={(e) => verificationCode.value = (e.target as HTMLInputElement).value}
                required
                maxLength={6}
                pattern="\d{6}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
                placeholder="000000"
                disabled={isLoading.value}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading.value || verificationCode.value.length !== 6}
              class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading.value ? 'Verifying...' : 'Verify and Enable'}
            </button>

            <button
              type="button"
              onClick={() => step.value = 'scan'}
              class="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* Backup Codes Step */}
      {step.value === 'backup' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="flex items-center gap-3 mb-4">
            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <h2 class="text-2xl font-bold text-gray-900">2FA Enabled Successfully!</h2>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-yellow-800 mb-2">⚠️ Important: Save Your Backup Codes</p>
            <p class="text-sm text-yellow-700">
              These backup codes can be used if you lose access to your authenticator app. 
              Each code can only be used once. Store them in a safe place!
            </p>
          </div>

          <div class="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 gap-2">
              {backupCodes.value.map((code, index) => (
                <code key={index} class="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              onClick={copyBackupCodes}
              class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              📋 Copy Codes
            </button>
            <button
              type="button"
              onClick={handleFinish}
              class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Finish Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

