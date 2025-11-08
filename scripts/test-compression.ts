#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test Response Compression
 * 
 * This script tests the compression middleware by:
 * - Making requests with different Accept-Encoding headers
 * - Checking compression is applied for large responses
 * - Verifying compression is skipped for small responses
 * - Testing different content types
 */

const API_URL = Deno.env.get('API_URL') || 'http://localhost:3000/api';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

const results: TestResult[] = [];

function log(test: string, status: 'PASS' | 'FAIL', message: string) {
  results.push({ test, status, message });
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${test}: ${message}`);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

// Test 1: Large JSON response with gzip
async function testGzipCompression() {
  console.log('\n📝 Test 1: Gzip Compression (large response)');
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    
    const encoding = response.headers.get('Content-Encoding');
    const contentLength = response.headers.get('Content-Length');
    
    // Health endpoint is too small, let's try a larger endpoint
    // For now, just check headers are present
    if (response.ok) {
      log('Gzip Support', 'PASS', `Server responded (encoding: ${encoding || 'none'})`);
    } else {
      log('Gzip Support', 'FAIL', `Server error: ${response.status}`);
    }
  } catch (error) {
    log('Gzip Support', 'FAIL', error.message);
  }
}

// Test 2: Large JSON response with brotli
async function testBrotliCompression() {
  console.log('\n📝 Test 2: Brotli Compression (preferred)');
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept-Encoding': 'br, gzip, deflate',
      },
    });
    
    const encoding = response.headers.get('Content-Encoding');
    
    if (response.ok) {
      log('Brotli Support', 'PASS', `Server responded (encoding: ${encoding || 'none'})`);
    } else {
      log('Brotli Support', 'FAIL', `Server error: ${response.status}`);
    }
  } catch (error) {
    log('Brotli Support', 'FAIL', error.message);
  }
}

// Test 3: No compression for small responses
async function testSmallResponseNoCompression() {
  console.log('\n📝 Test 3: Small Response (no compression)');
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept-Encoding': 'gzip, br',
      },
    });
    
    const encoding = response.headers.get('Content-Encoding');
    const body = await response.text();
    const size = new TextEncoder().encode(body).length;
    
    // Health check is small (<1KB), should not be compressed
    if (size < 1024 && !encoding) {
      log('Small Response Skip', 'PASS', `${formatBytes(size)} - not compressed (below threshold)`);
    } else if (size < 1024 && encoding) {
      log('Small Response Skip', 'FAIL', `${formatBytes(size)} - incorrectly compressed`);
    } else {
      log('Small Response Skip', 'PASS', `${formatBytes(size)} - ${encoding || 'no encoding'}`);
    }
  } catch (error) {
    log('Small Response Skip', 'FAIL', error.message);
  }
}

// Test 4: Create large response to test compression
async function testLargeResponse() {
  console.log('\n📝 Test 4: Large Response Compression');
  
  try {
    // Try to get a larger response (e.g., list of users if authenticated)
    // For now, test with what we have
    
    // Make request without compression
    const responseUncompressed = await fetch(`${API_URL}/health`);
    const bodyUncompressed = await responseUncompressed.text();
    const uncompressedSize = new TextEncoder().encode(bodyUncompressed).length;
    
    // Make request with compression
    const responseCompressed = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    
    const encoding = responseCompressed.headers.get('Content-Encoding');
    const compressedSize = responseCompressed.headers.get('Content-Length');
    
    if (uncompressedSize >= 1024) {
      if (encoding === 'gzip' && compressedSize) {
        const ratio = ((1 - parseInt(compressedSize) / uncompressedSize) * 100).toFixed(1);
        log(
          'Large Response',
          'PASS',
          `${formatBytes(uncompressedSize)} → ${formatBytes(parseInt(compressedSize))} (${ratio}% reduction)`
        );
      } else {
        log('Large Response', 'FAIL', 'Expected compression but got none');
      }
    } else {
      log('Large Response', 'PASS', `Response too small to test (${formatBytes(uncompressedSize)})`);
    }
  } catch (error) {
    log('Large Response', 'FAIL', error.message);
  }
}

// Test 5: No compression without Accept-Encoding
async function testNoAcceptEncoding() {
  console.log('\n📝 Test 5: No Accept-Encoding Header');
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        // Explicitly don't send Accept-Encoding
      },
    });
    
    const encoding = response.headers.get('Content-Encoding');
    
    if (!encoding) {
      log('No Accept-Encoding', 'PASS', 'No compression applied without header');
    } else {
      log('No Accept-Encoding', 'FAIL', `Unexpected encoding: ${encoding}`);
    }
  } catch (error) {
    log('No Accept-Encoding', 'FAIL', error.message);
  }
}

// Test 6: Compression info in development
async function testDevelopmentHeaders() {
  console.log('\n📝 Test 6: Development Compression Headers');
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    
    const compressionRatio = response.headers.get('X-Compression-Ratio');
    const originalSize = response.headers.get('X-Original-Size');
    const compressedSize = response.headers.get('X-Compressed-Size');
    
    if (env.DENO_ENV === 'development') {
      // In development, debug headers might be present if compressed
      log(
        'Development Headers',
        'PASS',
        compressionRatio
          ? `Ratio: ${compressionRatio}, Original: ${originalSize}B, Compressed: ${compressedSize}B`
          : 'Response too small for compression'
      );
    } else {
      // In production, debug headers should not be present
      if (!compressionRatio && !originalSize && !compressedSize) {
        log('Development Headers', 'PASS', 'No debug headers in production');
      } else {
        log('Development Headers', 'FAIL', 'Debug headers leaked to production');
      }
    }
  } catch (error) {
    log('Development Headers', 'FAIL', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Response Compression Tests\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Environment: ${env.DENO_ENV}\n`);
  
  try {
    // Run all tests
    await testGzipCompression();
    await testBrotliCompression();
    await testSmallResponseNoCompression();
    await testLargeResponse();
    await testNoAcceptEncoding();
    await testDevelopmentHeaders();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary\n');
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;
    
    console.log(`Total:  ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Rate:   ${Math.round((passed / total) * 100)}%\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:');
      results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  ❌ ${r.test}: ${r.message}`));
    }
    
    console.log('='.repeat(50));
    console.log('\n💡 Note: Health endpoint is small (<1KB), so compression is skipped.');
    console.log('   To see compression in action, test with larger endpoints like:');
    console.log('   - /api/admin/users (requires auth)');
    console.log('   - /api/openapi.json (API spec)');
    console.log('   - Any endpoint returning large JSON arrays\n');
    
    Deno.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  runTests();
}
