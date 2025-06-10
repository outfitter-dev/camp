import { type z } from 'zod';

import { ErrorCode, makeError, type AppError } from '../error';

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
