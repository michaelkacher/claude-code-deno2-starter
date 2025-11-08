# Design System

A comprehensive component library for rapid mockup and application development. All components are built with Preact and styled with Tailwind CSS.

## Overview

This design system provides a complete set of pre-built, customizable UI components that follow consistent design patterns. Use these components to quickly prototype ideas, create mockups, and build production-ready applications.

## Getting Started

Import components from the design system:

```tsx
import {
  Button,
  Card,
  Input,
  Badge,
  Avatar,
  Modal,
  PageLayout,
} from '../components/design-system/index.ts';
```

## Components

### Layout Components

#### PageLayout
Main page container with consistent styling and responsive behavior.

```tsx
<PageLayout maxWidth="xl" centered>
  {/* Your content */}
</PageLayout>
```

**Props:**
- `maxWidth`: `'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'` - Maximum width constraint
- `centered`: `boolean` - Center content horizontally
- `className`: `string` - Additional CSS classes

#### PageHeader
Page title section with optional back button and action.

```tsx
<PageHeader
  title="Page Title"
  subtitle="Optional description"
  backButton
  onBack={() => console.log('Back clicked')}
  action={<Button>Action</Button>}
/>
```

#### Grid
Responsive grid layout.

```tsx
<Grid cols={3} gap={4}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

**Props:**
- `cols`: `1 | 2 | 3 | 4 | 6` - Number of columns (responsive)
- `gap`: `number` - Gap between items

#### Stack
Vertical or horizontal stacking layout.

```tsx
<Stack spacing={4} direction="vertical">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

#### Divider
Visual separator line.

```tsx
<Divider orientation="horizontal" />
```

---

### Card Components

Versatile containers for content grouping.

```tsx
<Card variant="elevated" padding="lg">
  <CardHeader>
    <h2>Card Title</h2>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Variants:**
- `default` - Standard card with border
- `elevated` - Card with shadow
- `outlined` - Border only, no background
- `flat` - Minimal styling
- `gradient` - Colorful gradient background

**Props:**
- `variant`: Card style variant
- `padding`: `'none' | 'sm' | 'md' | 'lg' | 'xl'`
- `hover`: `boolean` - Enable hover lift effect
- `onClick`: Function - Make card clickable

---

### Button Component

Comprehensive button with multiple variants and states.

```tsx
<Button
  variant="primary"
  size="md"
  loading={false}
  disabled={false}
  leftIcon={<Icon />}
  onClick={() => console.log('Clicked')}
>
  Click Me
</Button>
```

**Variants:**
- `primary` - Main action button (gradient blue)
- `secondary` - Secondary actions (gray)
- `success` - Positive actions (green)
- `danger` - Destructive actions (red)
- `warning` - Warning actions (orange)
- `ghost` - Transparent background
- `outline` - Bordered, transparent
- `link` - Text-only link style

**Sizes:**
- `sm` - Small (compact)
- `md` - Medium (default)
- `lg` - Large
- `xl` - Extra large

**Props:**
- `fullWidth`: `boolean` - Expand to container width
- `loading`: `boolean` - Show loading spinner
- `disabled`: `boolean` - Disable interaction
- `leftIcon`/`rightIcon`: JSX - Add icons

---

### Form Components

#### Input
Text input with validation states.

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter email..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  helperText="We'll never share your email"
  errorText="Invalid email format"
  leftIcon={<SearchIcon />}
  fullWidth
/>
```

**Variants:**
- `default` - Standard input
- `error` - Error state (red)
- `success` - Success state (green)

**Sizes:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

#### Select
Dropdown selection.

```tsx
<Select
  label="Choose option"
  placeholder="Select..."
  value={selected}
  onChange={(e) => setSelected(e.target.value)}
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]}
  fullWidth
/>
```

---

### Badge Component

Small status indicators and labels.

```tsx
<Badge variant="success" dot pill>
  Active
</Badge>
```

**Variants:**
- `primary` - Blue
- `secondary` - Gray
- `success` - Green
- `danger` - Red
- `warning` - Orange
- `info` - Purple

**Props:**
- `size`: `'sm' | 'md' | 'lg'`
- `pill`: `boolean` - Fully rounded (default: true)
- `dot`: `boolean` - Show status dot

---

### Avatar Component

User profile images with status indicators.

```tsx
<Avatar
  name="John Doe"
  src="/path/to/image.jpg"
  size="md"
  status="online"
/>
```

**Sizes:**
- `xs`, `sm`, `md`, `lg`, `xl`, `2xl`

**Status:**
- `online` - Green dot
- `offline` - Gray dot
- `away` - Yellow dot
- `busy` - Red dot

#### AvatarGroup
Stacked avatar display.

```tsx
<AvatarGroup
  avatars={[
    { name: 'User 1' },
    { name: 'User 2' },
    { name: 'User 3' },
  ]}
  max={3}
  size="md"
/>
```

---

### Modal Component

Centered dialog overlay.

```tsx
import { useSignal } from '@preact/signals';

const isOpen = useSignal(false);

<Modal
  isOpen={isOpen.value}
  onClose={() => isOpen.value = false}
  title="Modal Title"
  size="md"
  showClose
>
  <p>Modal content</p>
  <Button onClick={() => isOpen.value = false}>Close</Button>
</Modal>
```

**Sizes:**
- `sm` - Small modal
- `md` - Medium (default)
- `lg` - Large
- `xl` - Extra large
- `full` - Full width

---

### Panel Component

Side sliding panel/drawer.

```tsx
import { useSignal } from '@preact/signals';

const isOpen = useSignal(false);

<Panel
  isOpen={isOpen.value}
  onClose={() => isOpen.value = false}
  position="right"
  size="md"
  title="Panel Title"
  showOverlay
>
  <p>Panel content</p>
</Panel>
```

**Props:**
- `position`: `'left' | 'right'`
- `size`: `'sm' | 'md' | 'lg' | 'xl' | 'full'`
- `showOverlay`: `boolean` - Show backdrop

---

### Progress Components

#### ProgressBar
Linear progress indicator.

```tsx
<ProgressBar
  value={65}
  max={100}
  variant="primary"
  size="md"
  label="Upload Progress"
  showLabel
/>
```

**Variants:**
- `primary` - Blue
- `success` - Green
- `warning` - Orange
- `danger` - Red

#### Spinner
Loading spinner animation.

```tsx
<Spinner size="md" variant="primary" />
```

**Sizes:**
- `sm`, `md`, `lg`, `xl`

**Variants:**
- `primary` - Blue
- `white` - White (for dark backgrounds)

#### Steps
Multi-step progress indicator.

```tsx
<Steps
  steps={[
    { label: 'Step 1', description: 'First step' },
    { label: 'Step 2', description: 'Second step' },
    { label: 'Step 3', description: 'Final step' },
  ]}
  currentStep={1}
/>
```

---

## Design Tokens

### Colors
- **Primary**: Blue/Purple gradient (`from-blue-500 to-purple-600`)
- **Success**: Green (`green-500`)
- **Warning**: Orange (`orange-500`)
- **Danger**: Red (`red-500`)
- **Gray Scale**: `gray-50` through `gray-900`

### Spacing
Consistent spacing scale: 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24

### Border Radius
- Small: `rounded-lg` (8px)
- Medium: `rounded-xl` (12px)
- Large: `rounded-2xl` (16px)
- Full: `rounded-full` (9999px)

### Shadows
- Small: `shadow-sm`
- Medium: `shadow-md`
- Large: `shadow-lg`
- Extra Large: `shadow-xl`
- 2X Large: `shadow-2xl`

### Typography
- **Headings**: Bold, gray-900
  - H1: `text-4xl` (36px)
  - H2: `text-3xl` (30px)
  - H3: `text-2xl` (24px)
- **Body**: Regular, gray-700
  - Large: `text-lg` (18px)
  - Medium: `text-base` (16px)
  - Small: `text-sm` (14px)

---

## Best Practices

### Responsive Design
All components are mobile-first and responsive. Use Tailwind's responsive prefixes:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

### Accessibility
- All interactive elements have proper focus states
- Modals and panels trap focus
- Buttons have aria-labels where needed
- Color contrast meets WCAG AA standards

### Performance
- Components use Preact signals for reactive state
- Minimal re-renders with proper memoization
- Lazy loading for heavy components (modals, panels)

---

## Examples

### Quick Mockup
```tsx
import {
  PageLayout,
  PageHeader,
  Card,
  CardBody,
  Button,
  Grid,
} from '../components/design-system/index.ts';

export default function QuickMockup() {
  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back!"
        action={<Button>New Item</Button>}
      />

      <Grid cols={3} gap={6}>
        <Card variant="elevated">
          <CardBody>
            <h3 class="font-bold text-xl mb-2">Metric 1</h3>
            <p class="text-3xl font-bold text-blue-600">1,234</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <h3 class="font-bold text-xl mb-2">Metric 2</h3>
            <p class="text-3xl font-bold text-green-600">5,678</p>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody>
            <h3 class="font-bold text-xl mb-2">Metric 3</h3>
            <p class="text-3xl font-bold text-purple-600">9,012</p>
          </CardBody>
        </Card>
      </Grid>
    </PageLayout>
  );
}
```

---

## Live Demo

Visit `/design-system` to see all components in action with interactive examples.

---

## Contributing

When adding new components:
1. Follow existing patterns and naming conventions
2. Use TypeScript for props typing
3. Support responsive design
4. Include hover and focus states
5. Add to showcase page
6. Update this README
