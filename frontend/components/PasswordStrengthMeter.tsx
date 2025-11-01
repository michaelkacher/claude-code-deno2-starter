/**
 * Password Strength Meter Component
 * Provides visual feedback on password strength
 */


interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  feedback: string[];
}

/**
 * Calculate password strength
 * Returns score from 0 (weakest) to 4 (strongest)
 */
function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: '',
      bgColor: '',
      feedback: [],
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLowercase && hasUppercase) {
    score++;
  } else if (!hasLowercase && !hasUppercase) {
    feedback.push('Add both uppercase and lowercase letters');
  } else if (!hasLowercase) {
    feedback.push('Add lowercase letters');
  } else if (!hasUppercase) {
    feedback.push('Add uppercase letters');
  }

  if (hasNumbers) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  if (hasSpecialChars) {
    score++;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Penalty for common patterns
  const commonPatterns = [
    /^12345/,
    /^password/i,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
    /^master/i,
    /^123456789/,
    /(.)\1{2,}/, // Repeated characters (aaa, 111, etc.)
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.unshift('Avoid common patterns');
  }

  // Sequential characters penalty
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
  if (hasSequential) {
    score = Math.max(0, score - 1);
    if (!feedback.includes('Avoid common patterns')) {
      feedback.unshift('Avoid sequential characters');
    }
  }

  // Cap score at 4
  score = Math.min(4, score);

  // Determine label and colors based on score
  let label = '';
  let color = '';
  let bgColor = '';

  switch (score) {
    case 0:
    case 1:
      label = 'Weak';
      color = 'text-red-700';
      bgColor = 'bg-red-500';
      break;
    case 2:
      label = 'Fair';
      color = 'text-orange-700';
      bgColor = 'bg-orange-500';
      break;
    case 3:
      label = 'Good';
      color = 'text-yellow-700';
      bgColor = 'bg-yellow-500';
      break;
    case 4:
      label = 'Strong';
      color = 'text-green-700';
      bgColor = 'bg-green-500';
      break;
  }

  return { score, label, color, bgColor, feedback };
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthProps) {
  const strength = calculateStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div class="mt-2 space-y-2">
      {/* Strength bars */}
      <div class="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            class={`h-1 flex-1 rounded-full transition-all duration-300 ${
              index < strength.score ? strength.bgColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div class="flex items-center justify-between">
        <span class={`text-sm font-medium ${strength.color}`}>
          {strength.label}
        </span>
        <span class="text-xs text-gray-500">
          {strength.score}/4
        </span>
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div class="text-xs text-gray-600 space-y-1">
          <p class="font-medium">Suggestions:</p>
          <ul class="list-disc list-inside space-y-0.5">
            {strength.feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Strong password message */}
      {strength.score === 4 && (
        <div class="text-xs text-green-700 font-medium flex items-center gap-1">
          <span>✓</span>
          <span>Excellent! Your password is strong.</span>
        </div>
      )}
    </div>
  );
}
