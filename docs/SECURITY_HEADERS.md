# Security Headers Implementation

## Overview

The application now implements comprehensive security headers following OWASP best practices to protect against common web vulnerabilities.

## Implemented Headers

### 1. Content-Security-Policy (CSP)
**Purpose:** Prevents XSS attacks by controlling which resources can be loaded

**Development Mode:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss:;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' ws: wss:;
frame-ancestors 'none';
```

**Production Mode:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

**Note:** `unsafe-inline` and `unsafe-eval` are required for Fresh/Preact. Consider using nonces for production if possible.

---

### 2. Strict-Transport-Security (HSTS)
**Purpose:** Forces HTTPS connections, prevents protocol downgrade attacks

**Value:** `max-age=31536000; includeSubDomains`
- Enforces HTTPS for 1 year
- Applies to all subdomains
- **Only enabled in production** (not in development)

**Note:** Only add `preload` if you've registered with HSTS preload list

---

### 3. X-Frame-Options
**Purpose:** Prevents clickjacking attacks

**Value:** `DENY`
- Prevents the page from being embedded in any frame/iframe
- Use `SAMEORIGIN` if you need to embed your own pages

---

### 4. X-Content-Type-Options
**Purpose:** Prevents MIME-sniffing attacks

**Value:** `nosniff`
- Forces browsers to respect declared Content-Type
- Prevents malicious file upload exploits

---

### 5. X-XSS-Protection
**Purpose:** Legacy XSS protection for older browsers

**Value:** `1; mode=block`
- Enables built-in XSS filter
- Blocks page rendering if XSS detected
- Modern browsers rely on CSP instead

---

### 6. Referrer-Policy
**Purpose:** Controls how much referrer information is sent

**Value:** `strict-origin-when-cross-origin`
- Full URL sent for same-origin requests
- Only origin sent for cross-origin requests
- Balances privacy and functionality

**Alternatives:**
- `no-referrer` - Maximum privacy (breaks some analytics)
- `same-origin` - Only send for same-origin
- `origin` - Always send origin only

---

### 7. Permissions-Policy
**Purpose:** Controls browser feature access

**Value:** `camera=(), microphone=(), geolocation=()`
- Disables camera access
- Disables microphone access
- Disables geolocation access

**Note:** Add features as needed: `payment=self`, `usb=()`, etc.

---

### 8. X-Powered-By Removal
**Purpose:** Security through obscurity

**Value:** Empty string
- Removes server identification
- Makes fingerprinting slightly harder

---

## Request Body Size Limits

Protects against large payload denial-of-service attacks:

| Endpoint Type | Limit | Use Case |
|---------------|-------|----------|
| **Strict** | 100 KB | Auth endpoints (login/signup) |
| **JSON** | 1 MB | General API endpoints (default) |
| **File Upload** | 10 MB | Image/document uploads |
| **Large** | 50 MB | Video/large file uploads |

### Implementation

```typescript
// Global default (1MB)
app.use('*', bodySizeLimits.json);

// Specific endpoints
auth.post('/login', bodySizeLimits.strict, ...); // 100KB
uploads.post('/files', bodySizeLimits.fileUpload, ...); // 10MB
```

---

## Usage

### Default Configuration (Recommended)

```typescript
// backend/main.ts
import { securityHeaders } from './lib/security-headers.ts';

app.use('*', securityHeaders()); // Balanced defaults
```

### Custom Configuration

```typescript
import { securityHeaders } from './lib/security-headers.ts';

// Custom CSP
app.use('*', securityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self' cdn.example.com",
  xFrameOptions: 'SAMEORIGIN', // Allow same-origin framing
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
}));
```

### Presets

```typescript
import { securityHeaderPresets } from './lib/security-headers.ts';

// Maximum security (APIs only)
app.use('*', securityHeaderPresets.strict);

// Balanced (default - most apps)
app.use('*', securityHeaderPresets.balanced);

// Relaxed (development/testing)
app.use('*', securityHeaderPresets.relaxed);
```

---

## Testing Security Headers

### Browser DevTools
1. Open DevTools → Network tab
2. Make a request to your API
3. Check Response Headers

### Command Line
```bash
curl -I http://localhost:8000/api/health

# Expected headers:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Online Tools
- [SecurityHeaders.com](https://securityheaders.com) - Grade your security headers
- [Mozilla Observatory](https://observatory.mozilla.org) - Comprehensive security analysis

---

## Security Checklist

- [x] Content-Security-Policy configured
- [x] HSTS enabled (production only)
- [x] X-Frame-Options set to DENY
- [x] X-Content-Type-Options enabled
- [x] X-XSS-Protection enabled
- [x] Referrer-Policy configured
- [x] Permissions-Policy configured
- [x] X-Powered-By removed
- [x] Request body size limits implemented
- [x] Rate limiting on auth endpoints
- [x] bcrypt password hashing
- [x] JWT token validation
- [x] CORS configured

---

## Additional Recommendations

### 1. Enable HTTPS in Production
Security headers are most effective over HTTPS:
- Use Deno Deploy (automatic HTTPS)
- Or use Let's Encrypt for self-hosted

### 2. Monitor CSP Violations
Add CSP reporting:
```typescript
contentSecurityPolicy: "...; report-uri /api/csp-report"
```

### 3. Regularly Update
Security headers evolve. Review annually:
- New vulnerabilities discovered
- Browser support changes
- New header standards

### 4. Consider Additional Security
- Web Application Firewall (WAF)
- DDoS protection (Cloudflare, Deno Deploy edge)
- Intrusion Detection System (IDS)
- Regular security audits

---

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Content Security Policy Guide](https://content-security-policy.com/)
- [HSTS Preload List](https://hstspreload.org/)
