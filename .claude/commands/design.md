---
description: Update design system styling, colors, and components
---

You will help the user update the application's design system, including colors, typography, spacing, and component styling.

## Purpose

The design command provides a structured way to customize the app's visual design:
- ✅ Update design tokens (colors, typography, spacing)
- ✅ Customize component variants and styles
- ✅ Maintain consistency across the application
- ✅ Auto-update design system documentation and showcase

## When to Use

- Rebranding or changing color scheme
- Adjusting typography or spacing scale
- Customizing component styles
- Creating new component variants
- Updating the design system showcase page

## Workflow

### Step 1: Determine Design Update Type

Ask the user what they want to update:

```
What would you like to update in the design system?

a) Design tokens (colors, typography, spacing, shadows)
b) Component styling (buttons, cards, inputs, etc.)
c) Brand identity (logo, color scheme, overall feel)
d) Add new component variant
e) Update design showcase page

Please choose an option or describe what you'd like to change:
```

### Step 2: Gather Design Requirements

Based on their choice, ask specific questions:

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
   Current: "Deno 2 Starter"
   
2. Site description: (short tagline for your app)
   Current: "A modern full-stack application starter with Deno 2 and Fresh"

3. What's the overall vibe? (professional, playful, minimal, bold, etc.)

4. Primary brand color? (hex code or name)
   Current: #2563eb (blue-600)

5. Secondary/accent colors? (optional)
   Current: #64748b (slate-500), #7c3aed (violet-600)

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

### Step 3: Confirm Design Changes

Summarize the proposed changes:

```
I'll update the design system with these changes:

[Summarize changes clearly]

This will update:
- Site configuration in frontend/lib/config.ts (if brand identity changes)
- Design system components in frontend/components/design-system/
- Design tokens documentation
- Design showcase page at /design-system
- Design system README

Continue? (yes/no)
```

### Step 4: Launch Design Agent

Launch the **design-agent** to implement the changes:

```
Launching design agent to update the design system...

The agent will:
1. Update site configuration (if brand identity changes)
2. Update design tokens (if applicable)
3. Modify component styles
4. Update design system README
5. Update showcase page with new examples
6. Ensure consistency across all components
```

Pass to the agent:
- Design update type (tokens, components, brand, etc.)
- Specific changes requested
- Affected components/tokens
- Brand guidelines (if provided)

### Step 5: Preview Changes

After the agent completes:

```
✅ Design system updated successfully!

Changes made:
[List specific files updated]

To preview the changes:
1. Start dev server: deno task dev
2. Visit: http://localhost:3000/design-system
3. Check the updated showcase page

The design system README has been updated with the new styles.
```

### Step 6: Review and Iterate

Offer next steps:

```
What would you like to do next?

a) Make additional design changes
b) Apply these styles to existing pages
c) Create a new mockup with the new design
d) Revert changes (undo)
e) Done

Choose an option:
```

**Handle user choices:**

**Option a) Additional changes:**
Restart from Step 1

**Option b) Apply to existing pages:**
```
Which pages should use the updated design?
- List existing routes/pages
- I'll update them to use the new design tokens and components
```

**Option c) Create mockup:**
```
Let's create a mockup to showcase the new design.
Run /mockup to create a visual prototype.
```

**Option d) Revert changes:**
```
Are you sure you want to revert the design changes? (yes/no)
```

If yes, use git to revert:
```bash
git checkout frontend/components/design-system/
git checkout frontend/routes/design-system.tsx
```

**Option e) Done:**
```
Great! Your design system has been updated.

Updated files:
- frontend/components/design-system/ (components)
- frontend/routes/design-system.tsx (showcase)

View the showcase: http://localhost:3000/design-system
```

## Design Tokens File Structure

The design system uses Tailwind CSS classes. Design tokens are defined in:

1. **Component files**: Direct Tailwind classes in TSX files
2. **Design system README**: Documentation of design tokens
3. **Showcase page**: Live examples of all components

**Note:** This template uses Tailwind CSS utility classes rather than CSS variables. Design tokens are applied through consistent Tailwind class patterns.

## Best Practices

### Design Token Updates
- Maintain consistent color scale (50-900)
- Keep spacing scale exponential (4px base)
- Test color contrast for accessibility (WCAG AA)
- Update all variants consistently

### Component Updates
- Follow existing component patterns
- Maintain responsive behavior
- Test all variants (hover, focus, disabled)
- Update showcase examples

### Brand Identity
- Create cohesive color palette (primary + 4-5 supporting)
- Choose legible typography pairings
- Balance boldness with usability
- Consider dark mode implications

### Testing Changes
- Check responsive behavior (mobile, tablet, desktop)
- Test interactive states (hover, focus, active, disabled)
- Verify accessibility (keyboard navigation, screen readers)
- Preview in different browsers

## Token Efficiency

This command is optimized for:
- Focused design updates without touching business logic
- Reusable design patterns across components
- Clear documentation of design decisions
- Quick iteration on visual design

**Estimated token usage:**
- Design token updates: ~3-5K tokens
- Component styling: ~4-6K tokens
- Brand identity overhaul: ~8-12K tokens
- New variant addition: ~2-3K tokens

## Integration with Other Commands

- **After /design**: Use `/mockup` to create examples with new design
- **After /design**: Run `/new-feature` to build features with updated styles
- **Before /design**: Use `/mockup` to experiment, then `/design` to make permanent

## Notes

- Changes are applied to design system components
- Existing feature pages may need manual updates
- Design tokens affect all components automatically
- Showcase page is updated to reflect changes
- Git-trackable changes for easy rollback
