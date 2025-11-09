/**
 * Structured Logging Library
 * 
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Context tracking
 * - Development vs Production modes
 * - Structured metadata
 * - Future extensibility (error tracking services, log aggregation)
 * 
 * @example
 * ```typescript
 * const logger = createLogger('WebSocket');
 * logger.info('User connected', { userId: '123' });
 * logger.error('Connection failed', error, { userId: '123' });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMeta {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, error?: Error | unknown, meta?: LogMeta): void;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string | undefined;
  } | undefined;
  meta?: LogMeta | undefined;
}

class LoggerImpl implements Logger {
  private context: string;
  private isDevelopment: boolean;
  private minLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    // Safely check environment - default to production if we can't access env
    try {
      this.isDevelopment = Deno.env.get('DENO_ENV') === 'development';
    } catch {
      this.isDevelopment = false;
    }
    this.minLevel = this.isDevelopment ? 'debug' : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Development: Readable format with colors
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[entry.level];

      let output = `${emoji} [${entry.context}] ${entry.message}`;
      
      if (entry.meta && Object.keys(entry.meta).length > 0) {
        output += `\n  Meta: ${JSON.stringify(entry.meta, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      return output;
    } else {
      // Production: JSON format for log aggregation
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, error?: Error | unknown, meta?: LogMeta): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      meta,
    };

    // Parse error if provided
    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        entry.error = {
          name: 'Unknown',
          message: String(error),
        };
      }
    }

    const formatted = this.formatEntry(entry);

    // Log to appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        // In production, also send to error tracking service
        if (!this.isDevelopment && entry.error) {
          this.sendToErrorTracking(entry);
        }
        break;
    }
  }

  private sendToErrorTracking(_entry: LogEntry): void {
    // TODO(@team): Integrate with error tracking service (Sentry, LogTail, etc.)
    // Example:
    // Sentry.captureException(_entry.error, {
    //   tags: { context: _entry.context },
    //   extra: _entry.meta,
    // });
  }

  debug(message: string, meta?: LogMeta): void {
    this.log('debug', message, undefined, meta);
  }

  info(message: string, meta?: LogMeta): void {
    this.log('info', message, undefined, meta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.log('warn', message, undefined, meta);
  }

  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    this.log('error', message, error, meta);
  }
}

/**
 * Create a logger instance with the given context
 * 
 * @param context - Name of the module/component (e.g., 'WebSocket', 'Auth', 'JobQueue')
 * @returns Logger instance
 */
export function createLogger(context: string): Logger {
  return new LoggerImpl(context);
}

/**
 * Default logger for general use (lazy-initialized to avoid permission errors)
 */
let _defaultLogger: Logger | null = null;
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop: string | symbol) {
    if (!_defaultLogger) {
      _defaultLogger = createLogger('App');
    }
    if (typeof prop === 'symbol') {
      return (_defaultLogger as never)[prop];
    }
    return (_defaultLogger as unknown as Record<string, unknown>)[prop];
  }
});
