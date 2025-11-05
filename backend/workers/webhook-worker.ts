/**
 * Webhook Processing Worker
 *
 * Example job worker for processing webhooks asynchronously.
 * This demonstrates handling external API calls with retry logic.
 */

import { queue } from '../lib/queue.ts';

// ============================================================================
// Types
// ============================================================================

export interface WebhookJobData {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body: unknown;
  event: string;
  signature?: string;
}

// ============================================================================
// Webhook Processing Logic
// ============================================================================

/**
 * Process a webhook by sending HTTP request to the target URL
 */
async function processWebhook(data: WebhookJobData): Promise<void> {
  console.log('🪝 Processing webhook:');
  console.log(`  URL: ${data.url}`);
  console.log(`  Event: ${data.event}`);
  console.log(`  Method: ${data.method}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YourApp-Webhook/1.0',
    ...data.headers,
  };

  // Add signature if provided (for webhook security)
  if (data.signature) {
    headers['X-Webhook-Signature'] = data.signature;
  }

  try {
    const response = await fetch(data.url, {
      method: data.method,
      headers,
      body: JSON.stringify(data.body),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(no body)');
      throw new Error(
        `Webhook failed with status ${response.status}: ${body}`,
      );
    }

    console.log(`✅ Webhook delivered successfully (status: ${response.status})`);
  } catch (error) {
    console.error('❌ Webhook delivery failed:', error);
    throw error;
  }
}

// ============================================================================
// Worker Registration
// ============================================================================

/**
 * Register the webhook worker
 * Call this function during server startup
 */
export function registerWebhookWorker(): void {
  queue.process<WebhookJobData>('process-webhook', async (job) => {
    await processWebhook(job.data);
  });

  console.log('🪝 Webhook worker registered');
}

// ============================================================================
// Helper Functions for Enqueueing Jobs
// ============================================================================

/**
 * Send a webhook for a user event
 */
export async function sendUserWebhook(
  webhookUrl: string,
  event: 'user.created' | 'user.updated' | 'user.deleted',
  userId: string,
  userData: Record<string, unknown>,
): Promise<string> {
  return await queue.add('process-webhook', {
    url: webhookUrl,
    method: 'POST',
    event,
    body: {
      event,
      timestamp: new Date().toISOString(),
      data: {
        userId,
        ...userData,
      },
    },
  }, {
    priority: 6,
    maxRetries: 5, // Webhooks should retry multiple times
  });
}

/**
 * Send a webhook for a payment event
 */
export async function sendPaymentWebhook(
  webhookUrl: string,
  event: 'payment.succeeded' | 'payment.failed' | 'payment.refunded',
  paymentData: Record<string, unknown>,
): Promise<string> {
  return await queue.add('process-webhook', {
    url: webhookUrl,
    method: 'POST',
    event,
    body: {
      event,
      timestamp: new Date().toISOString(),
      data: paymentData,
    },
  }, {
    priority: 10, // High priority for payment webhooks
    maxRetries: 5,
  });
}

/**
 * Send a custom webhook
 */
export async function sendCustomWebhook(
  webhookUrl: string,
  event: string,
  data: unknown,
  options: {
    priority?: number;
    maxRetries?: number;
    headers?: Record<string, string>;
    signature?: string;
  } = {},
): Promise<string> {
  return await queue.add('process-webhook', {
    url: webhookUrl,
    method: 'POST',
    event,
    body: {
      event,
      timestamp: new Date().toISOString(),
      data,
    },
    headers: options.headers,
    signature: options.signature,
  }, {
    priority: options.priority || 5,
    maxRetries: options.maxRetries || 3,
  });
}

// ============================================================================
// Webhook Signature Generation
// ============================================================================

/**
 * Generate HMAC signature for webhook security
 * Use this to sign webhook payloads so recipients can verify authenticity
 */
export async function generateWebhookSignature(
  payload: unknown,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = encoder.encode(secret);

  // Import key for HMAC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  // Generate signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Send a webhook with HMAC signature
 */
export async function sendSignedWebhook(
  webhookUrl: string,
  webhookSecret: string,
  event: string,
  data: unknown,
): Promise<string> {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const signature = await generateWebhookSignature(payload, webhookSecret);

  return await sendCustomWebhook(webhookUrl, event, data, {
    signature: `sha256=${signature}`,
    priority: 8,
    maxRetries: 5,
  });
}
