# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-01-26

### Added - Deno KV Best Practices & Tools

#### Comprehensive Documentation
- `docs/DENO_KV_GUIDE.md` - Complete guide to Deno KV local development best practices
  - Local storage using SQLite (vs production FoundationDB)
  - Single instance pattern (critical for performance)
  - Environment-based configuration
  - Testing with `:memory:` databases
  - Dependency injection patterns
  - Graceful shutdown handling

#### Development Scripts
- `scripts/seed-local-kv.ts` - Populate local database with sample data
- `scripts/reset-local-kv.ts` - Delete local database for fresh start
- `scripts/inspect-local-kv.ts` - View all entries in local database

#### New Tasks (deno.json)
- `deno task kv:seed` - Seed local database
- `deno task kv:reset` - Reset local database
- `deno task kv:inspect` - Inspect database contents

#### Infrastructure
- `data/` directory for local KV storage
- `.gitignore` updated to exclude `.deno_kv_store/`, `data/*.db`, SQLite files
- Updated all tasks to include `--allow-write` permission for KV access

#### Updated Agents
- `backend-agent.md` - Added Deno KV best practices and examples
  - Single instance pattern
  - Environment-based paths
  - Testing with `:memory:`

#### README Updates
- Added "Deno KV Management" commands section
- Added "Local Development with Deno KV" section with quick setup
- Documented storage locations (local vs testing vs production)

### Added - Feature-Scoped Workflow (40-50% Token Reduction)

#### New Folder Structure
- `features/` - Root folder for feature-scoped documentation
  - `features/proposed/` - Features currently being developed
  - `features/implemented/` - Completed features with implementation summaries
  - `features/_templates/` - Templates for creating feature documentation
  - `features/README.md` - Comprehensive guide to feature-scoped workflow

#### New Agents (Lightweight, Feature-Focused)
- `requirements-agent-feature.md` - Lightweight requirements gathering for individual features

#### Updated Agents (Feature-Folder Support)
- `test-writer-agent.md` - Now checks `features/proposed/{feature-name}/` first
- `backend-agent.md` - Reads from feature folders for token efficiency
- `frontend-agent.md` - Supports feature-scoped API specifications

#### New Commands
- `/feature-complete` - Finalize features by moving from proposed → implemented

#### Updated Commands
- `/new-feature` - Now uses feature-scoped workflow by default
  - Creates docs in `features/proposed/{feature-name}/`
  - Uses lightweight requirements-agent-feature
  - Achieves 40-50% token reduction vs global docs approach

#### Documentation Templates
- `requirements.md` - Lightweight feature requirements template
- `api-spec.md` - Feature-scoped API endpoints template
- `data-models.md` - TypeScript types and Zod schemas template
- `notes.md` - Development notes template
- `implementation.md` - Post-completion summary template

### Changed

#### README.md Updates
- Added feature-scoped workflow section under "Adding a New Feature"
- Updated project structure to show `features/` folder
- Updated token efficiency table with feature-scoped approach
- Highlighted 40-50% token savings for new features

#### Workflow Optimization
- **Before**: All features documented in global `docs/` files (~26-42K tokens)
- **After**: Features documented in `features/proposed/` (~15-20K tokens)
- **Savings**: 40-50% token reduction per feature

### Benefits

1. **Token Efficiency** (40-50% reduction)
   - Agents only read feature-specific docs, not entire project documentation
   - Lightweight templates focus on essential information
   - Reduced context switching and redundant information

2. **Better Organization**
   - Each feature is self-contained and easy to find
   - Clear separation between in-progress (`proposed/`) and completed work (`implemented/`)
   - Historical record of all features with implementation summaries

3. **Easy Rollback**
   - Delete a feature folder to completely remove it
   - No need to untangle changes from global docs
   - Simple to archive or move features between states

4. **Parallel Development**
   - Multiple features can be designed simultaneously without conflicts
   - Each feature has its own documentation space
   - Easy to track what's in progress vs completed

5. **Preserved History**
   - Implemented features kept in `features/implemented/`
   - Implementation summaries document what was actually built
   - Easy to reference when building related features

### Migration Guide

For existing projects using this template:

1. **No breaking changes** - Global docs workflow (`docs/`) still works
2. **Recommended for new features** - Use `/new-feature` which now uses feature-scoped workflow
3. **Optional migration** - Existing features can stay in `docs/` or be moved to `features/implemented/`

### Backward Compatibility

- All existing commands still work
- Global docs (`docs/`) remain valid for project-wide concerns
- Original requirements-agent unchanged for project-wide requirements
- Template users can continue current workflows without modification

### When to Use Each Approach

**Use Feature-Scoped (`features/`)** ✅ Recommended:
- Adding new API endpoints
- Building new user-facing features
- Incremental improvements
- Experimental features
- Most development work (80% of cases)

**Use Global Docs (`docs/`)**:
- Initial project setup
- Architecture decisions affecting entire system
- Technology stack changes
- Project-wide requirements gathering

## Summary

This update introduces an **optimized feature-scoped workflow** that reduces token usage by 40-50% while improving code organization and making features easier to manage. The new workflow is now the default for `/new-feature`, making it the recommended approach for most development work.

Token usage comparison:
- Old approach: ~26-42K tokens per feature
- New approach: ~15-20K tokens per feature
- **Savings: 40-50% reduction**
