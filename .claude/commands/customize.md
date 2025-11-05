---
description: Guide users through initial starter template customization
---

You will help users customize their Deno 2 Starter template by guiding them through the configuration process and making the necessary changes to personalize their application.

## Customization Workflow

This command helps users configure:
- Site name and branding
- Navigation menu items  
- Theme colors and styling
- Feature flags (notifications, 2FA, admin panel)
- Environment settings

## Instructions

### Step 1: Welcome and Project Assessment

1. **Welcome message**: Explain this will help them customize the starter template
2. **Check current config**: Read `frontend/lib/config.ts` to see current settings
3. **Assess customization level**:
   - If still using "Deno 2 Starter" → needs full customization
   - If already customized → offer specific updates

### Step 2: Gather Customization Requirements

**Ask these questions to understand their project:**

1. **Project Identity**:
   - "What's your app/site name?" (replaces "Deno 2 Starter")
   - "Describe your app in one sentence" (for meta descriptions)
   - "What type of application are you building?" (SaaS, e-commerce, portfolio, etc.)

2. **Navigation Needs**:
   - "What main navigation items do you need?" (Home, About, Shop, Dashboard, etc.)
   - "Do you need any external links?" (GitHub, social media, docs)
   - "Any admin-only or auth-required pages?"

3. **Visual Identity**:
   - "What's your primary brand color?" (show color options: blue, green, purple, red, etc.)
   - "Any specific color preferences?" (professional, playful, modern, etc.)

4. **Feature Requirements**:
   - "Do you need real-time notifications?" (for news, updates, messaging apps)
   - "Do you need two-factor authentication?" (for security-focused apps)
   - "Do you need an admin panel?" (for managing users, content)
   - "Do you need file uploads?" (for user content, documents)

### Step 3: Generate Configuration

Based on their answers, create a customized configuration by updating `frontend/lib/config.ts`:

**Site Configuration:**
```typescript
site: {
  name: "[Their App Name]",
  description: "[Their Description]",
  url: "http://localhost:3000", // Keep localhost for dev
}
```

**Navigation Configuration:**
```typescript
navigation: {
  primary: [
    // Generate based on their needs
    { label: "Home", href: "/", icon: "🏠" },
    { label: "[Their Items]", href: "/[their-routes]", icon: "[appropriate-emoji]" },
  ],
  mobile: [
    // Same as primary unless they specify different mobile navigation
  ],
}
```

**Theme Configuration:**
```typescript
theme: {
  primary: "[Their Brand Color]",
  secondary: "#64748b", // Keep neutral
  accent: "[Complementary Color]", // Choose based on their primary
  background: "#ffffff",
  surface: "#f8fafc",
}
```

**Feature Flags:**
```typescript
features: {
  enableNotifications: [based on their answer],
  enableTwoFactor: [based on their answer],
  enableFileUpload: [based on their answer],
  enableAdminPanel: [based on their answer],
  enableDarkMode: false, // Default off
}
```

### Step 4: Apply Configuration

1. **Update config file**: Write the new configuration to `frontend/lib/config.ts`
2. **Create backup**: Save the original as `config.ts.backup` before making changes
3. **Update page title**: Ensure `_app.tsx` uses the new site name
4. **Test configuration**: Verify the changes work by starting/restarting the dev server

### Step 5: Create Custom Navigation (if needed)

If they need complex navigation or specific menu items:

1. **Add route files**: Create any missing route files they mentioned
2. **Update navigation**: Add appropriate icons and organize logically
3. **Handle external links**: Properly configure external links with target="_blank"

### Step 6: Additional Customizations

Offer these follow-up customizations:

1. **Environment Setup**:
   - "Do you want to configure production URLs?"
   - Help set up `.env` files for different environments

2. **Social Links**:
   - "Any social media or GitHub links to add?"
   - Configure footer or header social links

3. **Logo/Branding**:
   - "Do you have a logo to add?"
   - Guide them on adding logo images and updating the navigation

### Step 7: Documentation and Next Steps

1. **Summarize changes**: List what was customized
2. **Test instructions**: Guide them to test the changes
3. **Next steps**: Point to relevant documentation:
   - `docs/CUSTOMIZATION.md` for advanced options
   - `features/README.md` for adding new features
   - How to run the interactive customization script for future changes

## Application Type Presets

Based on their application type, suggest appropriate configurations:

### E-commerce/Store
```typescript
navigation: [
  { label: "Shop", href: "/shop", icon: "🛍️" },
  { label: "Categories", href: "/categories", icon: "📂" },
  { label: "Cart", href: "/cart", icon: "🛒" },
  { label: "Account", href: "/account", icon: "👤" },
]
theme: { primary: "#059669" } // Green for commerce
features: { enableNotifications: true, enableFileUpload: true }
```

### SaaS/Dashboard
```typescript
navigation: [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Analytics", href: "/analytics", icon: "📈" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Help", href: "/help", icon: "❓" },
]
theme: { primary: "#3b82f6" } // Professional blue
features: { enableNotifications: true, enableTwoFactor: true, enableAdminPanel: true }
```

### Portfolio/Blog
```typescript
navigation: [
  { label: "Work", href: "/work", icon: "💼" },
  { label: "About", href: "/about", icon: "👋" },
  { label: "Blog", href: "/blog", icon: "✍️" },
  { label: "Contact", href: "/contact", icon: "📬" },
]
theme: { primary: "#7c3aed" } // Creative purple
features: { enableNotifications: false, enableTwoFactor: false, enableFileUpload: true }
```

### Business/Corporate
```typescript
navigation: [
  { label: "Services", href: "/services", icon: "🏢" },
  { label: "About", href: "/about", icon: "ℹ️" },
  { label: "Contact", href: "/contact", icon: "📞" },
  { label: "Resources", href: "/resources", icon: "📚" },
]
theme: { primary: "#1f2937" } // Professional dark
features: { enableNotifications: false, enableTwoFactor: false, enableAdminPanel: false }
```

## Color Recommendations

When they choose colors, suggest complementary themes:

- **Blue (#2563eb)**: Professional, trustworthy (SaaS, corporate)
- **Green (#059669)**: Growth, money (e-commerce, finance)
- **Purple (#7c3aed)**: Creative, premium (design, luxury)
- **Red (#dc2626)**: Energy, urgency (news, alerts)
- **Orange (#ea580c)**: Friendly, energetic (social, lifestyle)
- **Teal (#0d9488)**: Calm, balanced (health, wellness)

## Error Handling

- **Backup config** before making changes
- **Validate configuration** before writing
- **Check for syntax errors** in generated config
- **Provide rollback instructions** if something goes wrong
- **Test dev server restart** to ensure changes work

## Success Indicators

The customization is successful when:
- ✅ Site name appears in navigation and page title
- ✅ Navigation items show correctly on desktop and mobile
- ✅ Theme colors are applied (check with dev tools)
- ✅ Feature flags work as expected
- ✅ Dev server restarts without errors
- ✅ User understands how to make future changes

## Follow-up Recommendations

After basic customization:
1. **Add real content** to replace placeholder text
2. **Set up deployment** configuration
3. **Add your first feature** using `/new-feature`
4. **Configure authentication** if needed
5. **Set up monitoring and analytics**