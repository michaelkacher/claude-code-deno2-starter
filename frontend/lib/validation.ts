/**
 * Form Validation Utilities
 * 
 * Centralizes validation logic to eliminate 100-150 duplicate lines across form components.
 * Provides consistent validation rules, error messages, and validation helpers.
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation regex
 * Standard email format: user@domain.ext
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: false, // Can be enabled for stricter validation
  requireLowercase: false,
  requireNumber: false,
  requireSpecial: false,
} as const;

/**
 * Validate email address
 * Eliminates duplicate email regex validation (3+ occurrences)
 */
export function validateEmail(email: string): ValidationResult {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate password
 * Eliminates duplicate password validation (5+ occurrences)
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
    };
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    return {
      isValid: false,
      error: `Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`,
    };
  }

  // Optional: Check for additional requirements
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true };
}

/**
 * Validate password confirmation
 * Eliminates duplicate password match validation (2+ occurrences)
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}

/**
 * Validate required field
 * Eliminates duplicate empty field checks (10+ occurrences)
 */
export function validateRequired(value: string, fieldName: string = 'This field'): ValidationResult {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validate name field
 * Common validation for user name fields
 */
export function validateName(name: string): ValidationResult {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Name is required' };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }

  return { isValid: true };
}

/**
 * Validate 2FA code (6 digits for TOTP, 8 chars for backup)
 */
export function validate2FACode(code: string): ValidationResult {
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    return { isValid: false, error: 'Verification code is required' };
  }

  if (trimmedCode.length !== 6 && trimmedCode.length !== 8) {
    return {
      isValid: false,
      error: 'Verification code must be 6 digits (TOTP) or 8 characters (backup code)',
    };
  }

  // 6-digit codes should be numeric
  if (trimmedCode.length === 6 && !/^\d{6}$/.test(trimmedCode)) {
    return { isValid: false, error: 'TOTP code must be 6 digits' };
  }

  return { isValid: true };
}

/**
 * Composite validator - runs multiple validations and returns first error
 */
export function validateAll(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

/**
 * Form validation helper for signup
 * Eliminates 30-40 lines of duplicate validation in SignupForm
 */
export function validateSignupForm(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult {
  return validateAll(
    validateName(data.name),
    validateEmail(data.email),
    validatePassword(data.password),
    validatePasswordMatch(data.password, data.confirmPassword)
  );
}

/**
 * Form validation helper for login
 * Eliminates 10-15 lines of duplicate validation in LoginForm
 */
export function validateLoginForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  return validateAll(
    validateRequired(data.email, 'Email'),
    validateRequired(data.password, 'Password')
  );
}

/**
 * Form validation helper for password reset
 * Eliminates 15-20 lines of duplicate validation in ResetPasswordForm
 */
export function validatePasswordResetForm(data: {
  password: string;
  confirmPassword: string;
}): ValidationResult {
  return validateAll(
    validatePassword(data.password),
    validatePasswordMatch(data.password, data.confirmPassword)
  );
}

/**
 * Form validation helper for forgot password / resend verification
 * Eliminates 10-15 lines of duplicate validation
 */
export function validateEmailForm(email: string): ValidationResult {
  return validateEmail(email);
}
