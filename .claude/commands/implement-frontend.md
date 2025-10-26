---
description: Implement frontend components and UI
---

Launch the frontend-agent to build user interface components using Fresh and Preact.

Prerequisites:
- `.docs/api-spec.md` or `docs/api-spec.md` - API specification
- `.docs/architecture.md` or `docs/architecture.md` - Architecture decisions
- Component tests should exist for TDD approach (optional but recommended)

The agent will:
1. Read the API specification
2. Read architecture decisions (frontend framework choice)
3. Read existing component tests (if available)
4. Implement Fresh routes, islands, and components
5. Use Preact Signals for state management
6. Style with Tailwind CSS

This implements:
- Fresh routes (server-side rendered pages in `frontend/routes/`)
- Fresh islands (interactive client components in `frontend/islands/`)
- Reusable server components (`frontend/components/`)
- API integration with backend
- Forms with validation
- State management with Preact Signals
- Tailwind CSS styling

Focus on:
- **Islands Architecture**: Server-render by default, add interactivity selectively
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive Design**: Mobile-first with Tailwind
- **Performance**: Minimal JavaScript shipped to client
- **User Experience**: Fast page loads, smooth interactions

After implementation:
- Run `deno test --allow-all` to verify tests pass
- Test accessibility with axe DevTools
- Check responsive design on different screen sizes
- Verify Fresh builds: `cd frontend && deno task build`
