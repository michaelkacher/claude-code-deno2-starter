---
description: Customize template - initial setup, design system, and visual updates
---

You will help users customize their Deno 2 Starter template through initial configuration, design system updates, and visual personalization.

## Customization Overview

This unified command handles all customization needs:
- **Initial Setup**: Site name, branding, navigation, feature flags (first-time use)
- **Design System**: Colors, typography, components, styling (ongoing updates)
- **Quick Updates**: Individual config or design changes

## Instructions

### Step 1: Determine Customization Type

Ask the user what they want to customize:

```
What would you like to customize?

1. Initial Setup (First-time configuration)
   - Site name and branding
   - Navigation menu
   - Basic theme colors
   - Feature flags (notifications, 2FA, admin panel)
   - Environment setup

2. Design System (Visual updates)
   - Design tokens (colors, typography, spacing, shadows)
   - Component styling and variants
   - Brand identity refinement
   - Design showcase updates

3. Quick Updates
   - Change site name
   - Update specific colors
   - Modify navigation items
   - Toggle feature flags

Choose an option (1-3) or describe what you want to customize:
```

### Step 2A: Initial Setup Workflow

**If user chose Option 1 (Initial Setup):**

1. **Welcome and Project Assessment**

1. **Welcome and Project Assessment**

```
I'll help you set up your Deno 2 Starter template.
This is your first-time setup to configure the basics.

Current configuration:
- Site name: [read from config.ts]
- Navigation: [read from config.ts]
- Theme: [read from config.ts]
```

2. **Gather Initial Setup Requirements**

2. **Gather Initial Setup Requirements**

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

3. **Apply Initial Configuration**

Launch the **customization-agent** to apply changes:

```
Launching customization agent for initial setup...

The agent will:
1. Update site configuration in frontend/lib/config.ts
2. Create/update navigation structure
3. Apply basic theme colors
4. Configure feature flags
5. Test configuration
```

Pass to agent:
- Site name and description
- Navigation structure
- Basic theme colors
- Feature flags
- Application type preset (if applicable)

### Step 2B: Design System Workflow

**If user chose Option 2 (Design System):**

1. **Determine Design Update Type**

```
What would you like to update in the design system?

a) Design tokens (colors, typography, spacing, shadows)
b) Component styling (buttons, cards, inputs, etc.)
c) Brand identity (logo, color scheme, overall feel)
d) Add new component variant
e) Update design showcase page

Please choose an option or describe what you'd like to change:
```

2. **Gather Design Requirements**

**For Design Tokens (Option a):**
```
Which design tokens would you like to update?

1. Colors
   - Primary color (current: Blue/Purple gradient)
   - Success/Warning/Danger colors
   - Gray scale
   - Background colors

2. Typography
   - Font family
   - Font sizes
   - Font weights
   - Line heights

3. Spacing
   - Spacing scale (current: 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24)

4. Shadows and Effects
   - Shadow intensities
   - Border radius scale
   - Animations/transitions

Please describe what you'd like to change:
```

**For Component Styling (Option b):**
```
Which components would you like to update?

- Button (variants: primary, secondary, success, danger, warning, ghost, outline, link)
- Card (variants: default, elevated, outlined, flat, gradient)
- Input (variants: default, error, success)
- Badge (variants: primary, secondary, success, danger, warning, info)
- Modal, Panel, Avatar, Progress, etc.

Describe the changes you want:
- Which component?
- Which variant (if applicable)?
- What styling changes?
```

**For Brand Identity (Option c):**
```
Tell me about your brand identity:

1. Site name: (e.g., "MyApp", "Acme Corp")
   Current: [from config.ts]
   
2. Site description: (short tagline for your app)
   Current: [from config.ts]

3. What's the overall vibe? (professional, playful, minimal, bold, etc.)

4. Primary brand color? (hex code or name)
   Current: [from config.ts]

5. Secondary/accent colors? (optional)
   Current: [from config.ts]

6. Any brand guidelines or references? (website, Figma, etc.)

7. What should change from the current design?

I'll update your site configuration and create a cohesive design system based on your brand.
```

**For New Variant (Option d):**
```
Which component needs a new variant?
- Component name: (e.g., Button, Card, Badge)
- Variant name: (e.g., "gradient", "minimal", "bold")
- Variant purpose: (e.g., "for call-to-action buttons")
- Styling details: (colors, effects, sizing)
```

**For Showcase Update (Option e):**
```
What changes should be made to the design showcase page?
- Add new component examples?
- Update existing examples?
- Improve layout/organization?
- Add interactive demos?
```

3. **Apply Design System Updates**

Launch the **customization-agent** to implement design changes:

```
Launching customization agent for design updates...

The agent will:
1. Update site configuration (if brand identity changes)
2. Update design tokens (if applicable)
3. Modify component styles
4. Update design system README
5. Update showcase page with new examples
6. Ensure consistency across all components
```

Pass to agent:
- Design update type (tokens, components, brand, etc.)
- Specific changes requested
- Affected components/tokens
- Brand guidelines (if provided)

### Step 2C: Quick Updates Workflow

**If user chose Option 3 (Quick Updates):**

```
What would you like to update quickly?

Common quick updates:
- Site name: "Current Name" → "New Name"
- Primary color: #2563eb → [new color]
- Add navigation item: [new page/link]
- Toggle feature: notifications, 2FA, admin panel, uploads

Describe the specific change:
```

Launch **customization-agent** with focused update:
```
Making quick update to [specific item]...
```

### Step 3: Confirm Changes

Summarize the proposed changes before applying:

```
I'll update your configuration with these changes:

[Summarize all changes clearly]

This will update:
- Site configuration: frontend/lib/config.ts
- [Design system components (if design changes)]
- [Design showcase page (if design changes)]

Continue? (yes/no)
```

### Step 4: Preview and Test

After the customization-agent completes:

```
✅ Customization completed successfully!

Changes made:
[List specific files updated]

To preview the changes:
1. Restart dev server (if needed): deno task dev
2. Visit: http://localhost:3000
[3. Check design showcase: http://localhost:3000/design-system (if design changes)]

[Configuration summary]
```

### Step 5: Follow-up Options

Offer next steps:

```
What would you like to do next?

a) Make additional customizations
b) Create a mockup with the new design
c) Add a new feature using /new-feature
d) Review changes (git diff)
e) Revert changes (undo)
f) Done

Choose an option:
```

**Handle user choices:**

**Option a) Additional customizations:**
Return to Step 1

**Option b) Create mockup:**
```
Let's create a mockup to showcase your customization.
Run /mockup to create a visual prototype.
```

**Option c) Add feature:**
```
Ready to add your first feature!
Run /new-feature to start building.
```

**Option d) Review changes:**
```bash
git diff frontend/lib/config.ts
git diff frontend/components/design-system/
```

**Option e) Revert changes:**
```
Are you sure you want to revert all customizations? (yes/no)
```

If yes:
```bash
git checkout frontend/lib/config.ts
git checkout frontend/components/design-system/
git checkout frontend/routes/design-system.tsx
```

**Option f) Done:**
```
Great! Your template is now customized.

Summary of changes:
[List key changes]

Next steps:
- Start building features with /new-feature
- Create UI mockups with /mockup
- Deploy your app (see docs/PRODUCTION_DEPLOYMENT.md)
```

## Application Type Presets

Based on application type, suggest appropriate configurations:

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

## Application Type Presets

Based on application type, suggest appropriate configurations:

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

## Design Token Guidelines

**For design system updates:**

### Color Tokens
- Maintain consistent color scale (50-900)
- Test color contrast for accessibility (WCAG AA minimum)
- Update all variants consistently (hover, focus, active)

### Typography
- Choose legible font pairings
- Maintain consistent scale (12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72)
- Consider mobile readability

### Spacing
- Keep spacing scale exponential (4px base)
- Common scale: 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64

### Component Updates
- Follow existing component patterns
- Maintain responsive behavior
- Test all variants (hover, focus, disabled)
- Update showcase examples

## Error Handling

- **Backup config** before making changes
- **Validate configuration** before writing
- **Check for syntax errors** in generated config
- **Provide rollback instructions** if something goes wrong
- **Test dev server restart** to ensure changes work

## Success Indicators

Customization is successful when:
- ✅ Site name appears in navigation and page title
- ✅ Navigation items show correctly on desktop and mobile
- ✅ Theme colors are applied (check with dev tools)
- ✅ Feature flags work as expected
- ✅ Dev server restarts without errors
- ✅ (Design updates) Showcase page reflects new styling
- ✅ User understands how to make future changes

## Token Efficiency

This unified command is optimized for:
- **Initial setup**: ~4-6K tokens (one-time)
- **Design token updates**: ~3-5K tokens
- **Component styling**: ~4-6K tokens  
- **Brand identity overhaul**: ~8-12K tokens
- **Quick updates**: ~1-2K tokens

Reuses customization-agent for all tasks, avoiding duplicate agent code.

## Integration with Other Commands

- **After /customize**: Use `/mockup` to create examples with your customization
- **After /customize**: Run `/new-feature` to build features with updated branding
- **Before major updates**: Use `/mockup` to experiment, then `/customize` to make permanent

## Notes

- Changes are version-controlled (git-trackable)
- Design tokens affect all components automatically
- Initial setup is typically one-time, design updates are ongoing
- Showcase page updates automatically with design changes
- Easy rollback via git if needed