# Production Admin Setup Guide

Complete guide for setting up the first admin user in production.

## Overview

When deploying to production, you need at least one admin user to access the admin panel. This guide covers the automatic setup process.

---

## Automatic Admin Setup (Recommended)

The template includes an automatic admin setup system that runs on server startup.

### How It Works

1. Set `INITIAL_ADMIN_EMAIL` environment variable in your production deployment
2. Deploy your application
3. Sign up using that email address through the UI
4. Server automatically promotes that user to admin on next restart (or on signup if server running)
5. Remove the environment variable for security

### Security Features

✅ **Only runs if authentication is enabled** (`DISABLE_AUTH=false`)  
✅ **Only promotes once** - safe to leave variable set temporarily  
✅ **No exposed endpoints** - completely server-side  
✅ **Automatic cleanup** - reminds you to remove the variable  

---

## Step-by-Step Instructions

### For Deno Deploy

1. **Set environment variable** in Deno Deploy dashboard:
   ```
   INITIAL_ADMIN_EMAIL=your-email@company.com
   ```

2. **Deploy your application**:
   ```bash
   git push origin main
   # Or manual deployment
   deno task deploy
   ```

3. **Visit your production URL** and sign up with that exact email:
   - Go to `https://your-app.deno.dev/signup`
   - Enter the email you specified in `INITIAL_ADMIN_EMAIL`
   - Complete the signup process

4. **Restart the server** (if it was already running):
   - Deno Deploy: Push a small change or redeploy
   - Or wait for next deployment

5. **Check the logs** - you should see:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ ✅ INITIAL ADMIN CREATED                            │
   ├─────────────────────────────────────────────────────┤
   │ Email: your-email@company.com                       │
   │ Name:  Your Name                                    │
   │ ID:    dd2b080c-054e-4c6e-8b19-187ab331f427         │
   ├─────────────────────────────────────────────────────┤
   │ ⚠️  IMPORTANT: Remove INITIAL_ADMIN_EMAIL from      │
   │    your environment variables now for security.    │
   └─────────────────────────────────────────────────────┘
   ```

6. **Log in** and verify admin access:
   - Go to `https://your-app.deno.dev/login`
   - Log in with your credentials
   - You should see the "Admin Panel" button in navigation

7. **Remove the environment variable**:
   - Go to Deno Deploy dashboard → Settings → Environment Variables
   - Delete `INITIAL_ADMIN_EMAIL`
   - **Important**: Do this for security - prevents anyone from using this feature

### For Docker/VPS Deployment

1. **Add to environment variables**:
   ```bash
   # .env.production or docker-compose.yml
   INITIAL_ADMIN_EMAIL=your-email@company.com
   ```

2. **Deploy and start server**:
   ```bash
   docker-compose up -d
   # Or for VPS
   systemctl restart your-app
   ```

3. **Sign up** through the UI with that email

4. **Check logs**:
   ```bash
   docker logs your-app-container
   # Or
   journalctl -u your-app
   ```

5. **Remove environment variable**:
   ```bash
   # Edit .env.production or docker-compose.yml
   # Remove or comment out INITIAL_ADMIN_EMAIL
   
   # Restart to apply
   docker-compose up -d
   ```

### For Other Platforms (AWS, GCP, Azure, etc.)

1. **Set environment variable** in your platform's dashboard
2. **Deploy application**
3. **Sign up** with that email through the UI
4. **Verify in logs** that admin was created
5. **Remove environment variable** from platform settings

---

## Verification

After setup, verify your admin access:

1. **Log in** to your production site
2. **Check navigation bar** - you should see "Admin Panel" button
3. **Click "Admin Panel"** - should load admin dashboard
4. **Verify statistics** - should show all registered users

---

## Troubleshooting

### "User not found" Warning

**Problem**: Server logs show:
```
⚠️  INITIAL_ADMIN_EMAIL set to "email@example.com" but user not found.
   Please sign up with this email first, then restart the server.
```

**Solution**:
1. Go to your production URL `/signup`
2. Create an account with the exact email from `INITIAL_ADMIN_EMAIL`
3. Restart the server (redeploy or push a change)

---

### Environment Variable Not Working

**Problem**: Signed up but not promoted to admin

**Checklist**:
- [ ] Is `DISABLE_AUTH=false`? (Auth must be enabled)
- [ ] Did you restart the server after signing up?
- [ ] Is the email **exactly** the same? (case-sensitive)
- [ ] Check deployment logs for setup messages

**Fix**:
```bash
# Check current environment variables
deno eval "console.log(Deno.env.get('INITIAL_ADMIN_EMAIL'))"

# Verify auth is enabled
deno eval "console.log(Deno.env.get('DISABLE_AUTH'))"
```

---

### Already Promoted But Still Seeing Warning

**Problem**: Logs show admin already configured, but message appears on every startup

**Solution**: This is expected behavior until you remove the environment variable. Simply:
1. Go to your deployment platform's settings
2. Delete `INITIAL_ADMIN_EMAIL` environment variable
3. Restart server (optional - warning is harmless)

---

### Can't See "Admin Panel" Button

**Problem**: Logged in but no admin button in navigation

**Solutions**:

1. **Clear browser storage**:
   ```javascript
   // In browser console
   localStorage.clear();
   // Then log out and log back in
   ```

2. **Verify role in database**:
   ```bash
   # Using the CLI tool
   deno task users:list
   # Your user should show "admin" in the Role column
   ```

3. **Check logs** during login to verify role is being set

---

## Alternative Methods

If automatic setup doesn't work for your deployment platform, use the CLI script:

### Manual CLI Script

1. **SSH into your production server**

2. **Run the make-admin script**:
   ```bash
   cd /path/to/your/app
   deno run --unstable-kv --allow-read --allow-write --allow-env \
     scripts/make-admin.ts your-email@example.com
   ```

3. **Output**:
   ```
   ✅ User "Your Name" (your-email@example.com) promoted to admin!
      User ID: dd2b080c-054e-4c6e-8b19-187ab331f427
      Updated at: 2025-01-15T10:30:00.000Z
   ```

4. **Log in** and verify admin access

---

## Security Best Practices

### Production Checklist

- [ ] ✅ Set `INITIAL_ADMIN_EMAIL` before deployment
- [ ] ✅ Sign up with that email through the UI
- [ ] ✅ Verify admin promotion in logs
- [ ] ✅ **Remove `INITIAL_ADMIN_EMAIL` after setup**
- [ ] ✅ Confirm admin panel access works
- [ ] ✅ Create additional admins if needed (through admin panel)

### Why Remove the Environment Variable?

**Security Reason**: If left set, the system will continue checking for that email on every startup. While this doesn't create a vulnerability (the user must already exist), it's best practice to remove it after initial setup.

**Performance**: Eliminates unnecessary database lookup on every startup.

**Clean Deployment**: Keeps your environment variables minimal and purpose-specific.

---

## Creating Additional Admins

After you have admin access, you can promote other users through the admin panel:

1. **Go to Admin Panel** (`/admin/users`)
2. **Find the user** in the table
3. **Click the ↑ (up arrow)** button next to their name
4. **Confirm** the promotion
5. User is now an admin!

---

## Environment Variable Reference

```bash
# Required for automatic admin setup
INITIAL_ADMIN_EMAIL=your-email@company.com

# Must be false for admin setup to work
DISABLE_AUTH=false

# Other auth-related variables
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-app.deno.dev
```

---

## Production Deployment Checklist

```markdown
## Initial Deployment

- [ ] Set `INITIAL_ADMIN_EMAIL` in deployment environment
- [ ] Set `JWT_SECRET` to a secure random string
- [ ] Set `CORS_ORIGIN` to your production URL
- [ ] Set `FRONTEND_URL` to your production URL
- [ ] Configure `RESEND_API_KEY` if using email verification
- [ ] Deploy application

## First-Time Setup

- [ ] Visit production URL
- [ ] Sign up with the email from `INITIAL_ADMIN_EMAIL`
- [ ] Check deployment logs for admin promotion message
- [ ] Log in and verify "Admin Panel" button appears
- [ ] Access admin panel and verify functionality
- [ ] **Remove `INITIAL_ADMIN_EMAIL` from environment**

## Post-Setup

- [ ] Create additional admin users if needed
- [ ] Set up email verification (optional)
- [ ] Configure monitoring and alerts
- [ ] Test all admin panel features
- [ ] Document admin procedures for your team
```

---

## Related Documentation

- [Admin Panel Guide](./ADMIN_PANEL.md) - Complete admin panel documentation
- [Admin Quick Start](./ADMIN_QUICK_START.md) - Quick reference for admin features
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - General deployment guide

---

## Support

If you encounter issues:

1. **Check deployment logs** for error messages
2. **Verify environment variables** are set correctly
3. **Test locally** with the same setup
4. **Review this guide** for troubleshooting steps
5. **Use the CLI script** as a fallback method

For persistent issues, check that:
- Authentication is enabled (`DISABLE_AUTH=false`)
- Database is accessible
- User account was created successfully
- Email matches exactly (case-sensitive)
