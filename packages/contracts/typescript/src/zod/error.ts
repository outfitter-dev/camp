import { type z } from 'zod';

import { ErrorCode, makeError, type AppError } from '../error';

/**
 * Convert Zod error to AppError
 */
export function fromZod(error: z.ZodError): AppError {
  return makeError(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
    issues: error.issues.map(issue => {
      const baseIssue = {
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      };

      // Type guard for issues with 'received' property
      if ('received' in issue && issue.received !== undefined) {
        return { ...baseIssue, received: issue.received };
      }

      return baseIssue;
    }),
  });
}
