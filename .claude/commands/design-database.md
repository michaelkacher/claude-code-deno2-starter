---
description: Design database schema with tables, relationships, and migrations
---

Launch the database-designer-agent to create comprehensive database schema design.

Prerequisites:
- `docs/requirements.md` should exist
- `docs/architecture.md` should exist
- `docs/api-spec.md` or `docs/data-models.md` should exist

The agent will create:
- `docs/database-schema.md` - Complete database schema documentation
- **Deno KV key design** (recommended starting point) or PostgreSQL schema
- Entity-Relationship Diagrams (text-based)
- Key patterns and secondary indexes (Deno KV) or table definitions (PostgreSQL)
- Query patterns and performance considerations
- Testing strategies with in-memory KV or test database
- Migration guidance (if using PostgreSQL)

**Default Approach**: The agent prioritizes Deno KV design unless complex JOINs or aggregations are needed.

This command is useful for:
- Designing Deno KV key structures for new applications
- Planning data models and relationships
- Defining query patterns and secondary indexes
- Creating testing strategy with in-memory KV
- Optimizing for Deno Deploy edge deployment
- Planning PostgreSQL schema when KV limitations are reached

After completion, consider running:
- `/write-tests` - Write database integration tests (with in-memory KV)
- `/implement-backend` - Implement database access layer
