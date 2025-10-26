# Features Directory

This directory contains **feature-scoped documentation** for a more efficient and organized development workflow.

## Structure

```
features/
├── proposed/           # Features currently being designed
│   └── {feature-name}/
│       ├── requirements.md      # Lightweight feature requirements
│       ├── api-spec.md         # API endpoints for this feature
│       ├── data-models.md      # Data models specific to feature
│       └── notes.md            # Any additional notes
└── implemented/        # Completed and deployed features
    └── {feature-name}/
        ├── requirements.md      # Original requirements
        ├── api-spec.md         # API specification
        ├── implementation.md   # What was actually built
        └── tests-summary.md    # Test coverage summary
```

## Benefits

### 1. **Token Efficiency** (40-50% reduction)
- Agents only read feature-specific docs, not entire project documentation
- Lightweight templates focus on essential information
- Reduces context switching and redundant information

### 2. **Better Organization**
- Each feature is self-contained and easy to find
- Clear separation between in-progress and completed work
- Historical record of all features

### 3. **Easy Rollback**
- Delete a feature folder to completely remove it
- No need to untangle changes from global docs
- Simple to archive or move features

### 4. **Parallel Development**
- Multiple features can be designed simultaneously without conflicts
- Each feature has its own documentation space
- Easy to track what's in progress

## Workflow

### Starting a New Feature

```bash
/new-feature "user authentication"
```

This will:
1. Create `features/proposed/user-authentication/`
2. Run lightweight requirements gathering
3. Design API endpoints (feature-scoped)
4. Write tests
5. Implement backend and frontend

### Completing a Feature

```bash
/feature-complete "user-authentication"
```

This will:
1. Move from `proposed/` to `implemented/`
2. Create `implementation.md` summary
3. Update global `docs/architecture.md` with high-level changes
4. Archive the feature for future reference

### Abandoning a Feature

Simply delete the feature folder:
```bash
rm -rf features/proposed/user-authentication
```

## Template Files

See `features/_templates/` for standard templates to copy when creating features manually.

## Best Practices

1. **Keep features small**: Each feature should be independently implementable
2. **One feature at a time**: Focus on completing one feature before starting another
3. **Move to implemented**: Don't forget to run `/feature-complete` when done
4. **Clean up proposed**: Remove abandoned features to keep the folder clean

## Comparison with Global Docs

| Aspect | Global Docs | Feature-Scoped Docs |
|--------|-------------|---------------------|
| **Token Usage** | 26-42K per feature | 15-20K per feature ⭐ |
| **Organization** | Everything mixed | Separated by feature ⭐ |
| **Rollback** | Difficult | Easy (delete folder) ⭐ |
| **History** | Lost over time | Preserved in implemented/ ⭐ |
| **Parallel Work** | Conflicts | Independent ⭐ |
| **Best For** | Initial architecture | Individual features ⭐ |

## When to Use Global vs Feature Docs

### Use Global Docs (`docs/`)
- Initial project setup
- Architecture decisions affecting entire system
- Technology choices
- Overall project requirements

### Use Feature Docs (`features/`)
- Adding new endpoints/routes
- New user-facing features
- Incremental improvements
- Experimental features

## Migration

Existing global docs in `docs/` remain valid for:
- `docs/architecture.md` - Overall system architecture
- `docs/adr/` - Architecture Decision Records
- Project-wide documentation

New features should use the feature-scoped approach in `features/`.
