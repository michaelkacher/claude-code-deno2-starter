# Design System Styling Guide

## Overview

The design system has been enhanced with modern, clean, and highly responsive styling. All components now feature:

- **Glassmorphism effects** with backdrop blur
- **Smooth micro-interactions** with transform animations
- **Rich gradients** for depth and visual interest
- **Elevated shadows** with color-matched glows
- **Professional typography** hierarchy
- **Responsive design** for all screen sizes

## Quick Start

1. **Start the development server:**
   ```bash
   deno task dev
   ```

2. **Visit the showcase:**
   Open `http://localhost:3000/design-system` in your browser

3. **View the volleyball mockup:**
   Open `http://localhost:3000/mockups/volleyball-workout`

## Styling Features

### Visual Effects

#### Glassmorphism
- Semi-transparent backgrounds (`bg-white/90`)
- Backdrop blur for depth (`backdrop-blur-sm`)
- Subtle borders with transparency

#### Gradients
- Triple-color gradients for richness
- `from-blue-500 via-blue-600 to-blue-700`
- Gradient shadows on hover

#### Shadows
- Layered shadow system
- Color-matched glows (`shadow-blue-500/50`)
- Smooth transitions between states

#### Animations
All components use CSS animations defined in route files:
- `fadeIn` - Opacity transitions
- `scaleIn` - Scale with fade for modals
- `slideUp` - Upward content reveal
- `shimmer` - Progress bar shine effect

### Component Styling

#### Buttons
```tsx
<Button variant="primary" size="md">
  Click Me
</Button>
```
- 8 variants with unique styles
- Hover: lift up + scale
- Active: press down effect
- Gradient backgrounds with glow

#### Cards
```tsx
<Card variant="elevated" hover padding="lg">
  Content
</Card>
```
- Glassmorphic backgrounds
- Hover scale and lift
- Smooth shadow transitions

#### Inputs
```tsx
<Input
  label="Email"
  placeholder="Enter email..."
  fullWidth
/>
```
- Clean borders with hover states
- Focus rings with transparency
- Bold labels for hierarchy

#### Badges
```tsx
<Badge variant="success" dot>
  Active
</Badge>
```
- Translucent backgrounds
- Pulse animation on dots
- Hover state changes

### Responsive Breakpoints

```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

All components automatically adjust:
- Grid columns collapse on mobile
- Padding reduces on small screens
- Touch targets remain accessible (44px minimum)

## Tailwind Configuration

The `tailwind.config.ts` has been extended with:

```typescript
{
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
}
```

## Verification Checklist

###  Styling Configuration (FIXED)

The styling system has been fully configured with three critical fixes:

1. **✅ Tailwind Directives Added** (`frontend/static/styles.css`):
   - Added `@tailwind base; @tailwind components; @tailwind utilities;`
   - Added custom animation keyframes
   - This allows Tailwind to generate utility classes

2. **✅ Fresh Tailwind Plugin Enabled** (`frontend/fresh.config.ts`):
   - Added `tailwind()` plugin
   - This integrates Tailwind compilation into Fresh's build process

3. **✅ TailwindCSS Added to Import Map** (`frontend/deno.json`):
   - Added `tailwindcss` npm package to imports
   - This resolves the Fresh plugin's dependency requirements

### If styling still isn't appearing:

1. **Hard refresh browser:**
   - `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - This clears cached CSS

2. **Check server is running:**
   - Fresh should show "🍋 Fresh ready" at `http://localhost:3000/`
   - Look for compilation messages in console

3. **Check for console errors:**
   - Open browser DevTools (F12)
   - Look for CSS or JavaScript errors

4. **Verify imports:**
   ```tsx
   import {
     Button,
     Card,
     Input,
     // ... other components
   } from '../components/design-system/index.ts';
   ```

5. **Check Fresh manifest:**
   - File: `frontend/fresh.gen.ts`
   - Should include `design-system.tsx` route
   - Should include `DesignSystemShowcase.tsx` island

## Component Usage Examples

### Quick Dashboard Mockup

```tsx
import {
  PageLayout,
  PageHeader,
  Card,
  CardBody,
  Button,
  Grid,
  Badge,
} from '../components/design-system/index.ts';

export default function Dashboard() {
  return (
    <PageLayout maxWidth="xl">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back!"
        action={<Button>New Item</Button>}
      />

      <Grid cols={3} gap={6}>
        <Card variant="elevated" hover>
          <CardBody>
            <Badge variant="success">Active</Badge>
            <h3 class="text-2xl font-bold mt-4">1,234</h3>
            <p class="text-gray-600">Total Users</p>
          </CardBody>
        </Card>

        <Card variant="elevated" hover>
          <CardBody>
            <Badge variant="primary">In Progress</Badge>
            <h3 class="text-2xl font-bold mt-4">567</h3>
            <p class="text-gray-600">Active Projects</p>
          </CardBody>
        </Card>

        <Card variant="gradient">
          <CardBody>
            <h3 class="text-2xl font-bold">Premium</h3>
            <p class="mt-2">Upgrade now</p>
            <Button variant="secondary" className="mt-4">
              Upgrade
            </Button>
          </CardBody>
        </Card>
      </Grid>
    </PageLayout>
  );
}
```

### Form Mockup

```tsx
import {
  PageLayout,
  Card,
  CardHeader,
  CardBody,
  Input,
  Select,
  Button,
  Stack,
} from '../components/design-system/index.ts';

export default function Form() {
  return (
    <PageLayout maxWidth="md">
      <Card variant="elevated">
        <CardHeader>
          <h2 class="text-2xl font-bold">Sign Up</h2>
        </CardHeader>
        <CardBody>
          <Stack spacing={4}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              fullWidth
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              fullWidth
            />
            <Select
              label="Country"
              placeholder="Select country..."
              options={[
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
              ]}
              fullWidth
            />
            <Button fullWidth>Create Account</Button>
          </Stack>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
```

## Design Tokens

### Colors
```css
Blue: #3b82f6 → #2563eb → #1d4ed8
Green: #10b981 → #059669 → #047857
Red: #ef4444 → #dc2626 → #b91c1c
Orange: #f97316 → #ea580c → #c2410c
Purple: #a855f7 → #9333ea → #7e22ce
```

### Spacing Scale
```css
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
6: 1.5rem (24px)
8: 2rem (32px)
```

### Border Radius
```css
lg: 0.5rem (8px)
xl: 0.75rem (12px)
2xl: 1rem (16px)
full: 9999px
```

### Typography
```css
Headings: font-bold
Labels: font-bold
Body: font-medium
Badges: font-bold
Buttons: font-semibold
```

## Performance

All styling features are optimized for performance:

- **CSS-only animations** (no JavaScript overhead)
- **Hardware-accelerated transforms** (GPU rendering)
- **Efficient transitions** with `ease-out` timing
- **Minimal re-paints** with proper layering

## Browser Support

The design system works in all modern browsers:

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 12.2+ for backdrop-filter)
- Older browsers: Graceful degradation

## Troubleshooting

### Styles not loading?

1. **Check file paths in imports**
2. **Verify Tailwind config includes frontend folder**
3. **Restart dev server**: `Ctrl+C` then `deno task dev`
4. **Clear browser cache**

### Components look different?

1. **Check component props match documentation**
2. **Verify className prop isn't overriding styles**
3. **Look for conflicting global CSS**

### Animations not working?

1. **Check route file includes animation CSS**
2. **Verify Tailwind config has animation definitions**
3. **Browser may not support backdrop-filter**

## Next Steps

1. **Explore the showcase**: `/design-system`
2. **Build a mockup**: Use components to create UI
3. **Customize**: Override with className prop
4. **Extend**: Add new variants or components
5. **Convert**: Turn mockups into real features

## Support

- **Documentation**: `frontend/components/design-system/README.md`
- **Examples**: Visit `/design-system` route
- **Source**: `frontend/components/design-system/`
