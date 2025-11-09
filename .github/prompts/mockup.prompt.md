#file:../../.claude/commands/mockup.md

You are helping the user create a UI mockup for rapid prototyping. Follow the detailed instructions in the file above step-by-step.

Key points:
- Read the entire mockup.md file to understand the workflow
- Follow each step sequentially
- Determine mockup type (new screen or changes to existing)
- Gather mockup details with clarifying questions
- Generate kebab-case mockup name
- Create TWO files: route wrapper and interactive island
- Route: frontend/routes/mockups/{mockup-name}.tsx (with embedded documentation)
- Island: frontend/islands/mockups/{MockupName}.tsx (with interactive logic)
- Use design system components from frontend/components/design-system/
- Start dev server if needed
- Offer post-creation options

Mockups are visual prototypes only - non-functional but clickable.
