/**
 * Email Sending Worker
 *
 * Example job worker for sending emails asynchronously.
 * This demonstrates how to create a simple worker that processes email jobs.
 */

import { createLogger } from '../lib/logger.ts';
import { queue } from '../lib/queue.ts';

const logger = createLogger('EmailWorker');

// ============================================================================
// Types
// ============================================================================

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Uint8Array;
    contentType: string;
  }>;
}

// ============================================================================
// Email Sending Logic
// ============================================================================

/**
 * Send an email (stub implementation)
 * In production, you would integrate with a real email service like:
 * - AWS SES
 * - SendGrid
 * - Mailgun
 * - Resend
 * - Postmark
 */
async function sendEmail(data: EmailJobData): Promise<void> {
  logger.info('Sending email', {
    to: data.to,
    subject: data.subject,
    bodyPreview: data.body.substring(0, 100),
  });

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate occasional failures for testing retry logic
  if (Math.random() < 0.1) {
    throw new Error('Simulated email sending failure');
  }

  logger.info('Email sent successfully', { to: data.to });
}

// ============================================================================
// Worker Registration
// ============================================================================

/**
 * Register the email worker
 * Call this function during server startup
 */
export function registerEmailWorker(): void {
  queue.process<EmailJobData>('send-email', async (job) => {
    await sendEmail(job.data);
  });

  logger.info('Email worker registered');
}

// ============================================================================
// Helper Functions for Enqueueing Jobs
// ============================================================================

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<string> {
  return await queue.add('send-email', {
    to: email,
    subject: 'Welcome to Our App!',
    body: `Hi ${name},\n\nWelcome to our app! We're excited to have you on board.\n\nBest regards,\nThe Team`,
  }, {
    priority: 5, // Medium priority
    maxRetries: 3,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string,
): Promise<string> {
  return await queue.add('send-email', {
    to: email,
    subject: 'Password Reset Request',
    body: `You requested a password reset.\n\nClick here to reset your password: ${resetUrl}?token=${resetToken}\n\nThis link expires in 1 hour.`,
  }, {
    priority: 10, // High priority
    maxRetries: 5,
  });
}

/**
 * Send an email verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  verificationUrl: string,
): Promise<string> {
  return await queue.add('send-email', {
    to: email,
    subject: 'Verify Your Email',
    body: `Please verify your email address by clicking the link below:\n\n${verificationUrl}?token=${verificationToken}\n\nThis link expires in 24 hours.`,
  }, {
    priority: 8, // High priority
    maxRetries: 3,
  });
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  body: string,
): Promise<string> {
  return await queue.add('send-email', {
    to: email,
    subject,
    body,
  }, {
    priority: 3, // Lower priority than transactional emails
    maxRetries: 2,
  });
}
