---
description: Gather and document project or feature requirements
---

Launch the requirements-agent to help gather and document **project-wide** requirements.

## When to Use This Command

**Use `/requirements` when you need:**
- Comprehensive project documentation for stakeholders
- Planning 10+ features upfront with detailed roadmap
- Multiple user personas and complex use cases
- Integration requirements across many services
- Detailed non-functional requirements (performance, security, scalability)

**Most users should use `/new-feature` instead:**
- `/new-feature` handles feature requirements automatically
- 40-50% more token efficient
- Better for incremental development
- Asks for project context on first run

## What This Creates

The agent will create a `docs/requirements.md` file with:
- Project overview and vision
- Target users and personas
- Core features (MVP) and future roadmap
- Non-functional requirements
- Technical constraints
- Integration requirements
- Success metrics

## After Completion

Consider running:
- `/architect` - Design or adjust system architecture
- `/new-feature` - Build your first feature

**Note:** This is optional. The template ships with a pre-defined architecture (Hono + Fresh + Deno KV). You can start building features immediately with `/new-feature`.
