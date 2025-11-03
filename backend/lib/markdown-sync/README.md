# Markdown Sync System

A generic, convention-based system for synchronizing markdown files to a Deno KV database with built-in admin UI.

## Overview

This system allows you to manage structured data in markdown files and sync them to your production database. Perfect for content that changes frequently or needs to be version-controlled.

**Key Features:**
- ✅ **Convention-based**: `data/{model-name}/{record-id}.md` → automatic discovery
- ✅ **Generic parsers**: Configure nested structures in JSON, no code required
- ✅ **Admin UI**: Browser-based deployment with preview and validation
- ✅ **CLI tools**: Command-line validation and sync for CI/CD
- ✅ **Type-safe**: Zod schema validation
- ✅ **Version control**: Markdown files in Git = audit trail

## Quick Start

### 1. Create Markdown Files

```
data/
  your-model/
    record-1.md
    record-2.md
```

### 2. Configure Models

`data/sync-config.json`:

```json
{
  "models": {
    "your-model": {
      "kvPrefix": "your_kv_prefix",
      "parser": "nested",
      "parserConfig": {
        "nestedField": "items",
        "nestedHeadingLevel": 3,
        "nestedFields": {
          "field1": "string",
          "field2": "number"
        }
      },
      "validator": "YourZodSchema",
      "autoManageTimestamps": true
    }
  }
}
```

### 3. Sync Data

**CLI:**
```bash
deno task sync-data --dry-run --verbose
deno task sync-data
```

**Admin Portal:**
1. Navigate to `/admin/data-sync`
2. Select model
3. Validate → Preview → Deploy

## Architecture

### Components

```
backend/lib/markdown-sync/
├── core.ts                    # Main sync engine
├── parsers/
│   ├── default.ts            # Simple frontmatter + body parser
│   ├── nested.ts             # Configurable nested parser ⭐
│   ├── index.ts              # Parser registry
│   ├── NESTED_PARSER.md      # Full documentation
│   └── QUICK_START_NESTED.md # Quick setup guide
└── validators/
    └── index.ts              # Zod schema registry
```

### Parsers

#### Default Parser
For simple markdown with frontmatter + body:

```markdown
---
id: example
title: Example
---

Body content here...
```

#### Nested Parser (Recommended)
For documents with nested collections. **No code required** - just configure:

```json
{
  "parser": "nested",
  "parserConfig": {
    "nestedField": "exercises",
    "nestedHeadingLevel": 3,
    "nestedFields": {
      "sets": "number",
      "reps": "string"
    }
  }
}
```

See [NESTED_PARSER.md](./parsers/NESTED_PARSER.md) for full documentation.

#### Custom Parsers
For complex parsing logic, create a custom parser:

```typescript
export class MyParser implements MarkdownParser {
  async parse(content: string, recordId: string) {
    // Custom logic
  }
}
```

## Usage

### CLI

```bash
# Validate markdown files
deno task validate-data
deno task validate-data --model=workout-categories

# Sync to database
deno task sync-data --dry-run --verbose
deno task sync-data --model=workout-categories
deno task sync-data --force
```

### Admin Portal

Navigate to `/admin/data-sync` for a browser-based UI:

1. **Validate** - Check for syntax/schema errors
2. **Preview** - See what will change (dry run)
3. **Deploy** - Apply changes to production

Features:
- Visual diff showing creates/updates/deletes
- Full JSON preview of data to be synced
- Deployment history and audit trail
- Error messages with file paths

See [ADMIN_DEPLOYMENT.md](../../../docs/ADMIN_DEPLOYMENT.md) for details.

## Configuration

### Sync Config (`data/sync-config.json`)

```json
{
  "models": {
    "model-name": {
      "kvPrefix": "kv_prefix",           // Deno KV key prefix
      "parser": "nested",                 // Parser type
      "parserConfig": { ... },           // Parser-specific config
      "validator": "ZodSchemaName",      // Zod schema for validation
      "autoManageTimestamps": true,      // Auto-add createdAt/updatedAt
      "softDelete": false                // Mark as deleted vs remove from DB
    }
  }
}
```

### Parser Configuration

See [NESTED_PARSER.md](./parsers/NESTED_PARSER.md) for all options.

## Examples

### Blog Posts with Comments
```json
{
  "blog-posts": {
    "kvPrefix": "blog_post",
    "parser": "nested",
    "parserConfig": {
      "nestedField": "comments",
      "nestedHeadingLevel": 2,
      "nestedFields": {
        "author": "string",
        "content": "string",
        "rating": "number"
      }
    }
  }
}
```

### Products with Features
```json
{
  "products": {
    "kvPrefix": "product",
    "parser": "nested",
    "parserConfig": {
      "nestedField": "features",
      "nestedHeadingLevel": 3,
      "nestedFields": {
        "name": "string",
        "value": "string",
        "highlighted": "boolean"
      },
      "sortBy": "priority"
    }
  }
}
```

## Adding to New Projects

See [QUICK_START_NESTED.md](./parsers/QUICK_START_NESTED.md) for step-by-step instructions.

**TL;DR:**
1. Copy `parsers/nested.ts` to your project
2. Update `parsers/index.ts` to register it
3. Configure models in `sync-config.json`
4. Pass config to `getParserRegistry(config)`

## Development

### Adding a New Model

1. Create markdown files in `data/your-model/`
2. Add model config to `data/sync-config.json`
3. Create Zod schema in `backend/schemas/`
4. Register schema in `backend/lib/markdown-sync/validators/index.ts`
5. Test: `deno task validate-data --model=your-model`

### Testing

```bash
# Run all tests
deno task test

# Test specific model
deno test tests/your-model.test.ts
```

## Production Deployment

### Option 1: Git-Based (Recommended)
1. Edit markdown locally
2. Validate and preview in dev
3. Commit and push to Git
4. Pull on production server
5. Deploy via admin portal

### Option 2: CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
- name: Validate data
  run: deno task validate-data
  
- name: Deploy to production
  run: deno task sync-data --production
```

### Option 3: Admin Portal
Navigate to `/admin/data-sync` and click through:
Validate → Preview → Deploy

## Benefits

### For Developers
- ✅ No custom parser code for most models
- ✅ Configuration over code
- ✅ Type-safe with Zod validation
- ✅ Easy to test and debug

### For Content Editors
- ✅ Edit in markdown (familiar format)
- ✅ Version control with Git
- ✅ Visual diff in pull requests
- ✅ Safe deployment with preview

### For Projects
- ✅ Reusable across projects
- ✅ Minimal code to maintain
- ✅ Self-documenting configuration
- ✅ Quick to set up new models

## Comparison

| Approach | Code | Flexibility | Maintenance |
|----------|------|-------------|-------------|
| **Custom Parser** | 100+ lines | High | High effort |
| **Nested Parser** | 0 lines (config only) | Medium | Low effort |
| **Default Parser** | 0 lines | Low (flat only) | No effort |

## Limitations

- Best for single-level nesting (not deeply nested)
- Assumes markdown format with headings + lists
- For complex parsing, use custom parser

## Documentation

- [NESTED_PARSER.md](./parsers/NESTED_PARSER.md) - Full nested parser docs
- [QUICK_START_NESTED.md](./parsers/QUICK_START_NESTED.md) - Quick setup guide
- [ADMIN_DEPLOYMENT.md](../../../docs/ADMIN_DEPLOYMENT.md) - Admin portal guide

## License

MIT
