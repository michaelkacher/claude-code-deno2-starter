---
description: Implement frontend components and UI
---

Launch the frontend-agent to build user interface components.

Prerequisites:
- `docs/api-spec.md` - API specification
- Component tests should exist for TDD approach

The agent will:
1. Read the API specification
2. Read existing component tests
3. Implement components to make tests pass
4. Follow architecture patterns from `docs/architecture.md`

This implements:
- React/Vue/Svelte components (based on your stack)
- Custom hooks for API integration
- Pages/routes
- Forms with validation
- State management
- Styling

Focus on:
- Accessibility (WCAG 2.1 AA)
- Responsive design (mobile-first)
- Performance optimization
- User experience

After implementation:
- Run `npm test` to verify component tests pass
- Test accessibility with axe DevTools
- Check responsive design on different screen sizes
