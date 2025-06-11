import { z } from 'zod';

import type { Result, AppError } from '@outfitter/contracts';
import { success, failure, makeError, ErrorCode } from '@outfitter/contracts';

/**
 * Create a validated environment configuration from a Zod schema
 */
export function createEnvSchema<T extends z.ZodRawShape>(
  schema: T
): Result<z.infer<z.ZodObject<T>>, AppError> {
  const envSchema = z.object(schema);

  try {
    const parsed = envSchema.parse(process.env);
    return success(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(
        makeError(ErrorCode.VALIDATION_ERROR, 'Environment validation failed', {
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
            received: 'received' in issue ? issue.received : undefined,
          })),
          missingVariables: error.issues
            .filter(
              issue =>
                issue.code === 'invalid_type' && issue.received === 'undefined'
            )
            .map(issue => issue.path.join('.')),
        })
      );
    }

    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        'Unexpected error during environment validation',
        {
          cause: error,
        }
      )
    );
  }
}

/**
 * Common environment variable schemas for reuse
 */
export const CommonEnvSchemas = {
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
} as const;

/**
 * Type-safe environment configuration for Next.js applications
 */
export function createNextEnvSchema<T extends z.ZodRawShape>(
  additionalSchema: T = {} as T
) {
  return createEnvSchema({
    NODE_ENV: CommonEnvSchemas.NODE_ENV,
    PORT: CommonEnvSchemas.PORT,
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    ...additionalSchema,
  });
}

/**
 * Type-safe environment configuration for Node.js applications
 */
export function createNodeEnvSchema<T extends z.ZodRawShape>(
  additionalSchema: T = {} as T
) {
  return createEnvSchema({
    NODE_ENV: CommonEnvSchemas.NODE_ENV,
    PORT: CommonEnvSchemas.PORT,
    LOG_LEVEL: CommonEnvSchemas.LOG_LEVEL,
    ...additionalSchema,
  });
}

/**
 * Validate and parse a single environment variable
 */
export function parseEnvVar<T>(
  name: string,
  schema: z.ZodSchema<T>,
  defaultValue?: T
): Result<T, AppError> {
  const value = process.env[name];

  if (value === undefined && defaultValue !== undefined) {
    return success(defaultValue);
  }

  try {
    const parsed = schema.parse(value);
    return success(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(
        makeError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid environment variable: ${name}`,
          {
            variable: name,
            value: value,
            issues: error.issues.map(issue => ({
              message: issue.message,
              code: issue.code,
              received: 'received' in issue ? issue.received : undefined,
            })),
          }
        )
      );
    }

    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Unexpected error parsing environment variable: ${name}`,
        { variable: name, cause: error }
      )
    );
  }
}

/**
 * Check if all required environment variables are set
 */
export function validateRequiredEnvVars(
  ...variables: Array<string>
): Result<Record<string, string>, AppError> {
  const missing: Array<string> = [];
  const values: Record<string, string> = {};

  for (const variable of variables) {
    const value = process.env[variable];
    if (!value) {
      missing.push(variable);
    } else {
      values[variable] = value;
    }
  }

  if (missing.length > 0) {
    return failure(
      makeError(
        ErrorCode.VALIDATION_ERROR,
        `Missing required environment variables: ${missing.join(', ')}`,
        { missingVariables: missing }
      )
    );
  }

  return success(values);
}

