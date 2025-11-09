# TypeScript Coding Standards

This project uses **strict TypeScript configuration** with `exactOptionalPropertyTypes: true`. All code must conform to these standards.

## Table of Contents
- [Optional Properties](#optional-properties)
- [Type Guards](#type-guards)
- [Array Access](#array-access)
- [Object Property Access](#object-property-access)
- [Common Patterns](#common-patterns)

---

## Optional Properties

### ❌ Incorrect
```typescript
interface User {
  name: string;
  email?: string;  // WRONG - doesn't explicitly allow undefined
}

const user: User = {
  name: "John",
  email: undefined  // ERROR: Type 'undefined' not assignable to 'string'
};
```

### ✅ Correct
```typescript
interface User {
  name: string;
  email?: string | undefined;  // CORRECT - explicitly allows undefined
}

const user: User = {
  name: "John",
  email: undefined  // OK
};
```

### Rule
When defining optional properties, **always** use `property?: Type | undefined` instead of `property?: Type`.

---

## Type Guards

### ❌ Incorrect
```typescript
function handleMessage(data: unknown) {
  // ERROR: 'data' is of type 'unknown'
  switch (data.type) {
    case 'ping':
      // ...
  }
}
```

### ✅ Correct
```typescript
function handleMessage(data: unknown) {
  // Type guard for unknown data
  if (!data || typeof data !== 'object' || !('type' in data)) {
    logger.warn('Invalid message format');
    return;
  }
  
  const messageData = data as { type: string; [key: string]: unknown };
  
  switch (messageData.type) {
    case 'ping':
      // ...
  }
}
```

### Rule
**Always validate unknown types** before accessing properties. Use type guards and narrow the type before use.

---

## Array Access

### ❌ Incorrect
```typescript
const users = await getUsers();
const firstUser = users[0];  // ERROR: Object is possibly 'undefined'
console.log(firstUser.name);
```

### ✅ Correct - Option 1: Optional Chaining
```typescript
const users = await getUsers();
const firstUser = users[0];
console.log(firstUser?.name);  // OK - handles undefined
```

### ✅ Correct - Option 2: Null Assertion in Tests
```typescript
// In test files where you know the array has elements
const users = await getUsers();
assertEquals(users[0]?.id, 'expected-id');  // OK
```

### ✅ Correct - Option 3: Using .at()
```typescript
const users = await getUsers();
const firstUser = users.at(0);  // Returns T | undefined
if (firstUser) {
  console.log(firstUser.name);
}
```

### Rule
**Never assume array elements exist**. Always use optional chaining (`?.`) or check for undefined.

---

## Object Property Access

### ❌ Incorrect
```typescript
const payload: Record<string, unknown> = await verifyToken(token);
const userId = payload.sub;  // ERROR: Property 'sub' comes from index signature
```

### ✅ Correct
```typescript
const payload: Record<string, unknown> = await verifyToken(token);
const userId = payload['sub'];  // OK - bracket notation for index signatures
```

### Rule
With `noPropertyAccessFromIndexSignature: true`, **use bracket notation** for properties from index signatures.

---

## Common Patterns

### Pattern 1: Conditional Optional Properties

#### ❌ Incorrect
```typescript
const options = {
  limit: 10,
  cursor: maybeCursor ? maybeCursor : undefined  // ERROR if property is typed as optional
};
```

#### ✅ Correct
```typescript
const options: { limit: number; cursor?: string | undefined } = {
  limit: 10,
};

if (maybeCursor) {
  options.cursor = maybeCursor;
}
```

### Pattern 2: Cron Expression Parsing

#### ❌ Incorrect
```typescript
const [minute, hour, day] = cron.split(' ');
// ERROR: minute, hour, day might be undefined
matchesPart(minute, value);
```

#### ✅ Correct
```typescript
const parts = cron.split(' ');
if (parts.length !== 5) {
  throw new Error('Invalid cron expression');
}

const [minute = '*', hour = '*', day = '*'] = parts;
matchesPart(minute, value);  // OK - has default values
```

### Pattern 3: Range Validation

#### ❌ Incorrect
```typescript
const [start, end] = part.split('-').map(Number);
return value >= start && value <= end;  // ERROR: start/end possibly undefined
```

#### ✅ Correct
```typescript
const [start, end] = part.split('-').map(Number);
if (start === undefined || end === undefined) return false;
return value >= start && value <= end;  // OK - checked for undefined
```

### Pattern 4: Proxy Property Access

#### ❌ Incorrect
```typescript
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop) {
    return (instance as Record<string, unknown>)[prop];  // ERROR: prop might be symbol
  }
});
```

#### ✅ Correct
```typescript
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop: string | symbol) {
    if (typeof prop === 'symbol') {
      return (instance as never)[prop];
    }
    return (instance as Record<string, unknown>)[prop];
  }
});
```

---

## Checklist for Code Reviews

When reviewing code or implementing new features, verify:

- [ ] All optional properties use `property?: Type | undefined`
- [ ] Unknown types are validated with type guards before use
- [ ] Array access uses optional chaining (`?.`) or null checks
- [ ] Index signature access uses bracket notation (`obj['key']`)
- [ ] No explicit `undefined` assignments to properties typed without `| undefined`
- [ ] Cron expressions and string splits have default values or validation
- [ ] Proxy handlers check for symbol properties

---

## Why These Rules?

The `exactOptionalPropertyTypes: true` setting provides stronger type safety by distinguishing between:

1. **`property?: string`** - Can be `string` or **missing** (but not explicitly `undefined`)
2. **`property?: string | undefined`** - Can be `string`, `undefined`, or **missing**

This prevents bugs where you might accidentally pass `undefined` instead of omitting the property, which can behave differently in some APIs (e.g., JSON serialization, object spreading).

---

## Quick Reference

```typescript
// ✅ Correct patterns
interface Config {
  name: string;
  timeout?: number | undefined;
  retries?: number | undefined;
}

const config: Config = {
  name: 'api',
  timeout: undefined,  // OK
};

// ✅ Unknown type validation
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    const obj = data as { id: string };
    console.log(obj.id);
  }
}

// ✅ Array access
const items = getItems();
console.log(items[0]?.name);

// ✅ Index signatures
const record: Record<string, unknown> = {};
const value = record['key'];
```

---

## AI Agent Instructions

When generating or modifying TypeScript code for this project:

1. **Always** add `| undefined` to optional properties in interfaces/types
2. **Always** validate `unknown` types with type guards before accessing properties
3. **Always** use optional chaining (`?.`) for array element access
4. **Always** use bracket notation (`obj['key']`) for Record/index signature access
5. **Never** assume destructured array elements exist - provide defaults or validate
6. **Check** for `undefined` before using values from `.split()`, `.match()`, etc.

Following these patterns ensures code compiles without errors under strict TypeScript settings.
