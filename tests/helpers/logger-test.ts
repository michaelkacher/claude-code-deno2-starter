/**
 * Logger Test Helpers
 * Utilities for managing logger output during tests
 */

/**
 * Temporarily suppress logger output during test execution
 * Useful for tests that intentionally trigger errors/warnings
 * 
 * @example
 * ```typescript
 * await suppressLogs(async () => {
 *   // Code that logs errors we don't want cluttering test output
 *   await connection.onMessage(malformedMessage, mockWs);
 * });
 * ```
 */
export async function suppressLogs<T>(
  fn: () => T | Promise<T>
): Promise<T> {
  const originalLogLevel = Deno.env.get('LOG_LEVEL');
  
  try {
    // Set to 'silent' to suppress all logs
    Deno.env.set('LOG_LEVEL', 'silent');
    return await fn();
  } finally {
    // Restore original log level
    if (originalLogLevel !== undefined) {
      Deno.env.set('LOG_LEVEL', originalLogLevel);
    } else {
      Deno.env.delete('LOG_LEVEL');
    }
  }
}

/**
 * Suppress only error-level logs
 * Allows info/debug logs through but suppresses errors
 */
export async function suppressErrorLogs<T>(
  fn: () => T | Promise<T>
): Promise<T> {
  const originalLogLevel = Deno.env.get('LOG_LEVEL');
  
  try {
    // Set to 'warn' to show only warnings and above (not errors from expected failures)
    Deno.env.set('LOG_LEVEL', 'fatal');
    return await fn();
  } finally {
    if (originalLogLevel !== undefined) {
      Deno.env.set('LOG_LEVEL', originalLogLevel);
    } else {
      Deno.env.delete('LOG_LEVEL');
    }
  }
}
