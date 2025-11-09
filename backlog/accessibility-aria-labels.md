# Accessibility: Add ARIA Labels to TSX Components

**Priority**: Medium
**Effort**: Medium (2-3 days)
**Impact**: High (Improves accessibility, SEO, and legal compliance)

## Overview

Implement comprehensive ARIA labels and accessibility attributes across all TSX components to ensure the application meets WCAG 2.1 AA standards and is fully accessible to screen reader users.

## Current State

- ❌ No ARIA labels found in TSX files (0 matches for `aria-|role=|alt=`)
- ❌ Navigation lacks proper landmarks and labels
- ❌ Icon-only buttons missing accessible names
- ❌ Forms missing proper error announcements
- ❌ Modals/dialogs lack proper ARIA attributes
- ✅ Semantic HTML used in most places (good foundation)

## Goals

1. Add ARIA labels to all interactive elements
2. Ensure all forms are properly labeled and validated
3. Implement proper live regions for dynamic content
4. Add screen reader-only text where needed
5. Achieve WCAG 2.1 AA compliance

## Implementation Strategy

### Phase 1: Foundation (Day 1)

#### 1.1 Add Screen Reader Utility Class

**File**: `frontend/static/styles.css` or Tailwind config

```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

#### 1.2 Create Accessible Component Wrappers

**File**: `frontend/components/design-system/IconButton.tsx`

```tsx
import { ComponentType } from 'preact';

interface IconButtonProps {
  icon: ComponentType;
  label: string; // Required for accessibility
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button'
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      class={`icon-button icon-button--${variant}`}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}
```

**File**: `frontend/components/design-system/VisuallyHidden.tsx`

```tsx
import { ComponentChildren } from 'preact';

interface VisuallyHiddenProps {
  children: ComponentChildren;
  focusable?: boolean;
}

export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  return (
    <span class={focusable ? 'sr-only-focusable' : 'sr-only'}>
      {children}
    </span>
  );
}
```

### Phase 2: Navigation & Landmarks (Day 1-2)

#### 2.1 Update Main Navigation

**Files to update**:
- `frontend/components/Header.tsx` (if exists)
- `frontend/components/Navigation.tsx` (if exists)

```tsx
// Main navigation
<nav aria-label="Main navigation">
  <ul>
    <li>
      <a
        href="/dashboard"
        aria-current={currentPath === '/dashboard' ? 'page' : undefined}
      >
        Dashboard
      </a>
    </li>
    <li>
      <a
        href="/users"
        aria-current={currentPath === '/users' ? 'page' : undefined}
      >
        Users
      </a>
    </li>
  </ul>
</nav>

// User account navigation
<nav aria-label="User account">
  <button aria-label="User menu" aria-expanded={isOpen}>
    <UserIcon aria-hidden="true" />
    <span class="sr-only">Open user menu</span>
  </button>
</nav>
```

#### 2.2 Add Landmarks to Layout

**File**: `frontend/routes/_app.tsx` or layout component

```tsx
<div class="app">
  <header role="banner">
    {/* Site header */}
  </header>

  <main id="main-content" role="main">
    <a href="#main-content" class="sr-only-focusable">
      Skip to main content
    </a>
    {children}
  </main>

  <footer role="contentinfo">
    {/* Site footer */}
  </footer>
</div>
```

### Phase 3: Forms & Inputs (Day 2)

#### 3.1 Update Form Components

**File**: `frontend/islands/LoginForm.tsx`

```tsx
export default function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form aria-labelledby="login-heading" noValidate>
      <h1 id="login-heading">Sign In</h1>

      <div class="form-group">
        <label htmlFor="email">
          Email Address
          <abbr title="required" aria-label="required">*</abbr>
        </label>
        <input
          id="email"
          type="email"
          aria-required="true"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert" class="error">
            {errors.email}
          </span>
        )}
      </div>

      <div class="form-group">
        <label htmlFor="password">
          Password
          <abbr title="required" aria-label="required">*</abbr>
        </label>
        <input
          id="password"
          type="password"
          aria-required="true"
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert" class="error">
            {errors.password}
          </span>
        )}
      </div>

      <button type="submit">Sign In</button>
    </form>
  );
}
```

### Phase 4: Interactive Components (Day 2-3)

#### 4.1 Update Admin User Table

**File**: `frontend/islands/AdminUserTable.tsx`

```tsx
// Add to action buttons
<div class="actions">
  <IconButton
    icon={EditIcon}
    label={`Edit user ${user.name}`}
    onClick={() => handleEdit(user.id)}
    variant="secondary"
  />
  <IconButton
    icon={TrashIcon}
    label={`Delete user ${user.name}`}
    onClick={() => handleDelete(user.id)}
    variant="danger"
  />
</div>

// Update table structure
<table>
  <caption class="sr-only">
    User list with name, email, role, and actions
  </caption>
  <thead>
    <tr>
      <th scope="col">
        <button
          aria-label={`Sort by name ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
          aria-sort={sortCol === 'name' ? sortDir : 'none'}
          onClick={() => handleSort('name')}
        >
          Name
        </button>
      </th>
      <th scope="col">Email</th>
      <th scope="col">Role</th>
      <th scope="col">
        <span class="sr-only">Actions</span>
      </th>
    </tr>
  </thead>
</table>
```

#### 4.2 Add Modal/Dialog Accessibility

**File**: `frontend/components/Modal.tsx` (create if doesn't exist)

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ComponentChildren;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      class="modal-overlay"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        class="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            class="modal-close"
          >
            <CloseIcon aria-hidden="true" />
          </button>
        </div>
        {description && (
          <p id="modal-description" class="sr-only">
            {description}
          </p>
        )}
        <div class="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Phase 5: Dynamic Content & Notifications (Day 3)

#### 5.1 Add Live Regions

**File**: `frontend/islands/NotificationBell.tsx` (if exists)

```tsx
<button
  type="button"
  aria-label={`Notifications, ${unreadCount} unread`}
  aria-expanded={isOpen}
  aria-controls="notifications-menu"
>
  <BellIcon aria-hidden="true" />
  {unreadCount > 0 && (
    <>
      <span class="badge" aria-hidden="true">{unreadCount}</span>
      <span class="sr-only">{unreadCount} unread notifications</span>
    </>
  )}
</button>

{isOpen && (
  <div
    id="notifications-menu"
    role="region"
    aria-label="Notifications"
    aria-live="polite"
  >
    {/* notification items */}
  </div>
)}
```

#### 5.2 Loading States

**File**: `frontend/components/LoadingSpinner.tsx`

```tsx
interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Loading" }: LoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite">
      <span class="sr-only">{message}...</span>
      <SpinnerIcon aria-hidden="true" class="animate-spin" />
    </div>
  );
}
```

#### 5.3 Status Messages

**File**: `frontend/components/Toast.tsx` or alert component

```tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function Toast({ message, type }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      class={`toast toast--${type}`}
    >
      <span class="sr-only">{type}: </span>
      {message}
    </div>
  );
}
```

## Files to Update

### High Priority
1. ✅ `frontend/islands/LoginForm.tsx` - Add form labels and error announcements
2. ✅ `frontend/islands/AdminUserTable.tsx` - Add button labels and table accessibility
3. ✅ `frontend/components/Header.tsx` - Add navigation landmarks
4. ✅ `frontend/components/Modal.tsx` - Add dialog ARIA attributes
5. ✅ `frontend/routes/index.tsx` - Add page structure and landmarks

### Medium Priority
6. `frontend/islands/NotificationBell.tsx` - Add live regions
7. `frontend/components/design-system/Button.tsx` - Add type attributes
8. `frontend/components/design-system/Input.tsx` - Add form field accessibility
9. All route files - Add `<title>` and main landmark

### Low Priority
10. Add skip navigation link
11. Add focus management for modals
12. Add keyboard shortcuts documentation

## Testing Checklist

### Manual Testing
- [ ] Test with NVDA screen reader (Windows)
- [ ] Test with VoiceOver (Mac)
- [ ] Test with JAWS (if available)
- [ ] Navigate entire app using only keyboard (Tab, Enter, Escape)
- [ ] Test form validation announcements
- [ ] Test modal focus trapping
- [ ] Test notification announcements

### Automated Testing
- [ ] Install and run axe-core
- [ ] Add accessibility tests to test suite
- [ ] Run Lighthouse accessibility audit (aim for 90+)
- [ ] Validate with WAVE browser extension

### Compliance
- [ ] Verify WCAG 2.1 Level A compliance
- [ ] Verify WCAG 2.1 Level AA compliance
- [ ] Document any AA failures with remediation plan

## Automated Testing Setup

**File**: `tests/e2e/accessibility.test.ts`

```typescript
import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login form should be accessible', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin dashboard should be accessible', async ({ page }) => {
    // Login first
    await page.goto('/login');
    // ... login steps ...

    await page.goto('/admin');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

**Installation**:
```bash
deno add npm:@axe-core/playwright
```

## Success Criteria

- [ ] All interactive elements have accessible names
- [ ] All forms have proper labels and error handling
- [ ] All images have alt text (or aria-hidden if decorative)
- [ ] Keyboard navigation works throughout the app
- [ ] Screen reader announces all important state changes
- [ ] Focus indicators are visible on all interactive elements
- [ ] Color contrast meets WCAG AA standards (4.5:1 for text)
- [ ] Lighthouse accessibility score: 90+
- [ ] axe-core reports 0 violations
- [ ] Manual screen reader testing passes

## Resources

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM ARIA Techniques](https://webaim.org/techniques/aria/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Notes

- Start with high-impact, low-effort items (navigation, buttons)
- Use existing semantic HTML before adding ARIA
- Test with real screen readers, not just automated tools
- Document any deviations from WCAG standards with justification
- Consider adding accessibility documentation to component library

## Dependencies

- None (pure HTML/ARIA implementation)
- Optional: `@axe-core/playwright` for automated testing

## Related Issues

- Improves SEO (search engines use ARIA hints)
- Reduces legal risk (ADA/Section 508 compliance)
- Expands user base (15% of population has some disability)
- Improves UX for keyboard-only users
- Better mobile experience (larger touch targets, better structure)
