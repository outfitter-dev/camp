# ADR-0006: Opaque Result Type for Guaranteed Type Safety

- **Status**: Proposed
- **Date**: 2025-06-18
- **Deciders**: Max

---

## Context and Problem Statement

Our current `Result<T, E>` type, defined in `@outfitter/contracts`, is a cornerstone of our error-handling strategy. It's implemented as a discriminated union:

```typescript
// packages/contracts/typescript/src/result.ts
export type Result<T, E> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: DeepReadonly<E>;
}
```

This pattern is a significant improvement over throwing exceptions, as it forces developers to acknowledge that an operation can fail. However, it contains a subtle but critical flaw: it allows for states that are *legal* from the perspective of the TypeScript compiler but are *illegal* at runtime.

The core issue is that a developer can access `result.data` or `result.error` without first checking the `success` discriminant.

**Example of an Illegal State:**

```typescript
function getUser(id: string): Result<User, AppError> {
  // ...
}

const userResult = getUser('123');

// This is a runtime error if the result is a Failure.
// The compiler allows this because `data` exists on the `Result` type union.
const username = userResult.data.name; // Throws "Cannot read properties of undefined"
```

While we provide `isSuccess` and `isFailure` type guards, they rely on developer discipline. The type system itself does not prevent incorrect usage. This violates the principle of "making illegal states unrepresentable." A truly robust system shouldn't just allow for writing correct code; it should guide developers away from writing incorrect code.

This proposal advocates for refactoring our `Result` type into an **opaque** structure that enforces safe access patterns at the type level, thereby eliminating this entire class of potential runtime errors.

## Decision Drivers

- **Correctness**: Eliminate the possibility of runtime errors from improper `Result` handling.
- **Type System Enforcement**: Shift the responsibility of ensuring safe access from developer discipline (and linters) to the compiler.
- **Improved Developer Experience**: Guide developers to a single, correct way of handling results, reducing cognitive load.
- **Architectural Robustness**: Align our codebase with best practices for functional error handling and type design.

## Considered Options

1. **Do Nothing**: Keep the current discriminated union. This accepts the risk of runtime errors and fails to improve our architecture.
2. **Add a Custom ESLint Rule**: We could write a complex, stateful ESLint rule to track `Result` types and ensure they are checked before use. This is brittle, adds performance overhead to our tooling, and treats the symptom, not the cause. It's using a linter to do the compiler's job.
3. **Refactor to an Opaque `Result` Type**: Encapsulate the success/failure state and expose methods (`.match()`, `.map()`, `.getOrElse()`) as the *only* way to interact with the value. This makes incorrect access a compile-time error.

## Decision

We will refactor our `Result<T, E>` to be an opaque type. The internal `Success` and `Failure` states will be private, and all interactions will be mediated through methods that guarantee safe access.

### Technical Design: Before vs. After

This change is best illustrated with code.

#### Current (Unsafe) Implementation

Our current approach allows for direct, unchecked access.

```typescript
// --- Current Usage ---

function findUser(id: string): Result<User, { message: string }> {
  if (id === '1') {
    return success({ id: '1', name: 'Max' });
  }
  return failure({ message: 'User not found' });
}

const result = findUser('2');

// CORRECT, but relies on developer discipline
if (isSuccess(result)) {
  console.log(`Welcome, ${result.data.name}`);
} else {
  console.error(`Error: ${result.error.message}`);
}

// DANGEROUS: Compiles, but throws a runtime error
try {
  // This line will throw if the user is not found
  const name = result.data.name;
  console.log(name);
} catch (e) {
  console.error('Caught a runtime error!');
}
```

#### Proposed (Opaque) Implementation

The new `Result` will be a class that hides its internal state.

```typescript
// --- Proposed Implementation Sketch ---

// The internal variants would be inaccessible from outside the module
class Success<T, E> {
  constructor(readonly data: T) {}
  // ... method implementations
}
class Failure<T, E> {
  constructor(readonly error: E) {}
  // ... method implementations
}

export class Result<T, E> {
  private constructor(private readonly value: Success<T, E> | Failure<T, E>) {}

  public static success<T, E>(data: T): Result<T, E> {
    return new Result(new Success(data));
  }

  public static failure<T, E>(error: E): Result<T, E> {
    return new Result(new Failure(error));
  }

  public match<R>(handlers: {
    success: (data: T) => R;
    failure: (error: E) => R;
  }): R {
    if (this.value instanceof Success) {
      return handlers.success(this.value.data);
    }
    return handlers.failure(this.value.error);
  }
  
  // Other methods like map, flatMap, etc. would be implemented here
}
```

**This change transforms the consumer experience:**

```typescript
// --- New, Safe Usage ---

function findUser(id: string): Result<User, { message: string }> {
  if (id === '1') {
    return Result.success({ id: '1', name: 'Max' });
  }
  return Result.failure({ message: 'User not found' });
}

const result = findUser('2');

// THE ONLY WAY: Safe by construction
const message = result.match({
  success: (user) => `Welcome, ${user.name}`,
  failure: (err) => `Error: ${err.message}`,
});
console.log(message);

// COMPILE-TIME ERROR: The footgun is gone
// Property 'data' is private and only accessible within class 'Result'.
const name = result.data;
```

With this design, it is *impossible* to access the underlying data or error without explicitly handling both cases through the `.match()` method (or another safe accessor like `.getOrElse()`).

### Migration Plan

This is a significant and breaking change that must be managed carefully.

1. **Phase 1: Implement and Coexist**
    - Implement the new `OpaqueResult` class within `@outfitter/contracts` alongside the existing `Result` type.
    - The existing `success()` and `failure()` helpers will be deprecated but will continue to return the old `Result` type for now.
    - The new `Result.success()` and `Result.failure()` static methods will create instances of `OpaqueResult`.

2. **Phase 2: Automated Refactoring with Codemods**
    - Develop a `jscodeshift` codemod to perform the bulk of the migration. The codemod will be designed to transform the most common pattern:
        ```diff
        - if (isSuccess(result)) {
        -   // success logic using result.data
        - } else {
        -   // failure logic using result.error
        - }
        + result.match({
        +   success: (data) => { /* success logic using data */ },
        +   failure: (error) => { /* failure logic using error */ },
        + });
        ```
    - Run this codemod across the entire monorepo. This will handle an estimated 80-90% of use cases.

3. **Phase 3: Manual Refactoring and Cleanup**
    - Manually refactor the more complex or idiosyncratic use cases that the codemod cannot handle.
    - This phase involves careful code review to ensure all logic is preserved.

4. **Phase 4: Finalization**
    - Once all parts of the codebase use `OpaqueResult`, we will perform the final switch.
    - The old `Result` type alias and helper functions (`isSuccess`, `isFailure`, etc.) will be removed.
    - `OpaqueResult` will be renamed to `Result`.
    - This will be done in a single, atomic pull request to avoid a prolonged state of dual implementations.

## Consequences

### Positive

- **Eliminates a Class of Runtime Errors**: Improper `Result` handling becomes a compile-time error.
- **Enforces Best Practices**: The design forces developers into a safe, robust pattern for error handling.
- **Reduces Cognitive Load**: No need to remember to check a discriminant; the type guides the way.
- **Cleaner Code**: The `.match()` pattern is often more declarative and readable than `if/else` blocks.

### Negative

- **Significant Refactoring Effort**: This is a non-trivial, breaking change that will touch a large portion of the codebase. The investment in a high-quality codemod is essential to mitigate this cost.
- **Initial Friction**: Developers familiar with the discriminated union pattern will need to adapt to the new API. The verbosity of the `.match()` object may feel cumbersome at first, but the safety guarantees are worth the trade-off.
- **Potential Performance Impact**: Introducing a class instance for every `Result` may have a minor performance overhead compared to plain objects. This is expected to be negligible in virtually all use cases and is a small price for guaranteed correctness.