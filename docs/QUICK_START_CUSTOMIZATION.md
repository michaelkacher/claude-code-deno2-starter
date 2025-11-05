# ⚡ Quick Start Customization

This starter template is designed to be easily customizable for your specific project needs.

## 🚀 Instant Setup

**Option 1: Interactive Setup (Recommended)**
```bash
deno run --allow-read --allow-write scripts/customize.ts
```

**Option 2: Manual Configuration**
Edit `frontend/lib/config.ts` directly:

```typescript
export const defaultConfig: SiteConfig = {
  site: {
    name: "Your App Name",        // 👈 Change this
    description: "Your description", // 👈 And this
  },
  
  navigation: {
    primary: [
      { label: "Home", href: "/", icon: "🏠" },
      { label: "About", href: "/about", icon: "ℹ️" },
      // Add your menu items here
    ],
  },
  
  theme: {
    primary: "#2563eb",  // Your brand color
    // ... other colors
  },
}
```

## 🎨 What You Can Customize

- **🏷️ Site Name & Branding** - Shown in navigation and page titles
- **🧭 Navigation Menu** - Add/remove/reorder menu items with icons
- **🎨 Theme Colors** - Complete color system with automatic variants
- **⚙️ Feature Flags** - Enable/disable notifications, 2FA, admin panel, etc.
- **🌍 Environment Config** - Different settings for dev/staging/production

## 📚 Learn More

- **[Complete Customization Guide](docs/CUSTOMIZATION.md)** - Detailed documentation
- **[Architecture Overview](docs/architecture.md)** - Understanding the codebase
- **[Feature Documentation](features/README.md)** - Available features and modules

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `frontend/lib/config.ts` | Main configuration file |
| `frontend/components/ThemeProvider.tsx` | CSS custom properties |
| `frontend/routes/_app.tsx` | App-wide layout and theme |

## 🎯 Examples

### E-commerce Site
```typescript
const config = {
  site: { name: "My Store" },
  navigation: {
    primary: [
      { label: "Shop", href: "/shop", icon: "🛍️" },
      { label: "Cart", href: "/cart", icon: "🛒" },
    ],
  },
  theme: { primary: "#059669" }, // Green theme
};
```

### SaaS Dashboard
```typescript
const config = {
  site: { name: "Analytics Pro" },
  navigation: {
    primary: [
      { label: "Dashboard", href: "/dashboard", icon: "📊" },
      { label: "Reports", href: "/reports", icon: "📈" },
    ],
  },
  theme: { primary: "#3b82f6" }, // Professional blue
};
```

---

*Continue reading the full documentation for detailed setup instructions and advanced features.*