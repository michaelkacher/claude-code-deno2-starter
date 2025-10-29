# Production Deployment Guide

## Development-Only Routes

This template includes development-only routes that are **automatically excluded from production builds**:

- `/design-system` - Design system showcase and component library
- `/mockups/*` - UI mockups and prototypes

### How It Works

The application uses the `DENO_ENV` environment variable to determine the environment:

**Development (default):**
- All routes are accessible
- Design system and mockups visible on home page
- Useful for prototyping and design iteration

**Production:**
- Development routes are excluded from the build
- `/design-system` and `/mockups/*` return 404
- Home page hides development-only cards
- Cleaner, production-ready deployment

### Configuration

**Fresh Config** (`frontend/fresh.config.ts`):
```typescript
const isDevelopment = Deno.env.get("DENO_ENV") !== "production";

export default defineConfig({
  router: {
    ignoreFilePattern: isDevelopment
      ? undefined
      : /\/(design-system|mockups)/,
  },
});
```

**Environment Variable:**
- `DENO_ENV=production` - Production mode (excludes dev routes)
- `DENO_ENV` not set or any other value - Development mode (includes all routes)

### Build Commands

The deno.json tasks automatically set the correct environment:

**Development:**
```bash
deno task dev              # Development mode (all routes)
deno task dev:frontend     # Development mode (all routes)
```

**Production Build:**
```bash
deno task build            # Sets DENO_ENV=production for frontend build
deno task build:frontend   # Builds frontend with production exclusions
```

**Production Preview:**
```bash
deno task preview          # Preview production build locally
```

**Deployment:**
```bash
deno task deploy           # Deploys with DENO_ENV=production
deno task deploy:preview   # Preview deployment with production settings
```

## Deployment to Deno Deploy

### Manual Deployment

```bash
# Deploy to production
deno task deploy

# The deploy command automatically sets DENO_ENV=production
```

### Automatic Deployment (GitHub Actions)

When using GitHub Actions for deployment, set the environment variable in your workflow:

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Deno Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: denoland/setup-deno@v1
        with:
          deno-version: v2.x

      - name: Deploy to Deno Deploy
        run: |
          deno task deploy
        env:
          DENO_DEPLOY_TOKEN: ${{ secrets.DENO_DEPLOY_TOKEN }}
          DENO_ENV: production  # Important: Set production environment
```

### Environment Variables in Deno Deploy Dashboard

If not using the deploy command, you can also set environment variables in the Deno Deploy dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add: `DENO_ENV` = `production`
4. Redeploy

## Verifying Production Build

### Local Verification

Test production behavior locally:

```bash
# Build with production settings
deno task build

# Preview the production build
deno task preview

# Visit http://localhost:3000
# - /design-system should return 404
# - /mockups should return 404
# - Home page should not show design system/mockups cards
```

### After Deployment

Check your deployed site:

```bash
# Visit your production URL
curl https://your-project.deno.dev/design-system
# Should return: 404 Not Found

curl https://your-project.deno.dev/mockups
# Should return: 404 Not Found
```

## Adding More Development-Only Routes

To exclude additional routes from production:

**Update `frontend/fresh.config.ts`:**
```typescript
export default defineConfig({
  router: {
    ignoreFilePattern: isDevelopment
      ? undefined
      : /\/(design-system|mockups|admin-dev|debug)/,  // Add more patterns
  },
});
```

The pattern uses regex, so you can match multiple routes:
- `/design-system` - Exact route
- `/mockups/*` - All mockup routes
- `/admin-dev` - Admin development tools
- `/debug` - Debug pages

## Best Practices

### What Should Be Development-Only

**Include in development only:**
- ✅ Design system showcases
- ✅ UI mockups and prototypes
- ✅ Debug pages
- ✅ Testing utilities
- ✅ Style guides
- ✅ Component playgrounds

**Include in production:**
- ❌ Actual features and user-facing pages
- ❌ API endpoints
- ❌ Authentication pages
- ❌ Dashboard and app functionality

### Security Considerations

Development-only routes are **completely excluded** from production builds, meaning:
- They don't exist in the production bundle
- They can't be accessed even if someone knows the URL
- No security risk from exposed development tools
- Smaller production bundle size

### File Organization

Keep development resources separate:

```
frontend/routes/
├── index.tsx              # Production route
├── design-system.tsx      # Development only (excluded)
├── mockups/               # Development only (excluded)
│   ├── index.tsx
│   └── user-profile.tsx
└── dashboard.tsx          # Production route
```

## Troubleshooting

### Issue: Development routes still accessible in production

**Check:**
1. Is `DENO_ENV=production` set?
   ```bash
   # In deployment environment
   echo $DENO_ENV  # Should output: production
   ```

2. Is Fresh config correctly reading the environment?
   ```typescript
   console.log('DENO_ENV:', Deno.env.get('DENO_ENV'));
   console.log('isDevelopment:', isDevelopment);
   ```

3. Rebuild after configuration changes:
   ```bash
   deno task clean
   deno task build
   ```

### Issue: Home page shows development cards in production

**Check:**
1. `DENO_ENV=production` is set
2. `frontend/routes/index.tsx` correctly checks `isDevelopment`
3. Fresh server restarted after env change

### Issue: Need development routes in staging environment

**Solution:** Use a different environment variable:

```typescript
const isProduction = Deno.env.get("DENO_ENV") === "production";
const isStaging = Deno.env.get("DENO_ENV") === "staging";

// Exclude dev routes only in production
const isDevelopment = !isProduction;
```

Then set `DENO_ENV=staging` for staging deployments.

## Summary

- **Automatic:** Development routes excluded in production builds
- **Environment-based:** Uses `DENO_ENV` environment variable
- **Safe:** Routes completely removed from production bundle
- **Simple:** Works with existing deployment workflows
- **Configurable:** Easy to add more development-only routes

**Key takeaway:** Set `DENO_ENV=production` when deploying, and development routes are automatically excluded!
