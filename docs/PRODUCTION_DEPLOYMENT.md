# Production Deployment Guide

Complete guide for deploying your application to production.

## Table of Contents

- [Quick Start (Deno Deploy)](#quick-start-deno-deploy)
- [Environment Variables](#environment-variables)
- [Security Checklist](#security-checklist)
- [Deployment Platforms](#deployment-platforms)
- [Database Setup](#database-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Quick Start (Deno Deploy)

### Prerequisites

1. **Deno Deploy account**: https://dash.deno.com (sign in with GitHub)
2. **GitHub repository**: Your code pushed to GitHub
3. **Environment variables**: Prepared (see [Environment Variables](#environment-variables))

### Deployment Steps

1. **Create a new project** in Deno Deploy:
   - Visit https://dash.deno.com
   - Click "New Project"
   - Connect your GitHub repository
   - Choose your project name (e.g., `my-app`)

2. **Configure automatic deployments**:
   - Select your repository
   - Set production branch: `main`
   - Set entry point: `frontend/main.ts`
   - Enable automatic deployments on push

3. **Set environment variables** (Dashboard → Settings → Environment Variables):
   ```bash
   # Required
   DENO_ENV=production
   JWT_SECRET=<generate-secure-secret>
   
   # Recommended
   FRONTEND_URL=https://your-app.deno.dev
   API_URL=https://your-app.deno.dev/api
   
   # Optional (for email)
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@yourdomain.com
   
   # Optional (first admin setup)
   INITIAL_ADMIN_EMAIL=admin@yourdomain.com
   ```

4. **Deploy**:
   ```bash
   git push origin main
   # Automatic deployment via GitHub integration
   ```

5. **Verify deployment**:
   - Visit your deployment URL: `https://your-app.deno.dev`
   - Check logs in Deno Deploy dashboard
   - Test login/signup functionality

6. **Setup first admin** (see [Production Admin Setup](PRODUCTION_ADMIN_SETUP.md)):
   - Sign up with the email specified in `INITIAL_ADMIN_EMAIL`
   - Server auto-promotes to admin
   - Remove `INITIAL_ADMIN_EMAIL` after setup

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DENO_ENV` | Environment (must be `production`) | `production` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Generate with `openssl rand -base64 32` |

**Generate secure JWT_SECRET:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Recommended Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Your app's public URL | `https://your-app.deno.dev` |
| `API_URL` | API endpoint URL | `https://your-app.deno.dev/api` |
| `PORT` | Server port | `3000` |

### Optional Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `RESEND_API_KEY` | Email service API key | Email verification, notifications |
| `EMAIL_FROM` | Sender email address | Transactional emails |
| `REQUIRE_EMAIL_VERIFICATION` | Enforce email verification | Set to `true` in production |
| `INITIAL_ADMIN_EMAIL` | Auto-promote first admin | First deployment only |
| `STRIPE_SECRET_KEY` | Payment processing | Payment features |
| `S3_*` | S3-compatible storage config | File uploads (production) |

See `.env.example` for complete list of available variables.

---

## Security Checklist

Before deploying to production, verify:

### ✅ **Critical Security**

- [ ] `DENO_ENV=production` is set (enables security validations)
- [ ] `JWT_SECRET` is a unique, secure random string (min 32 chars)
- [ ] `JWT_SECRET` is **NOT** the default dev value
- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] All environment variables are set in deployment platform (not in code)

### ✅ **Authentication**

- [ ] Email verification is enabled (`REQUIRE_EMAIL_VERIFICATION=true`)
- [ ] Password requirements are sufficient (min 8 chars by default)
- [ ] 2FA is available for admin accounts
- [ ] Session timeout is reasonable (`JWT_EXPIRES_IN`)

### ✅ **Database**

- [ ] Deno KV is used (automatically secure on Deno Deploy)
- [ ] No sensitive data in console logs
- [ ] Backups configured (automatic on Deno Deploy)

### ✅ **API Security**

- [ ] CORS is configured correctly (`CORS_ORIGIN`)
- [ ] Rate limiting is enabled (built-in)
- [ ] Input validation is active (Zod schemas)
- [ ] Error messages don't leak sensitive info

### ✅ **Admin Access**

- [ ] First admin created via `INITIAL_ADMIN_EMAIL`
- [ ] `INITIAL_ADMIN_EMAIL` removed after first admin setup
- [ ] Admin panel access verified
- [ ] Admin email verified

---

## Deployment Platforms

### Deno Deploy (Recommended)

**Advantages:**
- ✅ Zero-config Deno KV (globally distributed)
- ✅ Edge deployment (low latency worldwide)
- ✅ Automatic HTTPS
- ✅ Auto-scaling
- ✅ Built-in monitoring
- ✅ GitHub integration

**Pricing:** https://deno.com/deploy/pricing

**Setup:**
```bash
# Install deployctl
deno install -A jsr:@deno/deployctl

# Deploy manually
deployctl deploy --project=your-project --prod frontend/main.ts

# Or use task
deno task deploy
```

### Docker (Self-Hosted)

**Use case:** Custom infrastructure, on-premise deployment

```dockerfile
# Dockerfile
FROM denoland/deno:2.0.0

WORKDIR /app

# Copy files
COPY . .

# Cache dependencies
RUN deno cache frontend/main.ts

# Expose port
EXPOSE 3000

# Run application
CMD ["deno", "run", "--allow-all", "--unstable-kv", "frontend/main.ts"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DENO_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://yourdomain.com
    volumes:
      - ./data:/app/data  # Deno KV persistence
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

### VPS (Linux Server)

**Requirements:** Deno 2 installed on server

```bash
# Install Deno on server
curl -fsSL https://deno.land/install.sh | sh

# Clone your repository
git clone https://github.com/your-org/your-app.git
cd your-app

# Set environment variables
export DENO_ENV=production
export JWT_SECRET="your-secure-secret"

# Run with systemd (recommended)
# Create /etc/systemd/system/your-app.service
```

**systemd service file:**
```ini
[Unit]
Description=Your App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/your-app
Environment="DENO_ENV=production"
Environment="JWT_SECRET=your-secure-secret"
ExecStart=/home/www-data/.deno/bin/deno run --allow-all --unstable-kv frontend/main.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Start service:**
```bash
sudo systemctl enable your-app
sudo systemctl start your-app
sudo systemctl status your-app
```

---

## Database Setup

### Deno KV (Recommended)

**Local Development:**
- SQLite file: `./data/local.db`
- Automatic creation
- Perfect for testing

**Production (Deno Deploy):**
- FoundationDB backend (automatic)
- Globally distributed
- Eventually consistent
- No configuration needed!

**Key Features:**
- ✅ Zero setup
- ✅ Automatic backups (Deno Deploy)
- ✅ Edge replication
- ✅ Strong consistency available via atomic operations

**Migrations:**
Not needed! Deno KV is schema-less. Changes to data models are handled in application code.

### PostgreSQL (Advanced)

**When to migrate from Deno KV:**
- Complex JOIN queries needed
- Advanced aggregations required
- Existing PostgreSQL infrastructure
- Specific compliance requirements

See `docs/architecture.md` for migration guidance.

---

## Monitoring & Logging

### Deno Deploy Dashboard

**Built-in monitoring:**
- Request logs (real-time)
- Error tracking
- Performance metrics
- Deployment history

**Access logs:**
1. Visit https://dash.deno.com
2. Select your project
3. Click "Logs" tab

### Application Logging

**Log levels:**
- `debug` - Development only (verbose)
- `info` - General information
- `warn` - Warnings
- `error` - Errors and exceptions

**Production logging:**
```typescript
import { createLogger } from '@/lib/logger.ts';

const logger = createLogger('MyService');

// Automatically adjusts verbosity based on DENO_ENV
logger.info('User created', { userId, email });
logger.error('Failed to process', { error });
```

**Viewing logs:**
```bash
# Deno Deploy (CLI)
deployctl logs --project=your-project --production

# Or in dashboard
# https://dash.deno.com → Your Project → Logs
```

### Error Tracking

**Built-in features:**
- Structured error logging
- Stack traces (development only)
- Error boundary components
- Graceful degradation

**External services (optional):**
- Sentry
- DataDog
- New Relic

---

## Troubleshooting

### Server Won't Start

**Error: JWT_SECRET validation failed**
```
🚨 CRITICAL SECURITY ERROR - SERVER STARTUP BLOCKED
JWT_SECRET is still set to the default development value
```

**Solution:**
Generate a new secure secret:
```bash
openssl rand -base64 32
```
Set in environment variables (not in code!).

---

### Admin Panel Not Accessible

**Symptoms:**
- No "Admin Panel" button in navigation
- `/admin/users` returns 403

**Solutions:**

1. **Check user role:**
   ```bash
   deno task users:list
   # Look for your user, verify role is 'admin'
   ```

2. **Promote user to admin:**
   - Set `INITIAL_ADMIN_EMAIL` in environment
   - Restart server
   - Remove `INITIAL_ADMIN_EMAIL` after promotion

3. **Manual promotion (local only):**
   ```bash
   deno task users:make-admin your@email.com
   ```

---

### Database Connection Issues

**Error: KV operation failed**

**For Deno Deploy:**
- Deno KV is automatic, no configuration needed
- Check deployment logs for errors
- Verify `--unstable-kv` flag is present (automatic in `deno.json`)

**For self-hosted:**
- Ensure `data/` directory exists and is writable
- Check disk space
- Verify file permissions

---

### Email Not Sending

**Check:**
1. `RESEND_API_KEY` is set correctly
2. `EMAIL_FROM` is verified in Resend dashboard
3. API key has proper permissions
4. Check Resend dashboard logs

**Testing:**
```bash
# In development
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

### Performance Issues

**Slow response times:**

1. **Check Deno Deploy metrics:**
   - Dashboard → Analytics
   - Look for slow endpoints
   - Check error rates

2. **Optimize database queries:**
   - Use indexes (Deno KV keys)
   - Batch operations with atomic transactions
   - Cache frequently accessed data

3. **Enable caching:**
   - Static assets (automatic in Fresh)
   - API responses (add cache headers)

---

### Deployment Fails

**GitHub Actions failing:**

1. **Check secrets:**
   - `DENO_DEPLOY_TOKEN` is set in GitHub repo secrets
   - Token hasn't expired

2. **Check project name:**
   - Matches in `deno.json`
   - Matches in `.github/workflows/deploy.yml`

3. **View workflow logs:**
   - GitHub → Actions tab
   - Click failed workflow
   - Review error messages

---

## Production Best Practices

### 🔐 Security

1. **Never commit secrets** - Use environment variables
2. **Rotate secrets regularly** - Especially JWT_SECRET
3. **Enable email verification** - `REQUIRE_EMAIL_VERIFICATION=true`
4. **Monitor failed login attempts** - Built-in rate limiting
5. **Keep dependencies updated** - `deno cache --reload`

### 📊 Monitoring

1. **Set up alerts** - Use Deno Deploy alerts or external service
2. **Monitor error rates** - Check logs daily
3. **Track performance** - Use built-in analytics
4. **Review logs regularly** - Catch issues early

### 🚀 Performance

1. **Use edge caching** - Automatic on Deno Deploy
2. **Optimize images** - Use WebP format, lazy loading
3. **Minimize bundle size** - Fresh does this automatically
4. **Use atomic operations** - Batch KV operations

### 📝 Documentation

1. **Document environment variables** - Update `.env.example`
2. **Keep architecture docs current** - Update `docs/architecture.md`
3. **Document API changes** - Feature-scoped docs in `features/`
4. **Maintain changelog** - Track changes between deployments

---

## Related Documentation

- [Production Admin Setup](PRODUCTION_ADMIN_SETUP.md) - Setting up first admin user
- [Deno KV Guide](guides/DENO_KV_GUIDE.md) - Database best practices
- [Architecture](architecture.md) - System design and decisions
- [Quick Reference](QUICK_REFERENCE.md) - Common tasks and commands

---

## Support

**Issues:**
- Check deployment logs first
- Review this troubleshooting guide
- Consult Deno Deploy documentation: https://deno.com/deploy/docs

**Deno Deploy Support:**
- Discord: https://discord.gg/deno
- GitHub: https://github.com/denoland/deploy_feedback

**Template Issues:**
- Submit issue to repository
- Include error logs and environment details
