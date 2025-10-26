---
description: Design API contracts and data models
---

Launch the api-designer-agent to create detailed API specifications.

Prerequisites:
- `docs/requirements.md` should exist
- `docs/architecture.md` should exist

The agent will create:
- `docs/api-spec.md` - Complete API documentation
- `docs/data-models.md` - TypeScript interfaces and validation rules
- Optionally `docs/openapi.yaml` - OpenAPI specification

This command is useful for:
- Defining the contract between frontend and backend
- Planning API endpoints before implementation
- Ensuring frontend and backend teams are aligned
- Generating API documentation

After completion, consider running:
- `/design-database` - Design database schema
- `/write-tests` - Write tests for the API (TDD)
