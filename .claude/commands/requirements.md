---
description: Set up comprehensive project context for better features and mockups
---

Launch the requirements-agent to set up **project context** that will guide all feature development and mockup creation.

## When to Use This Command

**Use `/requirements` when:**
- First time using this starter template
- Want to create `features/PROJECT_CONTEXT.md` for the `/new-feature` and `/mockup` commands
- Want to document comprehensive project vision, users, goals, and success criteria
- Takes 5-10 minutes but significantly improves feature quality and alignment

**Also triggered automatically by:**
- `/new-feature` - Will prompt to run this if PROJECT_CONTEXT doesn't exist
- You can skip it, but features will be less aligned with your project goals

## What This Creates

The agent will create a `features/PROJECT_CONTEXT.md` file with:
- **Project Vision**: What you're building, why it matters, long-term direction
- **Target Users**: Who will use it, their needs and pain points
- **Core Features**: MVP features and future roadmap (high-level)
- **Success Criteria**: How you'll measure success

## How It's Used

This context is automatically read and used by:
- **`/mockup`** - Creates mockups aligned with your project vision and target users
- **`/new-feature`** - Generates features that serve your specific users and goals
- All agents receive this context to create better, more aligned results

## Time Investment

- **Takes**: 5-10 minutes to answer questions
- **Saves**: Hours of rework and misaligned features
- **Improves**: Feature quality, consistency, and user alignment

## After Completion

Consider running:
- `/mockup` - Create visual mockups aligned with your project vision
- `/new-feature` - Build your first feature with full project context

**Note:** The template ships with a pre-defined architecture (Fresh 1.7.3 + Deno KV). This command focuses on business requirements, not technical architecture.
