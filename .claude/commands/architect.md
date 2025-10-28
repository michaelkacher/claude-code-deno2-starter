---
description: Design system architecture and make technology decisions
---

Launch the architect-agent to **update** the system architecture and document key technical decisions.

## When to Use This Command

**This template ships with a pre-defined architecture** (`docs/architecture.md`):
- Deno 2 + Hono + Fresh + Deno KV + Deno Deploy
- Opinionated by design for fast development

**Most users should NOT run this command** - the default architecture is production-ready.

**Use `/architect` when you need to:**
- Migrate from Deno KV to PostgreSQL (outgrowing KV)
- Split monolith into microservices (scaling)
- Add major infrastructure (Redis, message queues, CDN)
- Change authentication strategy (JWT → OAuth, etc.)
- Make other significant architectural changes
- Document architectural decisions (create ADRs)

**Don't use `/architect` for:**
- Starting a new project (architecture already defined)
- Adding features (use `/new-feature` instead)
- Small changes (just update code directly)
- Customizing the stack (this template is opinionated)

## What This Command Does

The agent will:
1. Read the current `docs/architecture.md`
2. Understand your proposed changes
3. Update the architecture document
4. Create ADRs in `docs/adr/` for major decisions
5. Consider migration paths and trade-offs

## Example Use Cases

**"Migrate from Deno KV to PostgreSQL"**
- Agent evaluates if migration is needed
- Documents migration strategy
- Updates architecture.md
- Creates ADR for database decision

**"Add Redis for caching"**
- Agent evaluates caching needs
- Documents caching strategy
- Updates architecture.md
- Creates ADR for caching approach

**"Split authentication into separate service"**
- Agent evaluates microservice split
- Documents service boundaries
- Updates architecture.md
- Creates ADR for microservices decision

## After Completion

Consider running:
- `/new-feature` - Implement features with new architecture
- `/review` - Review changes for consistency

## Note

The pre-defined architecture is battle-tested and token-optimized. Only change it if you have specific requirements that the default stack cannot meet.
