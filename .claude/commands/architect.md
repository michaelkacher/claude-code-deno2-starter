---
description: Design system architecture and make technology decisions
---

Launch the architect-agent to design the system architecture and document key technical decisions.

Prerequisites:
- `docs/requirements.md` should exist (run `/requirements` first if needed)

The agent will create:
- `docs/architecture.md` - System architecture overview
- `docs/adr/` - Architecture Decision Records for key decisions

This command is useful for:
- Starting a new project (after requirements)
- Making major architectural changes
- Evaluating technology choices
- Documenting architectural decisions

After completion, consider running:
- `/design-api` - Design API contracts
- `/design-database` - Design database schema (after API design)
