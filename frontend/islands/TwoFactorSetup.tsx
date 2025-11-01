/**
 * Two-Factor Authentication Setup Island
 * Handles 2FA enrollment with QR code display
 */

import { IS_BROWSER } from '$fresh/runtime.ts';
import { useState } from 'preact/hooks';

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export default function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'password' | 'scan' | 'verify' | 'backup'>('password');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeURL, setQrCodeURL] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!IS_BROWSER) return;

      const apiUrl = window.location.origin.replace(':3000', ':8000');
      const accessToken = localStorage.getItem('access_token');
      
      const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      
      const response = await fetch(`${apiUrl}/api/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfData.data.csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Failed to setup 2FA');
        setIsLoading(false);
        return;
      }

      setQrCodeURL(data.data.qrCodeURL);
      setManualKey(data.data.manualEntryKey);
      setStep('scan');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: Event) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!IS_BROWSER) return;

      const apiUrl = window.location.origin.replace(':3000', ':8000');
      const accessToken = localStorage.getItem('access_token');
      
      const csrfResponse = await fetch(`${apiUrl}/api/auth/csrf-token`, {
        credentials: 'include',
      });
      const csrfData = await csrfResponse.json();
      
      const response = await fetch(`${apiUrl}/api/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CSRF-Token': csrfData.data.csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Invalid verification code');
        setIsLoading(false);
        return;
      }

      setBackupCodes(data.data.backupCodes);
      setStep('backup');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
      navigator.clipboard.writeText(backupCodes.join('\n'));
      alert('Backup codes copied to clipboard!');
    }
  };

  return (
    <div class="max-w-2xl mx-auto">
      {/* Password Confirmation Step */}
      {step === 'password' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Enable Two-Factor Authentication</h2>
          <p class="text-gray-600 mb-6">
            Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
          </p>

          {error && (
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
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
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {/* QR Code Scan Step */}
      {step === 'scan' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Scan QR Code</h2>
          <p class="text-gray-600 mb-6">
            Scan this QR code with your authenticator app:
          </p>

          <div class="flex justify-center mb-6">
            <img src={qrCodeURL} alt="2FA QR Code" class="border border-gray-300 rounded-lg" />
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-gray-700 mb-2">Can't scan? Enter this key manually:</p>
            <code class="text-sm text-gray-900 break-all">{manualKey}</code>
          </div>

          <button
            onClick={() => setStep('verify')}
            class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            I've Scanned the Code
          </button>
        </div>
      )}

      {/* Verification Step */}
      {step === 'verify' && (
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Verify Setup</h2>
          <p class="text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app to complete setup:
          </p>

          {error && (
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
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
                value={verificationCode}
                onInput={(e) => setVerificationCode((e.target as HTMLInputElement).value)}
                required
                maxLength={6}
                pattern="\d{6}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
                placeholder="000000"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify and Enable'}
            </button>

            <button
              type="button"
              onClick={() => setStep('scan')}
              class="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* Backup Codes Step */}
      {step === 'backup' && (
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
              {backupCodes.map((code, index) => (
                <code key={index} class="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-gray-200">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <div class="flex gap-3">
            <button
              onClick={copyBackupCodes}
              class="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              📋 Copy Codes
            </button>
            <button
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
