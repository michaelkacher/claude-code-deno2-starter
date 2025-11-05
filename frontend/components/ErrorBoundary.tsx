/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree,
 * logs those errors, and displays a fallback UI instead of
 * crashing the entire application.
 * 
 * Features:
 * - Prevents app crashes from component errors
 * - Shows user-friendly error message
 * - Logs errors for debugging
 * - Provides recovery option (reload page)
 * - Dark mode support
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import { Component, ComponentChildren } from 'preact';

interface Props {
  children: ComponentChildren;
  fallback?: ComponentChildren;
  onError?: (error: Error, errorInfo: unknown) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: unknown;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // Log error details
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error tracking service in production
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
            <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                class="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
              Something went wrong
            </h1>

            <p class="text-gray-600 dark:text-gray-400 text-center mb-6">
              We're sorry for the inconvenience. An unexpected error occurred.
            </p>

            {this.state.error && (
              <div class="bg-gray-50 dark:bg-gray-900 rounded p-4 mb-6">
                <p class="text-sm font-mono text-gray-700 dark:text-gray-300 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div class="flex gap-3">
              <button
                onClick={this.handleReload}
                class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Go Home
              </button>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-500 text-center mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
