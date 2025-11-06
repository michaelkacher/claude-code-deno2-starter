# Input Debouncing Guide

> **Implementation Status**: ✅ Implemented in AdminDataBrowser.tsx  
> **Performance Gain**: 94% reduction in API calls for filter operations  
> **Pattern**: Standard React/Preact debouncing with useRef and useEffect

## Table of Contents
- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution: Debouncing](#solution-debouncing)
- [Implementation](#implementation)
- [Performance Comparison](#performance-comparison)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Debouncing** is a technique to delay function execution until after a specified time period has elapsed since the last invocation. For input fields, this means waiting until the user stops typing before triggering actions like API calls, searches, or filtering.

### Key Concepts
- **Immediate Value**: The actual input value that updates on every keystroke (for UI binding)
- **Debounced Value**: The delayed value that triggers side effects (for API calls)
- **Debounce Delay**: Time to wait after last keystroke before updating debounced value (typically 300-500ms)

### When to Use Debouncing
✅ **DO use debouncing for:**
- Search inputs that trigger API calls
- Filter inputs that fetch filtered data
- Auto-save functionality
- Live validation that hits a server
- Any expensive operation triggered by user input

❌ **DON'T use debouncing for:**
- Simple UI state updates (e.g., character counters)
- Client-side only operations (e.g., filtering local array)
- Form submission on Enter key (use form handlers instead)
- Critical real-time feedback (e.g., password strength indicators)

---

## Problem Statement

### The Issue
In `frontend/islands/AdminDataBrowser.tsx`, the filter input field triggered an API fetch on **every keystroke**:

```typescript
// ❌ BEFORE: Immediate fetch on every keystroke
const [filterValue, setFilterValue] = useState('');

useEffect(() => {
  if (IS_BROWSER && selectedModel) {
    fetchModelData(); // Called on every filterValue change
  }
}, [selectedModel, currentPage, filterProperty, filterValue]);
```

### Impact Analysis

#### Performance Impact
| User Action | Keystrokes | API Calls (Before) | API Calls (After) | Reduction |
|-------------|------------|-------------------|------------------|-----------|
| Types "test" | 4 | 4 | 1 | 75% |
| Types "admin" | 5 | 5 | 1 | 80% |
| Types "test@example.com" | 17 | 17 | 1 | **94%** |
| Types "john.doe@company.com" | 23 | 23 | 1 | **96%** |

#### User Experience Issues
- **Loading Spinner Flashing**: Spinner appears/disappears on every keystroke
- **Response Lag**: Backend processing delays next keystroke
- **Wasted Bandwidth**: Fetching data for incomplete/invalid filters
- **Poor Responsiveness**: UI feels sluggish due to constant state updates

#### Backend Impact
- **Resource Waste**: Processing queries for partial/invalid input
- **Database Load**: Unnecessary KV reads and scans
- **Rate Limiting**: Risk of hitting rate limits with fast typing
- **Server Cost**: Increased compute time and bandwidth

---

## Solution: Debouncing

### Core Concept
Instead of fetching on every keystroke, wait for the user to **stop typing** for a specified duration (e.g., 500ms) before triggering the fetch:

```
User types: "t" → wait 500ms → "e" → wait 500ms → "s" → wait 500ms → "t" → wait 500ms → FETCH!
                        ↑ timer reset          ↑ timer reset          ↑ timer reset          ↑ timer expires
```

### Strategy
1. **Immediate State**: Update UI immediately for responsive typing experience
2. **Debounced State**: Update separate state after delay for side effects
3. **Timer Management**: Clear and reset timer on each keystroke
4. **Cleanup**: Clear timer on component unmount to prevent memory leaks

---

## Implementation

### Step 1: Add State and Ref

```typescript
import { useEffect, useRef, useState } from 'preact/hooks';

export default function MyComponent() {
  // Immediate value for UI binding
  const [filterValue, setFilterValue] = useState('');
  
  // Debounced value for side effects (API calls)
  const [debouncedFilterValue, setDebouncedFilterValue] = useState('');
  
  // Timer ref (persists across re-renders without triggering re-renders)
  const debounceTimerRef = useRef<number | null>(null);
  
  // Configurable delay
  const DEBOUNCE_DELAY_MS = 500;
  
  // ... rest of component
}
```

**Why `useRef`?**
- Persists value across re-renders without triggering re-renders
- Stores timer ID so we can clear it on next keystroke
- Doesn't cause unnecessary component updates

### Step 2: Implement Debounce Logic

```typescript
// Debounce filter value changes
useEffect(() => {
  // Clear existing timer (user typed again before delay expired)
  if (debounceTimerRef.current !== null) {
    clearTimeout(debounceTimerRef.current);
  }

  // Set new timer (will expire in DEBOUNCE_DELAY_MS if no more keystrokes)
  debounceTimerRef.current = setTimeout(() => {
    setDebouncedFilterValue(filterValue); // Update debounced value
  }, DEBOUNCE_DELAY_MS);

  // Cleanup function (runs on unmount or when filterValue changes)
  return () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, [filterValue]); // Run when immediate value changes
```

**Flow Explanation:**
1. User types → `filterValue` updates → useEffect runs
2. Clear previous timer (if exists) → Set new timer
3. User types again before timer expires → useEffect runs again → Clear timer → Set new timer
4. User stops typing → Timer expires after 500ms → `setDebouncedFilterValue()` runs
5. Component unmounts → Cleanup runs → Clear timer

### Step 3: Use Debounced Value for Side Effects

```typescript
// Fetch data when debounced value changes (NOT immediate value)
useEffect(() => {
  if (IS_BROWSER && selectedModel) {
    fetchModelData(); // Only called after user stops typing
  }
}, [selectedModel, currentPage, filterProperty, debouncedFilterValue]); // ← Use debounced value!
```

**Important:** Use `debouncedFilterValue` in dependency array, not `filterValue`!

### Step 4: Update API Call to Use Debounced Value

```typescript
const fetchModelData = async () => {
  setLoading(true);
  setError('');

  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '20',
    });

    // Use debounced value for API call
    if (filterProperty && debouncedFilterValue) {
      params.append('filterProperty', filterProperty);
      params.append('filterValue', debouncedFilterValue); // ← Use debounced value!
    }

    const response = await fetch(`${apiUrl}/api/endpoint?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    // ... handle response
  } catch (err) {
    setError('Failed to fetch data');
  } finally {
    setLoading(false);
  }
};
```

### Step 5: Keep Input Binding with Immediate Value

```typescript
// Input field uses immediate value for responsive typing
<input
  type="text"
  value={filterValue} // ← Immediate value for UI
  onInput={(e) => setFilterValue((e.target as HTMLInputElement).value)}
  placeholder="Filter by value..."
  className="border rounded px-3 py-2"
/>

{/* Button state checks immediate value for UX */}
<button
  onClick={applyFilter}
  disabled={!filterProperty || !filterValue} // ← Immediate value for button state
  className="px-4 py-2 bg-blue-500 text-white rounded"
>
  Apply Filter
</button>
```

**Why use immediate value for UI?**
- **Responsive Typing**: User sees characters appear instantly
- **Button State**: Disable/enable buttons based on immediate input
- **Validation**: Show validation errors as user types (client-side only)

---

## Performance Comparison

### Before: Immediate Fetch
```typescript
// ❌ BAD: Fetch on every keystroke
const [filterValue, setFilterValue] = useState('');

useEffect(() => {
  if (IS_BROWSER && selectedModel) {
    fetchModelData(); // 17 calls for "test@example.com"
  }
}, [selectedModel, currentPage, filterProperty, filterValue]);
```

**Metrics:**
- **API Calls**: 17 (for "test@example.com")
- **Network Requests**: 17
- **Loading States**: 17 (spinner flashes 17 times)
- **Backend Queries**: 17
- **User Experience**: Poor (constant loading, lag)

### After: Debounced Fetch
```typescript
// ✅ GOOD: Fetch after user stops typing
const [filterValue, setFilterValue] = useState('');
const [debouncedFilterValue, setDebouncedFilterValue] = useState('');
const debounceTimerRef = useRef<number | null>(null);

useEffect(() => {
  if (debounceTimerRef.current !== null) {
    clearTimeout(debounceTimerRef.current);
  }
  debounceTimerRef.current = setTimeout(() => {
    setDebouncedFilterValue(filterValue);
  }, 500);
  return () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, [filterValue]);

useEffect(() => {
  if (IS_BROWSER && selectedModel) {
    fetchModelData(); // 1 call for "test@example.com"
  }
}, [selectedModel, currentPage, filterProperty, debouncedFilterValue]);
```

**Metrics:**
- **API Calls**: 1 (for "test@example.com")
- **Network Requests**: 1
- **Loading States**: 1 (spinner shows once, after user stops typing)
- **Backend Queries**: 1
- **User Experience**: Excellent (smooth typing, no lag)
- **Reduction**: **94%** fewer API calls

### Real-World Measurements

#### Typing Speed Analysis
Assuming average typing speed of 40 WPM (200 characters per minute):
- **Characters per second**: ~3.3
- **Time between keystrokes**: ~300ms
- **Debounce delay**: 500ms

**Result:** For typical typing, debounce delay expires shortly after user finishes typing, providing near-instant results once done.

#### Network Savings
For a 1KB API response:
- **Before**: 17 requests = 17KB transferred
- **After**: 1 request = 1KB transferred
- **Savings**: 16KB (94% reduction)

For 100 users filtering 10 times per day:
- **Before**: 17,000 requests/day = 17MB/day = 510MB/month
- **After**: 1,000 requests/day = 1MB/day = 30MB/month
- **Savings**: 480MB/month (94% reduction)

---

## Best Practices

### 1. Choose Appropriate Delay

```typescript
// Search inputs: Longer delay (users think about search terms)
const SEARCH_DEBOUNCE_DELAY = 500; // ms

// Filter inputs: Medium delay (users scan results while typing)
const FILTER_DEBOUNCE_DELAY = 300; // ms

// Auto-save: Longer delay (avoid saving on every keystroke)
const AUTOSAVE_DEBOUNCE_DELAY = 1000; // ms

// Live validation: Short delay (provide quick feedback)
const VALIDATION_DEBOUNCE_DELAY = 200; // ms
```

**Guidelines:**
- **100-200ms**: Very short (live validation, quick feedback)
- **300-500ms**: Standard (search, filter, typical inputs)
- **1000ms+**: Long (auto-save, expensive operations)

### 2. Use `useRef` for Timer Management

```typescript
// ✅ GOOD: useRef doesn't trigger re-renders
const debounceTimerRef = useRef<number | null>(null);

// ❌ BAD: useState triggers re-renders unnecessarily
const [debounceTimer, setDebounceTimer] = useState<number | null>(null);
```

### 3. Always Include Cleanup

```typescript
// ✅ GOOD: Clear timer on unmount to prevent memory leaks
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedValue(value);
  }, 500);
  
  return () => clearTimeout(timer); // Cleanup!
}, [value]);

// ❌ BAD: No cleanup (memory leak if component unmounts during delay)
useEffect(() => {
  setTimeout(() => {
    setDebouncedValue(value);
  }, 500);
}, [value]);
```

### 4. Separate Immediate and Debounced State

```typescript
// ✅ GOOD: Two separate states
const [filterValue, setFilterValue] = useState(''); // Immediate (UI)
const [debouncedFilterValue, setDebouncedFilterValue] = useState(''); // Delayed (API)

// ❌ BAD: Single state (can't have responsive typing AND debounced fetching)
const [filterValue, setFilterValue] = useState('');
```

### 5. Reset Page on Filter Change

```typescript
// ✅ GOOD: Reset to page 1 when filter changes
useEffect(() => {
  setCurrentPage(1); // Reset pagination
  if (IS_BROWSER && selectedModel) {
    fetchModelData();
  }
}, [selectedModel, filterProperty, debouncedFilterValue]);

// ❌ BAD: Keep current page (user might be on page 5 with 0 results on page 1)
useEffect(() => {
  if (IS_BROWSER && selectedModel) {
    fetchModelData();
  }
}, [selectedModel, currentPage, filterProperty, debouncedFilterValue]);
```

### 6. Show Loading States Correctly

```typescript
// ✅ GOOD: Show loading spinner during fetch
const fetchData = async () => {
  setLoading(true);
  try {
    const data = await api.get('/data');
    setData(data);
  } finally {
    setLoading(false); // Always hide spinner
  }
};

// ❌ BAD: Spinner shows on every keystroke (with immediate fetch)
useEffect(() => {
  fetchData(); // Called on every keystroke
}, [filterValue]);
```

### 7. Consider Empty State

```typescript
// ✅ GOOD: Don't fetch on empty filter
useEffect(() => {
  if (debounceTimerRef.current !== null) {
    clearTimeout(debounceTimerRef.current);
  }
  
  // Only set debounced value if filterValue is not empty
  if (filterValue.trim()) {
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilterValue(filterValue);
    }, 500);
  } else {
    setDebouncedFilterValue(''); // Immediately clear
  }
  
  return () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
  };
}, [filterValue]);

// ❌ BAD: Fetch even when filter is empty (wasted call)
useEffect(() => {
  fetchData(); // Fetches all data when filter is ""
}, [debouncedFilterValue]);
```

---

## Common Patterns

### Pattern 1: Search Input with Debouncing

```typescript
export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
      }, 500);
    } else {
      setDebouncedSearchTerm('');
    }

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch results when debounced term changes
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/search?q=${debouncedSearchTerm}`);
        setResults(response.data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearchTerm]);

  return (
    <div>
      <input
        type="search"
        value={searchTerm}
        onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
        placeholder="Search..."
      />
      {loading && <div>Searching...</div>}
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Pattern 2: Auto-Save Form with Debouncing

```typescript
export default function AutoSaveForm({ documentId }: { documentId: string }) {
  const [content, setContent] = useState('');
  const [debouncedContent, setDebouncedContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const debounceTimerRef = useRef<number | null>(null);

  // Debounce content changes (longer delay for auto-save)
  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    setSaveStatus('unsaved');

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedContent(content);
    }, 1000); // 1 second delay

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content]);

  // Auto-save when debounced content changes
  useEffect(() => {
    if (!debouncedContent) return;

    const saveDocument = async () => {
      setSaveStatus('saving');
      try {
        await api.put(`/documents/${documentId}`, { content: debouncedContent });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Save failed:', err);
        setSaveStatus('unsaved');
      }
    };

    saveDocument();
  }, [debouncedContent, documentId]);

  return (
    <div>
      <div className="save-status">
        {saveStatus === 'saved' && '✓ Saved'}
        {saveStatus === 'saving' && '⟳ Saving...'}
        {saveStatus === 'unsaved' && '• Unsaved changes'}
      </div>
      <textarea
        value={content}
        onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
        rows={10}
        cols={50}
      />
    </div>
  );
}
```

### Pattern 3: Multi-Field Filter with Debouncing

```typescript
export default function AdvancedFilter() {
  // Immediate values
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Debounced values
  const [debouncedNameFilter, setDebouncedNameFilter] = useState('');
  const [debouncedEmailFilter, setDebouncedEmailFilter] = useState('');
  const [debouncedRoleFilter, setDebouncedRoleFilter] = useState('');

  // Timer refs
  const nameTimerRef = useRef<number | null>(null);
  const emailTimerRef = useRef<number | null>(null);
  const roleTimerRef = useRef<number | null>(null);

  // Debounce name filter
  useEffect(() => {
    if (nameTimerRef.current !== null) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(() => setDebouncedNameFilter(nameFilter), 300);
    return () => {
      if (nameTimerRef.current !== null) clearTimeout(nameTimerRef.current);
    };
  }, [nameFilter]);

  // Debounce email filter
  useEffect(() => {
    if (emailTimerRef.current !== null) clearTimeout(emailTimerRef.current);
    emailTimerRef.current = setTimeout(() => setDebouncedEmailFilter(emailFilter), 300);
    return () => {
      if (emailTimerRef.current !== null) clearTimeout(emailTimerRef.current);
    };
  }, [emailFilter]);

  // Debounce role filter
  useEffect(() => {
    if (roleTimerRef.current !== null) clearTimeout(roleTimerRef.current);
    roleTimerRef.current = setTimeout(() => setDebouncedRoleFilter(roleFilter), 300);
    return () => {
      if (roleTimerRef.current !== null) clearTimeout(roleTimerRef.current);
    };
  }, [roleFilter]);

  // Fetch data when any debounced filter changes
  useEffect(() => {
    const fetchFilteredData = async () => {
      const params = new URLSearchParams();
      if (debouncedNameFilter) params.append('name', debouncedNameFilter);
      if (debouncedEmailFilter) params.append('email', debouncedEmailFilter);
      if (debouncedRoleFilter) params.append('role', debouncedRoleFilter);

      const response = await api.get(`/users?${params}`);
      // ... handle response
    };

    fetchFilteredData();
  }, [debouncedNameFilter, debouncedEmailFilter, debouncedRoleFilter]);

  return (
    <div>
      <input
        type="text"
        value={nameFilter}
        onInput={(e) => setNameFilter((e.target as HTMLInputElement).value)}
        placeholder="Filter by name..."
      />
      <input
        type="text"
        value={emailFilter}
        onInput={(e) => setEmailFilter((e.target as HTMLInputElement).value)}
        placeholder="Filter by email..."
      />
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter((e.target as HTMLSelectElement).value)}
      >
        <option value="">All roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
    </div>
  );
}
```

### Pattern 4: Reusable Debounce Hook

```typescript
// hooks/useDebounce.ts
import { useEffect, useRef, useState } from 'preact/hooks';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
export default function MyComponent() {
  const [filterValue, setFilterValue] = useState('');
  const debouncedFilterValue = useDebounce(filterValue, 500); // 500ms delay

  useEffect(() => {
    if (debouncedFilterValue) {
      fetchData(debouncedFilterValue);
    }
  }, [debouncedFilterValue]);

  return (
    <input
      type="text"
      value={filterValue}
      onInput={(e) => setFilterValue((e.target as HTMLInputElement).value)}
    />
  );
}
```

---

## Testing

### Manual Testing Checklist

#### Functional Testing
- [ ] Type fast in filter input → Only 1 API call after stopping
- [ ] Type slow in filter input → Only 1 API call per pause
- [ ] Type and immediately navigate away → Timer clears, no call after unmount
- [ ] Clear filter → Debounced value clears immediately
- [ ] Type invalid filter → No API call (if validation added)
- [ ] Type same value twice → No duplicate API call (if deduplication added)

#### Performance Testing
- [ ] No visible lag when typing fast
- [ ] Loading spinner only shows after user stops typing
- [ ] UI remains responsive during debounce delay
- [ ] Network tab shows reduced number of requests
- [ ] Memory doesn't leak (timers are cleared)

#### Edge Cases
- [ ] Component unmounts during debounce delay → No error
- [ ] Very fast typing (>10 chars/sec) → Still only 1 call
- [ ] Special characters in input → Handled correctly
- [ ] Empty string → No API call (or fetches all)
- [ ] Whitespace-only input → Handled correctly

### Automated Testing

```typescript
// tests/unit/debounce.test.ts
import { assertEquals } from 'jsr:@std/assert';
import { FakeTime } from 'jsr:@std/testing/time';

Deno.test('Debounce: Only calls function after delay', async () => {
  using time = new FakeTime();
  
  let callCount = 0;
  const debounced = debounce(() => callCount++, 500);

  // Call 5 times rapidly
  debounced();
  debounced();
  debounced();
  debounced();
  debounced();

  // Should not have called yet
  assertEquals(callCount, 0);

  // Advance time by 500ms
  await time.tickAsync(500);

  // Should have called once
  assertEquals(callCount, 1);
});

Deno.test('Debounce: Resets timer on new call', async () => {
  using time = new FakeTime();
  
  let callCount = 0;
  const debounced = debounce(() => callCount++, 500);

  debounced();
  await time.tickAsync(400); // 400ms (not enough)
  debounced(); // Reset timer
  await time.tickAsync(400); // 400ms more (total 800ms from first call)
  
  // Should not have called yet (timer was reset)
  assertEquals(callCount, 0);
  
  await time.tickAsync(100); // 100ms more (500ms from second call)
  
  // Now should have called
  assertEquals(callCount, 1);
});
```

### Browser DevTools Testing

#### Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Type in filter input
4. Count network requests
5. Should see only 1 request after stopping typing

#### Performance Tab
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Type in filter input fast
5. Stop recording
6. Analyze timeline:
   - Should see timer setups/clears
   - Should see only 1 fetch call after typing stops
   - Should see minimal re-renders

---

## Troubleshooting

### Issue: Debounce not working, API called on every keystroke

**Symptoms:**
- Network tab shows multiple requests per typed word
- Loading spinner flashes on every keystroke

**Possible Causes:**

1. **Using immediate value in dependency array**
   ```typescript
   // ❌ WRONG
   useEffect(() => {
     fetchData();
   }, [filterValue]); // Should be debouncedFilterValue
   ```
   
   **Fix:**
   ```typescript
   // ✅ CORRECT
   useEffect(() => {
     fetchData();
   }, [debouncedFilterValue]);
   ```

2. **Not clearing timer before setting new one**
   ```typescript
   // ❌ WRONG
   useEffect(() => {
     setTimeout(() => setDebouncedValue(value), 500);
   }, [value]);
   ```
   
   **Fix:**
   ```typescript
   // ✅ CORRECT
   useEffect(() => {
     if (timerRef.current !== null) clearTimeout(timerRef.current);
     timerRef.current = setTimeout(() => setDebouncedValue(value), 500);
     return () => {
       if (timerRef.current !== null) clearTimeout(timerRef.current);
     };
   }, [value]);
   ```

3. **Using useState instead of useRef for timer**
   ```typescript
   // ❌ WRONG (triggers re-render)
   const [timer, setTimer] = useState<number | null>(null);
   ```
   
   **Fix:**
   ```typescript
   // ✅ CORRECT (no re-render)
   const timerRef = useRef<number | null>(null);
   ```

### Issue: Memory leak warning on unmount

**Symptoms:**
- Console warning: "Can't perform a React state update on an unmounted component"
- Memory usage increases over time

**Cause:**
Timer not cleared when component unmounts

**Fix:**
```typescript
useEffect(() => {
  timerRef.current = setTimeout(() => setDebouncedValue(value), 500);
  
  // Add cleanup function
  return () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
  };
}, [value]);
```

### Issue: Delay feels too long

**Symptoms:**
- User types and waits too long for results
- Feels unresponsive

**Solution:**
Reduce debounce delay:
```typescript
// Before: 500ms (might feel slow)
const DEBOUNCE_DELAY_MS = 500;

// After: 300ms (more responsive)
const DEBOUNCE_DELAY_MS = 300;
```

**Guidelines:**
- **Fast feedback needed**: 200-300ms
- **Standard usage**: 300-500ms
- **Expensive operations**: 500-1000ms

### Issue: Still seeing lag when typing

**Symptoms:**
- Typing feels sluggish
- Characters appear delayed

**Possible Causes:**

1. **Expensive render on every keystroke**
   ```typescript
   // ❌ WRONG: Expensive computation on every render
   const filteredList = expensiveFilter(items, filterValue);
   ```
   
   **Fix with useMemo:**
   ```typescript
   // ✅ CORRECT: Only recompute when needed
   const filteredList = useMemo(
     () => expensiveFilter(items, filterValue),
     [items, filterValue]
   );
   ```

2. **Parent component re-rendering**
   - Check if parent is causing unnecessary re-renders
   - Use React DevTools Profiler to identify

### Issue: API called twice for same value

**Symptoms:**
- Network tab shows duplicate requests
- Same query string sent twice

**Cause:**
Strict Mode in development (intentional React behavior)

**Solution:**
This is expected in development. In production build, it won't happen.

**Alternative:** Implement deduplication:
```typescript
const lastFetchedValueRef = useRef<string>('');

useEffect(() => {
  // Skip if same value already fetched
  if (debouncedValue === lastFetchedValueRef.current) return;
  
  lastFetchedValueRef.current = debouncedValue;
  fetchData(debouncedValue);
}, [debouncedValue]);
```

### Issue: Empty filter causes API call

**Symptoms:**
- Clearing input triggers API call with empty filter
- Backend returns all data

**Solution:**
Don't fetch on empty value:
```typescript
useEffect(() => {
  // Skip fetch if debounced value is empty
  if (!debouncedFilterValue.trim()) {
    setResults([]);
    return;
  }
  
  fetchData(debouncedFilterValue);
}, [debouncedFilterValue]);
```

---

## Summary

### Key Takeaways

1. **Always debounce user input that triggers expensive operations** (API calls, searches, filters)
2. **Use separate state for immediate (UI) and debounced (API) values**
3. **Use `useRef` to store timer ID** (doesn't trigger re-renders)
4. **Always clear timer in cleanup function** (prevents memory leaks)
5. **Choose appropriate delay** (300-500ms for most cases)
6. **Test thoroughly** (fast typing, unmounting, edge cases)

### Implementation Checklist

- [ ] Add immediate state for UI (`const [value, setValue] = useState('')`)
- [ ] Add debounced state for API (`const [debouncedValue, setDebouncedValue] = useState('')`)
- [ ] Add timer ref (`const timerRef = useRef<number | null>(null)`)
- [ ] Implement debounce useEffect with cleanup
- [ ] Update API call useEffect to use debounced value
- [ ] Keep input binding with immediate value
- [ ] Test with fast typing
- [ ] Test with unmounting
- [ ] Verify reduced API calls in Network tab
- [ ] Update documentation

### Performance Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Calls (17 chars) | 17 | 1 | **94%** |
| Network Requests | 17 | 1 | **94%** |
| Loading States | 17 | 1 | **94%** |
| User Experience | Poor | Excellent | N/A |

### Related Documentation

- **Frontend Caching**: `docs/FRONTEND_CACHING.md` - Cache API responses
- **Rate Limiting**: `docs/RATE_LIMITING.md` - Protect backend from abuse
- **Composite Indexes**: `docs/COMPOSITE_INDEXES.md` - Optimize queries
- **Quick Reference**: `docs/QUICK_REFERENCE.md` - Common patterns

---

**Questions or issues?** Check the [Troubleshooting](#troubleshooting) section or create an issue on GitHub.
