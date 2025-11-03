# Quick Start: Adding Nested Parser to New Projects

This guide shows how to copy the generic nested parser to a new project and configure it for your data models.

## Step 1: Copy Parser Files

Copy these files to your new project:

```bash
# Core nested parser
backend/lib/markdown-sync/parsers/nested.ts

# Documentation
backend/lib/markdown-sync/parsers/NESTED_PARSER.md
```

## Step 2: Register the Parser

In your `backend/lib/markdown-sync/parsers/index.ts`:

```typescript
import { createNestedParser, type NestedParserConfig } from './nested.ts';

export function getParserRegistry(config?: any): Map<string, MarkdownParser> {
  const registry = new Map<string, MarkdownParser>();
  
  registry.set('default', new DefaultMarkdownParser());
  
  // Register configured parsers
  if (config?.models) {
    for (const [modelName, modelConfig] of Object.entries(config.models)) {
      const mc = modelConfig as any;
      
      if (mc.parser === 'nested' && mc.parserConfig) {
        registry.set(modelName, createNestedParser(mc.parserConfig));
      }
    }
  }
  
  return registry;
}
```

## Step 3: Configure Your Models

In `data/sync-config.json`:

```json
{
  "models": {
    "your-model": {
      "kvPrefix": "your_prefix",
      "parser": "nested",
      "parserConfig": {
        "nestedField": "items",
        "nestedHeadingLevel": 3,
        "nestedFields": {
          "field1": "string",
          "field2": "number"
        },
        "generateIds": true,
        "sortBy": "order"
      },
      "validator": "YourSchema",
      "autoManageTimestamps": true
    }
  }
}
```

## Step 4: Pass Config to Parser Registry

Update all calls to `getParserRegistry()` to pass the config:

```typescript
// Before
const service = new MarkdownSyncService(
  kv,
  config,
  getParserRegistry(),  // ❌ No config
  getValidatorRegistry()
);

// After
const service = new MarkdownSyncService(
  kv,
  config,
  getParserRegistry(config),  // ✅ With config
  getValidatorRegistry()
);
```

Update in these files:
- `backend/routes/admin/data-sync.ts` (4 places)
- `scripts/sync-data.ts`
- `scripts/validate-data.ts`

## Step 5: Create Markdown Files

Create your markdown files in `data/your-model/`:

```markdown
---
id: example
field1: value1
---

### Item 1
- **Field1**: value
- **Field2**: 123

### Item 2
- **Field1**: value
- **Field2**: 456
```

## Step 6: Test

```bash
# Validate
deno task validate-data --model=your-model

# Preview
deno task sync-data --dry-run --verbose --model=your-model

# Sync
deno task sync-data --model=your-model
```

## Common Configurations

### Blog with Comments
```json
{
  "nestedField": "comments",
  "nestedHeadingLevel": 2,
  "nestedFields": {
    "author": "string",
    "content": "string",
    "rating": "number",
    "verified": "boolean"
  },
  "generateIds": true
}
```

### Products with Features
```json
{
  "nestedField": "features",
  "nestedHeadingLevel": 3,
  "nestedFields": {
    "name": "string",
    "value": "string",
    "important": "boolean"
  },
  "sortBy": "order"
}
```

### Recipes with Ingredients
```json
{
  "nestedField": "ingredients",
  "nestedHeadingLevel": 3,
  "nestedFields": {
    "quantity": "string",
    "unit": "string",
    "optional": "boolean"
  }
}
```

## Benefits

✅ **No custom parser code needed**  
✅ **Configure in JSON instead of TypeScript**  
✅ **Reusable across all projects**  
✅ **Self-documenting configuration**  
✅ **Easy to modify without deployment**

## Need Custom Logic?

For complex parsing needs, you can still create custom parsers and use them alongside the nested parser:

```typescript
// backend/lib/markdown-sync/parsers/custom.ts
export class CustomParser implements MarkdownParser {
  async parse(content: string, recordId: string) {
    // Your custom logic
  }
}

// Register it
registry.set('custom', new CustomParser());
```

Then in config:
```json
{
  "simple-model": { "parser": "nested" },
  "complex-model": { "parser": "custom" }
}
```

## That's It!

You now have a flexible, configuration-driven markdown parser that can handle most nested data structures without writing any code. Perfect for template projects! 🎉
