# Package: typescript-utils - AI Assistant Guidelines

This package provides core utilities for type-safe error handling, environment
validation, and TypeScript utility types. It serves as the foundation for all
other packages in the monorepo.

## Domain Context

This package contains pure, zero-dependency utilities that must work across all
environments (Node.js, browser, edge). Every function here is used by multiple
packages, so correctness and performance are critical.

## Critical Principles

1. **Zero runtime dependencies** - Only devDependencies allowed
2. **Pure functions only** - No side effects, global state, or I/O
3. **Comprehensive type safety** - Make invalid usage impossible at compile time
4. **Result pattern everywhere** - Never throw exceptions in public APIs
5. **Performance by design** - O(1) operations preferred, document complexity
   otherwise

## Code Review Checklist

### 🔴 Blockers (Must Fix)

- [ ] Any `throw` statements in public API functions
- [ ] Runtime dependencies in package.json
- [ ] Side effects (console.log, global mutations, I/O)
- [ ] Missing error handling for all failure modes
- [ ] Untested public API functions
- [ ] `any` types without explicit justification

### 🟡 Improvements (Should Fix)

- [ ] Missing JSDoc documentation for public functions
- [ ] Non-O(1) operations without complexity documentation
- [ ] Mutable function parameters without readonly
- [ ] Missing branded types for domain concepts
- [ ] Inconsistent error codes or messages

### 🟢 Style (Consider)

- [ ] Function names could be more descriptive
- [ ] Type names follow convention (PascalCase for types, camelCase for
      functions)
- [ ] Consistent parameter ordering across related functions

## Common Patterns

### Result Pattern Implementation

```typescript
// ✅ Correct - Always return Result<T, AppError>
function parseJson<T>(json: string): Result<T, AppError> {
  try {
    const data = JSON.parse(json) as T;
    return success(data);
  } catch (error) {
    return failure(
      makeError(
        'VALIDATION_ERROR',
        'Invalid JSON format',
        { input: json.slice(0, 100) },
        error as Error
      )
    );
  }
}

// ❌ Wrong - Never throw in library functions
function parseJson<T>(json: string): T {
  return JSON.parse(json) as T; // Throws on invalid JSON
}
```

### Branded Types for Type Safety

```typescript
// ✅ Correct - Branded types prevent misuse
type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };

function createUserId(id: string): Result<UserId, AppError> {
  if (!id.trim()) {
    return failure(makeError('VALIDATION_ERROR', 'User ID cannot be empty'));
  }
  return success(id as UserId);
}

// ❌ Wrong - Primitive types allow invalid usage
function getUserById(id: string): Promise<User> {
  // Could accidentally pass email instead of ID
}
```

### Type Guards with Exhaustive Checking

```typescript
// ✅ Correct - Exhaustive type checking
function processValue(value: string | number | boolean): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  // This line ensures we handle all cases
  const _exhaustive: never = value;
  throw new Error(`Unhandled value: ${_exhaustive}`);
}
```

## Anti-Patterns to Avoid

### ❌ Throwing Exceptions

```typescript
// Wrong - Library functions should never throw
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

// ✅ Correct
function divide(a: number, b: number): Result<number, AppError> {
  if (b === 0) {
    return failure(makeError('VALIDATION_ERROR', 'Division by zero'));
  }
  return success(a / b);
}
```

### ❌ Impure Functions

```typescript
// Wrong - Side effects in utility functions
function logAndAdd(a: number, b: number): number {
  console.log(`Adding ${a} + ${b}`); // Side effect!
  return a + b;
}

// ✅ Correct - Pure function
function add(a: number, b: number): number {
  return a + b;
}
```

### ❌ Weak Type Safety

```typescript
// Wrong - Allows invalid states
interface User {
  id?: string;
  email?: string;
}

// ✅ Correct - Makes invalid states unrepresentable
interface User {
  readonly id: UserId;
  readonly email: Email;
}
```

## Testing Strategy

### Unit Test Requirements

- **100% coverage** for all public APIs
- **Property-based testing** for mathematical operations
- **Edge case testing** (empty arrays, null/undefined, boundary values)
- **Error path testing** - Verify all failure modes return proper AppError

### Example Test Structure

```typescript
describe('parseJson', () => {
  it('should parse valid JSON successfully', () => {
    const result = parseJson<{ name: string }>('{"name":"test"}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('test');
    }
  });

  it('should return error for invalid JSON', () => {
    const result = parseJson('{invalid}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Invalid JSON');
    }
  });

  // Property-based test example
  it('should roundtrip any serializable object', () => {
    fc.assert(
      fc.property(fc.record({ name: fc.string(), age: fc.integer() }), obj => {
        const json = JSON.stringify(obj);
        const result = parseJson(json);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(obj);
        }
      })
    );
  });
});
```

## Performance Considerations

### Complexity Documentation

```typescript
/**
 * Merges two sorted arrays in O(n + m) time
 * @complexity O(n + m) where n, m are array lengths
 */
function mergeSorted<T>(a: readonly T[], b: readonly T[]): readonly T[] {
  // Implementation...
}
```

### Memory Efficiency

- Prefer structural sharing over deep cloning
- Use `readonly` arrays to enable immutable optimizations
- Document memory usage for large data operations

### Common Optimizations

- Cache expensive computations with memoization
- Use lookup tables for O(1) access patterns
- Prefer iteration over recursion for large datasets

## Integration Guidelines

### Importing from This Package

```typescript
// ✅ Correct - Import specific functions
import { makeError, success, failure } from '@maybegood/typescript-utils';

// ❌ Wrong - Barrel imports can hurt tree-shaking
import * as utils from '@maybegood/typescript-utils';
```

### Adding New Utilities

1. Start with types and tests
2. Implement with Result pattern
3. Add comprehensive JSDoc
4. Update package exports
5. Add to integration tests

## Dependencies Policy

- **Zero runtime dependencies** - Keep the package lightweight
- **Minimal devDependencies** - Only essential tools (TypeScript, Vitest, etc.)
- **No framework-specific code** - Must work in any JavaScript environment
- **No Node.js specific APIs** - Should work in browsers and edge runtimes
