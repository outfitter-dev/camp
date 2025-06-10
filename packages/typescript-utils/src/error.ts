import { z } from 'zod';

/**
 * Standard error codes for application errors
 * Using const object for better type safety than enum
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error code categories for better organization
 */
export const ErrorCategory = {
  VALIDATION: [ErrorCode.VALIDATION_ERROR],
  AUTH: [ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN],
  RESOURCE: [ErrorCode.NOT_FOUND, ErrorCode.CONFLICT],
  SYSTEM: [ErrorCode.INTERNAL_ERROR, ErrorCode.EXTERNAL_SERVICE_ERROR],
  RATE_LIMIT: [ErrorCode.RATE_LIMIT_EXCEEDED],
} as const;

/**
 * Check if an error code belongs to a category
 */
export function isErrorInCategory(code: ErrorCode, category: keyof typeof ErrorCategory): boolean {
  return (ErrorCategory[category] as readonly ErrorCode[]).includes(code);
}

/**
 * Application error with structured metadata
 */
export interface AppError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Create a structured app error
 */
export function makeError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): AppError {
  // Validate inputs
  if (!Object.values(ErrorCode).includes(code)) {
    throw new Error(`Invalid error code: ${code}`);
  }

  if (!message || typeof message !== 'string') {
    throw new Error('Error message must be a non-empty string');
  }

  if (message.trim().length === 0) {
    throw new Error('Error message cannot be empty or whitespace only');
  }

  if (
    details !== undefined &&
    (typeof details !== 'object' || details === null || Array.isArray(details))
  ) {
    throw new Error('Error details must be a plain object');
  }

  if (cause !== undefined && !(cause instanceof Error)) {
    throw new Error('Error cause must be an Error instance');
  }

  if (details !== undefined && cause !== undefined) {
    return { code, message, details, cause };
  }

  if (details !== undefined) {
    return { code, message, details };
  }

  if (cause !== undefined) {
    return { code, message, cause };
  }

  return { code, message };
}

/**
 * Safe version of makeError that returns a Result instead of throwing
 */
export function tryMakeError(
  code: unknown,
  message: unknown,
  details?: unknown,
  cause?: unknown
): { success: true; data: AppError } | { success: false; error: string } {
  try {
    // Type validation
    if (!Object.values(ErrorCode).includes(code as ErrorCode)) {
      return { success: false, error: `Invalid error code: ${code}` };
    }

    if (!message || typeof message !== 'string') {
      return {
        success: false,
        error: 'Error message must be a non-empty string',
      };
    }

    if (message.trim().length === 0) {
      return {
        success: false,
        error: 'Error message cannot be empty or whitespace only',
      };
    }

    if (
      details !== undefined &&
      (typeof details !== 'object' || details === null || Array.isArray(details))
    ) {
      return { success: false, error: 'Error details must be a plain object' };
    }

    if (cause !== undefined && !(cause instanceof Error)) {
      return { success: false, error: 'Error cause must be an Error instance' };
    }

    const error = makeError(
      code as ErrorCode,
      message as string,
      details as Record<string, unknown> | undefined,
      cause as Error | undefined
    );

    return { success: true, data: error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in tryMakeError',
    };
  }
}

/**
 * Convert Zod error to AppError
 */
export function fromZod(error: z.ZodError): AppError {
  return makeError(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
    issues: error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      received: 'received' in issue ? issue.received : undefined,
    })),
  });
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    Object.values(ErrorCode).includes((error as AppError).code)
  );
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return fromZod(error);
  }

  if (error instanceof Error) {
    return makeError(ErrorCode.INTERNAL_ERROR, error.message, undefined, error);
  }

  return makeError(ErrorCode.INTERNAL_ERROR, 'Unknown error occurred', {
    originalError: error,
  });
}
