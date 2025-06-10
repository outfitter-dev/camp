/**
 * Result pattern for type-safe error handling without exceptions
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Create a successful result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Wrap an async function to return a Result instead of throwing
 */
export async function tryAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    // Type-safe error handling
    if (error instanceof Error) {
      return failure(error as E extends Error ? E : Error as E);
    }
    return failure(new Error(String(error)) as E extends Error ? E : Error as E);
  }
}

/**
 * Wrap a sync function to return a Result instead of throwing
 */
export function trySync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const data = fn();
    return success(data);
  } catch (error) {
    // Type-safe error handling
    if (error instanceof Error) {
      return failure(error as E extends Error ? E : Error as E);
    }
    return failure(new Error(String(error)) as E extends Error ? E : Error as E);
  }
}

/**
 * Check if result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success;
}

/**
 * Check if result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.success;
}

/**
 * Map the success value to a new value
 * @param result The result to map
 * @param fn The function to apply to the success value
 * @returns A new result with the mapped value or the original error
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.success ? success(fn(result.data)) : result;
}

/**
 * Map the error value to a new error
 * @param result The result to map
 * @param fn The function to apply to the error value
 * @returns A new result with the original value or the mapped error
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.success ? result : failure(fn(result.error));
}

/**
 * Chain Result-returning operations (flatMap/bind)
 * @param result The result to chain from
 * @param fn The function that returns a new Result
 * @returns The result of the chained operation
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.success ? fn(result.data) : result;
}

/**
 * Flatten nested Results
 * @param result A Result containing another Result
 * @returns The inner Result
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
  return result.success ? result.data : result;
}

/**
 * Combine multiple Results into a single Result
 * @param results Array of Results to combine
 * @returns Success with array of values if all succeed, or first failure
 */
export function all<T extends readonly Result<unknown, unknown>[]>(
  results: T
): Result<
  { [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never },
  T[number] extends Result<unknown, infer E> ? E : never
> {
  type Values = {
    [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never;
  };
  type ErrorType = T[number] extends Result<unknown, infer E> ? E : never;

  const values: unknown[] = [];

  for (const result of results) {
    if (!result.success) {
      return failure(result.error) as Result<Values, ErrorType>;
    }
    values.push(result.data);
  }

  return success(values as Values);
}

/**
 * Get the value or a default if the Result is a failure
 * @param result The Result to unwrap
 * @param defaultValue The default value to return on failure
 * @returns The success value or the default
 */
export function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Get the value or compute a default if the Result is a failure
 * @param result The Result to unwrap
 * @param fn Function to compute the default value from the error
 * @returns The success value or the computed default
 */
export function getOrElseWith<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.success ? result.data : fn(result.error);
}

/**
 * Execute a side effect on success
 * @param result The Result to tap
 * @param fn The side effect to execute on success
 * @returns The original Result unchanged
 */
export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (result.success) {
    fn(result.data);
  }
  return result;
}

/**
 * Execute a side effect on failure
 * @param result The Result to tap
 * @param fn The side effect to execute on failure
 * @returns The original Result unchanged
 */
export function tapError<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (!result.success) {
    fn(result.error);
  }
  return result;
}

/**
 * Convert a Result to a Promise
 * @param result The Result to convert
 * @returns A Promise that resolves on success or rejects on failure
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
  return result.success ? Promise.resolve(result.data) : Promise.reject(result.error);
}

/**
 * Create a Result from a nullable value
 * @param value The nullable value
 * @param error The error to use if value is null/undefined
 * @returns Success if value exists, Failure otherwise
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E
): Result<NonNullable<T>, E> {
  return value !== null && value !== undefined ? success(value as NonNullable<T>) : failure(error);
}
