---
description: Test the starter customization workflow end-to-end
---

# Customization Workflow Test

This test verifies that the customization workflow works correctly.

## Test Scenario: E-commerce Store Setup

**User Goal**: Transform the starter into an e-commerce store called "Modern Goods"

### Expected Input
- Site name: "Modern Goods"
- Description: "Premium products for modern life"
- App type: E-commerce store
- Navigation: Shop, Categories, New Arrivals, About, Contact
- Theme: Green (#059669)
- Features: Notifications ✅, File Upload ✅, 2FA ❌, Admin Panel ❌

### Expected Output

**Updated `frontend/lib/config.ts`:**
```typescript
export const defaultConfig: SiteConfig = {
  site: {
    name: "Modern Goods",
    description: "Premium products for modern life",
    url: "http://localhost:3000",
  },

  navigation: {
    primary: [
      { label: "Home", href: "/", icon: "🏠" },
      { label: "Shop", href: "/shop", icon: "🛍️" },
      { label: "Categories", href: "/categories", icon: "📂" },
      { label: "New Arrivals", href: "/new", icon: "✨" },
      { label: "About", href: "/about", icon: "ℹ️" },
      { label: "Contact", href: "/contact", icon: "📞" },
    ],
    mobile: [
      // Same as primary
    ],
  },

  theme: {
    primary: "#059669", // Green for commerce
    secondary: "#64748b",
    accent: "#7c3aed",
    background: "#ffffff",
    surface: "#f8fafc",
  },

  features: {
    enableNotifications: true,
    enableTwoFactor: false,
    enableFileUpload: true,
    enableAdminPanel: false,
    enableDarkMode: false,
  },
};
```

### Verification Steps

1. **Configuration Applied**: Config file updated correctly
2. **Site Name Changed**: "Modern Goods" appears in navigation
3. **Navigation Updated**: New menu items appear in correct order
4. **Theme Applied**: Green primary color visible in components
5. **Features Configured**: Notifications enabled, 2FA disabled
6. **Dev Server Works**: Application starts without errors
7. **Backup Created**: Original config saved as backup

### Test Commands

```bash
# Test the interactive script
deno run --allow-read --allow-write scripts/customize.ts

# Or test through Claude agent
# Ask: "customize this starter for an e-commerce store called Modern Goods"
```

### Success Criteria

- ✅ Navigation shows "Modern Goods" instead of "Deno 2 Starter"
- ✅ Menu items match the e-commerce structure
- ✅ Green theme colors are applied
- ✅ Notification functionality is available
- ✅ 2FA options are hidden
- ✅ No console errors or build failures
- ✅ Page title reflects new site name

## Alternative Test Scenarios

### SaaS Dashboard Test
- Name: "DataFlow Pro"
- Navigation: Dashboard, Analytics, Team, Settings
- Theme: Blue (#3b82f6)
- Features: All enabled

### Portfolio Test  
- Name: "Alex Design Studio"
- Navigation: Work, About, Process, Contact
- Theme: Purple (#7c3aed)
- Features: Minimal (only file upload)

## Troubleshooting Tests

### Invalid Configuration Test
- Verify error handling for invalid colors
- Test missing required fields
- Check TypeScript compilation errors

### Rollback Test
- Verify backup creation works
- Test config restoration from backup
- Ensure rollback doesn't break anything

### Environment Test
- Test production URL configuration
- Verify staging environment setup
- Check environment variable handling

## Performance Test

- Measure customization time (should be < 2 minutes)
- Check generated CSS custom properties
- Verify no performance regression after customization