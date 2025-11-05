# 🎨 Quick Customization Guide

**Just cloned this starter?** Let's make it yours in 2 minutes!

## Option 1: Claude/Copilot Agent (Recommended)

If you're using Claude or GitHub Copilot, simply ask:

```
@workspace customize starter
```

or 

```
I want to customize this template for my project
```

The AI will guide you through:
- ✅ Site name and branding
- ✅ Navigation menu setup  
- ✅ Theme colors
- ✅ Feature configuration
- ✅ Testing your changes

## Option 2: Interactive Script

Run the customization script:

```bash
deno run --allow-read --allow-write scripts/customize.ts
```

This will prompt you for:
- Your app name
- Navigation items you need
- Brand colors
- Features to enable/disable

## Option 3: Manual Edit

Edit `frontend/lib/config.ts` directly:

```typescript
export const defaultConfig: SiteConfig = {
  site: {
    name: "Your App Name",        // 👈 Change this
    description: "Your app does...", // 👈 And this
  },
  navigation: {
    primary: [
      { label: "Home", href: "/", icon: "🏠" },
      { label: "About", href: "/about", icon: "ℹ️" },
      // 👈 Add your menu items
    ],
  },
  theme: {
    primary: "#2563eb",  // 👈 Your brand color
  },
};
```

## What Gets Customized

- **🏷️ Site Name**: Appears in navigation and page titles
- **🧭 Navigation**: Menu items with icons and organization
- **🎨 Theme**: Colors that cascade through the entire app
- **⚙️ Features**: Enable/disable notifications, admin panel, 2FA, etc.

## Example Results

Your starter can instantly become:

**SaaS Dashboard:**
- Professional blue theme
- Dashboard/Analytics/Settings navigation
- Notifications and admin panel enabled

**E-commerce Store:**
- Green commerce theme  
- Shop/Categories/Cart navigation
- File uploads and notifications enabled

**Portfolio Site:**
- Creative purple theme
- Work/About/Contact navigation
- Minimal feature set, content-focused

## Next Steps

After customizing:
1. **Start development**: `deno task dev`
2. **Add your first feature**: Ask Claude/Copilot to `create a new feature`
3. **Deploy**: Follow deployment docs when ready

## Need Help?

- **Detailed Guide**: [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md)
- **Examples**: See application presets in the customization guide
- **Support**: Use the Claude/Copilot agents for guided assistance

---

**Ready to build something amazing?** Start customizing! 🚀