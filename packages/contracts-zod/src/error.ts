import type { z } from 'zod';

import { ErrorCode, makeError, type AppError } from '@outfitter/contracts';

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
      } as const;

      if ('received' in issue && issue.received !== undefined) {
        return { ...baseIssue, received: issue.received };
      }

      return baseIssue;
    }),
  });
}

