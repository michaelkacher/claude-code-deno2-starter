/**
 * Test Client for API Integration Tests
 * Simplifies making HTTP requests to the test server
 */

export interface TestClientOptions {
  skipAuth?: boolean;
  headers?: Record<string, string>;
}

export interface TestResponse<T = unknown> {
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  headers: Headers;
}

/**
 * Create a test client for making API requests
 * Handles authentication, JSON serialization, and response parsing
 */
export function createTestClient(baseUrl = 'http://localhost:3000') {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const makeRequest = async <T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    options: TestClientOptions = {},
  ): Promise<TestResponse<T>> => {
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...options.headers,
    };

    // Add auth token unless explicitly skipped
    if (!options.skipAuth) {
      headers['Authorization'] = 'Bearer test-token';
    }

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${path}`, requestInit);

    let data: T | undefined;
    let error: { code: string; message: string } | undefined;

    const text = await response.text();
    if (text) {
      const json = JSON.parse(text);
      if (response.ok) {
        data = json.data ?? json;
      } else {
        error = json.error;
      }
    }

    return {
      status: response.status,
      data,
      error,
      headers: response.headers,
    };
  };

  return {
    get: <T = unknown>(path: string, options?: TestClientOptions) =>
      makeRequest<T>('GET', path, undefined, options),

    post: <T = unknown>(
      path: string,
      body: unknown,
      options?: TestClientOptions,
    ) => makeRequest<T>('POST', path, body, options),

    put: <T = unknown>(
      path: string,
      body: unknown,
      options?: TestClientOptions,
    ) => makeRequest<T>('PUT', path, body, options),

    patch: <T = unknown>(
      path: string,
      body: unknown,
      options?: TestClientOptions,
    ) => makeRequest<T>('PATCH', path, body, options),

    delete: <T = unknown>(path: string, options?: TestClientOptions) =>
      makeRequest<T>('DELETE', path, undefined, options),
  };
}
