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
- Entity-Relationship Diagrams (text-based)
- Table definitions with columns, types, and constraints
- Index strategy and performance considerations
- Migration file structure and guidance
- Security and testing strategies

This command is useful for:
- Designing database schema for new applications
- Planning data models and relationships
- Defining constraints and data integrity rules
- Creating migration strategy
- Optimizing database performance before implementation

After completion, consider running:
- `/write-tests` - Write database integration tests
- `/implement-backend` - Implement database access layer
