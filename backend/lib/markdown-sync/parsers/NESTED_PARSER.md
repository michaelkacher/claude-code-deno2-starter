# Generic Nested Markdown Parser

A configurable parser for handling documents with nested collections (e.g., workout categories with exercises, blog posts with comments, products with reviews, etc.).

## Overview

The nested parser eliminates the need to write custom parser code for each model with nested data. Instead, you configure it in `sync-config.json`.

## When to Use

Use the nested parser when your markdown documents have:
- **Frontmatter** with top-level fields
- **Nested collections** in the markdown body (identified by headings)
- **Structured properties** for each nested item (using markdown lists)

## Configuration

### Basic Structure

```json
{
  "models": {
    "your-model-name": {
      "kvPrefix": "your_kv_prefix",
      "parser": "nested",
      "parserConfig": {
        "nestedField": "items",
        "nestedHeadingLevel": 3,
        "nestedFields": {
          "field1": "string",
          "field2": "number",
          "field3": "boolean"
        },
        "generateIds": true,
        "sortBy": "order",
        "nameField": "name"
      },
      "validator": "YourZodSchema",
      "autoManageTimestamps": true
    }
  }
}
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `nestedField` | string | Yes | Name of the array field that will contain nested items (e.g., "exercises", "comments", "items") |
| `nestedHeadingLevel` | number | Yes | Markdown heading level for nested items (2 = ##, 3 = ###, etc.) |
| `nestedFields` | object | Yes | Field definitions with types: "string", "number", or "boolean" |
| `generateIds` | boolean | No | Generate unique IDs for nested items using nanoid (default: false) |
| `sortBy` | string | No | Field name to sort nested items by |
| `nameField` | string | No | Field name for the heading text (default: "name") |

## Examples

### Example 1: Workout Categories (Current Use Case)

**Markdown File:** `data/workout-categories/vertical-jump.md`

```markdown
---
id: vertical-jump
name: Vertical Jump Training
focusArea: Lower Body Power
keyObjective: Increase explosive jumping ability
---

### Box Jumps
- **Sets**: 4
- **Repetitions**: 8-10
- **Difficulty**: medium
- **Order**: 1
- **Description**: Explosive jumps onto a box or platform

### Depth Jumps
- **Sets**: 3
- **Repetitions**: 6-8
- **Difficulty**: hard
- **Order**: 2
- **Description**: Drop from height and immediately jump upward
```

**Configuration:**

```json
{
  "workout-categories": {
    "kvPrefix": "workout_category",
    "parser": "nested",
    "parserConfig": {
      "nestedField": "exercises",
      "nestedHeadingLevel": 3,
      "nestedFields": {
        "sets": "number",
        "repetitions": "string",
        "difficulty": "string",
        "order": "number",
        "description": "string"
      },
      "generateIds": true,
      "sortBy": "order"
    }
  }
}
```

**Result in Database:**

```json
{
  "id": "vertical-jump",
  "name": "Vertical Jump Training",
  "focusArea": "Lower Body Power",
  "keyObjective": "Increase explosive jumping ability",
  "exercises": [
    {
      "id": "abc123xyz",
      "name": "Box Jumps",
      "sets": 4,
      "repetitions": "8-10",
      "difficulty": "medium",
      "order": 1,
      "description": "Explosive jumps onto a box or platform"
    },
    {
      "id": "def456uvw",
      "name": "Depth Jumps",
      "sets": 3,
      "repetitions": "6-8",
      "difficulty": "hard",
      "order": 2,
      "description": "Drop from height and immediately jump upward"
    }
  ]
}
```

### Example 2: Blog Posts with Comments

**Markdown File:** `data/blog-posts/my-first-post.md`

```markdown
---
id: my-first-post
title: My First Blog Post
author: John Doe
publishedAt: 2025-01-15
---

This is the main blog content...

## User Comment 1
- **Author**: Jane Smith
- **Posted**: 2025-01-16
- **Rating**: 5
- **Verified**: true
- **Comment**: Great article! Very helpful.

## User Comment 2
- **Author**: Bob Johnson
- **Posted**: 2025-01-17
- **Rating**: 4
- **Verified**: false
- **Comment**: Thanks for sharing.
```

**Configuration:**

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
        "posted": "string",
        "rating": "number",
        "verified": "boolean",
        "comment": "string"
      },
      "generateIds": true,
      "nameField": "title"
    }
  }
}
```

### Example 3: Products with Features

**Markdown File:** `data/products/laptop-x1.md`

```markdown
---
id: laptop-x1
name: Laptop X1 Pro
price: 1299.99
category: Electronics
inStock: true
---

Product description here...

### High Performance
- **Type**: processor
- **Value**: Intel i7 12th Gen
- **Priority**: 1
- **Highlighted**: true

### Long Battery Life
- **Type**: battery
- **Value**: Up to 12 hours
- **Priority**: 2
- **Highlighted**: true

### Lightweight Design
- **Type**: design
- **Value**: Only 2.5 lbs
- **Priority**: 3
- **Highlighted**: false
```

**Configuration:**

```json
{
  "products": {
    "kvPrefix": "product",
    "parser": "nested",
    "parserConfig": {
      "nestedField": "features",
      "nestedHeadingLevel": 3,
      "nestedFields": {
        "type": "string",
        "value": "string",
        "priority": "number",
        "highlighted": "boolean"
      },
      "generateIds": false,
      "sortBy": "priority",
      "nameField": "feature"
    }
  }
}
```

## Supported Field Formats

The parser recognizes multiple markdown formats:

```markdown
**Field**: Value          ← Preferred format
Field: Value              ← Also supported
- **Field**: Value        ← List format (also supported)
```

## Type Conversion

### String
- Preserves value as-is
- Empty fields return ""

### Number
- Parses as float: `"123.45"` → `123.45`
- Invalid numbers return `0`
- Supports ranges: `"8-10"` → `"8-10"` (kept as string)

### Boolean
- `"true"`, `"yes"`, `"1"` → `true`
- Anything else → `false`
- Case-insensitive

## Limitations

The nested parser works best for:
- **Single nested level** (not deeply nested structures)
- **List-based properties** in markdown
- **Uniform nested items** (all items have same fields)

For more complex parsing needs (multiple nesting levels, varied structures, custom transformations), create a custom parser.

## Advanced: Combining with Custom Logic

You can still create custom parsers for edge cases and use the nested parser for standard cases:

```json
{
  "models": {
    "simple-model": {
      "parser": "nested",
      "parserConfig": { ... }
    },
    "complex-model": {
      "parser": "my-custom-parser"
    }
  }
}
```

Register custom parsers in `backend/lib/markdown-sync/parsers/index.ts`.

## Testing Your Configuration

1. Create a test markdown file
2. Run validation: `deno task validate-data --model=your-model`
3. Preview changes: `deno task sync-data --dry-run --verbose --model=your-model`
4. Check the parsed output in the preview

Or use the **Admin Portal**:
1. Navigate to `/admin/data-sync`
2. Select your model
3. Click "Preview Changes"
4. Inspect the "Data to be synced" section

## Troubleshooting

### Fields not parsing correctly
- Check field names match exactly (case-sensitive)
- Verify heading level matches `nestedHeadingLevel`
- Ensure markdown format uses `**Field**: Value`

### Nested items not sorted
- Verify `sortBy` field exists in all items
- Check field type (numbers sort numerically, strings alphabetically)

### IDs regenerating on each sync
- This is expected with `generateIds: true`
- To preserve IDs, store them in frontmatter and parse manually
- Or accept that IDs will change (useful for pure content sync)

## Summary

The nested parser provides a **configuration-over-code** approach to markdown parsing, making it easy to:
- Add new nested models without writing code
- Maintain consistency across models
- Share configuration across projects
- Quickly prototype and iterate

Perfect for template projects where you want flexibility without complexity!
