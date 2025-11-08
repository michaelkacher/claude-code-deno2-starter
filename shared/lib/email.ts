/**
 * Email Service using Resend
 * Handles sending transactional emails (verification, password reset, etc.)
 */

import { Resend } from 'npm:resend@4.0.0';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
      throw new Error('RESEND_API_KEY is not configured. Get your API key from https://resend.com');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Email templates
 */

interface EmailVerificationData {
  name: string;
  verificationUrl: string;
}

function getVerificationEmailHTML(data: EmailVerificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.name},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thanks for signing up! Please verify your email address to complete your registration.
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.verificationUrl}" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
      ${data.verificationUrl}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #999; margin: 0;">
      This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>© ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

function getVerificationEmailText(data: EmailVerificationData): string {
  return `
Hi ${data.name},

Thanks for signing up! Please verify your email address to complete your registration.

Click the link below to verify your email:
${data.verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
© ${new Date().getFullYear()} Your App Name. All rights reserved.
  `.trim();
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com';
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const data: EmailVerificationData = {
      name,
      verificationUrl,
    };

    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Verify your email address',
      html: getVerificationEmailHTML(data),
      text: getVerificationEmailText(data),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send password reset email (for future implementation)
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@yourdomain.com';
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Reset Your Password</h1>
  <p>Hi ${name},</p>
  <p>You requested to reset your password. Click the button below to create a new password:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Reset Password
    </a>
  </p>
  <p>Or copy this link: ${resetUrl}</p>
  <p style="color: #999; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, ignore this email.</p>
</body>
</html>
    `.trim();

    const text = `
Hi ${name},

You requested to reset your password. Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, ignore this email.
    `.trim();

    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Reset your password',
      html,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
