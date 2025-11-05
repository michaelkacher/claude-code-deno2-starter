# 🎨 Customizing Your Deno 2 Starter

This guide explains how to customize the Deno 2 Starter template for your specific project needs.

## 📋 Table of Contents

- [Quick Start Customization](#quick-start-customization)
- [Site Configuration](#site-configuration)
- [Navigation Setup](#navigation-setup)
- [Theme & Branding](#theme--branding)
- [Feature Flags](#feature-flags)
- [Environment Configuration](#environment-configuration)
- [Advanced Customization](#advanced-customization)

## 🚀 Quick Start Customization

The fastest way to customize your starter is to edit the main configuration file:

```typescript
// frontend/lib/config.ts
export const defaultConfig: SiteConfig = {
  site: {
    name: "Your App Name",           // 👈 Change this
    description: "Your description", // 👈 And this
    url: "https://your-domain.com",
  },
  // ... rest of config
}
```

## ⚙️ Site Configuration

### Basic Site Identity

```typescript
site: {
  name: "Your App Name",                    // Shown in navigation and page titles
  description: "Your app description",     // Used for meta tags and SEO
  url: "https://your-domain.com",          // Base URL for your application
  logo: "/images/logo.svg",                // Optional: Path to your logo
}
```

### Meta Tags and SEO

The site name is automatically used for:
- Page titles (in `_app.tsx`)
- Navigation branding
- Social sharing metadata

## 🧭 Navigation Setup

### Primary Navigation

Configure your main navigation menu:

```typescript
navigation: {
  primary: [
    {
      label: "Home",
      href: "/",
      icon: "🏠",              // Optional emoji or icon
    },
    {
      label: "About",
      href: "/about",
      icon: "ℹ️",
    },
    {
      label: "GitHub",
      href: "https://github.com/your-repo",
      icon: "📱",
      external: true,          // Opens in new tab
    },
    {
      label: "Admin",
      href: "/admin",
      icon: "🛠️",
      adminOnly: true,         // Only shown to admin users
    },
  ],
}
```

### Mobile Navigation

Configure mobile-specific navigation (often same as primary):

```typescript
navigation: {
  mobile: [
    // Same format as primary
    // Can be different items or order for mobile
  ],
}
```

### Navigation Item Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Display text for the link |
| `href` | `string` | URL or path to navigate to |
| `icon` | `string` | Optional emoji or icon character |
| `external` | `boolean` | If true, opens in new tab |
| `adminOnly` | `boolean` | Only visible to admin users |
| `requiresAuth` | `boolean` | Only visible to authenticated users |

## 🎨 Theme & Branding

### Color Configuration

Customize your brand colors:

```typescript
theme: {
  primary: "#2563eb",      // Main brand color (blue-600)
  secondary: "#64748b",    // Secondary color (slate-500)
  accent: "#7c3aed",       // Accent color (violet-600)
  background: "#ffffff",   // Main background
  surface: "#f8fafc",      // Card/surface background
}
```

### Using Custom Colors

The theme system automatically generates:
- **50-900 color scales** for each brand color
- **Component-specific CSS variables**
- **Semantic color mappings**

### CSS Custom Properties

After setting your theme, use these CSS variables:

```css
.my-button {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.my-button:hover {
  background-color: var(--btn-primary-hover);
}
```

### Pre-built Theme Classes

Use these classes in your components:

```tsx
// Buttons
<button class="btn-primary">Primary Button</button>
<button class="btn-secondary">Secondary Button</button>
<button class="btn-accent">Accent Button</button>

// Navigation
<a class="nav-item">Navigation Link</a>
<h1 class="nav-brand">Brand Text</h1>

// Forms
<input class="form-input" />

// Status
<span class="status-success">Success</span>
<span class="status-error">Error</span>
```

## 🚀 Feature Flags

Enable or disable features based on your needs:

```typescript
features: {
  enableNotifications: true,    // Real-time notifications
  enableTwoFactor: true,        // 2FA authentication
  enableFileUpload: false,      // File upload functionality
  enableAdminPanel: true,       // Admin user interface
  enableDarkMode: false,        // Dark/light theme toggle
}
```

### Checking Feature Flags

```typescript
import { getFeatures } from '../lib/config.ts';

const features = getFeatures();

if (features.enableNotifications) {
  // Show notification UI
}
```

## 🌍 Environment Configuration

### Development vs Production

The config automatically adapts to different environments:

```typescript
// In production
DENO_ENV=production
FRONTEND_URL=https://your-domain.com
API_URL=https://api.your-domain.com

// In staging
DENO_ENV=staging
FRONTEND_URL=https://staging.your-domain.com
API_URL=https://api-staging.your-domain.com
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DENO_ENV` | Environment (development/staging/production) | `development` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `API_URL` | Backend API base URL | `http://localhost:8000/api` |

## 🔧 Advanced Customization

### Custom Navigation Components

For complex navigation needs, create custom components:

```typescript
// frontend/components/CustomNavigation.tsx
import { getNavigationItems } from '../lib/config.ts';

export default function CustomNavigation() {
  const items = getNavigationItems();
  
  return (
    <nav class="my-custom-nav">
      {items.map(item => (
        <CustomNavItem key={item.href} item={item} />
      ))}
    </nav>
  );
}
```

### Extending the Configuration

Add your own configuration sections:

```typescript
// frontend/lib/config.ts
export interface SiteConfig {
  // ... existing config
  
  // Your custom sections
  analytics?: {
    googleAnalytics?: string;
    mixpanel?: string;
  };
  
  integrations?: {
    stripe?: string;
    sendgrid?: string;
  };
}

export const defaultConfig: SiteConfig = {
  // ... existing config
  
  analytics: {
    googleAnalytics: Deno.env.get("GA_TRACKING_ID"),
  },
  
  integrations: {
    stripe: Deno.env.get("STRIPE_PUBLIC_KEY"),
  },
};
```

### Custom Theme Variables

Extend the theme system:

```typescript
// In ThemeProvider.tsx, add your custom variables:
const cssVariables = `
  :root {
    /* Existing variables... */
    
    /* Your custom variables */
    --my-custom-color: #ff6b6b;
    --my-spacing: 2rem;
    --my-border-radius: 12px;
  }
`;
```

## 📝 Configuration Checklist

When setting up a new project, customize these items:

### Required Changes
- [ ] Site name and description
- [ ] Navigation menu items
- [ ] Primary brand colors
- [ ] Production URLs
- [ ] Remove unused features

### Optional Customizations
- [ ] Add custom logo
- [ ] Configure social links
- [ ] Set up analytics
- [ ] Customize theme variables
- [ ] Add footer navigation
- [ ] Configure API timeouts

### Environment Setup
- [ ] Set production environment variables
- [ ] Configure staging environment
- [ ] Set up custom domain
- [ ] Configure API endpoints

## 🎯 Examples

### E-commerce Site

```typescript
const ecommerceConfig = {
  site: {
    name: "My Store",
    description: "Premium products for modern life",
  },
  navigation: {
    primary: [
      { label: "Shop", href: "/shop", icon: "🛍️" },
      { label: "Categories", href: "/categories", icon: "📂" },
      { label: "About", href: "/about", icon: "ℹ️" },
      { label: "Contact", href: "/contact", icon: "📞" },
    ],
  },
  theme: {
    primary: "#059669", // Green for commerce
    accent: "#dc2626",  // Red for sales
  },
  features: {
    enableNotifications: true,
    enableFileUpload: true, // Product images
  },
};
```

### SaaS Application

```typescript
const saasConfig = {
  site: {
    name: "DataFlow Pro",
    description: "Advanced analytics for modern teams",
  },
  navigation: {
    primary: [
      { label: "Dashboard", href: "/dashboard", icon: "📊" },
      { label: "Analytics", href: "/analytics", icon: "📈" },
      { label: "Settings", href: "/settings", icon: "⚙️" },
      { label: "Help", href: "/help", icon: "❓" },
    ],
  },
  theme: {
    primary: "#3b82f6", // Professional blue
    secondary: "#6b7280",
    accent: "#8b5cf6", // Purple accent
  },
  features: {
    enableNotifications: true,
    enableTwoFactor: true,
    enableAdminPanel: true,
  },
};
```

## 🛠️ Troubleshooting

### Common Issues

**Navigation items not showing:**
- Check that items are properly formatted in the config
- Verify imports in Navigation component

**Theme colors not applying:**
- Ensure ThemeProvider is included in _app.tsx
- Check that CSS custom properties are being generated

**Environment config not working:**
- Verify DENO_ENV is set correctly
- Check that environment variables are defined

### Debug Tips

```typescript
// Add this to debug configuration loading:
console.log('Current config:', siteConfig);
console.log('Current environment:', Deno.env.get('DENO_ENV'));
```

## 🚀 Next Steps

After customizing your starter:

1. **Update README** with your project information
2. **Configure deployment** for your hosting platform
3. **Set up monitoring** and analytics
4. **Customize error pages** and 404 handlers
5. **Add your content** and features

---

Need help? Check the [main documentation](../README.md) or [create an issue](https://github.com/your-repo/issues).