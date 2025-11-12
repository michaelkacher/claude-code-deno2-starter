# Pattern Library

Reusable code patterns and templates for common UI components and features.

## Available Patterns

### Forms
- `form-basic.tsx` - Simple form with validation
- `form-multi-step.tsx` - Multi-step wizard form
- `form-with-file-upload.tsx` - Form with file upload

### Tables
- `table-basic.tsx` - Simple data table
- `table-sortable.tsx` - Sortable data table
- `table-paginated.tsx` - Paginated table with search

### Lists
- `list-basic.tsx` - Simple list with items
- `list-infinite-scroll.tsx` - Infinite scrolling list
- `list-drag-drop.tsx` - Draggable list items

### Modals
- `modal-basic.tsx` - Simple modal dialog
- `modal-confirmation.tsx` - Confirmation dialog
- `modal-form.tsx` - Modal with form

### API Integration
- `api-fetch-pattern.ts` - Standard fetch with error handling
- `api-mutation-pattern.ts` - Create/Update/Delete pattern
- `api-polling-pattern.ts` - Poll for updates

## Usage

Copy patterns into your feature and customize:

```bash
# Copy a pattern
cp .claude/patterns/forms/form-basic.tsx frontend/islands/MyForm.tsx

# Customize for your feature
# - Replace model names
# - Update field names
# - Adjust validation rules
```

## Pattern Categories

### 1. Forms (`forms/`)
Common form patterns with validation, error handling, and submission.

### 2. Tables (`tables/`)
Data display patterns with sorting, filtering, and pagination.

### 3. Lists (`lists/`)
List display patterns for various use cases.

### 4. Modals (`modals/`)
Dialog and modal patterns for user interactions.

### 5. API Integration (`api/`)
Standard patterns for API calls and data fetching.

### 6. State Management (`state/`)
Patterns for managing component and application state.

## Creating New Patterns

When you build something reusable:

1. Extract the generic pattern
2. Add it to the appropriate category
3. Document parameters and customization points
4. Add usage example

## Benefits

- **Faster development**: Copy-paste and customize
- **Consistent UX**: Same patterns across features
- **Best practices**: Pre-built with proper error handling
- **Less bugs**: Battle-tested code
